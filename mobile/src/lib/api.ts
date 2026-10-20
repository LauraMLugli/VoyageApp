import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 3333;

// Descobre sozinho o endereço do computador que está rodando o Expo (o mesmo PC da API).
// Assim funciona no celular (Expo Go), no emulador e no navegador SEM precisar configurar nada.
function detectDevHost(): string | null {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
  }
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ?? (Constants as any).expoGoConfig?.debuggerHost ?? undefined;
  const host = hostUri?.split(":")[0];
  return host ? host : null;
}

function defaultUrl(): string {
  const host = detectDevHost();
  if (host) return `http://${host}:${API_PORT}/api`;
  return Platform.OS === "android" ? `http://10.0.2.2:${API_PORT}/api` : `http://localhost:${API_PORT}/api`;
}

// Prioridade: EXPO_PUBLIC_API_URL (.env do app) > endereço detectado automaticamente.
// Em produção, SEMPRE defina EXPO_PUBLIC_API_URL com o endereço https da sua API.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultUrl()).replace(/\/$/, "");

export type ServerStatus = "ok" | "wrong" | "offline";

// Pergunta ao servidor se ele está no ar e se é mesmo a API do Voyage.
export async function checkHealth(): Promise<ServerStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    const data = await res.json().catch(() => null);
    return data?.name === "voyage-api" ? "ok" : "wrong";
  } catch {
    return "offline";
  } finally {
    clearTimeout(timer);
  }
}

export class ApiError extends Error {
  status: number; // 0 = sem conexão com o servidor
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Algo deu errado. Tente novamente.";
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(value: string | null) {
  token = value;
}

// O AuthProvider registra aqui o que fazer quando o servidor responde "sessão expirada".
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      `Não foi possível conectar ao servidor (${API_URL}). Confira se a API está rodando e se o endereço do app está certo.`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // resposta sem corpo JSON
  }

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(data?.error ?? `Erro ${res.status} ao falar com o servidor.`, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

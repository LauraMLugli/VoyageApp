import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const configuredKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
const isConfigured = Boolean(configuredUrl && configuredKey);

export const SUPABASE_URL = configuredUrl;
export const SUPABASE_URL_DISPLAY = SUPABASE_URL || "Supabase não configurado";
export type ServerStatus = "ok" | "wrong" | "offline" | "unconfigured";

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

const authStorage = {
  getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return Promise.resolve(typeof window === "undefined" ? null : window.localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },
  setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

const supabaseClient = isConfigured
  ? createClient(configuredUrl, configuredKey, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new ApiError(
      "Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env do app.",
      0,
    );
  }
  return supabaseClient;
}

export async function checkHealth(): Promise<ServerStatus> {
  if (!isConfigured) return "unconfigured";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${configuredUrl}/auth/v1/health`, {
      headers: { apikey: configuredKey },
      signal: controller.signal,
    });
    return response.ok ? "ok" : "wrong";
  } catch {
    return "offline";
  } finally {
    clearTimeout(timer);
  }
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Algo deu errado. Tente novamente.";
}

function assertSuccess<T>(
  data: T,
  error: { message: string; code?: string } | null,
): T {
  if (error) {
    const status = error.code === "PGRST301" ? 401 : 500;
    throw new ApiError(error.message, status);
  }
  return data;
}

async function callRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().rpc(name, args);
  return assertSuccess(data as T, error);
}

export const api = {
  getProfile: async <T>(userId: string): Promise<T> => {
    const { data, error } = await getSupabaseClient()
      .from("profiles")
      .select("id, name, usuario, email, avatar_url")
      .eq("id", userId)
      .single();
    return assertSuccess(data as T, error);
  },

  updateProfile: async <T>(patch: { name: string }): Promise<T> => {
    return callRpc<T>("update_my_profile", { p_name: patch.name });
  },

  getVoyageState: <T>() => callRpc<T>("get_my_voyage_state"),
  getPassCatalog: async <T>(): Promise<T> => {
    const { data, error } = await getSupabaseClient()
      .from("pass_catalog")
      .select("id, kind, scope, name, description, price, duration_hours, uses")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    const passes = assertSuccess(data, error) ?? [];
    return passes.map(({ duration_hours, ...pass }) => ({
      ...pass,
      durationHours: duration_hours,
    })) as T;
  },
  setCard: <T>(number: string, holder: string, type: string) =>
    callRpc<T>("set_my_card", { p_number: number, p_holder: holder, p_type: type }),
  createVirtualCard: <T>(holder: string, type: string) =>
    callRpc<T>("create_virtual_card", { p_holder: holder, p_type: type }),
  removeCard: <T>() => callRpc<T>("remove_my_card"),
  rechargeWallet: <T>(amount: number, method: string) =>
    callRpc<T>("recharge_my_wallet", { p_amount: amount, p_method: method }),
  purchasePass: <T>(passId: string) =>
    callRpc<T>("purchase_my_pass", { p_pass_id: passId }),
  boardLine: <T>(lineId: string) =>
    callRpc<T>("board_my_line", { p_line_id: lineId }),
  toggleFavoriteLine: <T>(lineId: string) =>
    callRpc<T>("toggle_my_favorite_line", { p_line_id: lineId }),
  addFavoriteRoute: <T>(originId: string, destId: string) =>
    callRpc<T>("add_my_favorite_route", { p_origin_id: originId, p_dest_id: destId }),
  removeFavoriteRoute: <T>(id: string) =>
    callRpc<T>("remove_my_favorite_route", { p_id: id }),
  markAllNoticesRead: <T>() => callRpc<T>("mark_my_notices_read"),

  getTransitData: async <T>(): Promise<T> => {
    const client = getSupabaseClient();
    const [stopsResult, linesResult] = await Promise.all([
      client.from("transit_stops").select("id, name, x, y").order("name"),
      client
        .from("transit_lines")
        .select("id, code, name, kind, color, fare, stop_ids")
        .order("code"),
    ]);
    const stops = assertSuccess(stopsResult.data, stopsResult.error) ?? [];
    const lines = assertSuccess(linesResult.data, linesResult.error) ?? [];
    return {
      stops,
      lines: lines.map(({ stop_ids, ...line }) => ({ ...line, stopIds: stop_ids })),
    } as T;
  },

  getBuses: async <T>(): Promise<T> => {
    const { data, error } = await getSupabaseClient()
      .from("transit_buses")
      .select("id, line_id, dist, dir, speed")
      .order("id");
    const buses = assertSuccess(data, error) ?? [];
    return buses.map(({ line_id, ...bus }) => ({ ...bus, lineId: line_id })) as T;
  },
};

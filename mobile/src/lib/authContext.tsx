import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { api, ApiError, errorMessage, setToken, setUnauthorizedHandler } from "./api";

export interface User {
  id: number;
  name: string;
  usuario: string;
  email: string;
  avatar?: string;
}

export type AuthResult = { ok: boolean; error?: string };

type AuthContextProps = {
  isLoggedIn: boolean;
  isReding: boolean; // true enquanto a sessão salva ainda está sendo verificada
  user: User | null;
  logIn: (login: string, senha: string) => Promise<AuthResult>;
  register: (data: { name: string; usuario: string; email: string; senha: string }) => Promise<AuthResult>;
  updateUser: (patch: { name?: string; email?: string }) => Promise<AuthResult>;
  logOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  isReding: true,
  user: null,
  logIn: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  updateUser: async () => ({ ok: false }),
  logOut: async () => {},
});

const SESSION_KEY = "voyage-session";

type AuthResponse = { token: string; user: User };

// O login agora é feito na API (veja voyage-api). Aqui guardamos só o TOKEN e os dados
// públicos do usuário. A senha nunca fica no aparelho.
export default function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReding, setIsReding] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  async function saveSession(token: string, nextUser: User) {
    setToken(token);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: nextUser }));
    setUser(nextUser);
    setIsLoggedIn(true);
  }

  async function clearSession() {
    setToken(null);
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    setUser(null);
    setIsLoggedIn(false);
  }

  // Ao abrir o app: recupera o token salvo e confirma com o servidor que ainda vale.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        const session = raw ? JSON.parse(raw) : null;
        if (session?.token && session.user) {
          setToken(session.token);
          try {
            const { user: fresh } = await api.get<{ user: User }>("/me");
            setUser(fresh);
            setIsLoggedIn(true);
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              await clearSession();
            } else {
              // sem conexão: mantém a sessão salva; a tela mostrará o aviso de servidor indisponível
              setUser(session.user);
              setIsLoggedIn(true);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao ler a sessão:", error);
      } finally {
        setIsReding(false);
      }
    };
    restore();
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logIn: AuthContextProps["logIn"] = async (login, senha) => {
    try {
      const res = await api.post<AuthResponse>("/auth/login", { login: login.trim(), senha });
      await saveSession(res.token, res.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  };

  // Cadastra e já deixa o usuário logado.
  const register: AuthContextProps["register"] = async (data) => {
    try {
      const res = await api.post<AuthResponse>("/auth/register", {
        name: data.name.trim(),
        usuario: data.usuario.trim(),
        email: data.email.trim(),
        senha: data.senha,
      });
      await saveSession(res.token, res.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  };

  const updateUser: AuthContextProps["updateUser"] = async (patch) => {
    try {
      const { user: updated } = await api.patch<{ user: User }>("/me", patch);
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      const session = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: updated }));
      setUser(updated);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  };

  const logOut = async () => {
    await clearSession();
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isReding, user, logIn, register, updateUser, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

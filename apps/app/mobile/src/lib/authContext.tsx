import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { api, errorMessage, getSupabaseClient, isSupabaseConfigured } from "./api";

export interface User {
  id: string;
  name: string;
  usuario: string;
  email: string;
  avatar?: string;
}

type Profile = {
  id: string;
  name: string;
  usuario: string;
  email: string;
  avatar_url: string | null;
};

export type AuthResult = {
  ok: boolean;
  error?: string;
  message?: string;
  requiresConfirmation?: boolean;
};

type AuthContextProps = {
  isLoggedIn: boolean;
  isReding: boolean;
  user: User | null;
  logIn: (email: string, senha: string) => Promise<AuthResult>;
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

function toUser(profile: Profile): User {
  return {
    id: profile.id,
    name: profile.name,
    usuario: profile.usuario,
    email: profile.email,
    avatar: profile.avatar_url ?? undefined,
  };
}

function getLoginErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;

  if (code === "invalid_credentials" || code === "user_not_found") {
    return "E-mail ou senha incorretos. Use uma conta criada no app; a conta administrativa do site não dá acesso ao app.";
  }
  if (code === "email_not_confirmed") {
    return "Confirme seu e-mail pelo link enviado antes de entrar.";
  }
  return errorMessage(error);
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReding, setIsReding] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsReding(false);
      return;
    }

    let active = true;
    const client = getSupabaseClient();
    const restoreSession = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session) return;

        const profile = await api.getProfile<Profile>(data.session.user.id);
        if (active) {
          setUser(toUser(profile));
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Erro ao restaurar a sessão Supabase:", error);
        if (active) {
          setUser(null);
          setIsLoggedIn(false);
        }
      } finally {
        if (active) setIsReding(false);
      }
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    void restoreSession();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logIn: AuthContextProps["logIn"] = async (email, senha) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });
      if (error) throw error;
      if (!data.user) throw new Error("O Supabase não retornou o usuário autenticado.");

      const profile = await api.getProfile<Profile>(data.user.id);
      setUser(toUser(profile));
      setIsLoggedIn(true);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getLoginErrorMessage(error) };
    }
  };

  const register: AuthContextProps["register"] = async (data) => {
    try {
      const { data: result, error } = await getSupabaseClient().auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.senha,
        options: {
          data: {
            name: data.name.trim(),
            usuario: data.usuario.trim().toLowerCase(),
          },
        },
      });
      if (error) throw error;
      if (!result.session || !result.user) {
        return {
          ok: false,
          requiresConfirmation: true,
          error: "Conta criada. Confirme seu e-mail para entrar.",
        };
      }

      const profile = await api.getProfile<Profile>(result.user.id);
      setUser(toUser(profile));
      setIsLoggedIn(true);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  };

  const updateUser: AuthContextProps["updateUser"] = async (patch) => {
    try {
      const client = getSupabaseClient();
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Sua sessão expirou. Entre novamente.");

      const emailChanged = Boolean(
        patch.email && patch.email.trim().toLowerCase() !== authData.user.email,
      );
      if (emailChanged && patch.email) {
        const { error } = await client.auth.updateUser({ email: patch.email.trim().toLowerCase() });
        if (error) throw error;
      }

      const profile = patch.name
        ? await api.updateProfile<Profile>({ name: patch.name.trim() })
        : await api.getProfile<Profile>(authData.user.id);
      const updated = toUser(profile);
      setUser(updated);
      return {
        ok: true,
        message: emailChanged
          ? "Confirme a alteração pelo link enviado ao novo e-mail."
          : undefined,
      };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  };

  const logOut = async () => {
    const { error } = await getSupabaseClient().auth.signOut({ scope: "local" });
    setUser(null);
    setIsLoggedIn(false);
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isReding, user, logIn, register, updateUser, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

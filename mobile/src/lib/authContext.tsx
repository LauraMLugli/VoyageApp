import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

export interface User {
  id: number;
  name: string;
  usuario: string;
  email: string;
  avatar?: string;
}

type StoredUser = User & { senha: string };
export type AuthResult = { ok: boolean; error?: string };

type AuthContextProps = {
  isLoggedIn: boolean;
  isReding: boolean; // true enquanto a sessão salva ainda está sendo lida
  user: User | null;
  logIn: (login: string, senha: string) => Promise<boolean>;
  register: (data: { name: string; usuario: string; email: string; senha: string }) => Promise<AuthResult>;
  updateUser: (patch: { name?: string; email?: string }) => Promise<void>;
  logOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  isReding: true,
  user: null,
  logIn: async () => false,
  register: async () => ({ ok: false }),
  updateUser: async () => {},
  logOut: async () => {},
});

const SESSION_KEY = "voyage-session";
const USERS_KEY = "voyage-users";

// Usuário de demonstração, sempre disponível para testes.
const DEMO: StoredUser = {
  id: 1,
  name: "Passageiro Demo",
  usuario: "demo",
  email: "demo@voyage.app",
  senha: "123456",
};

// ATENÇÃO: usuários e senhas ficam salvos só no aparelho (AsyncStorage) como
// protótipo. Com backend, troque estas funções por chamadas à API de login e
// guarde apenas o token — nunca a senha.
async function loadUsers(): Promise<StoredUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const list: StoredUser[] = raw ? JSON.parse(raw) : [];
    return [DEMO, ...list.filter((u) => u.usuario !== DEMO.usuario)];
  } catch {
    return [DEMO];
  }
}

async function saveUsers(users: StoredUser[]) {
  const toSave = users.filter((u) => u.usuario !== DEMO.usuario);
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(toSave));
}

const toUser = ({ senha, ...user }: StoredUser): User => user;

export default function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReding, setIsReding] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          if (session?.isLoggedIn && session.user) {
            setUser(session.user);
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error("Erro ao ler a sessão:", error);
      } finally {
        setIsReding(false);
      }
    };
    restoreSession();
  }, []);

  const logIn = async (login: string, senha: string) => {
    const key = login.trim().toLowerCase();
    const users = await loadUsers();
    const found = users.find(
      (u) => (u.usuario.toLowerCase() === key || u.email.toLowerCase() === key) && u.senha === senha,
    );
    if (!found) return false;
    const publicUser = toUser(found);
    const token = `voyage.${found.id}.${Date.now()}`; // trocar pelo token real da API
    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ isLoggedIn: true, user: publicUser, token }),
    );
    setUser(publicUser);
    setIsLoggedIn(true);
    return true;
  };

  const register: AuthContextProps["register"] = async ({ name, usuario, email, senha }) => {
    const users = await loadUsers();
    const login = usuario.trim().toLowerCase();
    if (users.some((u) => u.usuario.toLowerCase() === login)) {
      return { ok: false, error: "Este usuário já existe. Escolha outro." };
    }
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { ok: false, error: "Este e-mail já está cadastrado." };
    }
    const newUser: StoredUser = {
      id: Date.now(),
      name: name.trim(),
      usuario: usuario.trim(),
      email: email.trim(),
      senha,
    };
    await saveUsers([...users, newUser]);
    return { ok: true };
  };

  const updateUser: AuthContextProps["updateUser"] = async (patch) => {
    if (!user) return;
    const updated: User = { ...user, ...patch };
    const users = await loadUsers();
    await saveUsers(users.map((u) => (u.id === user.id ? { ...u, ...patch } : u)));
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ isLoggedIn: true, user: updated }));
    setUser(updated);
  };

  const logOut = async () => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ isLoggedIn: false }));
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isReding, user, logIn, register, updateUser, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

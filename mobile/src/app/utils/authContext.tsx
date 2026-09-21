import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

interface User {
  id: number;
  name?: string;
  avatar?: string;
  email: string;
}

type AuthContextProps = {
  isLoggedIn: boolean;
  isReding: boolean; // false enquanto o login não for
  user: User | null;
  logIn: (login: string, senha: string) => Promise<boolean>;
  logOut: () => void;
};

export const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  isReding: false,
  user: null,
  logIn: async (login: string, senha: string) => false,
  logOut: () => {},
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setILoggedIn] = useState(false);
  const [isReding, setIsReding] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();
  useEffect(() => {
    const verificarLogin = async () => {
      try {
        // 1. Pega a string do AsyncStorage
        const jsonValue = await AsyncStorage.getItem("my-key");
        // 2. Verifica se ela existe e transforma em objeto
        if (jsonValue !== null) {
          const resultado = JSON.parse(jsonValue);
          // 3. Atualiza o seu estado com o valor booleano (true/false)
          if (resultado.isLoggedIn) {
            setILoggedIn(true);
            setUser(resultado.user);

            console.log(resultado.token);
          } else {
            setILoggedIn(false);
          }
        }
      } catch (error) {
        console.error("Erro ao ler o status de login:", error);
      } finally {
        // setILoggedIn(false); // Finaliza o estado de carregamento
        setIsReding(false);
      }
    };

    verificarLogin();
  }, []);

  const logIn = async (login: string, senha: string) => {
    const userPayloud: User = {
      id: 1,
      name: login,
      avatar: "",
      email: login,
    };
    setUser(userPayloud);
    const token = "amvoamdoasdmvoasmdovap0131231321";
    const jsonValue = JSON.stringify({
      isLoggedIn: true,
      user: userPayloud,
      token: token,
    });

    await AsyncStorage.setItem("my-key", jsonValue);
    setILoggedIn(true);
    return true;
  };

  const logOut = async () => {
    const jsonValue = JSON.stringify({ isLoggedIn: false });
    setILoggedIn(false);
    await AsyncStorage.setItem("my-key", jsonValue);
    setUser(null);
  };

  return (
    <AuthContext value={{ isLoggedIn, isReding, user, logIn, logOut }}>
      {children}
    </AuthContext>
  );
}

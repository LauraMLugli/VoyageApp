import { Link, useRouter } from "expo-router";
import { useContext, useState } from "react";
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthContext } from "./utils/authContext";

export default function Login() {
  const router = useRouter();
  const [senha, setSenha] = useState<string>();
  const [usuario, setUsuario] = useState<string>();
  const [focusLogin, setFocusLogin] = useState<boolean>(false);
  const [focusSenha, setFocusSenha] = useState<boolean>(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const auth = useContext(AuthContext);

  async function onClickAcessar() {
    if (!usuario) {
      setMsgError("Login e obrigatorio !");
      //Alert.alert("Login e obrigatorio !");
      // setFocusLogin(true);
      // setFocusSenha(false);
      return;
    }
    if (!senha) {
      //Alert.alert("senha e obrigatorio !");
      setMsgError("senha e obrigatorio !");
      // setFocusLogin(false);
      // setFocusSenha(true);
      return;
    }
    const autorizado = await auth.logIn(usuario, senha);
    if (autorizado) {
      router.navigate("/");
    } else {
      Alert.alert("Usuário ou Senha invalido ...");
    }
  }

  return (
    <View style={{ flex: 1, padding: 5, gap: 5, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Image source={require("@/assets/images/favicon.png")} />
        <Text style={styles.titulo}>Login</Text>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          Aula 14/09/2026
        </Text>
      </View>
      <View style={styles.main}>
        <Text style={styles.inputText}>Login:</Text>
        <TextInput
          style={styles.input}
          placeholder="Informe o login/email!"
          onChangeText={(value) => {
            setUsuario(value);
            setMsgError(null);
          }}
          autoFocus={focusLogin}
        />

        <Text style={styles.inputText}>senha:</Text>
        <TextInput
          style={styles.input}
          placeholder="informe a senha!"
          secureTextEntry
          onChangeText={(e) => {
            setSenha(e);
            setMsgError(null);
          }}
          autoFocus={focusSenha}
        />
        {msgError && <Text style={styles.textError}> {msgError}</Text>}
      </View>

      <View style={styles.footer}>
        <Text style={styles.inputText}>
          Não tem login,{" "}
          <Link href={"/register"}>
            <Text style={styles.textoLink}>faça o cadastro aqui!</Text>{" "}
          </Link>
        </Text>
        <Button
          onPress={() => {
            onClickAcessar();
          }}
          title="Acessar"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1 / 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  titulo: {
    color: "#000",
    fontSize: 28,
    fontWeight: 600,
  },
  textoLink: {
    fontSize: 18,
    color: "red",
    fontWeight: 500,
  },
  main: {
    flex: 1 / 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  input: {
    width: "100%",
    height: 36,
    backgroundColor: "#d2d2d2",
    marginBottom: 15,
    borderRadius: 10,
  },
  inputText: {
    color: "#000",
    fontWeight: "500",
    fontSize: 12,
    width: "100%",
    marginBottom: 5,
  },
  footer: {
    flex: 1 / 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  textError: {
    color: "#f10a0a",
    fontWeight: "700",
    fontSize: 14,
    width: "100%",
    textAlign: "center",
    marginBottom: 5,
    marginTop: 5,
  },
});

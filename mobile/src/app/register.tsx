import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Register() {
  const router = useRouter();
  const [namefull, setNamefull] = useState<string>();
  const [senha, setSenha] = useState<string>();
  const [senha2, setSenha2] = useState<string>();
  const [usuario, setUsuario] = useState<string>();

  function onClickAcessar() {
    if (namefull == "") {
      Alert.alert(
        "Campo Obrigatorio não preenchido! \n O nome completo esta em Branco \n Por favor providenciar o preenchimento ...",
      );
      return;
    }
    if (usuario === "") {
      Alert.alert(
        "As senhas informada são Diferente! \n Por favor providencia e a correção ...",
      );
    }
    if (senha !== senha2) {
      Alert.alert(
        "As senhas informada são Diferente! \n Por favor providencia e a correção ...",
      );
      return;
    }
    router.navigate("/login");
  }

  return (
    <View style={{ flex: 1, padding: 5, gap: 5, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Image source={require("@/assets/images/favicon.png")} />
        <Text style={styles.titulo}>Register</Text>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          Aula 31/08/2026
        </Text>
      </View>
      <View style={styles.main}>
        <Text style={styles.inputText}>Nome Completo:</Text>
        <TextInput
          style={styles.input}
          placeholder="Informe o Nome Completo!"
          onChangeText={(value) => {
            setNamefull(value);
          }}
        />

        <Text style={styles.inputText}>usuário:</Text>
        <TextInput
          style={styles.input}
          placeholder="Informe o login!"
          onChangeText={(value) => {
            setUsuario(value);
          }}
        />

        <Text style={styles.inputText}>senha:</Text>
        <TextInput
          style={styles.input}
          placeholder="informe a senha!"
          secureTextEntry
          onChangeText={(e) => {
            setSenha(e);
          }}
        />
        <Text style={styles.inputText}>Repetir senha:</Text>
        <TextInput
          style={styles.input}
          placeholder="repeti a senha!"
          secureTextEntry
          onChangeText={(e) => {
            setSenha2(e);
          }}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.inputText}>
          Já possui cadastro,{" "}
          <Link href={"/login"}>
            <Text style={styles.textoLink}>façao o login!</Text>{" "}
          </Link>
        </Text>
        <Button
          onPress={() => {
            onClickAcessar();
          }}
          title="Registrar"
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
});

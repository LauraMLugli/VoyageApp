import { ButtonFatec } from "@/components/Button";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { AuthContext } from "../utils/authContext";

export default function DashBoard() {
  const route = useRouter();
  const auth = useContext(AuthContext);

  function logout() {
    auth.logOut();
    route.navigate("/");
  }
  function openCadastros() {
    console.log("novo registro");
    Alert.alert("sucesso ao inserir novo registro ");
  }
  function newRegister() {
    route.navigate("/register");
  }
  function deleteRegister() {
    console.log("apagando registro");
    Alert.alert("apagando registro atual");
  }

  return (
    <View style={{ flex: 1, padding: 5, gap: 5, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Image source={require("@/assets/images/favicon.png")} />
        <Text style={styles.titulo}>Dashboard</Text>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          Aula 17/08/2026
        </Text>
      </View>
      <View style={styles.main}>
        <Text style={styles.inputText}>tela principal</Text>
      </View>
      <View style={styles.footer}>
        <ButtonFatec
          text={"sair"}
          action={() => {
            logout();
          }}
          icon={MaterialCommunityIcons}
          iconName={"exit-run"}
        />
        <ButtonFatec
          text={"cadastros"}
          action={() => {
            openCadastros();
          }}
          icon={MaterialCommunityIcons}
          iconName={"exit-run"}
        />
        <ButtonFatec
          text={"Novo"}
          action={() => {
            newRegister();
          }}
          icon={MaterialCommunityIcons}
          iconName={"exit-run"}
        />

        <ButtonFatec
          text={"Excluir"}
          action={() => {
            deleteRegister();
          }}
          icon={MaterialIcons}
          iconName={"arrow-back-ios-new"}
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
  },
  titulo: {
    color: "#000",
    fontSize: 28,
    fontWeight: 600,
  },

  main: {
    flex: 1 / 3,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    height: 36,
    backgroundColor: "#999",
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

    gap: 10,
    // backgroundColor: "lightgreen",
  },
});

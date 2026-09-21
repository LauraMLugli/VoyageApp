import { useContext } from "react";
import { Text, View } from "react-native";
import { AuthContext } from "../utils/authContext";

function Home() {
  const auth = useContext(AuthContext);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>home da dahsborad, na area autenticada</Text>

      <Text> {auth.user?.id} </Text>
      <Text> {auth.user?.name} </Text>
    </View>
  );
}

export default Home;

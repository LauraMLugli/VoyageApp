import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Redirect, Tabs } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../utils/authContext";

export default function AuthLayout() {
  const auth = useContext(AuthContext);

  if (auth.isReding) {
    return;
  }

  if (!auth.isLoggedIn) {
    return <Redirect href={"/login"} />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "home",
          tabBarIcon: () => (
            <MaterialIcons name="home" size={24} color={"red"} />
          ),
        }}
      />
      <Tabs.Screen name="listaClientes" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}

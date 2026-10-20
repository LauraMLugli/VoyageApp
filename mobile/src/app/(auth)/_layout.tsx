import { Button } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";
import { AuthContext } from "@/lib/authContext";
import { FleetProvider } from "@/lib/fleet";
import { useVoyage } from "@/lib/voyageContext";
import { Redirect, Stack } from "expo-router";
import { useContext } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

export default function AuthLayout() {
  const auth = useContext(AuthContext);
  const voyage = useVoyage();

  if (auth.isLoggedIn && voyage.status === "error") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 28, backgroundColor: colors.background }}>
        <Image source={require("../../../assets/images/voyage-logo.png")} style={{ width: 80, height: 80 }} resizeMode="contain" />
        <Text style={{ color: colors.navy, fontSize: 20, fontWeight: "800", textAlign: "center" }}>Servidor indisponível</Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: 14 }}>
          {voyage.error ?? "Não foi possível falar com a API."}
        </Text>
        <Text style={{ color: colors.textLight, fontSize: 12 }}>Endereço: {API_URL}</Text>
        <Button title="Tentar de novo" onPress={voyage.refresh} style={{ alignSelf: "stretch" }} />
        <Button title="Sair da conta" variant="ghost" onPress={auth.logOut} />
      </View>
    );
  }

  if (auth.isReding || (auth.isLoggedIn && !voyage.ready)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18, backgroundColor: colors.background }}>
        <Image source={require("../../../assets/images/voyage-logo.png")} style={{ width: 90, height: 90 }} resizeMode="contain" />
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (!auth.isLoggedIn) return <Redirect href="/login" />;

  return (
    <FleetProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </FleetProvider>
  );
}

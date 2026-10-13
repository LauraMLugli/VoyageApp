import { colors } from "@/lib/theme";
import { AuthContext } from "@/lib/authContext";
import { FleetProvider } from "@/lib/fleet";
import { useVoyage } from "@/lib/voyageContext";
import { Redirect, Stack } from "expo-router";
import { useContext } from "react";
import { ActivityIndicator, Image, View } from "react-native";

export default function AuthLayout() {
  const auth = useContext(AuthContext);
  const voyage = useVoyage();

  if (auth.isReding || (auth.isLoggedIn && !voyage.ready)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18, backgroundColor: colors.background }}>
        <Image source={require("@/assets/images/logoVoyage.jpeg")} style={{ width: 90, height: 90 }} resizeMode="contain" />
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

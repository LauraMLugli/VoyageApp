import { colors } from "@/lib/theme";
import { Tabs } from "expo-router";
import { CreditCard, House, Map as MapIcon, Ticket, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: "#8A97A8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color, size }) => <House size={size} color={color} /> }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa", tabBarIcon: ({ color, size }) => <MapIcon size={size} color={color} /> }} />
      <Tabs.Screen name="cartao" options={{ title: "Cartão", tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} /> }} />
      <Tabs.Screen name="passes" options={{ title: "Passes", tabBarIcon: ({ color, size }) => <Ticket size={size} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}

import { DialogProvider } from "@/components/Dialog";
import AuthProvider from "@/lib/authContext";
import { VoyageProvider } from "@/lib/voyageContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <VoyageProvider>
        <DialogProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </DialogProvider>
      </VoyageProvider>
    </AuthProvider>
  );
}

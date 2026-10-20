import { Button, Field } from "@/components/ui";
import { API_URL, checkHealth, type ServerStatus } from "@/lib/api";
import { AuthContext } from "@/lib/authContext";
import { colors, gradients, shadow } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { Lock, LogIn, User } from "lucide-react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [msgError, setMsgError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [server, setServer] = useState<ServerStatus | "checking">("checking");

  const testServer = useCallback(async () => {
    setServer("checking");
    setServer(await checkHealth());
  }, []);

  useEffect(() => {
    testServer();
  }, [testServer]);

  if (auth.isLoggedIn) return <Redirect href="/" />;

  async function onClickAcessar() {
    if (loading) return;
    if (!usuario.trim()) {
      setMsgError("Informe seu usuário ou e-mail.");
      return;
    }
    if (!senha) {
      setMsgError("Informe sua senha.");
      return;
    }

    setLoading(true);
    setMsgError(null);
    try {
      const res = await auth.logIn(usuario, senha);
      if (res.ok) {
        router.replace("/");
      } else {
        setMsgError(res.error ?? "Não foi possível entrar. Tente de novo.");
      }
    } catch (error) {
      setMsgError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar. Tente de novo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.voyage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 30 }]}
        >
          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/images/voyage-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brand}>Voyage</Text>
          <Text style={styles.tagline}>Seu transporte em movimento, em tempo real.</Text>
        </LinearGradient>

        <View style={[styles.formCard, { marginBottom: insets.bottom + 24 }]}>
          <Text style={styles.heading}>Entrar</Text>
          <Text style={styles.sub}>Acesse sua conta para ver ônibus, saldo e passes.</Text>

          <View style={{ gap: 14, marginTop: 18 }}>
            <Field
              label="Usuário ou e-mail"
              icon={User}
              placeholder="Informe seu usuário ou e-mail"
              value={usuario}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              editable={!loading}
              onChangeText={(v) => {
                setUsuario(v);
                setMsgError(null);
              }}
            />
            <Field
              label="Senha"
              icon={Lock}
              secure
              placeholder="Informe sua senha"
              value={senha}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="go"
              editable={!loading}
              onChangeText={(v) => {
                setSenha(v);
                setMsgError(null);
              }}
              onSubmitEditing={onClickAcessar}
            />
            {!!msgError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{msgError}</Text>
              </View>
            )}
            <Button title="Entrar" icon={LogIn} onPress={onClickAcessar} loading={loading} />
          </View>

          <Pressable
            style={styles.demo}
            onPress={() => {
              setUsuario("demo");
              setSenha("123456");
              setMsgError(null);
            }}
          >
            <Text style={styles.demoText}>
              Quer só testar? Toque aqui para usar a conta demo.
            </Text>
          </Pressable>

          <Pressable
            style={styles.server}
            onPress={testServer}
            disabled={server === "checking"}
            accessibilityRole="button"
            accessibilityLabel="Verificar conexão com o servidor"
            accessibilityState={{ disabled: server === "checking" }}
          >
            <View
              style={[
                styles.serverDot,
                { backgroundColor: server === "ok" ? colors.success : server === "checking" ? colors.warning : colors.danger },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.serverTitle}>
                {server === "checking" && "Verificando o servidor..."}
                {server === "ok" && "Servidor conectado"}
                {server === "offline" && "Servidor não respondeu"}
                {server === "wrong" && "Este endereço não é a API do Voyage"}
              </Text>
              <Text style={styles.serverUrl} numberOfLines={1}>{API_URL}</Text>
              {server === "offline" && (
                <Text style={styles.serverHint}>
                  Inicie a API (pasta voyage-api: npm start). No celular, ele precisa estar no mesmo Wi-Fi do computador. Toque para testar de novo.
                </Text>
              )}
              {server === "wrong" && (
                <Text style={styles.serverHint}>
                  Outro programa está respondendo nessa porta. Pare a API antiga e inicie a voyage-api.
                </Text>
              )}
            </View>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem conta?</Text>
            <Pressable onPress={() => router.push("/register")} hitSlop={8}>
              <Text style={styles.link}>Criar conta</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingBottom: 70, paddingHorizontal: 24 },
  logoBox: { width: 96, height: 96, borderRadius: 28, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadow },
  logo: { width: 68, height: 68 },
  brand: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", marginTop: 14 },
  tagline: { color: "#E0F2F1", fontSize: 14, marginTop: 4, textAlign: "center" },
  formCard: {
    marginTop: -44,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 22,
    ...shadow,
  },
  heading: { color: colors.navy, fontSize: 24, fontWeight: "800" },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: 12, padding: 12 },
  errorText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  demo: { marginTop: 14, alignItems: "center", padding: 10, backgroundColor: colors.greenLight, borderRadius: 12 },
  demoText: { color: colors.blueDark, fontSize: 13, fontWeight: "600", textAlign: "center" },
  server: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: "#F4F8F8" },
  serverDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  serverTitle: { color: colors.navy, fontSize: 13, fontWeight: "800" },
  serverUrl: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  serverHint: { color: colors.textMedium, fontSize: 12, marginTop: 6, lineHeight: 17 },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.blue, fontSize: 14, fontWeight: "800" },
});

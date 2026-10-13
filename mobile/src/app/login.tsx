import { Button, Field } from "@/components/ui";
import { AuthContext } from "@/lib/authContext";
import { colors, gradients, shadow } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { Lock, LogIn, User } from "lucide-react-native";
import { useContext, useState } from "react";
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

  if (auth.isLoggedIn) return <Redirect href="/" />;

  async function onClickAcessar() {
    if (!usuario.trim()) return setMsgError("Informe seu usuário ou e-mail.");
    if (!senha) return setMsgError("Informe sua senha.");
    setLoading(true);
    const ok = await auth.logIn(usuario, senha);
    setLoading(false);
    if (ok) router.replace("/");
    else setMsgError("Usuário ou senha incorretos. Confira os dados e tente de novo.");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={gradients.voyage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 30 }]}
        >
          <View style={styles.logoBox}>
            <Image source={require("@/assets/images/logoVoyage.jpeg")} style={styles.logo} resizeMode="contain" />
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
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.blue, fontSize: 14, fontWeight: "800" },
});

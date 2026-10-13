import { Button, Field } from "@/components/ui";
import { AuthContext } from "@/lib/authContext";
import { colors, gradients, shadow } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { ChevronLeft, Lock, Mail, User, UserPlus } from "lucide-react-native";
import { useContext, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Errors = Partial<Record<"name" | "usuario" | "email" | "senha" | "senha2", string>>;

export default function Register() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  if (auth.isLoggedIn) return <Redirect href="/" />;

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 3) e.name = "Informe seu nome completo.";
    if (usuario.trim().length < 3 || /\s/.test(usuario)) e.usuario = "Use 3 ou mais caracteres, sem espaços.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Informe um e-mail válido.";
    if (senha.length < 6) e.senha = "A senha precisa ter ao menos 6 caracteres.";
    if (senha2 !== senha) e.senha2 = "As senhas não são iguais.";
    return e;
  }

  async function onClickRegistrar() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const result = await auth.register({ name, usuario, email, senha });
    if (!result.ok) {
      setLoading(false);
      Alert.alert("Não foi possível cadastrar", result.error);
      return;
    }
    const ok = await auth.logIn(usuario, senha);
    setLoading(false);
    if (ok) router.replace("/");
    else router.replace("/login");
  }

  const clear = (key: keyof Errors) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={gradients.voyage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 14 }]}
        >
          <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))} hitSlop={8}>
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.sub}>Leva menos de um minuto.</Text>
        </LinearGradient>

        <View style={[styles.formCard, { marginBottom: insets.bottom + 24 }]}>
          <View style={{ gap: 14 }}>
            <Field label="Nome completo" icon={User} placeholder="Como aparece no seu documento" value={name} error={errors.name}
              onChangeText={(v) => { setName(v); clear("name"); }} />
            <Field label="Usuário" icon={User} placeholder="Escolha um nome de usuário" value={usuario} error={errors.usuario}
              autoCapitalize="none" autoCorrect={false} onChangeText={(v) => { setUsuario(v); clear("usuario"); }} />
            <Field label="E-mail" icon={Mail} placeholder="voce@email.com" value={email} error={errors.email}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} onChangeText={(v) => { setEmail(v); clear("email"); }} />
            <Field label="Senha" icon={Lock} secure placeholder="Mínimo de 6 caracteres" value={senha} error={errors.senha}
              onChangeText={(v) => { setSenha(v); clear("senha"); }} />
            <Field label="Repetir senha" icon={Lock} secure placeholder="Digite a senha novamente" value={senha2} error={errors.senha2}
              onChangeText={(v) => { setSenha2(v); clear("senha2"); }} onSubmitEditing={onClickRegistrar} />
            <Button title="Criar conta" icon={UserPlus} onPress={onClickRegistrar} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta?</Text>
            <Pressable onPress={() => router.replace("/login")} hitSlop={8}>
              <Text style={styles.link}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 64, paddingHorizontal: 22 },
  back: { width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 30, fontWeight: "800" },
  sub: { color: "#E0F2F1", fontSize: 14, marginTop: 4 },
  formCard: { marginTop: -38, marginHorizontal: 20, backgroundColor: "#FFFFFF", borderRadius: 26, padding: 22, ...shadow },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.blue, fontSize: 14, fontWeight: "800" },
});

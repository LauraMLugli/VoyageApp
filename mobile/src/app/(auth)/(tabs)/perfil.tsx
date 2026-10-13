import { Button, Card, Field, Page, SectionTitle } from "@/components/ui";
import { AuthContext } from "@/lib/authContext";
import { initials } from "@/lib/format";
import { colors, gradients, shadow } from "@/lib/theme";
import { CARD_TYPE_LABEL, useVoyage } from "@/lib/voyageContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bell, ChevronRight, CreditCard, History, LogOut, Mail, Save, Star, User } from "lucide-react-native";
import { useContext, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function Perfil() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const v = useVoyage();
  const [name, setName] = useState(auth.user?.name ?? "");
  const [email, setEmail] = useState(auth.user?.email ?? "");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const e: typeof errors = {};
    if (name.trim().length < 3) e.name = "Informe seu nome completo.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Informe um e-mail válido.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    await auth.updateUser({ name: name.trim(), email: email.trim() });
    setSaving(false);
    Alert.alert("Dados salvos", "Suas informações foram atualizadas.");
  }

  function logout() {
    Alert.alert("Sair da conta?", "Você precisará entrar novamente para acessar o app.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await auth.logOut();
          router.replace("/login");
        },
      },
    ]);
  }

  const go = (p: string) => router.push(p as never);
  const menu = [
    { title: "Meu cartão", sub: v.card ? `${CARD_TYPE_LABEL[v.card.type]} · final ${v.card.number.slice(-4)}` : "Nenhum cartão vinculado", icon: CreditCard, path: "/cartao" },
    { title: "Histórico", sub: "Recargas, passes e viagens", icon: History, path: "/historico" },
    { title: "Favoritos", sub: `${v.favLines.length} linha(s) · ${v.favRoutes.length} rota(s)`, icon: Star, path: "/favoritos" },
    { title: "Notificações", sub: v.unread ? `${v.unread} não lida(s)` : "Tudo em dia", icon: Bell, path: "/notificacoes" },
  ];

  return (
    <Page eyebrow="VOYAGE / CONTA" title="Minha conta">
      <LinearGradient colors={gradients.voyage} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(auth.user?.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{auth.user?.name}</Text>
          <Text style={styles.user}>@{auth.user?.usuario}</Text>
        </View>
      </LinearGradient>

      <SectionTitle title="Dados pessoais" />
      <Card style={{ gap: 14 }}>
        <Field label="Nome completo" icon={User} value={name} error={errors.name} onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: undefined })); }} />
        <Field label="E-mail" icon={Mail} value={email} error={errors.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: undefined })); }} />
        <Button title="Salvar alterações" icon={Save} onPress={save} loading={saving} />
      </Card>

      <SectionTitle title="Minha área" />
      <View style={{ gap: 10 }}>
        {menu.map((m) => (
          <Pressable key={m.title} style={styles.row} onPress={() => go(m.path)}>
            <View style={styles.rowIcon}>
              <m.icon size={19} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{m.title}</Text>
              <Text style={styles.muted}>{m.sub}</Text>
            </View>
            <ChevronRight size={19} color={colors.textLight} />
          </Pressable>
        ))}
      </View>

      <Button title="Sair da conta" icon={LogOut} variant="danger" onPress={logout} />
    </Page>
  );
}

const styles = StyleSheet.create({
  profile: { borderRadius: 24, padding: 20, flexDirection: "row", alignItems: "center", gap: 16, ...shadow },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.blueDark, fontSize: 22, fontWeight: "800" },
  name: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
  user: { color: "#E0F2F1", fontSize: 13, marginTop: 2 },
  row: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, ...shadow },
  rowIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.greenLight, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});

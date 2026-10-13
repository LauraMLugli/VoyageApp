import { Card, EmptyState, IconBubble, LineBadge, SectionTitle, SoftIcon } from "@/components/ui";
import { AuthContext } from "@/lib/authContext";
import { money, relativeDay } from "@/lib/format";
import { useFleet } from "@/lib/fleet";
import { colors, gradients, shadow } from "@/lib/theme";
import { LINE_MAP } from "@/lib/transit";
import { TxType, useVoyage } from "@/lib/voyageContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Bell,
  BusFront,
  ChevronRight,
  CreditCard,
  History,
  Map as MapIcon,
  Route,
  Star,
  Ticket,
  TriangleAlert,
  Wallet,
} from "lucide-react-native";
import { useContext } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const txIcon: Record<TxType, { icon: typeof Wallet; color: string }> = {
  recarga: { icon: CreditCard, color: colors.success },
  passe: { icon: Ticket, color: colors.blue },
  viagem: { icon: BusFront, color: colors.teal },
};

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useContext(AuthContext);
  const v = useVoyage();
  const { buses } = useFleet();
  const go = (path: string) => router.push(path as never);

  const firstName = (auth.user?.name || "viajante").split(" ")[0];
  const favLines = v.favLines.map((id) => LINE_MAP[id]).filter(Boolean);
  const lastNotice = v.notices.find((n) => !n.read);

  const actions = [
    { title: "Recarregar", icon: Wallet, path: "/recarga", color: colors.blue },
    { title: "Passes", icon: Ticket, path: "/passes", color: colors.teal },
    { title: "Mapa", icon: MapIcon, path: "/mapa", color: colors.green },
    { title: "Planejar", icon: Route, path: "/planejar", color: colors.blueMedium },
    { title: "Favoritos", icon: Star, path: "/favoritos", color: colors.warning },
    { title: "Histórico", icon: History, path: "/historico", color: colors.navy },
  ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <View style={styles.logoBox}>
            <Image source={require("@/assets/images/logoVoyage.jpeg")} style={styles.logo} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.eyebrow}>VOYAGE</Text>
            <Text style={styles.title}>Início</Text>
          </View>
        </View>
        <Pressable style={styles.iconButton} onPress={() => go("/notificacoes")} hitSlop={6}>
          <Bell size={20} color={colors.navy} />
          {v.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{v.unread > 9 ? "9+" : v.unread}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Saldo */}
      <LinearGradient colors={gradients.voyage} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroHello}>Olá, {firstName}</Text>
        <Text style={styles.heroLabel}>Saldo atual</Text>
        <Text style={styles.heroBalance}>{money(v.balance)}</Text>
        <Pressable style={styles.cardPill} onPress={() => go("/cartao")}>
          <CreditCard size={15} color="#FFFFFF" />
          <Text style={styles.cardPillText}>
            {v.card ? `Cartão final ${v.card.number.slice(-4)}` : "Vincular cartão Voyage"}
          </Text>
          <ChevronRight size={15} color="#FFFFFF" />
        </Pressable>
        <View style={styles.heroActions}>
          <Pressable style={[styles.heroBtn, { backgroundColor: "#FFFFFF" }]} onPress={() => go("/recarga")}>
            <Wallet size={17} color={colors.blue} />
            <Text style={[styles.heroBtnText, { color: colors.blue }]}>Recarregar</Text>
          </Pressable>
          <Pressable style={[styles.heroBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]} onPress={() => go("/passes")}>
            <Ticket size={17} color="#FFFFFF" />
            <Text style={[styles.heroBtnText, { color: "#FFFFFF" }]}>Comprar passe</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Aviso */}
      {lastNotice && (
        <Pressable style={styles.notice} onPress={() => go("/notificacoes")}>
          <TriangleAlert size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>{lastNotice.title}</Text>
            <Text style={styles.noticeText} numberOfLines={2}>{lastNotice.message}</Text>
          </View>
          <ChevronRight size={18} color={colors.textLight} />
        </Pressable>
      )}

      {/* Métricas */}
      <View style={styles.metrics}>
        <Metric icon={BusFront} color={colors.teal} value={String(buses.length)} label="Ônibus ativos" />
        <Metric icon={Ticket} color={colors.blue} value={String(v.activePasses.length).padStart(2, "0")} label="Passes ativos" />
        <Metric icon={Star} color={colors.warning} value={String(v.favLines.length).padStart(2, "0")} label="Linhas favoritas" />
      </View>

      {/* Acesso rápido */}
      <SectionTitle title="Acesso rápido" subtitle="Atalhos para o que você mais usa" />
      <View style={styles.grid}>
        {actions.map((a) => (
          <Pressable key={a.title} style={styles.tile} onPress={() => go(a.path)}>
            <IconBubble icon={a.icon} color={a.color} />
            <Text style={styles.tileText}>{a.title}</Text>
          </Pressable>
        ))}
      </View>

      {/* Favoritas */}
      <SectionTitle
        title="Linhas favoritas"
        right={
          <Pressable onPress={() => go("/favoritos")} hitSlop={8}>
            <Text style={styles.link}>Ver todas</Text>
          </Pressable>
        }
      />
      {favLines.length === 0 ? (
        <Card>
          <EmptyState icon={Star} title="Nenhuma linha favorita" text="Abra o mapa, escolha uma linha e toque na estrela para salvar." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {favLines.map((line) => (
            <Pressable key={line.id} style={styles.row} onPress={() => go(`/mapa?line=${line.id}`)}>
              <LineBadge line={line} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{line.name}</Text>
                <Text style={styles.muted}>
                  {buses.filter((b) => b.lineId === line.id).length} ônibus em operação
                </Text>
              </View>
              <ChevronRight size={19} color={colors.textLight} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Atividade */}
      <SectionTitle
        title="Atividade recente"
        subtitle="Últimas movimentações da conta"
        right={
          <Pressable onPress={() => go("/historico")} hitSlop={8}>
            <Text style={styles.link}>Histórico</Text>
          </Pressable>
        }
      />
      {v.txs.length === 0 ? (
        <Card>
          <EmptyState icon={History} title="Sem movimentações ainda" text="Suas recargas, passes e viagens aparecem aqui." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {v.txs.slice(0, 3).map((tx) => {
            const { icon, color } = txIcon[tx.type];
            return (
              <View key={tx.id} style={styles.row}>
                <SoftIcon icon={icon} color={color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{tx.title}</Text>
                  <Text style={styles.muted}>{relativeDay(tx.ts)} · {tx.subtitle}</Text>
                </View>
                <Text style={[styles.amount, { color: tx.amount > 0 ? colors.success : colors.blue }]}>
                  {tx.amount > 0 ? "+ " : tx.amount < 0 ? "- " : ""}
                  {tx.amount === 0 ? "Passe" : money(Math.abs(tx.amount))}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function Metric({ icon: Icon, color, value, label }: { icon: typeof Wallet; color: string; value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Icon size={21} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadow },
  logo: { width: 34, height: 34 },
  eyebrow: { color: colors.teal, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.navy, fontSize: 24, fontWeight: "800" },
  iconButton: { backgroundColor: "#FFFFFF", width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", ...shadow },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  hero: { borderRadius: 26, padding: 22, ...shadow },
  heroHello: { color: "#E0F2F1", fontSize: 15, fontWeight: "600" },
  heroLabel: { color: "#C8E6C9", fontSize: 12, marginTop: 14 },
  heroBalance: { color: "#FFFFFF", fontSize: 38, fontWeight: "800", marginTop: 2 },
  cardPill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginTop: 10 },
  cardPillText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  heroBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  heroBtnText: { fontWeight: "800", fontSize: 14 },
  notice: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.warningLight, borderRadius: 16, padding: 14 },
  noticeTitle: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  noticeText: { color: colors.textMedium, fontSize: 12, marginTop: 2 },
  metrics: { flexDirection: "row", gap: 10 },
  metric: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 13, flex: 1, minHeight: 100, justifyContent: "space-between", ...shadow },
  metricValue: { color: colors.navy, fontSize: 22, fontWeight: "800", marginTop: 8 },
  metricLabel: { color: colors.textMuted, fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "31.5%", backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 16, alignItems: "center", gap: 9, ...shadow },
  tileText: { color: colors.navy, fontWeight: "800", fontSize: 13 },
  link: { color: colors.blue, fontWeight: "800", fontSize: 13 },
  row: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, ...shadow },
  rowTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: "800", fontSize: 13 },
});

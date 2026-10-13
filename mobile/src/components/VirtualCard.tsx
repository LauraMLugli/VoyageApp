import { maskCardNumber } from "@/lib/format";
import { colors, gradients } from "@/lib/theme";
import { Card, CARD_TYPE_LABEL } from "@/lib/voyageContext";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";

export default function VirtualCard({ card, balance }: { card: Card; balance: number }) {
  return (
    <LinearGradient colors={gradients.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.circleA} />
      <View style={styles.circleB} />

      <View style={styles.top}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Image source={require("@/assets/images/logoVoyage.jpeg")} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandText}>Voyage</Text>
        </View>
        <View style={[styles.status, card.status !== "ativo" && { backgroundColor: colors.danger }]}>
          <Text style={styles.statusText}>{card.status === "ativo" ? "ATIVO" : "BLOQUEADO"}</Text>
        </View>
      </View>

      <Text style={styles.number}>{maskCardNumber(card.number)}</Text>

      <View style={styles.bottom}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Titular</Text>
          <Text style={styles.value} numberOfLines={1}>{card.holder}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.label}>{CARD_TYPE_LABEL[card.type]}</Text>
          <Text style={styles.balance}>{formatBalance(balance)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function formatBalance(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, minHeight: 200, justifyContent: "space-between", overflow: "hidden" },
  circleA: { position: "absolute", right: -50, top: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: "#00C9A7", opacity: 0.18 },
  circleB: { position: "absolute", right: 40, bottom: -70, width: 150, height: 150, borderRadius: 75, backgroundColor: "#419CA6", opacity: 0.2 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  logo: { width: 28, height: 28 },
  brandText: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  status: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: colors.navy, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  number: { color: "#FFFFFF", fontSize: 21, fontWeight: "700", letterSpacing: 1.5, marginVertical: 18 },
  bottom: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  label: { color: "#B9CBE0", fontSize: 11, fontWeight: "600" },
  value: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginTop: 2 },
  balance: { color: colors.accent, fontSize: 20, fontWeight: "800", marginTop: 2 },
});

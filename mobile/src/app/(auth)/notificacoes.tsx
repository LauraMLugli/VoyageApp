import { Button, Card, EmptyState, Page, SoftIcon } from "@/components/ui";
import { relativeDay } from "@/lib/format";
import { colors, shadow } from "@/lib/theme";
import { NoticeKind, useVoyage } from "@/lib/voyageContext";
import { Bell, BusFront, CheckCheck, CircleCheck, Ticket, TriangleAlert, Wallet } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

const meta: Record<NoticeKind, { icon: typeof Bell; color: string }> = {
  saldo: { icon: Wallet, color: colors.warning },
  recarga: { icon: CircleCheck, color: colors.success },
  passe: { icon: Ticket, color: colors.blue },
  transporte: { icon: TriangleAlert, color: colors.danger },
};

export default function Notificacoes() {
  const v = useVoyage();
  return (
    <Page eyebrow="VOYAGE / AVISOS" title="Notificações" subtitle={v.unread ? `${v.unread} não lida(s)` : "Você está em dia"} back>
      {v.unread > 0 && <Button title="Marcar todas como lidas" icon={CheckCheck} variant="secondary" onPress={v.markAllRead} />}

      {v.notices.length === 0 ? (
        <Card>
          <EmptyState icon={BusFront} title="Sem avisos" text="Saldo baixo, recargas, passes perto de vencer e alterações no transporte aparecem aqui." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {v.notices.map((n) => {
            const { icon, color } = meta[n.kind];
            return (
              <View key={n.id} style={[styles.row, !n.read && styles.unread]}>
                <SoftIcon icon={icon} color={color} />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleLine}>
                    <Text style={styles.title}>{n.title}</Text>
                    {!n.read && <View style={styles.dot} />}
                  </View>
                  <Text style={styles.message}>{n.message}</Text>
                  <Text style={styles.time}>{relativeDay(n.ts)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, ...shadow },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: colors.navy, fontSize: 14, fontWeight: "800", flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  message: { color: colors.textMedium, fontSize: 13, marginTop: 3, lineHeight: 18 },
  time: { color: colors.textLight, fontSize: 11, marginTop: 6 },
});

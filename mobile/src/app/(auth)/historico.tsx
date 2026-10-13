import { Card, EmptyState, Page, Segmented, SoftIcon } from "@/components/ui";
import { money, relativeDay } from "@/lib/format";
import { colors, shadow } from "@/lib/theme";
import { Tx, TxType, useVoyage } from "@/lib/voyageContext";
import { useLocalSearchParams } from "expo-router";
import { BusFront, CreditCard, History, Ticket } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Filter = "todos" | TxType;

const meta: Record<TxType, { icon: typeof Ticket; color: string }> = {
  recarga: { icon: CreditCard, color: colors.success },
  passe: { icon: Ticket, color: colors.blue },
  viagem: { icon: BusFront, color: colors.teal },
};

export default function Historico() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const v = useVoyage();
  const initial: Filter = ["recarga", "passe", "viagem"].includes(String(params.filter)) ? (params.filter as Filter) : "todos";
  const [filter, setFilter] = useState<Filter>(initial);

  const list = v.txs.filter((t) => filter === "todos" || t.type === filter);
  const recharged = v.txs.filter((t) => t.type === "recarga").reduce((s, t) => s + t.amount, 0);
  const spent = v.txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <Page eyebrow="VOYAGE / CONTA" title="Histórico" back>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Total recarregado</Text>
          <Text style={[styles.totalValue, { color: colors.success }]}>{money(recharged)}</Text>
        </View>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Total gasto</Text>
          <Text style={styles.totalValue}>{money(spent)}</Text>
        </View>
      </View>

      <Segmented
        options={[
          { key: "todos", label: "Todos" },
          { key: "recarga", label: "Recargas" },
          { key: "passe", label: "Passes" },
          { key: "viagem", label: "Viagens" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={History} title="Nada por aqui ainda" text="Quando houver movimentações desse tipo, elas aparecem nesta lista." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {list.map((tx) => (
            <TxRow key={tx.id} tx={tx} />
          ))}
        </View>
      )}
    </Page>
  );
}

function TxRow({ tx }: { tx: Tx }) {
  const { icon, color } = meta[tx.type];
  const credit = tx.amount > 0;
  return (
    <View style={styles.row}>
      <SoftIcon icon={icon} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{tx.title}</Text>
        <Text style={styles.muted}>{relativeDay(tx.ts)}</Text>
        <Text style={styles.muted} numberOfLines={1}>{tx.subtitle}</Text>
      </View>
      <Text style={[styles.amount, { color: credit ? colors.success : colors.blue }]}>
        {tx.amount === 0 ? "Passe" : `${credit ? "+" : "-"} ${money(Math.abs(tx.amount))}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  total: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, gap: 4, ...shadow },
  totalLabel: { color: colors.textMuted, fontSize: 12 },
  totalValue: { color: colors.navy, fontSize: 18, fontWeight: "800" },
  row: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, ...shadow },
  title: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: "800", fontSize: 14 },
});

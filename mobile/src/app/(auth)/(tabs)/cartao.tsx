import VirtualCard from "@/components/VirtualCard";
import { Button, Card, Chip, Field, Page, Pill, SectionTitle } from "@/components/ui";
import { AuthContext } from "@/lib/authContext";
import { dateShort, formatCardNumber, money, remaining } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { colors } from "@/lib/theme";
import { CARD_TYPE_LABEL, CardType, useVoyage } from "@/lib/voyageContext";
import { useRouter } from "expo-router";
import { CreditCard, Plus, Sparkles, Ticket, Trash2, User, Wallet } from "lucide-react-native";
import { useContext, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

const TYPES: CardType[] = ["comum", "estudante", "vale"];

export default function Cartao() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const v = useVoyage();
  useNow(60000);

  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState(auth.user?.name ?? "");
  const [type, setType] = useState<CardType>("comum");
  const [error, setError] = useState<string | null>(null);

  function link() {
    const res = v.linkCard(number, holder, type);
    if (!res.ok) return setError(res.error ?? "Não foi possível vincular.");
    setError(null);
    setNumber("");
    Alert.alert("Cartão vinculado", res.message);
  }

  function generate() {
    const res = v.generateCard(holder, type);
    if (!res.ok) return setError(res.error ?? "Não foi possível gerar o cartão.");
    setError(null);
    Alert.alert("Cartão virtual criado", "Seu cartão Voyage já está ativo e vinculado à conta.");
  }

  function unlink() {
    Alert.alert(
      "Desvincular cartão?",
      "Você não poderá recarregar, comprar passes ou embarcar até vincular um cartão novamente. O saldo da conta é mantido.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Desvincular", style: "destructive", onPress: v.unlinkCard },
      ],
    );
  }

  /* ------------------------------ Sem cartão ------------------------------ */
  if (!v.card) {
    return (
      <Page eyebrow="VOYAGE / CARTÃO" title="Meu cartão" subtitle="Vincule um cartão para viajar">
        <Card style={{ gap: 14 }}>
          <Field
            label="Número do cartão"
            icon={CreditCard}
            placeholder="0000 0000 0000 0000"
            keyboardType="number-pad"
            value={number}
            onChangeText={(t) => {
              setNumber(formatCardNumber(t));
              setError(null);
            }}
          />
          <Field label="Nome do titular" icon={User} placeholder="Nome completo" value={holder} onChangeText={(t) => { setHolder(t); setError(null); }} />
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Tipo de cartão</Text>
            <View style={styles.chips}>
              {TYPES.map((t) => (
                <Chip key={t} label={CARD_TYPE_LABEL[t]} active={type === t} onPress={() => setType(t)} />
              ))}
            </View>
          </View>
          {!!error && (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Button title="Vincular cartão" icon={Plus} onPress={link} />
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={styles.cardTitle}>Ainda não tem um cartão físico?</Text>
          <Text style={styles.muted}>Gere um cartão virtual na hora e use o app para pagar suas viagens.</Text>
          <Button title="Gerar cartão virtual" icon={Sparkles} variant="secondary" onPress={generate} />
        </Card>
      </Page>
    );
  }

  /* ------------------------------ Com cartão ------------------------------ */
  const card = v.card;
  return (
    <Page eyebrow="VOYAGE / CARTÃO" title="Meu cartão">
      <VirtualCard card={card} balance={v.balance} />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button title="Recarregar" icon={Wallet} onPress={() => router.push("/recarga" as never)} style={{ flex: 1 }} />
        <Button title="Passes" icon={Ticket} variant="secondary" onPress={() => router.push("/passes" as never)} style={{ flex: 1 }} />
      </View>

      <SectionTitle title="Dados do cartão" />
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Info label="Saldo" value={money(v.balance)} />
        <Info label="Número" value={`•••• ${card.number.slice(-4)}`} />
        <Info label="Titular" value={card.holder} />
        <Info label="Tipo" value={CARD_TYPE_LABEL[card.type]} />
        <Info label="Situação" value={card.status === "ativo" ? "Ativo" : "Bloqueado"} />
        <Info label="Vinculado em" value={dateShort(card.linkedAt)} last />
      </Card>

      <SectionTitle title="Passes ativos" subtitle={`${v.activePasses.length} em uso`} />
      {v.activePasses.length === 0 ? (
        <Card>
          <Text style={styles.muted}>Você não tem passes ativos. Compre um na aba Passes.</Text>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {v.activePasses.map((p) => (
            <Card key={p.id} style={styles.passRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.muted}>
                  {p.scope === "regional" ? "Regional" : "Urbano"} · vence em {remaining(p.expiresAt)}
                </Text>
              </View>
              <Pill label="Ativo" color={colors.success} />
            </Card>
          ))}
        </View>
      )}

      <Button title="Desvincular cartão" icon={Trash2} variant="danger" onPress={unlink} />
    </Page>
  );
}

function Info({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.navy, fontSize: 13, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  muted: { color: colors.textMuted, fontSize: 13 },
  error: { backgroundColor: colors.dangerLight, borderRadius: 12, padding: 12 },
  errorText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  cardTitle: { color: colors.navy, fontSize: 15, fontWeight: "800" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoValue: { color: colors.navy, fontWeight: "700", fontSize: 14, maxWidth: "60%", textAlign: "right" },
  passRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});

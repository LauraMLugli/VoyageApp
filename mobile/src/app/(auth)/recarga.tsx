import { Button, Card, Chip, EmptyState, Field, Page, Segmented, SectionTitle } from "@/components/ui";
import { money, parseAmount, relativeDay } from "@/lib/format";
import { PAYMENT_LABEL, PaymentMethod } from "@/lib/payments";
import { colors, gradients } from "@/lib/theme";
import { MAX_RECHARGE, MIN_RECHARGE, useVoyage } from "@/lib/voyageContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { CircleCheck, CreditCard, Wallet } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PRESETS = [10, 20, 30, 50, 100];

export default function Recarga() {
  const router = useRouter();
  const v = useVoyage();
  const [preset, setPreset] = useState<number | null>(20);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: number } | null>(null);

  const amount = custom ? parseAmount(custom) : (preset ?? 0);
  const recentRecharges = v.txs.filter((t) => t.type === "recarga").slice(0, 3);

  async function pay() {
    setError(null);
    setLoading(true);
    const res = await v.recharge(amount, method);
    setLoading(false);
    if (res.ok) setDone({ amount });
    else setError(res.error ?? "Não foi possível concluir a recarga.");
  }

  function reset() {
    setDone(null);
    setCustom("");
    setPreset(20);
  }

  if (done) {
    return (
      <Page eyebrow="VOYAGE / RECARGA" title="Recarga" back>
        <Card style={styles.success}>
          <View style={styles.successIcon}>
            <CircleCheck size={40} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Recarga confirmada</Text>
          <Text style={styles.muted}>{money(done.amount)} foram adicionados ao seu cartão.</Text>
          <Text style={styles.newBalanceLabel}>Novo saldo</Text>
          <Text style={styles.newBalance}>{money(v.balance)}</Text>
        </Card>
        <Button title="Voltar ao início" onPress={() => router.replace("/")} />
        <Button title="Fazer outra recarga" variant="secondary" onPress={reset} />
      </Page>
    );
  }

  return (
    <Page eyebrow="VOYAGE / RECARGA" title="Recarregar" back>
      <LinearGradient colors={gradients.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
        <Wallet size={22} color={colors.accent} />
        <View>
          <Text style={styles.balanceLabel}>Saldo atual</Text>
          <Text style={styles.balanceValue}>{money(v.balance)}</Text>
        </View>
      </LinearGradient>

      {!v.card && (
        <Card style={{ gap: 12 }}>
          <Text style={styles.cardTitle}>Vincule um cartão para recarregar</Text>
          <Text style={styles.muted}>A recarga é feita no seu cartão Voyage.</Text>
          <Button title="Vincular cartão" icon={CreditCard} onPress={() => router.push("/cartao" as never)} />
        </Card>
      )}

      <SectionTitle title="Valor da recarga" subtitle={`De ${money(MIN_RECHARGE)} a ${money(MAX_RECHARGE)}`} />
      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <Chip
            key={p}
            label={money(p)}
            active={!custom && preset === p}
            onPress={() => {
              setPreset(p);
              setCustom("");
              setError(null);
            }}
          />
        ))}
      </View>
      <Field
        label="Outro valor"
        placeholder="Ex.: 45,00"
        keyboardType="decimal-pad"
        value={custom}
        onChangeText={(t) => {
          setCustom(t.replace(/[^0-9,]/g, ""));
          setError(null);
        }}
      />

      <SectionTitle title="Forma de pagamento" />
      <Segmented
        options={(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((k) => ({
          key: k,
          label: k === "pix" ? "Pix" : k === "credito" ? "Crédito" : "Débito",
        }))}
        value={method}
        onChange={setMethod}
      />

      <Card style={{ gap: 8 }}>
        <View style={styles.line}>
          <Text style={styles.muted}>Valor</Text>
          <Text style={styles.cardTitle}>{money(amount)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.muted}>Pagamento</Text>
          <Text style={styles.cardTitle}>{PAYMENT_LABEL[method]}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.muted}>Saldo após a recarga</Text>
          <Text style={[styles.cardTitle, { color: colors.success }]}>{money(v.balance + (amount || 0))}</Text>
        </View>
      </Card>

      {!!error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Button title={loading ? "Processando pagamento..." : "Pagar e recarregar"} icon={Wallet} onPress={pay} loading={loading} disabled={!v.card || amount <= 0} />
      <Text style={styles.note}>Pagamento simulado: nenhuma cobrança real é feita. A integração com pagamento online fica para uma próxima etapa.</Text>

      <SectionTitle
        title="Últimas recargas"
        right={
          <Pressable onPress={() => router.push("/historico?filter=recarga" as never)} hitSlop={8}>
            <Text style={styles.link}>Ver histórico</Text>
          </Pressable>
        }
      />
      {recentRecharges.length === 0 ? (
        <Card>
          <EmptyState icon={Wallet} title="Nenhuma recarga ainda" text="Sua primeira recarga aparece aqui." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {recentRecharges.map((t) => (
            <Card key={t.id} style={styles.line}>
              <View>
                <Text style={styles.cardTitle}>{t.title}</Text>
                <Text style={styles.muted}>{relativeDay(t.ts)} · {t.subtitle}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.success }]}>+ {money(t.amount)}</Text>
            </Card>
          ))}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  balanceCard: { borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  balanceLabel: { color: "#B9CBE0", fontSize: 12 },
  balanceValue: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cardTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  line: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  error: { backgroundColor: colors.dangerLight, borderRadius: 12, padding: 12 },
  errorText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  note: { color: colors.textLight, fontSize: 11, textAlign: "center" },
  link: { color: colors.blue, fontWeight: "800", fontSize: 13 },
  success: { alignItems: "center", gap: 6, paddingVertical: 28 },
  successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.greenLight, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  successTitle: { color: colors.navy, fontSize: 22, fontWeight: "800" },
  newBalanceLabel: { color: colors.textMuted, fontSize: 12, marginTop: 14 },
  newBalance: { color: colors.navy, fontSize: 34, fontWeight: "800" },
});

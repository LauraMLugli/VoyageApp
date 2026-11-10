import { useDialog } from "@/components/Dialog";
import { Button, Card, Chip, EmptyState, IconBubble, Page, Pill, ProgressBar, Segmented, SectionTitle } from "@/components/ui";
import { dateTime, money, remaining } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { KIND_LABEL, PassDef, PassKind, PassScope } from "@/lib/passes";
import { colors, shadow } from "@/lib/theme";
import { useVoyage } from "@/lib/voyageContext";
import { useRouter } from "expo-router";
import { CalendarDays, CalendarRange, Clock, Ticket } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const kindIcon = { unico: Ticket, diario: Clock, mensal: CalendarDays } as const;
const kindColor: Record<PassKind, string> = { unico: colors.blue, diario: colors.teal, mensal: colors.green };

export default function Passes() {
  const router = useRouter();
  const v = useVoyage();
  const dialog = useDialog();
  const [buying, setBuying] = useState<string | null>(null);
  const now = useNow(30000);
  const [tab, setTab] = useState<"disponiveis" | "meus">("disponiveis");
  const [scope, setScope] = useState<"todos" | PassScope>("todos");

  async function buy(def: PassDef) {
    const ok = await dialog.confirm({
      title: "Comprar passe",
      message: `${def.name} (${def.scope === "regional" ? "regional" : "urbano"}) por ${money(def.price)}. O valor será debitado do seu saldo.`,
      confirmText: "Comprar",
    });
    if (!ok) return;
    setBuying(def.id);
    const res = await v.buyPass(def.id);
    setBuying(null);
    if (res.ok) {
      await dialog.notify("Passe ativado", res.message);
      setTab("meus");
      return;
    }
    const goRecharge = await dialog.confirm({
      title: "Não foi possível comprar",
      message: res.error,
      confirmText: v.card ? "Recarregar" : "Vincular cartão",
      cancelText: "Fechar",
    });
    if (goRecharge) router.push((v.card ? "/recarga" : "/cartao") as never);
  }

  const catalog = v.catalog.filter((p) => scope === "todos" || p.scope === scope);

  return (
    <Page eyebrow="VOYAGE / PASSES" title="Passes" subtitle={`Saldo disponível ${money(v.balance)}`}>
      <Segmented
        options={[
          { key: "disponiveis", label: "Disponíveis" },
          { key: "meus", label: `Meus passes (${v.activePasses.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "disponiveis" ? (
        <>
          <View style={styles.chips}>
            <Chip label="Todos" active={scope === "todos"} onPress={() => setScope("todos")} />
            <Chip label="Dentro da cidade" active={scope === "urbano"} onPress={() => setScope("urbano")} />
            <Chip label="Regional" active={scope === "regional"} onPress={() => setScope("regional")} />
          </View>
          <View style={{ gap: 12 }}>
            {catalog.map((def) => (
              <View key={def.id} style={styles.pass}>
                <View style={styles.passTop}>
                  <IconBubble icon={kindIcon[def.kind]} color={kindColor[def.kind]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passName}>{def.name}</Text>
                    <Text style={styles.muted}>{def.description}</Text>
                  </View>
                </View>
                <View style={styles.tags}>
                  <Pill label={KIND_LABEL[def.kind]} color={kindColor[def.kind]} />
                  <Pill label={def.scope === "regional" ? "Regional" : "Dentro da cidade"} color={colors.navy} />
                </View>
                <View style={styles.passBottom}>
                  <Text style={styles.price}>{money(def.price)}</Text>
                  <Button title="Comprar" onPress={() => buy(def)} loading={buying === def.id} disabled={buying !== null} style={{ minWidth: 130 }} />
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <SectionTitle title="Ativos" subtitle="Passes em uso agora" />
          {v.activePasses.length === 0 ? (
            <Card>
              <EmptyState
                icon={Ticket}
                title="Nenhum passe ativo"
                text="Compre um passe para viajar sem descontar do saldo a cada embarque."
                action={<Button title="Ver passes" variant="secondary" onPress={() => setTab("disponiveis")} />}
              />
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {v.activePasses.map((p) => {
                const total = p.expiresAt - p.purchasedAt;
                const left = Math.max(0, p.expiresAt - now);
                return (
                  <View key={p.id} style={styles.pass}>
                    <View style={styles.passTop}>
                      <IconBubble icon={kindIcon[p.kind]} color={kindColor[p.kind]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.passName}>{p.name}</Text>
                        <Text style={styles.muted}>{p.scope === "regional" ? "Regional" : "Dentro da cidade"}</Text>
                      </View>
                      <Pill label="Ativo" color={colors.success} />
                    </View>
                    <ProgressBar value={left / total} color={kindColor[p.kind]} />
                    <View style={styles.between}>
                      <Text style={styles.muted}>Vence em {remaining(p.expiresAt)}</Text>
                      <Text style={styles.muted}>
                        {p.usesLeft === null ? "Viagens ilimitadas" : `${p.usesLeft} viagem restante`}
                      </Text>
                    </View>
                    <Text style={styles.tiny}>Validade até {dateTime(p.expiresAt)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <SectionTitle title="Expirados" subtitle="Passes vencidos ou já utilizados" />
          {v.expiredPasses.length === 0 ? (
            <Text style={styles.muted}>Nenhum passe expirado.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {v.expiredPasses.map((p) => (
                <View key={p.id} style={[styles.pass, { opacity: 0.65, gap: 6 }]}>
                  <View style={styles.passTop}>
                    <IconBubble icon={CalendarRange} color={colors.gray} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.passName}>{p.name}</Text>
                      <Text style={styles.muted}>Encerrado em {dateTime(Math.min(p.expiresAt, Date.now()))}</Text>
                    </View>
                    <Pill label="Expirado" color={colors.textMuted} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pass: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, gap: 12, ...shadow },
  passTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  passName: { color: colors.navy, fontSize: 16, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  tiny: { color: colors.textLight, fontSize: 11 },
  tags: { flexDirection: "row", gap: 8 },
  passBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { color: colors.navy, fontSize: 24, fontWeight: "800" },
  between: { flexDirection: "row", justifyContent: "space-between" },
});

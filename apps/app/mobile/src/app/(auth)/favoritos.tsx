import { Card, Chip, EmptyState, LineBadge, Page, SectionTitle } from "@/components/ui";
import { useFleet } from "@/lib/fleet";
import { money } from "@/lib/format";
import { colors, shadow } from "@/lib/theme";
import { LINES, LINE_MAP, STOPS } from "@/lib/transit";
import { useVoyage } from "@/lib/voyageContext";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronRight, Route, Star, Trash2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Favoritos() {
  const router = useRouter();
  const v = useVoyage();
  const { buses } = useFleet();
  const go = (p: string) => router.push(p as never);

  const favLines = v.favLines.map((id) => LINE_MAP[id]).filter(Boolean);
  const others = LINES.filter((l) => !v.favLines.includes(l.id));

  return (
    <Page eyebrow="VOYAGE / ATALHOS" title="Favoritos" subtitle="Acesso rápido às suas linhas e rotas" back>
      <SectionTitle title="Linhas salvas" />
      {favLines.length === 0 ? (
        <Card>
          <EmptyState icon={Star} title="Nenhuma linha salva" text="Toque em uma linha abaixo para salvar como favorita." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {favLines.map((line) => (
            <View key={line.id} style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => go(`/mapa?line=${line.id}`)}>
                <LineBadge line={line} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{line.name}</Text>
                  <Text style={styles.muted}>
                    {buses.filter((b) => b.lineId === line.id).length} ônibus · {money(line.fare)}
                  </Text>
                </View>
                <ChevronRight size={19} color={colors.textLight} />
              </Pressable>
              <Pressable onPress={() => v.toggleFavLine(line.id)} hitSlop={10} style={styles.starBtn}>
                <Star size={22} color={colors.warning} fill={colors.warning} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {others.length > 0 && (
        <>
          <Text style={styles.sub}>Adicionar aos favoritos</Text>
          <View style={styles.chips}>
            {others.map((l) => (
              <Chip key={l.id} label={`${l.code} · ${l.name.split(" · ")[0]}`} color={l.color} onPress={() => v.toggleFavLine(l.id)} />
            ))}
          </View>
        </>
      )}

      <SectionTitle title="Rotas salvas" subtitle="Origem e destino que você usa sempre" />
      {v.favRoutes.length === 0 ? (
        <Card>
          <EmptyState
            icon={Route}
            title="Nenhuma rota salva"
            text="Planeje uma viagem e toque em Salvar rota para ela aparecer aqui."
            action={
              <Pressable style={styles.cta} onPress={() => go("/planejar")}>
                <Text style={styles.ctaText}>Planejar viagem</Text>
              </Pressable>
            }
          />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {v.favRoutes.map((r) => (
            <View key={r.id} style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => go(`/planejar?o=${r.originId}&d=${r.destId}`)}>
                <View style={styles.routeIcon}>
                  <Route size={18} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.routeLine}>
                    <Text style={styles.title} numberOfLines={1}>{STOPS[r.originId]?.name}</Text>
                    <ArrowRight size={14} color={colors.textLight} />
                    <Text style={styles.title} numberOfLines={1}>{STOPS[r.destId]?.name}</Text>
                  </View>
                  <Text style={styles.muted}>Toque para buscar linhas</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => v.removeFavRoute(r.id)} hitSlop={10} style={styles.starBtn}>
                <Trash2 size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: "#FFFFFF", borderRadius: 16, flexDirection: "row", alignItems: "center", ...shadow },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  starBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { color: colors.navy, fontSize: 14, fontWeight: "800", flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sub: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  routeIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.greenLight, alignItems: "center", justifyContent: "center" },
  routeLine: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cta: { marginTop: 8, backgroundColor: colors.blue, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12 },
  ctaText: { color: "#FFFFFF", fontWeight: "800" },
});

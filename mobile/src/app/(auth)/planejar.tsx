
import StopPicker from "@/components/StopPicker";
import { Button, Card, EmptyState, LineBadge, Page, Pill } from "@/components/ui";
import { useFleet } from "@/lib/fleet";
import { money, time } from "@/lib/format";
import { colors, shadow } from "@/lib/theme";
import { RouteOption, STOPS, findRoutes } from "@/lib/transit";
import { useVoyage } from "@/lib/voyageContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowDownUp, Bookmark, Circle, MapPin, Navigation, Route, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Planejar() {
  const router = useRouter();
  const params = useLocalSearchParams<{ o?: string; d?: string }>();
  const v = useVoyage();
  const { buses } = useFleet();

  const [originId, setOriginId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");
  const [picker, setPicker] = useState<"o" | "d" | null>(null);
  const [searched, setSearched] = useState(false);

  // abre já preenchido a partir de uma rota favorita
  useEffect(() => {
    if (params.o && params.d && STOPS[String(params.o)] && STOPS[String(params.d)]) {
      setOriginId(String(params.o));
      setDestId(String(params.d));
      setSearched(true);
    }
  }, [params.o, params.d]);

  const same = !!originId && originId === destId;
  const options = useMemo(
    () => (searched && originId && destId && !same ? findRoutes(originId, destId, buses) : []),
    [searched, originId, destId, same, buses],
  );
  const saved = originId && destId ? v.isFavRoute(originId, destId) : false;

  function swap() {
    setOriginId(destId);
    setDestId(originId);
  }

  return (
    <Page eyebrow="VOYAGE / VIAGEM" title="Planejar viagem" subtitle="Escolha de onde sai e para onde vai" back>
      <Card style={{ gap: 0, paddingVertical: 8 }}>
        <Pressable style={styles.stopField} onPress={() => setPicker("o")}>
          <Circle size={16} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Origem</Text>
            <Text style={[styles.fieldValue, !originId && { color: colors.textLight }]}>
              {originId ? STOPS[originId].name : "Escolher parada de origem"}
            </Text>
          </View>
        </Pressable>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Pressable style={styles.swap} onPress={swap} hitSlop={8} disabled={!originId && !destId}>
            <ArrowDownUp size={16} color={colors.blue} />
          </Pressable>
        </View>
        <Pressable style={styles.stopField} onPress={() => setPicker("d")}>
          <MapPin size={16} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Destino</Text>
            <Text style={[styles.fieldValue, !destId && { color: colors.textLight }]}>
              {destId ? STOPS[destId].name : "Escolher parada de destino"}
            </Text>
          </View>
        </Pressable>
      </Card>

      {same && (
        <View style={styles.error}>
          <Text style={styles.errorText}>Origem e destino são a mesma parada. Escolha pontos diferentes.</Text>
        </View>
      )}

      <Button
        title="Buscar linhas"
        icon={Search}
        disabled={!originId || !destId || same}
        onPress={() => setSearched(true)}
      />

      {searched && !same && !!originId && !!destId && (
        <>
          <View style={styles.resultsHead}>
            <Text style={styles.resultsTitle}>
              {options.length > 0 ? `${options.length} opção(ões) de trajeto` : "Trajetos"}
            </Text>
            <Pressable
              style={[styles.saveBtn, saved && { backgroundColor: colors.greenLight }]}
              onPress={() => v.toggleFavRoute(originId, destId)}
            >
              <Bookmark size={15} color={colors.blue} fill={saved ? colors.blue : "transparent"} />
              <Text style={styles.saveText}>{saved ? "Rota salva" : "Salvar rota"}</Text>
            </Pressable>
          </View>

          {options.length === 0 ? (
            <Card>
              <EmptyState
                icon={Route}
                title="Nenhuma linha liga esses pontos"
                text="Não há trajeto direto nem com uma conexão. Tente outra parada próxima."
              />
            </Card>
          ) : (
            options.map((opt, i) => (
              <OptionCard
                key={opt.id}
                opt={opt}
                best={i === 0}
                onMap={() => router.push(`/mapa?line=${opt.legs[0].line.id}` as never)}
              />
            ))
          )}
        </>
      )}

      <StopPicker
        visible={picker !== null}
        title={picker === "o" ? "De onde você sai?" : "Para onde você vai?"}
        selectedId={picker === "o" ? originId : destId}
        excludeId={picker === "o" ? destId : originId}
        onSelect={(id) => {
          if (picker === "o") setOriginId(id);
          else setDestId(id);
          setSearched(false);
        }}
        onClose={() => setPicker(null)}
      />
    </Page>
  );
}

function OptionCard({ opt, best, onMap }: { opt: RouteOption; best: boolean; onMap: () => void }) {
  const arrival = Date.now() + opt.total * 60000;
  return (
    <View style={[styles.option, best && { borderColor: colors.accent }]}>
      <View style={styles.optionTop}>
        <View>
          <Text style={styles.total}>{opt.total} min</Text>
          <Text style={styles.muted}>Chegada estimada às {time(arrival)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Pill label={opt.transfers === 0 ? "Direto" : `${opt.transfers} conexão`} color={opt.transfers === 0 ? colors.success : colors.warning} />
          {best && <Pill label="Mais rápido" color={colors.blue} />}
        </View>
      </View>

      <View style={styles.legs}>
        <Text style={styles.wait}>Próximo ônibus em {opt.wait} min</Text>
        {opt.legs.map((leg, i) => (
          <View key={`${leg.line.id}-${i}`}>
            {i > 0 && (
              <View style={styles.transfer}>
                <Text style={styles.transferText}>Conexão em {leg.from.name}</Text>
              </View>
            )}
            <View style={styles.leg}>
              <LineBadge line={leg.line} />
              <View style={{ flex: 1 }}>
                <Text style={styles.legTitle}>{leg.from.name} → {leg.to.name}</Text>
                <Text style={styles.muted}>{leg.stops} parada(s) · {leg.minutes} min</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.optionBottom}>
        <Text style={styles.fare}>Tarifa {money(opt.fare)}</Text>
        <Button title="Ver no mapa" icon={Navigation} variant="secondary" onPress={onMap} style={{ minHeight: 42 }} />
      </View>
      {opt.transfers > 0 && <Text style={styles.tiny}>Com a integração, você paga apenas a maior tarifa.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stopField: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  fieldValue: { color: colors.navy, fontSize: 16, fontWeight: "800", marginTop: 1 },
  divider: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", height: 22 },
  dividerLine: { position: "absolute", left: 30, right: 56, height: 1, backgroundColor: colors.border },
  swap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.greenLight, alignItems: "center", justifyContent: "center", marginRight: 6 },
  error: { backgroundColor: colors.dangerLight, borderRadius: 12, padding: 12 },
  errorText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  resultsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  resultsTitle: { color: colors.navy, fontSize: 18, fontWeight: "800" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", ...shadow },
  saveText: { color: colors.blue, fontWeight: "800", fontSize: 12 },
  option: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, gap: 14, borderWidth: 2, borderColor: "transparent", ...shadow },
  optionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  total: { color: colors.navy, fontSize: 26, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  legs: { gap: 10 },
  wait: { color: colors.success, fontSize: 12, fontWeight: "800" },
  leg: { flexDirection: "row", alignItems: "center", gap: 12 },
  legTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  transfer: { marginVertical: 8, marginLeft: 22, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: colors.border, borderStyle: "dashed" },
  transferText: { color: colors.warning, fontSize: 12, fontWeight: "800" },
  optionBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fare: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  tiny: { color: colors.textLight, fontSize: 11 },
});

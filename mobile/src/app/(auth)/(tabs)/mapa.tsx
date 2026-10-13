import BusMap from "@/components/BusMap";
import { Button, Card, Chip, EmptyState, LineBadge, LiveDot, Page, Pill, ProgressBar, SectionTitle } from "@/components/ui";
import { money, normalize } from "@/lib/format";
import { useFleet } from "@/lib/fleet";
import { colors, shadow } from "@/lib/theme";
import {
  Bus,
  LINES,
  LINE_MAP,
  Line,
  STOPS,
  etaToStop,
  geometry,
  nearestEta,
  nextStopIndex,
} from "@/lib/transit";
import { useVoyage } from "@/lib/voyageContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BusFront, ChevronRight, Navigation, Search, Star, Ticket } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Mapa() {
  const router = useRouter();
  const params = useLocalSearchParams<{ line?: string }>();
  const v = useVoyage();
  const { buses } = useFleet();

  const [query, setQuery] = useState("");
  const [lineId, setLineId] = useState<string | null>(null);
  const [busId, setBusId] = useState<string | null>(null);
  const [follow, setFollow] = useState(false);

  // abre já com a linha escolhida em outra tela (favoritos, início)
  useEffect(() => {
    const id = params.line ? String(params.line) : null;
    if (id && LINE_MAP[id]) {
      setLineId(id);
      setBusId(null);
      setFollow(false);
    }
  }, [params.line]);

  const q = normalize(query);
  const matchedLines = useMemo(
    () =>
      LINES.filter(
        (l) =>
          !q ||
          normalize(`${l.code} ${l.name}`).includes(q) ||
          l.stopIds.some((id) => normalize(STOPS[id].name).includes(q)),
      ),
    [q],
  );
  const matchedBuses = q ? buses.filter((b) => normalize(b.id).includes(q)) : [];

  const bus = busId ? buses.find((b) => b.id === busId) ?? null : null;
  const line: Line | null = bus ? LINE_MAP[bus.lineId] : lineId ? LINE_MAP[lineId] : null;

  function selectLine(id: string | null) {
    setLineId(id);
    setBusId(null);
    setFollow(false);
  }

  function selectBus(id: string) {
    const b = buses.find((x) => x.id === id);
    if (!b) return;
    setBusId(id);
    setLineId(b.lineId);
    setFollow(false);
  }

  function board(l: Line) {
    const res = v.boardLine(l.id);
    if (res.ok) {
      Alert.alert("Embarque registrado", res.message);
    } else {
      Alert.alert("Não foi possível embarcar", res.error, [
        { text: "Fechar", style: "cancel" },
        { text: "Recarregar", onPress: () => router.push((v.card ? "/recarga" : "/cartao") as never) },
      ]);
    }
  }

  return (
    <Page
      eyebrow="VOYAGE / TRANSPORTE"
      title="Mapa ao vivo"
      right={
        <View style={styles.live}>
          <LiveDot />
          <Text style={styles.liveText}>Ao vivo</Text>
        </View>
      }
    >
      <View style={styles.search}>
        <Search size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar linha, ônibus ou parada"
          placeholderTextColor="#9AA7B2"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="Todas" active={!line} onPress={() => selectLine(null)} />
        {matchedLines.map((l) => (
          <Chip key={l.id} label={l.code} color={l.color} active={line?.id === l.id} onPress={() => selectLine(l.id)} />
        ))}
      </ScrollView>

      {follow && bus && line && (
        <View style={[styles.followBar, { backgroundColor: line.color }]}>
          <Navigation size={16} color="#FFFFFF" />
          <Text style={styles.followText}>Acompanhando {bus.id}</Text>
        </View>
      )}

      <BusMap
        buses={buses}
        selectedLineId={line?.id ?? null}
        selectedBusId={bus?.id ?? null}
        onSelectBus={selectBus}
      />
      <Text style={styles.hint}>Toque em um ônibus para ver detalhes. Tempos em simulação acelerada.</Text>

      {bus && line ? (
        <BusPanel
          bus={bus}
          line={line}
          follow={follow}
          onToggleFollow={() => setFollow((f) => !f)}
          onBoard={() => board(line)}
          onBack={() => {
            setBusId(null);
            setFollow(false);
          }}
        />
      ) : line ? (
        <LinePanel
          line={line}
          buses={buses}
          favorite={v.favLines.includes(line.id)}
          onFavorite={() => v.toggleFavLine(line.id)}
          onSelectBus={selectBus}
          onBoard={() => board(line)}
        />
      ) : (
        <>
          <SectionTitle title={q ? "Resultados" : "Linhas"} subtitle={`${matchedLines.length} linha(s) encontrada(s)`} />
          {matchedLines.length === 0 && matchedBuses.length === 0 ? (
            <Card>
              <EmptyState icon={Search} title="Nada encontrado" text="Tente buscar pelo número da linha, nome do bairro ou código do ônibus." />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {matchedLines.map((l) => (
                <Pressable key={l.id} style={styles.row} onPress={() => selectLine(l.id)}>
                  <LineBadge line={l} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{l.name}</Text>
                    <Text style={styles.muted}>
                      {l.kind === "regional" ? "Regional" : "Urbana"} · {buses.filter((b) => b.lineId === l.id).length} ônibus · {money(l.fare)}
                    </Text>
                  </View>
                  {v.favLines.includes(l.id) && <Star size={16} color={colors.warning} fill={colors.warning} />}
                  <ChevronRight size={19} color={colors.textLight} />
                </Pressable>
              ))}
              {matchedBuses.map((b) => (
                <Pressable key={b.id} style={styles.row} onPress={() => selectBus(b.id)}>
                  <LineBadge line={LINE_MAP[b.lineId]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>Ônibus {b.id}</Text>
                    <Text style={styles.muted}>{LINE_MAP[b.lineId].name}</Text>
                  </View>
                  <ChevronRight size={19} color={colors.textLight} />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </Page>
  );
}

/* ------------------------------ Painel da linha ------------------------------ */
function LinePanel({
  line,
  buses,
  favorite,
  onFavorite,
  onSelectBus,
  onBoard,
}: {
  line: Line;
  buses: Bus[];
  favorite: boolean;
  onFavorite: () => void;
  onSelectBus: (id: string) => void;
  onBoard: () => void;
}) {
  const lineBuses = buses.filter((b) => b.lineId === line.id);
  return (
    <>
      <Card style={{ gap: 14 }}>
        <View style={styles.panelHead}>
          <LineBadge line={line} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{line.name}</Text>
            <Text style={styles.muted}>Tarifa {money(line.fare)}</Text>
          </View>
          <Pill label={line.kind === "regional" ? "Regional" : "Urbana"} color={line.color} />
          <Pressable onPress={onFavorite} hitSlop={10}>
            <Star size={24} color={favorite ? colors.warning : colors.textLight} fill={favorite ? colors.warning : "transparent"} />
          </Pressable>
        </View>
        <Button title="Embarcar nesta linha" icon={Ticket} onPress={onBoard} />
      </Card>

      <SectionTitle title="Ônibus da linha" subtitle="Toque para acompanhar" />
      <View style={{ gap: 10 }}>
        {lineBuses.map((b) => {
          const idx = nextStopIndex(b, line);
          const eta = Math.round(etaToStop(b, line, idx));
          return (
            <Pressable key={b.id} style={styles.row} onPress={() => onSelectBus(b.id)}>
              <View style={[styles.busIcon, { backgroundColor: line.color }]}>
                <BusFront size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{b.id}</Text>
                <Text style={styles.muted}>Próxima: {STOPS[line.stopIds[idx]].name}</Text>
              </View>
              <Text style={styles.eta}>{eta <= 0 ? "Chegando" : `${eta} min`}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Paradas" subtitle="Próximo ônibus em cada parada" />
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        {line.stopIds.map((id, i) => {
          const next = nearestEta(buses, line, i);
          return (
            <View key={id} style={styles.stopRow}>
              <View style={[styles.stopDot, { borderColor: line.color }]} />
              <Text style={[styles.rowTitle, { flex: 1 }]}>{STOPS[id].name}</Text>
              <Text style={styles.muted}>{next ? `${Math.max(0, Math.round(next.minutes))} min` : "--"}</Text>
            </View>
          );
        })}
      </Card>
    </>
  );
}

/* ------------------------------ Painel do ônibus ------------------------------ */
function BusPanel({
  bus,
  line,
  follow,
  onToggleFollow,
  onBoard,
  onBack,
}: {
  bus: Bus;
  line: Line;
  follow: boolean;
  onToggleFollow: () => void;
  onBoard: () => void;
  onBack: () => void;
}) {
  const g = geometry(line);
  const nextIdx = nextStopIndex(bus, line);
  const next = STOPS[line.stopIds[nextIdx]];
  const eta = Math.round(etaToStop(bus, line, nextIdx));
  const heading = STOPS[line.stopIds[bus.dir === 1 ? line.stopIds.length - 1 : 0]].name;

  let ahead = line.stopIds
    .map((id, i) => ({ id, d: g.cum[i] }))
    .filter((s) => (bus.dir === 1 ? s.d >= bus.dist - 0.01 : s.d <= bus.dist + 0.01));
  if (bus.dir === -1) ahead = ahead.reverse();
  const shown = follow ? ahead : ahead.slice(0, 3);

  return (
    <>
      <Card style={{ gap: 14 }}>
        <View style={styles.panelHead}>
          <Pressable onPress={onBack} style={styles.backChip} hitSlop={8}>
            <ArrowLeft size={18} color={colors.navy} />
          </Pressable>
          <LineBadge line={line} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{bus.id}</Text>
            <Text style={styles.muted}>Sentido {heading}</Text>
          </View>
          <Pill label={follow ? "Seguindo" : "Em operação"} color={follow ? colors.success : line.color} />
        </View>

        <View style={styles.nextBox}>
          <Text style={styles.muted}>Próxima parada</Text>
          <Text style={styles.nextName}>{next.name}</Text>
          <Text style={[styles.eta, { fontSize: 18 }]}>{eta <= 0 ? "Chegando agora" : `em ${eta} min`}</Text>
        </View>

        <View style={{ gap: 6 }}>
          <ProgressBar value={bus.dist / g.length} color={line.color} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.tiny}>{STOPS[line.stopIds[0]].name}</Text>
            <Text style={styles.tiny}>{STOPS[line.stopIds[line.stopIds.length - 1]].name}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            title={follow ? "Parar de seguir" : "Acompanhar"}
            icon={Navigation}
            variant={follow ? "secondary" : "primary"}
            onPress={onToggleFollow}
            style={{ flex: 1 }}
          />
          <Button title="Embarcar" icon={Ticket} variant="accent" onPress={onBoard} style={{ flex: 1 }} />
        </View>
      </Card>

      <SectionTitle title={follow ? "Todas as paradas à frente" : "Próximas paradas"} />
      <Card style={{ paddingVertical: 6 }}>
        {shown.length === 0 ? (
          <Text style={styles.muted}>Final da linha.</Text>
        ) : (
          shown.map((s) => (
            <View key={s.id} style={styles.stopRow}>
              <View style={[styles.stopDot, { borderColor: line.color }]} />
              <Text style={[styles.rowTitle, { flex: 1 }]}>{STOPS[s.id].name}</Text>
              <Text style={styles.muted}>{Math.max(0, Math.round(Math.abs(s.d - bus.dist) / bus.speed))} min</Text>
            </View>
          ))
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  live: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, ...shadow },
  liveText: { color: colors.navy, fontWeight: "800", fontSize: 12 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 14, ...shadow },
  searchInput: { flex: 1, color: colors.navy, fontSize: 15, height: "100%" },
  followBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  followText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: -6 },
  row: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, ...shadow },
  rowTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  tiny: { color: colors.textLight, fontSize: 11 },
  panelHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  backChip: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.greenLight, alignItems: "center", justifyContent: "center" },
  busIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eta: { color: colors.blue, fontWeight: "800", fontSize: 14 },
  nextBox: { backgroundColor: colors.background, borderRadius: 14, padding: 14, gap: 2 },
  nextName: { color: colors.navy, fontSize: 18, fontWeight: "800" },
  stopRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  stopDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, backgroundColor: "#FFFFFF" },
});

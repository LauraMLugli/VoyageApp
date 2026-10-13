import { colors } from "@/lib/theme";
import { Bus, LINE_MAP, LINES, MAP_H, MAP_W, STOPS, positionAt } from "@/lib/transit";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Polyline, Rect, Text as SvgText } from "react-native-svg";

// Mapa esquemático desenhado em SVG (funciona no Expo Go e na web, sem chave de API).
// Para um mapa real, troque este componente por react-native-maps ou Mapbox
// e use as coordenadas reais das paradas.

type Props = {
  buses: Bus[];
  selectedLineId?: string | null;
  selectedBusId?: string | null;
  onSelectBus: (id: string) => void;
};

const Base = memo(function Base() {
  return (
    <>
      <Rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#E8F4F1" />
      {/* parques */}
      <Rect x={18} y={300} width={110} height={110} rx={18} fill="#CDEBD6" />
      <Rect x={215} y={20} width={90} height={42} rx={14} fill="#CDEBD6" />
      <Rect x={225} y={330} width={95} height={62} rx={16} fill="#D6EFDF" />
      {/* rio */}
      <Path
        d="M-10 300 C 60 270, 120 330, 200 300 S 320 250, 370 275"
        stroke="#BFE3F2"
        strokeWidth={16}
        fill="none"
        strokeLinecap="round"
      />
      {/* ruas */}
      {[60, 120, 240, 300].map((x) => (
        <Path key={`v${x}`} d={`M${x} 0 L${x} ${MAP_H}`} stroke="#FFFFFF" strokeWidth={4} opacity={0.9} />
      ))}
      {[60, 170, 290, 340, 400].map((y) => (
        <Path key={`h${y}`} d={`M0 ${y} L${MAP_W} ${y}`} stroke="#FFFFFF" strokeWidth={4} opacity={0.9} />
      ))}
      <Path d={`M0 190 L${MAP_W} 120`} stroke="#FFFFFF" strokeWidth={6} opacity={0.9} />
      {/* avenidas principais */}
      <Path d={`M180 0 L180 ${MAP_H}`} stroke="#FFFFFF" strokeWidth={8} />
      <Path d={`M0 230 L${MAP_W} 230`} stroke="#FFFFFF" strokeWidth={8} />
    </>
  );
});

function BusMarker({ bus, dim, selected, onPress }: { bus: Bus; dim: boolean; selected: boolean; onPress: () => void }) {
  const line = LINE_MAP[bus.lineId];
  const { x, y } = positionAt(line, bus.dist);
  return (
    <G x={x} y={y} opacity={dim ? 0.45 : 1} onPress={onPress}>
      <Circle r={18} fill="transparent" />
      {selected && <Circle r={17} fill={line.color} opacity={0.22} />}
      <Rect x={-10} y={-7} width={20} height={14} rx={4} fill={line.color} stroke="#FFFFFF" strokeWidth={2} />
      <Rect x={-6.5} y={-4} width={13} height={5} rx={1.5} fill="#FFFFFF" />
      <Circle cx={-5} cy={8} r={1.8} fill="#192440" />
      <Circle cx={5} cy={8} r={1.8} fill="#192440" />
      {selected && (
        <SvgText y={-12} fontSize={8} fontWeight="bold" fill={colors.navy} textAnchor="middle" stroke="#FFFFFF" strokeWidth={2.5}>
          {line.code}
        </SvgText>
      )}
    </G>
  );
}

export default function BusMap({ buses, selectedLineId, selectedBusId, onSelectBus }: Props) {
  // linha selecionada desenhada por último (por cima)
  const ordered = [...LINES].sort((a, b) => Number(a.id === selectedLineId) - Number(b.id === selectedLineId));
  const selectedLine = selectedLineId ? LINE_MAP[selectedLineId] : null;

  const labeledStops = new Set<string>(selectedLine ? selectedLine.stopIds : ["term"]);

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        <Base />

        {ordered.map((line) => {
          const dim = !!selectedLineId && line.id !== selectedLineId;
          const pts = line.stopIds.map((id) => `${STOPS[id].x},${STOPS[id].y}`).join(" ");
          const w = line.id === selectedLineId ? 7 : 5;
          return (
            <G key={line.id} opacity={dim ? 0.25 : 1}>
              <Polyline points={pts} stroke="#FFFFFF" strokeWidth={w + 3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Polyline points={pts} stroke={line.color} strokeWidth={w} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </G>
          );
        })}

        {Object.values(STOPS).map((stop) => {
          const hub = stop.id === "term";
          return (
            <G key={stop.id}>
              <Circle cx={stop.x} cy={stop.y} r={hub ? 8 : 5.5} fill="#FFFFFF" stroke={colors.navy} strokeWidth={hub ? 3 : 2} />
              {labeledStops.has(stop.id) && (
                <SvgText
                  x={stop.x}
                  y={stop.y - (hub ? 13 : 10)}
                  fontSize={9}
                  fontWeight="bold"
                  fill={colors.navy}
                  textAnchor="middle"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                >
                  {stop.name}
                </SvgText>
              )}
            </G>
          );
        })}

        {buses.map((bus) => (
          <BusMarker
            key={bus.id}
            bus={bus}
            dim={!!selectedLineId && bus.lineId !== selectedLineId}
            selected={bus.id === selectedBusId}
            onPress={() => onSelectBus(bus.id)}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    aspectRatio: MAP_W / MAP_H,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
});

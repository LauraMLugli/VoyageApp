import { colors } from "@/lib/theme";
import { STOP_LIST, linesAtStop } from "@/lib/transit";
import { Check, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineBadge } from "./ui";

type Props = {
  visible: boolean;
  title: string;
  selectedId?: string;
  excludeId?: string;
  onSelect: (stopId: string) => void;
  onClose: () => void;
};

export default function StopPicker({ visible, title, selectedId, excludeId, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={22} color={colors.navy} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {STOP_LIST.filter((s) => s.id !== excludeId).map((stop) => (
              <Pressable
                key={stop.id}
                style={styles.row}
                onPress={() => {
                  onSelect(stop.id);
                  onClose();
                }}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.name}>{stop.name}</Text>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    {linesAtStop(stop.id).map((l) => (
                      <LineBadge key={l.id} line={l} small />
                    ))}
                  </View>
                </View>
                {selectedId === stop.id && <Check size={20} color={colors.accent} />}
              </Pressable>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,31,61,0.45)" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: "75%",
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { color: colors.navy, fontSize: 18, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { color: colors.navy, fontSize: 15, fontWeight: "700" },
});

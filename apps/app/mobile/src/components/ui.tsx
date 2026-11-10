import { colors, gradients, radius, shadow } from "@/lib/theme";
import type { Line } from "@/lib/transit";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { ComponentType, ReactNode, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/* ---------------------------------- Page ---------------------------------- */
type PageProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Page({ eyebrow, title, subtitle, back, right, children, contentStyle }: PageProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={s.page}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={s.headerLeft}>
          {back && (
            <Pressable
              style={s.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              hitSlop={8}
            >
              <ChevronLeft size={22} color={colors.navy} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            {!!eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
            <Text style={s.title}>{title}</Text>
            {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {right}
      </View>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 28 }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

/* ---------------------------------- Card ---------------------------------- */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {!!subtitle && <Text style={s.muted}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

/* --------------------------------- Buttons -------------------------------- */
type ButtonProps = {
  title: string;
  onPress: () => void;
  icon?: IconType;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, icon: Icon, variant = "primary", loading, disabled, style }: ButtonProps) {
  const fg =
    variant === "primary" ? "#FFFFFF"
    : variant === "danger" ? colors.danger
    : variant === "accent" ? colors.navy
    : colors.blue;

  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <>
      {Icon && <Icon size={18} color={fg} />}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </>
  );

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.88 : 1 }, style]}
      >
        <LinearGradient colors={gradients.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === "secondary" ? { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: colors.blue }
    : variant === "danger" ? { backgroundColor: colors.dangerLight }
    : variant === "accent" ? { backgroundColor: colors.accent }
    : { backgroundColor: "transparent" };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, bg, { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}
    >
      {content}
    </Pressable>
  );
}

/* ---------------------------------- Field --------------------------------- */
type FieldProps = TextInputProps & {
  label: string;
  icon?: IconType;
  secure?: boolean;
  error?: string | null;
};

export function Field({ label, icon: Icon, secure, error, style, ...rest }: FieldProps) {
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View
        style={[
          s.fieldBox,
          focus && { borderColor: colors.blue, backgroundColor: "#FFFFFF" },
          !!error && { borderColor: colors.danger },
        ]}
      >
        {Icon && <Icon size={18} color={focus ? colors.blue : colors.textLight} />}
        <TextInput
          {...rest}
          style={[s.fieldInput, style]}
          placeholderTextColor="#9AA7B2"
          secureTextEntry={secure && !show}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
        />
        {secure && (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={10}>
            {show ? <EyeOff size={18} color={colors.textLight} /> : <Eye size={18} color={colors.textLight} />}
          </Pressable>
        )}
      </View>
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

/* ------------------------------ Chips / Tabs ------------------------------ */
export function Chip({
  label,
  active,
  onPress,
  color = colors.blue,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active ? { backgroundColor: color, borderColor: color } : null]}
    >
      <Text style={[s.chipText, active ? { color: "#FFFFFF" } : null]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={s.segmented}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[s.segItem, active && s.segItemActive]}>
            <Text style={[s.segText, active && { color: colors.blue }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------- Small pieces ------------------------------ */
export function IconBubble({ icon: Icon, color, size = 42 }: { icon: IconType; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={size * 0.48} color="#FFFFFF" />
    </View>
  );
}

export function SoftIcon({ icon: Icon, color, size = 40 }: { icon: IconType; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}22`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={size * 0.48} color={color} />
    </View>
  );
}

export function LineBadge({ line, small }: { line: Line; small?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: line.color,
        paddingHorizontal: small ? 8 : 11,
        paddingVertical: small ? 3 : 5,
        borderRadius: 9,
        minWidth: small ? 34 : 44,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: small ? 11 : 14 }}>{line.code}</Text>
    </View>
  );
}

export function Pill({ label, color = colors.blue }: { label: string; color?: string }) {
  return (
    <View style={{ backgroundColor: `${color}1F`, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color, fontSize: 11, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.accent }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.greenLight, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export function LiveDot({ color = colors.accent }: { color?: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity }} />;
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: IconType;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon size={26} color={colors.teal} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {!!text && <Text style={[s.muted, { textAlign: "center" }]}>{text}</Text>}
      {action}
    </View>
  );
}

/* --------------------------------- Styles --------------------------------- */
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  eyebrow: { color: colors.teal, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.navy, fontSize: 26, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  card: { backgroundColor: "#FFFFFF", borderRadius: radius.lg, padding: 16, ...shadow },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: colors.navy, fontSize: 18, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  btn: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { fontSize: 15, fontWeight: "800" },
  fieldLabel: { color: colors.navy, fontSize: 13, fontWeight: "700" },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "#F4F8F8",
    borderWidth: 1.5,
    borderColor: "#E3ECEC",
  },
  fieldInput: { flex: 1, color: colors.navy, fontSize: 15, height: "100%" },
  fieldError: { color: colors.danger, fontSize: 12, fontWeight: "600" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipText: { color: colors.navy, fontSize: 13, fontWeight: "700" },
  segmented: { flexDirection: "row", backgroundColor: "#DDEBE9", borderRadius: 14, padding: 4 },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  segItemActive: { backgroundColor: "#FFFFFF", ...shadow },
  segText: { color: colors.textMuted, fontWeight: "800", fontSize: 13 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 28, paddingHorizontal: 20 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { color: colors.navy, fontWeight: "800", fontSize: 16, textAlign: "center" },
});

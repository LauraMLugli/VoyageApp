import { colors, shadow } from "@/lib/theme";
import { createContext, PropsWithChildren, useCallback, useContext, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

// Caixa de diálogo própria do app. Substitui o Alert.alert, que NÃO aparece no navegador (web)
// e por isso deixava botões como "Sair", "Comprar" e "Embarcar" parecendo quebrados.
export type DialogOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type DialogCtx = {
  /** Mostra uma pergunta. Resolve `true` se o usuário confirmar, `false` se cancelar. */
  confirm: (options: DialogOptions) => Promise<boolean>;
  /** Mostra um aviso com um botão "OK". */
  notify: (title: string, message?: string) => Promise<void>;
};

const DialogContext = createContext<DialogCtx | null>(null);

export function useDialog(): DialogCtx {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog deve ser usado dentro do DialogProvider");
  return ctx;
}

type Pending = DialogOptions & { single: boolean };

export function DialogProvider({ children }: PropsWithChildren) {
  const [pending, setPending] = useState<Pending | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const open = useCallback((options: Pending) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setPending(options);
    });
  }, []);

  const close = (value: boolean) => {
    const resolve = resolver.current;
    resolver.current = null;
    setPending(null);
    resolve?.(value);
  };

  const confirm = useCallback<DialogCtx["confirm"]>((options) => open({ ...options, single: false }), [open]);
  const notify = useCallback<DialogCtx["notify"]>(
    async (title, message) => {
      await open({ title, message, confirmText: "OK", single: true });
    },
    [open],
  );

  return (
    <DialogContext.Provider value={{ confirm, notify }}>
      {children}
      <Modal visible={pending !== null} transparent animationType="fade" onRequestClose={() => close(false)}>
        <View style={styles.backdrop}>
          <View style={styles.box}>
            <Text style={styles.title}>{pending?.title}</Text>
            {!!pending?.message && <Text style={styles.message}>{pending.message}</Text>}
            <View style={styles.actions}>
              {!pending?.single && (
                <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => close(false)}>
                  <Text style={[styles.btnText, { color: colors.blue }]}>{pending?.cancelText ?? "Cancelar"}</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.btn, { backgroundColor: pending?.destructive ? colors.danger : colors.blue }]}
                onPress={() => close(true)}
              >
                <Text style={[styles.btnText, { color: "#FFFFFF" }]}>{pending?.confirmText ?? "Confirmar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,31,61,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { width: "100%", maxWidth: 380, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 22, gap: 10, ...shadow },
  title: { color: colors.navy, fontSize: 19, fontWeight: "800" },
  message: { color: colors.textMedium, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  btnCancel: { backgroundColor: colors.greenLight },
  btnText: { fontSize: 15, fontWeight: "800" },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext, User } from "./authContext";
import { money, remaining } from "./format";
import { OwnedPass, PASS_CATALOG, isPassActive, passCoversLine } from "./passes";
import { PAYMENT_LABEL, PaymentMethod, processPayment } from "./payments";
import { LINE_MAP } from "./transit";

export type CardType = "comum" | "estudante" | "vale";
export const CARD_TYPE_LABEL: Record<CardType, string> = {
  comum: "Comum",
  estudante: "Estudante",
  vale: "Vale-transporte",
};

export type Card = {
  number: string;
  holder: string;
  type: CardType;
  linkedAt: number;
  status: "ativo" | "bloqueado";
};

export type TxType = "recarga" | "passe" | "viagem";
export type Tx = {
  id: string;
  type: TxType;
  title: string;
  subtitle: string;
  amount: number; // positivo = crédito, negativo = débito, 0 = uso de passe
  ts: number;
};

export type NoticeKind = "saldo" | "recarga" | "passe" | "transporte";
export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  message: string;
  ts: number;
  read: boolean;
};

export type FavRoute = { id: string; originId: string; destId: string };

type VoyageData = {
  balance: number;
  card: Card | null;
  passes: OwnedPass[];
  txs: Tx[];
  notices: Notice[];
  favLines: string[];
  favRoutes: FavRoute[];
};

export type Result = { ok: boolean; error?: string; message?: string };

export const LOW_BALANCE = 10;
export const MIN_RECHARGE = 5;
export const MAX_RECHARGE = 500;

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const dataKey = (userId: number) => `voyage-data:${userId}`;

function mkNotice(kind: NoticeKind, title: string, message: string, ts = Date.now()): Notice {
  return { id: uid(), kind, title, message, ts, read: false };
}

const EMPTY: VoyageData = {
  balance: 0,
  card: null,
  passes: [],
  txs: [],
  notices: [],
  favLines: [],
  favRoutes: [],
};

function initialData(user: User): VoyageData {
  const now = Date.now();
  const data: VoyageData = {
    ...EMPTY,
    notices: [
      mkNotice("transporte", "Linha 302 com atraso", "Obras na região central causam atraso médio de 8 minutos na linha 302.", now - 3600000),
      mkNotice("transporte", "Horário especial na linha 710", "A linha regional 710 opera com intervalos maiores aos domingos.", now - 86400000),
    ],
  };

  if (user.usuario === "demo") {
    // Conta de demonstração já vem com cartão, saldo e histórico
    data.balance = 42.8;
    data.card = {
      number: "6034120045678901",
      holder: user.name,
      type: "comum",
      linkedAt: now - 20 * 86400000,
      status: "ativo",
    };
    data.favLines = ["201", "302"];
    data.passes = [
      {
        id: uid(),
        passId: "diario-urbano",
        name: "Passe diário",
        kind: "diario",
        scope: "urbano",
        price: 16,
        purchasedAt: now - 3 * 3600000,
        expiresAt: now + 21 * 3600000,
        usesLeft: null,
      },
    ];
    data.txs = [
      { id: uid(), type: "passe", title: "Passe diário", subtitle: "Urbano · 24 horas", amount: -16, ts: now - 3 * 3600000 },
      { id: uid(), type: "viagem", title: "Linha 302", subtitle: "Terminal Central", amount: -5.5, ts: now - 26 * 3600000 },
      { id: uid(), type: "recarga", title: "Recarga confirmada", subtitle: "Pix · Cartão 8901", amount: 20, ts: now - 27 * 3600000 },
    ];
  } else {
    data.notices.unshift(
      mkNotice("saldo", "Saldo baixo", "Seu saldo está em R$ 0,00. Vincule um cartão e faça sua primeira recarga."),
    );
  }
  return data;
}

type VoyageCtx = VoyageData & {
  ready: boolean;
  unread: number;
  activePasses: OwnedPass[];
  expiredPasses: OwnedPass[];
  linkCard: (number: string, holder: string, type: CardType) => Result;
  generateCard: (holder: string, type: CardType) => Result;
  unlinkCard: () => void;
  recharge: (amount: number, method: PaymentMethod) => Promise<Result>;
  buyPass: (passId: string) => Result;
  boardLine: (lineId: string) => Result;
  toggleFavLine: (lineId: string) => void;
  toggleFavRoute: (originId: string, destId: string) => boolean;
  isFavRoute: (originId: string, destId: string) => boolean;
  removeFavRoute: (id: string) => void;
  markAllRead: () => void;
};

const VoyageContext = createContext<VoyageCtx | null>(null);

export function useVoyage(): VoyageCtx {
  const ctx = useContext(VoyageContext);
  if (!ctx) throw new Error("useVoyage deve ser usado dentro do VoyageProvider");
  return ctx;
}

// Guarda saldo, cartão, passes, histórico, avisos e favoritos de cada usuário.
// Hoje persiste no aparelho (AsyncStorage). Com backend, estas funções passam
// a chamar a API e o estado local vira apenas cache.
export function VoyageProvider({ children }: PropsWithChildren) {
  const { user } = useContext(AuthContext);
  const userId = user?.id ?? null;

  const [data, setData] = useState<VoyageData>(EMPTY);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const ref = useRef<VoyageData>(EMPTY);
  const ready = userId !== null && loadedFor === userId;

  // Carrega os dados do usuário ao entrar
  useEffect(() => {
    if (!user) {
      ref.current = EMPTY;
      setData(EMPTY);
      setLoadedFor(null);
      return;
    }
    let cancelled = false;
    (async () => {
      let loaded: VoyageData;
      try {
        const raw = await AsyncStorage.getItem(dataKey(user.id));
        loaded = raw ? { ...EMPTY, ...JSON.parse(raw) } : initialData(user);
      } catch {
        loaded = initialData(user);
      }
      if (cancelled) return;
      ref.current = loaded;
      setData(loaded);
      setLoadedFor(user.id);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Salva a cada mudança
  useEffect(() => {
    if (userId !== null && loadedFor === userId) {
      AsyncStorage.setItem(dataKey(userId), JSON.stringify(data)).catch(() => {});
    }
  }, [data, loadedFor, userId]);

  const commit = useCallback((fn: (d: VoyageData) => VoyageData) => {
    const prev = ref.current;
    let next = fn(prev);
    if (next === prev) return;
    // Aviso de saldo baixo ao cruzar o limite
    if (prev.balance >= LOW_BALANCE && next.balance < LOW_BALANCE) {
      next = {
        ...next,
        notices: [
          mkNotice("saldo", "Saldo baixo", `Seu saldo está em ${money(next.balance)}. Recarregue para continuar viajando.`),
          ...next.notices,
        ],
      };
    }
    ref.current = next;
    setData(next);
  }, []);

  // Aviso de passe perto do vencimento
  const checkExpiry = useCallback(() => {
    const now = Date.now();
    setTick((t) => t + 1);
    commit((cur) => {
      let changed = false;
      const notices = [...cur.notices];
      const passes = cur.passes.map((p) => {
        if (p.expiryNotified || p.kind === "unico" || !isPassActive(p, now)) return p;
        const threshold = p.kind === "mensal" ? 3 * 86400000 : 4 * 3600000;
        if (p.expiresAt - now <= threshold) {
          changed = true;
          notices.unshift(
            mkNotice("passe", "Passe perto de vencer", `${p.name} vence em ${remaining(p.expiresAt)}.`),
          );
          return { ...p, expiryNotified: true };
        }
        return p;
      });
      return changed ? { ...cur, passes, notices } : cur;
    });
  }, [commit]);

  useEffect(() => {
    if (!ready) return;
    checkExpiry();
    const id = setInterval(checkExpiry, 60000);
    return () => clearInterval(id);
  }, [ready, checkExpiry]);

  // ---------- Cartão ----------
  const linkCard = useCallback<VoyageCtx["linkCard"]>(
    (number, holder, type) => {
      const digits = number.replace(/\D/g, "");
      if (digits.length !== 16) return { ok: false, error: "O número do cartão deve ter 16 dígitos." };
      if (holder.trim().length < 3) return { ok: false, error: "Informe o nome do titular." };
      commit((cur) => ({
        ...cur,
        card: { number: digits, holder: holder.trim(), type, linkedAt: Date.now(), status: "ativo" },
      }));
      return { ok: true, message: "Cartão vinculado à sua conta." };
    },
    [commit],
  );

  const generateCard = useCallback<VoyageCtx["generateCard"]>(
    (holder, type) => {
      let digits = "6034";
      for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10);
      return linkCard(digits, holder, type);
    },
    [linkCard],
  );

  const unlinkCard = useCallback(() => commit((cur) => ({ ...cur, card: null })), [commit]);

  // ---------- Recarga ----------
  const recharge = useCallback<VoyageCtx["recharge"]>(
    async (amount, method) => {
      const card = ref.current.card;
      if (!card) return { ok: false, error: "Vincule um cartão Voyage antes de recarregar." };
      if (!(amount >= MIN_RECHARGE && amount <= MAX_RECHARGE)) {
        return { ok: false, error: `Escolha um valor entre ${money(MIN_RECHARGE)} e ${money(MAX_RECHARGE)}.` };
      }
      const payment = await processPayment({ amount, method });
      if (!payment.ok) return { ok: false, error: "Pagamento não aprovado. Tente novamente." };
      const last4 = card.number.slice(-4);
      commit((cur) => ({
        ...cur,
        balance: round2(cur.balance + amount),
        txs: [
          { id: uid(), type: "recarga" as TxType, title: "Recarga confirmada", subtitle: `${PAYMENT_LABEL[method]} · Cartão ${last4}`, amount, ts: Date.now() },
          ...cur.txs,
        ].slice(0, 200),
        notices: [
          mkNotice("recarga", "Recarga realizada", `${money(amount)} adicionados ao cartão final ${last4}.`),
          ...cur.notices,
        ],
      }));
      return { ok: true, message: `Recarga de ${money(amount)} confirmada.` };
    },
    [commit],
  );

  // ---------- Passes ----------
  const buyPass = useCallback<VoyageCtx["buyPass"]>(
    (passId) => {
      const def = PASS_CATALOG.find((p) => p.id === passId);
      const cur = ref.current;
      if (!def) return { ok: false, error: "Passe não encontrado." };
      if (!cur.card) return { ok: false, error: "Vincule um cartão Voyage para comprar passes." };
      if (cur.balance < def.price) {
        return { ok: false, error: `Saldo insuficiente. Você tem ${money(cur.balance)} e o passe custa ${money(def.price)}.` };
      }
      const now = Date.now();
      const owned: OwnedPass = {
        id: uid(),
        passId: def.id,
        name: def.name,
        kind: def.kind,
        scope: def.scope,
        price: def.price,
        purchasedAt: now,
        expiresAt: now + def.durationHours * 3600000,
        usesLeft: def.uses,
      };
      commit((c) => ({
        ...c,
        balance: round2(c.balance - def.price),
        passes: [owned, ...c.passes],
        txs: [
          { id: uid(), type: "passe" as TxType, title: def.name, subtitle: `${def.scope === "regional" ? "Regional" : "Urbano"} · ativado agora`, amount: -def.price, ts: now },
          ...c.txs,
        ].slice(0, 200),
      }));
      return { ok: true, message: `${def.name} ativado.` };
    },
    [commit],
  );

  // ---------- Uso do transporte (embarque simulado) ----------
  const boardLine = useCallback<VoyageCtx["boardLine"]>(
    (lineId) => {
      const line = LINE_MAP[lineId];
      const cur = ref.current;
      if (!line) return { ok: false, error: "Linha não encontrada." };
      if (!cur.card) return { ok: false, error: "Vincule um cartão Voyage para embarcar." };
      const now = Date.now();
      const usable = cur.passes
        .filter((p) => isPassActive(p, now) && passCoversLine(p.scope, line.kind))
        .sort((a, b) => Number(a.kind === "unico") - Number(b.kind === "unico"));
      const pass = usable[0];

      if (pass) {
        commit((c) => ({
          ...c,
          passes: c.passes.map((p) =>
            p.id === pass.id && p.usesLeft !== null ? { ...p, usesLeft: p.usesLeft - 1 } : p,
          ),
          txs: [
            { id: uid(), type: "viagem" as TxType, title: `Linha ${line.code}`, subtitle: `${line.name} · ${pass.name}`, amount: 0, ts: now },
            ...c.txs,
          ].slice(0, 200),
        }));
        return { ok: true, message: `Embarque na linha ${line.code} liberado com o ${pass.name.toLowerCase()}.` };
      }

      if (cur.balance < line.fare) {
        return { ok: false, error: `Saldo insuficiente. A tarifa é ${money(line.fare)} e você tem ${money(cur.balance)}.` };
      }
      commit((c) => ({
        ...c,
        balance: round2(c.balance - line.fare),
        txs: [
          { id: uid(), type: "viagem" as TxType, title: `Linha ${line.code}`, subtitle: line.name, amount: -line.fare, ts: now },
          ...c.txs,
        ].slice(0, 200),
      }));
      return { ok: true, message: `Embarque na linha ${line.code}. Tarifa de ${money(line.fare)} debitada.` };
    },
    [commit],
  );

  // ---------- Favoritos ----------
  const toggleFavLine = useCallback(
    (lineId: string) =>
      commit((cur) => ({
        ...cur,
        favLines: cur.favLines.includes(lineId)
          ? cur.favLines.filter((id) => id !== lineId)
          : [...cur.favLines, lineId],
      })),
    [commit],
  );

  const isFavRoute = useCallback(
    (o: string, d: string) => data.favRoutes.some((r) => r.originId === o && r.destId === d),
    [data.favRoutes],
  );

  const toggleFavRoute = useCallback(
    (o: string, d: string) => {
      const exists = ref.current.favRoutes.some((r) => r.originId === o && r.destId === d);
      commit((cur) => ({
        ...cur,
        favRoutes: exists
          ? cur.favRoutes.filter((r) => !(r.originId === o && r.destId === d))
          : [...cur.favRoutes, { id: uid(), originId: o, destId: d }],
      }));
      return !exists;
    },
    [commit],
  );

  const removeFavRoute = useCallback(
    (id: string) => commit((cur) => ({ ...cur, favRoutes: cur.favRoutes.filter((r) => r.id !== id) })),
    [commit],
  );

  // ---------- Avisos ----------
  const markAllRead = useCallback(
    () =>
      commit((cur) =>
        cur.notices.some((n) => !n.read)
          ? { ...cur, notices: cur.notices.map((n) => ({ ...n, read: true })) }
          : cur,
      ),
    [commit],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activePasses = useMemo(() => data.passes.filter((p) => isPassActive(p)), [data.passes, tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const expiredPasses = useMemo(() => data.passes.filter((p) => !isPassActive(p)), [data.passes, tick]);
  const unread = data.notices.filter((n) => !n.read).length;

  const value: VoyageCtx = {
    ...data,
    ready,
    unread,
    activePasses,
    expiredPasses,
    linkCard,
    generateCard,
    unlinkCard,
    recharge,
    buyPass,
    boardLine,
    toggleFavLine,
    toggleFavRoute,
    isFavRoute,
    removeFavRoute,
    markAllRead,
  };

  return <VoyageContext.Provider value={value}>{children}</VoyageContext.Provider>;
}

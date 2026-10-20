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
import { AppState } from "react-native";
import { api, errorMessage } from "./api";
import { AuthContext } from "./authContext";
import { isPassActive, OwnedPass, PASS_CATALOG, PassDef } from "./passes";
import { PaymentMethod } from "./payments";

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

// "Foto" da conta que a API devolve em GET /me/state
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
type ActionResponse = { message: string; state: VoyageData };

export const LOW_BALANCE = 10;
export const MIN_RECHARGE = 5;
export const MAX_RECHARGE = 500;

const EMPTY: VoyageData = {
  balance: 0,
  card: null,
  passes: [],
  txs: [],
  notices: [],
  favLines: [],
  favRoutes: [],
};

type VoyageCtx = VoyageData & {
  ready: boolean;
  status: "loading" | "ready" | "error";
  error: string | null;
  refresh: () => Promise<void>;
  catalog: PassDef[];
  unread: number;
  activePasses: OwnedPass[];
  expiredPasses: OwnedPass[];
  linkCard: (number: string, holder: string, type: CardType) => Promise<Result>;
  generateCard: (holder: string, type: CardType) => Promise<Result>;
  unlinkCard: () => Promise<Result>;
  recharge: (amount: number, method: PaymentMethod) => Promise<Result>;
  buyPass: (passId: string) => Promise<Result>;
  boardLine: (lineId: string) => Promise<Result>;
  toggleFavLine: (lineId: string) => void;
  toggleFavRoute: (originId: string, destId: string) => Promise<boolean>;
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

// Estado da conta do usuário (saldo, cartão, passes, histórico, avisos, favoritos).
// Quem manda é a API/banco de dados: o app pede o estado e, a cada ação (recarga,
// compra, embarque...), a API devolve o estado atualizado. As regras (saldo, validade,
// tarifas) rodam no servidor; aqui só exibimos.
export function VoyageProvider({ children }: PropsWithChildren) {
  const { user } = useContext(AuthContext);
  const userId = user?.id ?? null;

  const [data, setData] = useState<VoyageData>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PassDef[]>(PASS_CATALOG);
  const [tick, setTick] = useState(0);
  const ref = useRef<VoyageData>(EMPTY);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const apply = useCallback((state: VoyageData) => {
    ref.current = state;
    setData(state);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ state: VoyageData }>("/me/state");
      apply(res.state);
      setError(null);
      setStatus("ready");
      setTick((t) => t + 1);
    } catch (e) {
      // se já estava carregado, ignora falhas passageiras de rede; senão mostra a tela de erro
      if (statusRef.current !== "ready") {
        setError(errorMessage(e));
        setStatus("error");
      }
    }
  }, [apply]);

  // Carrega (ou limpa) os dados quando o usuário entra/sai
  useEffect(() => {
    if (userId === null) {
      apply(EMPTY);
      setStatus("loading");
      setError(null);
      return;
    }
    setStatus("loading");
    refresh();
    api
      .get<{ passes: PassDef[] }>("/passes/catalog")
      .then((res) => res.passes?.length && setCatalog(res.passes))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Mantém atualizado: a cada 60 s e quando o app volta para a tela
  useEffect(() => {
    if (status !== "ready") return;
    const id = setInterval(refresh, 60000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [status, refresh]);

  // Executa uma ação na API e aplica o estado novo que ela devolve.
  const act = useCallback(
    async (call: () => Promise<ActionResponse>): Promise<Result> => {
      try {
        const res = await call();
        apply(res.state);
        return { ok: true, message: res.message };
      } catch (e) {
        return { ok: false, error: errorMessage(e) };
      }
    },
    [apply],
  );

  const linkCard = useCallback<VoyageCtx["linkCard"]>(
    (number, holder, type) => act(() => api.put<ActionResponse>("/card", { number, holder, type })),
    [act],
  );
  const generateCard = useCallback<VoyageCtx["generateCard"]>(
    (holder, type) => act(() => api.post<ActionResponse>("/card/virtual", { holder, type })),
    [act],
  );
  const unlinkCard = useCallback<VoyageCtx["unlinkCard"]>(() => act(() => api.delete<ActionResponse>("/card")), [act]);
  const recharge = useCallback<VoyageCtx["recharge"]>(
    (amount, method) => act(() => api.post<ActionResponse>("/recharges", { amount, method })),
    [act],
  );
  const buyPass = useCallback<VoyageCtx["buyPass"]>(
    (passId) => act(() => api.post<ActionResponse>("/passes", { passId })),
    [act],
  );
  const boardLine = useCallback<VoyageCtx["boardLine"]>(
    (lineId) => act(() => api.post<ActionResponse>("/trips", { lineId })),
    [act],
  );

  // ---------- Favoritos: atualiza a tela na hora e confirma com a API ----------
  const toggleFavLine = useCallback(
    (lineId: string) => {
      const cur = ref.current;
      const has = cur.favLines.includes(lineId);
      apply({ ...cur, favLines: has ? cur.favLines.filter((id) => id !== lineId) : [...cur.favLines, lineId] });
      const call = has
        ? api.delete<ActionResponse>(`/favorites/lines/${lineId}`)
        : api.put<ActionResponse>(`/favorites/lines/${lineId}`);
      call.then((res) => apply(res.state)).catch(() => refresh());
    },
    [apply, refresh],
  );

  const isFavRoute = useCallback(
    (o: string, d: string) => data.favRoutes.some((r) => r.originId === o && r.destId === d),
    [data.favRoutes],
  );

  const toggleFavRoute = useCallback(
    async (o: string, d: string) => {
      const cur = ref.current;
      const existing = cur.favRoutes.find((r) => r.originId === o && r.destId === d);
      try {
        if (existing) {
          apply({ ...cur, favRoutes: cur.favRoutes.filter((r) => r.id !== existing.id) });
          const res = await api.delete<ActionResponse>(`/favorites/routes/${existing.id}`);
          apply(res.state);
          return false;
        }
        const res = await api.post<ActionResponse>("/favorites/routes", { originId: o, destId: d });
        apply(res.state);
        return true;
      } catch {
        refresh();
        return !!existing;
      }
    },
    [apply, refresh],
  );

  const removeFavRoute = useCallback(
    (id: string) => {
      const cur = ref.current;
      apply({ ...cur, favRoutes: cur.favRoutes.filter((r) => r.id !== id) });
      api
        .delete<ActionResponse>(`/favorites/routes/${id}`)
        .then((res) => apply(res.state))
        .catch(() => refresh());
    },
    [apply, refresh],
  );

  const markAllRead = useCallback(() => {
    const cur = ref.current;
    if (!cur.notices.some((n) => !n.read)) return;
    apply({ ...cur, notices: cur.notices.map((n) => ({ ...n, read: true })) });
    api.post<ActionResponse>("/notifications/read-all").catch(() => refresh());
  }, [apply, refresh]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activePasses = useMemo(() => data.passes.filter((p) => isPassActive(p)), [data.passes, tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const expiredPasses = useMemo(() => data.passes.filter((p) => !isPassActive(p)), [data.passes, tick]);
  const unread = data.notices.filter((n) => !n.read).length;

  const value: VoyageCtx = {
    ...data,
    ready: status === "ready",
    status,
    error,
    refresh,
    catalog,
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

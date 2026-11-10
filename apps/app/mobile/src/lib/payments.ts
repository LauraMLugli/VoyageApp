// Camada de pagamento.
// Hoje é uma SIMULAÇÃO (nenhuma cobrança real). Para integrar pagamento online
// (Pix, Mercado Pago, Stripe...), troque o corpo de `processPayment` por uma
// chamada ao seu backend, que cria a cobrança e confirma o pagamento.
export type PaymentMethod = "pix" | "credito" | "debito";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
};

export type PaymentResult = { ok: boolean; reference: string };

export async function processPayment(input: {
  amount: number;
  method: PaymentMethod;
}): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 1600));
  return {
    ok: input.amount > 0,
    reference: `VY${Date.now().toString(36).toUpperCase()}`,
  };
}

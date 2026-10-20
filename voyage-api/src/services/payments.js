// Gateway de pagamento. Hoje é uma SIMULAÇÃO: espera um instante e aprova.
// Para cobrar de verdade (Pix, Mercado Pago, Stripe...), troque o corpo desta função
// por uma chamada ao provedor. Em produção o ideal é: criar a cobrança, devolver o QR/link
// ao app e só creditar o saldo quando o provedor avisar o pagamento por webhook.
export async function processPayment({ amount, method }) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { ok: amount > 0, reference: `VY${Date.now().toString(36).toUpperCase()}`, method };
}

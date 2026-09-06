// Plain data logic, deliberately NOT "use client" — payment-panel.tsx is a
// client module, and a Server Component can only render exports of a client
// module as components/props, never call them directly during render. This
// file exists so the server-rendered customer page can call
// groupSplitPayments() itself.

export type PaymentRow = {
  id: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  clientRequestId: string | null;
};

export type PaymentGroup =
  | { type: "single"; payment: PaymentRow }
  | { type: "split"; cash: PaymentRow; gpay: PaymentRow };

/**
 * A single "Add payment" entry can be split across cash and GPay — each side
 * is stored as its own row (sharing a clientRequestId base, e.g.
 * "abc:cash"/"abc:gpay") so amounts/statuses stay correct, but the customer
 * only made ONE payment, so the history should show it on one line instead
 * of two separate ones.
 */
export function groupSplitPayments(payments: PaymentRow[]): PaymentGroup[] {
  const byBase = new Map<string, PaymentRow[]>();
  const groups: PaymentGroup[] = [];

  for (const p of payments) {
    const base = p.clientRequestId?.includes(":") ? p.clientRequestId.split(":")[0] : null;
    if (!base) {
      groups.push({ type: "single", payment: p });
      continue;
    }
    const list = byBase.get(base) ?? [];
    list.push(p);
    byBase.set(base, list);
  }

  for (const list of byBase.values()) {
    const cash = list.find((p) => p.paymentMethod === "cash");
    const gpay = list.find((p) => p.paymentMethod === "gpay");
    if (cash && gpay && list.length === 2) {
      groups.push({ type: "split", cash, gpay });
    } else {
      for (const p of list) groups.push({ type: "single", payment: p });
    }
  }

  const order = new Map(payments.map((p, i) => [p.id, i]));
  const indexOf = (g: PaymentGroup) => order.get(g.type === "single" ? g.payment.id : g.cash.id)!;
  return groups.sort((a, b) => indexOf(a) - indexOf(b));
}

export function buildSePayQrUrl(amount: number, description: string): string {
  const bank = process.env.BCLB_SEPAY_BANK_CODE ?? "MB";
  const account = process.env.BCLB_SEPAY_ACCOUNT_NUMBER ?? "";
  const params = new URLSearchParams({
    bank,
    acc: account,
    template: "compact",
    amount: String(Math.round(amount)),
    des: description,
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

export function buildPaymentRef(sessionId: string, memberId: string): string {
  // Short 6-char slices to keep the transfer description short
  const s = sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const m = memberId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `CLB${s}${m}`;
}

export function parsePaymentRef(ref: string): { sessionSlice: string; memberSlice: string } | null {
  const match = ref.match(/^CLB([A-Z0-9]{6})([A-Z0-9]{6})$/);
  if (!match) return null;
  return { sessionSlice: match[1], memberSlice: match[2] };
}

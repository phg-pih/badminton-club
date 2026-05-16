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

import { createHash } from "crypto";

export function buildPaymentRef(sessionId: string, memberId: string): string {
  const hash = createHash("sha256")
    .update(`${sessionId}:${memberId}`)
    .digest("hex")
    .toUpperCase()
    .slice(0, 10);
  return `CLB${hash}`;
}

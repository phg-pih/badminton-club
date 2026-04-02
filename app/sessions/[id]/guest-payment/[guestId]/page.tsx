export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GuestPaymentPoller } from "./poller";

function buildSePayQrUrl(amount: number, description: string): string {
  const bank = process.env.BCLB_SEPAY_BANK_CODE ?? "MB";
  const account = process.env.BCLB_SEPAY_ACCOUNT_NUMBER ?? "";
  const params = new URLSearchParams({ bank, acc: account, template: "compact", amount: String(Math.round(amount)), des: description });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

function buildGuestPaymentRef(sessionId: string, guestId: string): string {
  const s = sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const g = guestId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `CLBG${s}${g}`;
}

export default async function GuestPaymentPage({ params }: { params: Promise<{ id: string; guestId: string }> }) {
  const { id: sessionId, guestId } = await params;

  let guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { session: true },
  });
  if (!guest || guest.sessionId !== sessionId) notFound();

  // Backfill old guests that were created before payment fields were added
  if (!guest.sePayRef || guest.amount === 0) {
    const amount = guest.session.guestFee * guest.quantity;
    const sePayRef = buildGuestPaymentRef(sessionId, guestId);
    guest = await prisma.guest.update({
      where: { id: guestId },
      data: { amount, sePayRef },
      include: { session: true },
    });
  }

  const dateStr = new Date(guest.session.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const qrUrl = guest.sePayRef && guest.amount > 0 ? buildSePayQrUrl(guest.amount, guest.sePayRef) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <p className="text-3xl mb-1">🏸</p>
          <h1 className="text-xl font-bold">Thanh toán vãng lai</h1>
          <p className="text-gray-500 text-sm">{dateStr}</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {guest.name}
              {guest.quantity > 1 && <span className="ml-2 text-sm font-normal text-gray-500">x{guest.quantity} người</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Số tiền</p>
              <p className="text-3xl font-bold text-orange-600">
                {guest.amount > 0 ? `${guest.amount.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ` : "—"}
              </p>
              {guest.quantity > 1 && guest.session.guestFee > 0 && (
                <p className="text-xs text-gray-400">{guest.session.guestFee.toLocaleString("vi-VN")}đ × {guest.quantity} người</p>
              )}
            </div>

            <div className="text-center">
              <Badge variant={guest.status === "paid" ? "default" : "secondary"} className="text-sm">
                {guest.status === "paid" ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
              </Badge>
              {guest.paidAt && (
                <p className="text-xs text-gray-400 mt-1">{new Date(guest.paidAt).toLocaleString("vi-VN")}</p>
              )}
            </div>

            {guest.status !== "paid" && qrUrl && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">Quét mã QR để thanh toán</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR thanh toán" className="w-56 h-56 object-contain border rounded-lg" />
                <p className="text-xs text-gray-400">Nội dung CK: <strong>{guest.sePayRef}</strong></p>
              </div>
            )}

            {guest.status !== "paid" && !qrUrl && (
              <p className="text-center text-sm text-gray-400">
                {guest.amount === 0 ? "Buổi này miễn phí vãng lai." : "QR chưa khả dụng. Liên hệ admin."}
              </p>
            )}
          </CardContent>
        </Card>

        <Link href={`/sessions/${sessionId}`} className="block">
          <Button variant="outline" className="w-full">← Quay lại điểm danh</Button>
        </Link>

        {guest.status !== "paid" && guest.amount > 0 && (
          <GuestPaymentPoller sessionId={sessionId} guestId={guestId} />
        )}
      </div>
    </div>
  );
}

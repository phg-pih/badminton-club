import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { buildSePayQrUrl } from "@/lib/sepay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PaymentPoller } from "./poller";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: sessionId, memberId } = await params;

  const payment = await prisma.payment.findFirst({
    where: { sessionId, memberId },
    include: {
      member: true,
      attendance: { include: { session: true } },
    },
  });

  if (!payment) notFound();

  const session = payment.attendance.session;
  const dateStr = new Date(session.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const qrUrl = payment.sePayRef ? buildSePayQrUrl(payment.amount, payment.sePayRef) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <p className="text-3xl mb-1">🏸</p>
          <h1 className="text-xl font-bold">Thanh toán cầu lông</h1>
          <p className="text-gray-500 text-sm">{dateStr}</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{payment.member.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Số tiền</p>
              <p className="text-3xl font-bold text-green-600">
                {payment.amount.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ
              </p>
            </div>

            <div className="text-center">
              <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="text-sm">
                {payment.status === "paid" ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
              </Badge>
              {payment.paidAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(payment.paidAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>

            {payment.status !== "paid" && qrUrl && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">Quét mã QR để thanh toán</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR thanh toán" className="w-56 h-56 object-contain border rounded-lg" />
                {payment.sePayRef && (
                  <p className="text-xs text-gray-400">Nội dung CK: <strong>{payment.sePayRef}</strong></p>
                )}
              </div>
            )}

            {payment.status !== "paid" && !qrUrl && (
              <p className="text-center text-sm text-gray-400">QR chưa khả dụng. Vui lòng liên hệ admin.</p>
            )}
          </CardContent>
        </Card>

        <Link href={`/sessions/${sessionId}`} className="block">
          <Button variant="outline" className="w-full">← Quay lại điểm danh</Button>
        </Link>

        {payment.status !== "paid" && (
          <PaymentPoller sessionId={sessionId} memberId={memberId} />
        )}
      </div>
    </div>
  );
}

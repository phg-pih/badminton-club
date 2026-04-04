import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const secret = process.env.BCLB_SEPAY_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Apikey ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { code, content, transferType } = body;
  if (transferType !== "in") return NextResponse.json({ ok: true });

  // Try exact match on code or content, then substring fallback
  const candidates = [code, content].filter(Boolean) as string[];
  let payment = null;

  for (const candidate of candidates) {
    payment = await prisma.payment.findFirst({
      where: { sePayRef: candidate.toUpperCase(), status: "pending" },
    });
    if (payment) break;
  }

  if (!payment && content) {
    const upper = content.toUpperCase();
    const pending = await prisma.payment.findMany({
      where: { status: "pending", sePayRef: { not: null } },
    });
    payment = pending.find(p => p.sePayRef && upper.includes(p.sePayRef)) ?? null;
  }

  if (!payment) {
    // Try matching a guest payment
    let guest = null;
    for (const candidate of candidates) {
      guest = await prisma.guest.findFirst({
        where: { sePayRef: candidate.toUpperCase(), status: "pending" },
      });
      if (guest) break;
    }
    if (!guest && content) {
      const upper = content.toUpperCase();
      const pendingGuests = await prisma.guest.findMany({
        where: { status: "pending", sePayRef: { not: null } },
      });
      guest = pendingGuests.find(g => g.sePayRef && upper.includes(g.sePayRef)) ?? null;
    }
    if (!guest) return NextResponse.json({ ok: true });
    await prisma.guest.update({
      where: { id: guest.id },
      data: { status: "paid", paidAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  // Mark all pending payments for this member where session is paymentReady
  const paymentReadySessions = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM Session WHERE paymentReady = 1`;
  const readySessionIds = paymentReadySessions.map(s => s.id);
  await prisma.payment.updateMany({
    where: { memberId: payment.memberId, status: "pending", sessionId: { in: readySessionIds } },
    data: { status: "paid", paidAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

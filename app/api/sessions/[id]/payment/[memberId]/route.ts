import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: sessionId, memberId } = await params;
  const payment = await prisma.payment.findFirst({
    where: { sessionId, memberId },
    select: { status: true, amount: true, paidAt: true },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(payment);
}

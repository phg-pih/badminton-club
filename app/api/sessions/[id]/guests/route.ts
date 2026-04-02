import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function buildGuestPaymentRef(sessionId: string, guestId: string): string {
  const s = sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const g = guestId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `CLBG${s}${g}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const { name, quantity, notes } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const qty = quantity ?? 1;
  const amount = session.guestFee * qty;

  // Create guest first to get the id for sePayRef
  const guest = await prisma.guest.create({
    data: { sessionId, name: name.trim(), quantity: qty, notes: notes?.trim(), amount },
  });

  const sePayRef = buildGuestPaymentRef(sessionId, guest.id);
  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: { sePayRef },
  });

  return NextResponse.json(updated, { status: 201 });
}

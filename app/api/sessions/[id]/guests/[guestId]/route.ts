import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; guestId: string }> }) {
  const { guestId } = await params;
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { status: true, amount: true, paidAt: true, sePayRef: true },
  });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(guest);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; guestId: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { guestId } = await params;
  const { paid } = await request.json();
  const updated = await prisma.guest.update({
    where: { id: guestId },
    data: { status: paid ? "paid" : "pending", paidAt: paid ? new Date() : null },
  });
  return NextResponse.json(updated);
}

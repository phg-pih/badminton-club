import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      attendances: { include: { member: true, payment: true } },
      guests: true,
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await request.json();
  const session = await prisma.session.update({
    where: { id },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.courtCost !== undefined && { courtCost: data.courtCost }),
      ...(data.shuttleCost !== undefined && { shuttleCost: data.shuttleCost }),
      ...(data.waterCost !== undefined && { waterCost: data.waterCost }),
      ...(data.guestFee !== undefined && { guestFee: data.guestFee }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.paymentReady !== undefined && { paymentReady: data.paymentReady }),
    },
  });
  return NextResponse.json(session);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

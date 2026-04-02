import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildPaymentRef } from "@/lib/sepay";

function isGameDay(sessionDate: Date): boolean {
  const vntNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayVNT = vntNow.toISOString().slice(0, 10);
  const sessionDay = new Date(sessionDate).toISOString().slice(0, 10);
  return todayVNT === sessionDay;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const { memberId } = await request.json();
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { attendances: true },
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const isAdmin = !!(await getAdminSession());
  if (!isAdmin && isGameDay(session.date)) {
    return NextResponse.json({ error: "Điểm danh đã khoá trong ngày đánh cầu" }, { status: 403 });
  }

  // Check already checked in
  const existing = await prisma.attendance.findUnique({
    where: { memberId_sessionId: { memberId, sessionId } },
  });
  if (existing) return NextResponse.json({ error: "Already checked in" }, { status: 409 });

  const attendance = await prisma.attendance.create({
    data: { memberId, sessionId },
    include: { member: true },
  });

  // Calculate cost per person (including the new attendee)
  const totalAttendees = session.attendances.length + 1;
  const totalCost = session.courtCost + session.shuttleCost + session.waterCost;
  const amountPerPerson = totalCost > 0 ? totalCost / totalAttendees : 0;

  // Update all existing payment amounts
  if (totalCost > 0) {
    const allAttendances = await prisma.attendance.findMany({
      where: { sessionId },
      include: { payment: true },
    });
    for (const att of allAttendances) {
      if (att.payment) {
        await prisma.payment.update({
          where: { id: att.payment.id },
          data: { amount: amountPerPerson },
        });
      }
    }

    const ref = buildPaymentRef(sessionId, memberId);
    await prisma.payment.create({
      data: {
        attendanceId: attendance.id,
        memberId,
        sessionId,
        amount: amountPerPerson,
        sePayRef: ref,
      },
    });
  }

  return NextResponse.json(attendance, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: sessionId } = await params;
  const { memberId, paid } = await request.json();

  const attendance = await prisma.attendance.findUnique({
    where: { memberId_sessionId: { memberId, sessionId } },
    include: { payment: true },
  });
  if (!attendance?.payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const updated = await prisma.payment.update({
    where: { id: attendance.payment.id },
    data: {
      status: paid ? "paid" : "pending",
      paidAt: paid ? new Date() : null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const { memberId } = await request.json();

  const isAdmin = !!(await getAdminSession());
  if (!isAdmin) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (session && isGameDay(session.date)) {
      return NextResponse.json({ error: "Điểm danh đã khoá trong ngày đánh cầu" }, { status: 403 });
    }
  }

  const attendance = await prisma.attendance.findUnique({
    where: { memberId_sessionId: { memberId, sessionId } },
    include: { payment: true },
  });
  if (!attendance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (attendance.payment?.status === "paid") {
    return NextResponse.json({ error: "Cannot remove — payment already made" }, { status: 400 });
  }

  if (attendance.payment) {
    await prisma.payment.delete({ where: { id: attendance.payment.id } });
  }
  await prisma.attendance.delete({ where: { id: attendance.id } });

  // Recalculate remaining payments
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (session) {
    const remaining = await prisma.attendance.findMany({
      where: { sessionId },
      include: { payment: true },
    });
    const totalCost = session.courtCost + session.shuttleCost + session.waterCost;
    if (remaining.length > 0 && totalCost > 0) {
      const newAmount = totalCost / remaining.length;
      for (const att of remaining) {
        if (att.payment) {
          await prisma.payment.update({ where: { id: att.payment.id }, data: { amount: newAmount } });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

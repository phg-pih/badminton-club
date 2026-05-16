import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildPaymentRef } from "@/lib/sepay";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      attendances: { include: { payment: true } },
    },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const totalCost = session.courtCost + session.shuttleCost + session.waterCost;
  const totalAttendees = session.attendances.length;

  if (totalAttendees === 0) {
    return NextResponse.json({ message: "No attendances found", created: 0 });
  }

  if (totalCost === 0) {
    return NextResponse.json({ message: "Session has no cost", created: 0 });
  }

  const amountPerPerson = totalCost / totalAttendees;
  let created = 0;

  for (const att of session.attendances) {
    if (!att.payment) {
      const ref = buildPaymentRef(sessionId, att.memberId);
      await prisma.payment.create({
        data: {
          attendanceId: att.id,
          memberId: att.memberId,
          sessionId,
          amount: amountPerPerson,
          sePayRef: ref,
        },
      });
      created++;
    } else {
      // Update amount in case it's wrong
      await prisma.payment.update({
        where: { id: att.payment.id },
        data: { amount: amountPerPerson },
      });
    }
  }

  return NextResponse.json({ message: `Tạo lại thành công`, created, totalAttendees, amountPerPerson });
}

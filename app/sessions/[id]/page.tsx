import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AttendanceClient } from "@/components/attendance-client";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, members, admin] = await Promise.all([
    prisma.session.findUnique({
      where: { id },
      include: {
        attendances: { include: { member: true, payment: true } },
        guests: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.member.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getAdminSession(),
  ]);
  if (!session) notFound();

  const memberIds = session.attendances.map(a => a.memberId);
  const readySessions = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM Session WHERE paymentReady = 1`;
  const readySessionIds = readySessions.map(s => s.id);

  const allPendingPayments = memberIds.length > 0 && readySessionIds.length > 0
    ? await prisma.payment.findMany({
        where: {
          memberId: { in: memberIds },
          status: "pending",
          sessionId: { in: readySessionIds },
        },
        select: { memberId: true, amount: true },
      })
    : [];

  const memberDebts: Record<string, number> = {};
  for (const p of allPendingPayments) {
    memberDebts[p.memberId] = (memberDebts[p.memberId] ?? 0) + p.amount;
  }

  return (
    <AttendanceClient
      session={JSON.parse(JSON.stringify(session))}
      members={JSON.parse(JSON.stringify(members))}
      isAdmin={!!admin}
      memberDebts={memberDebts}
    />
  );
}

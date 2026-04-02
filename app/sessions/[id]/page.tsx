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

  return (
    <AttendanceClient
      session={JSON.parse(JSON.stringify(session))}
      members={JSON.parse(JSON.stringify(members))}
      isAdmin={!!admin}
    />
  );
}

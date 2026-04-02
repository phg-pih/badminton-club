export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { MembersClient } from "@/components/members-client";

export default async function MembersPage() {
  const members = await prisma.member.findMany({ orderBy: { name: "asc" } });
  return <MembersClient initialMembers={members} />;
}

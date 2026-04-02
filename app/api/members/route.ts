import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, phone } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const member = await prisma.member.create({ data: { name: name.trim(), phone: phone?.trim() } });
  return NextResponse.json(member, { status: 201 });
}

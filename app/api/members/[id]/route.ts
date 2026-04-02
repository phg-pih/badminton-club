import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await request.json();
  const member = await prisma.member.update({ where: { id }, data });
  return NextResponse.json(member);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const attendanceCount = await prisma.attendance.count({ where: { memberId: id } });
  if (attendanceCount > 0) {
    return NextResponse.json(
      { error: `Không thể xoá — thành viên có ${attendanceCount} buổi điểm danh` },
      { status: 409 }
    );
  }

  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { date: "desc" },
      include: { _count: { select: { attendances: true, guests: true } } },
    });
    return NextResponse.json(sessions);
  } catch (e: unknown) {
    const err = e as Error & { code?: string; cause?: unknown };
    return NextResponse.json({
      error: String(e),
      code: err.code,
      cause: String(err.cause),
      stack: err.stack?.split("\n").slice(0, 5),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { date, courtCost, shuttleCost, waterCost, guestFee, notes } = await request.json();
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });
  const session = await prisma.session.create({
    data: { date: new Date(date), courtCost: courtCost ?? 0, shuttleCost: shuttleCost ?? 0, waterCost: waterCost ?? 0, guestFee: guestFee ?? 0, notes },
  });
  return NextResponse.json(session, { status: 201 });
}

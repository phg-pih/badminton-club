export const dynamic = "force-dynamic";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const [sessions, memberCount] = await Promise.all([
    prisma.session.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { _count: { select: { attendances: true, guests: true } } },
    }),
    prisma.member.count({ where: { active: true } }),
  ]);

  const upcomingSession = sessions.find(s => s.date >= new Date()) ?? sessions[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/sessions/new">
          <Button>+ Tạo buổi đánh mới</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Thành viên</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{memberCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Buổi đánh gần nhất</CardTitle></CardHeader>
          <CardContent>
            {upcomingSession ? (
              <p className="text-3xl font-bold">{new Date(upcomingSession.date).toLocaleDateString("vi-VN")}</p>
            ) : (
              <p className="text-gray-400">Chưa có</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Buổi đánh gần đây</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.map(s => (
              <Link key={s.id} href={`/admin/sessions/${s.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border">
                <span className="font-medium">{new Date(s.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">{s._count.attendances} thành viên</Badge>
                  {s._count.guests > 0 && <Badge variant="outline">{s._count.guests} vãng lai</Badge>}
                </div>
              </Link>
            ))}
            {sessions.length === 0 && <p className="text-gray-400 text-center py-4">Chưa có buổi đánh nào</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

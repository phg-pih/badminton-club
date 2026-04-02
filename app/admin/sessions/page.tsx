export const dynamic = "force-dynamic";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function SessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: { select: { attendances: true, guests: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Buổi đánh</h1>
        <Link href="/admin/sessions/new"><Button>+ Tạo buổi mới</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Tất cả buổi đánh</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.map(s => {
              const total = s.courtCost + s.shuttleCost + s.waterCost;
              const perPerson = s._count.attendances > 0 ? total / s._count.attendances : 0;
              return (
                <Link key={s.id} href={`/admin/sessions/${s.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{new Date(s.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    {total > 0 && <p className="text-sm text-gray-500">Tổng: {total.toLocaleString("vi-VN")}đ {s._count.attendances > 0 && `— ${perPerson.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ/người`}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{s._count.attendances} thành viên</Badge>
                    {s._count.guests > 0 && <Badge variant="outline">{s._count.guests} vãng lai</Badge>}
                  </div>
                </Link>
              );
            })}
            {sessions.length === 0 && <p className="text-center text-gray-400 py-4">Chưa có buổi đánh nào</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

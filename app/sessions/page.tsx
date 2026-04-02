export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: { select: { attendances: true, guests: true } },
    },
  });

  const vntNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayVNT = vntNow.toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center py-4">
          <p className="text-3xl mb-2">🏸</p>
          <h1 className="text-xl font-bold">CLB Cầu Lông</h1>
        </div>

        <Card>
          <CardHeader><CardTitle>Các buổi đánh</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map(s => {
                const sessionDay = new Date(s.date).toISOString().slice(0, 10);
                const isToday = sessionDay === todayVNT;
                const total = s.courtCost + s.shuttleCost + s.waterCost;
                const perPerson = s._count.attendances > 0 ? total / s._count.attendances : 0;
                return (
                  <Link key={s.id} href={`/sessions/${s.id}`}
                    className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${isToday ? "border-green-400 bg-green-50 hover:bg-green-50" : "bg-white"}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {new Date(s.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        {isToday && <Badge className="text-xs bg-green-500">Hôm nay</Badge>}
                      </div>
                      {s.notes && <p className="text-sm text-gray-400">{s.notes}</p>}
                      {total > 0 && (
                        <p className="text-sm text-gray-500">
                          Tổng: {total.toLocaleString("vi-VN")}đ
                          {s._count.attendances > 0 && ` — ${perPerson.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ/người`}
                        </p>
                      )}
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
    </div>
  );
}

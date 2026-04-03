export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 4;

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      orderBy: { date: "desc" },
      include: { _count: { select: { attendances: true, guests: true } } },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.session.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
                  <div key={s.id} className={`border rounded-lg ${isToday ? "border-green-400 bg-green-50" : "bg-white"}`}>
                    <Link href={`/sessions/${s.id}`}
                      className="flex items-center justify-between p-3 hover:bg-black/5 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {new Date(s.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          {isToday && <Badge className="text-xs bg-green-500">Hôm nay</Badge>}
                        </div>
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
                    {s.notes && (
                      <div className="px-3 pb-3 text-sm text-gray-500 prose prose-sm prose-gray max-w-none [&_a]:text-blue-500 [&_a]:underline">
                        <ReactMarkdown components={{ a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                          {s.notes}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}
              {sessions.length === 0 && <p className="text-center text-gray-400 py-4">Chưa có buổi đánh nào</p>}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                {currentPage > 1
                  ? <Link href={`/sessions?page=${currentPage - 1}`} className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground">← Trước</Link>
                  : <span className="inline-flex items-center justify-center rounded-md border px-3 h-8 text-sm font-medium text-gray-300 cursor-not-allowed">← Trước</span>}
                <span className="text-sm text-gray-500">Trang {currentPage} / {totalPages}</span>
                {currentPage < totalPages
                  ? <Link href={`/sessions?page=${currentPage + 1}`} className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground">Sau →</Link>
                  : <span className="inline-flex items-center justify-center rounded-md border px-3 h-8 text-sm font-medium text-gray-300 cursor-not-allowed">Sau →</span>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

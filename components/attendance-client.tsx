"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Member = { id: string; name: string; phone: string | null; active: boolean };
type Payment = { id: string; status: string; amount: number } | null;
type Attendance = { id: string; memberId: string; member: Member; payment: Payment };
type Guest = { id: string; name: string; quantity: number; notes: string | null; amount: number; status: string; paidAt: string | null };
type Session = {
  id: string; date: string;
  courtCost: number; shuttleCost: number; waterCost: number; guestFee: number;
  notes: string | null;
  paymentReady: boolean;
  attendances: Attendance[];
  guests: Guest[];
};

function isGameDay(dateStr: string): boolean {
  const vntNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayVNT = vntNow.toISOString().slice(0, 10);
  return new Date(dateStr).toISOString().slice(0, 10) === todayVNT;
}

export function AttendanceClient({ session: initial, members, isAdmin = false }: { session: Session; members: Member[]; isAdmin?: boolean }) {
  const [session, setSession] = useState<Session>(initial);
  const [loadingMember, setLoadingMember] = useState<string | null>(null);
  const locked = !isAdmin && isGameDay(session.date);
  const [guestForm, setGuestForm] = useState({ name: "", quantity: "1", notes: "" });
  const [guestLoading, setGuestLoading] = useState(false);
  const isMutating = useRef(false);

  // Poll for updates every 5s, skip while a mutation is in flight
  useEffect(() => {
    const poll = async () => {
      if (isMutating.current || document.hidden) return;
      try {
        const data = await fetch(`/api/sessions/${initial.id}`).then(r => r.json());
        setSession(data);
      } catch { /* ignore */ }
    };
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [initial.id]);

  const checkedInIds = new Set(session.attendances.map(a => a.memberId));
  const total = session.courtCost + session.shuttleCost + session.waterCost;
  const perPerson = session.attendances.length > 0 ? total / session.attendances.length : 0;
  const dateStr = new Date(session.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  async function toggleCheckIn(member: Member) {
    const alreadyIn = checkedInIds.has(member.id);
    isMutating.current = true;
    setLoadingMember(member.id);
    try {
      const res = await fetch(`/api/sessions/${session.id}/attendance`, {
        method: alreadyIn ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Lỗi điểm danh");
        return;
      }
      const updated = await fetch(`/api/sessions/${session.id}`).then(r => r.json());
      setSession(updated);
      toast.success(alreadyIn ? "Đã huỷ điểm danh" : `Đã điểm danh: ${member.name}`);
    } finally {
      setLoadingMember(null);
      isMutating.current = false;
    }
  }

  async function registerGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!guestForm.name.trim()) return;
    isMutating.current = true;
    setGuestLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestForm.name, quantity: Number(guestForm.quantity) || 1, notes: guestForm.notes || null }),
      });
      if (!res.ok) { toast.error("Lỗi đăng ký"); return; }
      const updated = await fetch(`/api/sessions/${session.id}`).then(r => r.json());
      setSession(updated);
      setGuestForm({ name: "", quantity: "1", notes: "" });
      toast.success("Đã đăng ký vãng lai");
    } finally {
      setGuestLoading(false);
      isMutating.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center py-4">
          <p className="text-3xl mb-2">🏸</p>
          <h1 className="text-xl font-bold">CLB Cầu Lông</h1>
          <p className="text-gray-600">{dateStr}</p>
          {session.notes && <p className="text-sm text-gray-500 mt-1">{session.notes}</p>}
        </div>

        {total > 0 && (
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-sm text-gray-500">Chi phí / người</p>
              <p className="text-2xl font-bold text-green-600">
                {perPerson > 0 ? `${perPerson.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ` : "—"}
              </p>
              <p className="text-xs text-gray-400">
                Sân: {session.courtCost.toLocaleString("vi-VN")}đ · Cầu: {session.shuttleCost.toLocaleString("vi-VN")}đ · Nước: {session.waterCost.toLocaleString("vi-VN")}đ
              </p>
              {session.guestFee > 0 && (
                <p className="text-xs text-orange-500 mt-1">Phí vãng lai: {session.guestFee.toLocaleString("vi-VN")}đ/người</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Điểm danh ({session.attendances.length} người)</CardTitle>
            {locked && <p className="text-sm text-orange-500">Điểm danh đã khoá hôm nay — liên hệ admin để điều chỉnh.</p>}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {members.map(member => {
                const att = session.attendances.find(a => a.memberId === member.id);
                const isIn = !!att;
                return (
                  <div key={member.id} className={`flex items-center justify-between p-3 border rounded-lg ${isIn ? "bg-green-50 border-green-200" : "bg-white"}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {att?.payment?.status === "paid" && <Badge variant="default" className="text-xs">Đã TT</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isIn && att.payment && total > 0 && session.paymentReady && (
                        <Link href={`/sessions/${session.id}/payment/${member.id}`}>
                          <Button variant="outline" size="sm">QR TT</Button>
                        </Link>
                      )}
                      <Button
                        variant={isIn ? "secondary" : "default"}
                        size="sm"
                        disabled={locked || loadingMember === member.id}
                        onClick={() => toggleCheckIn(member)}
                      >
                        {loadingMember === member.id ? "..." : isIn ? "Huỷ" : "Điểm danh"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {session.guests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Vãng lai đã đăng ký
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({session.guests.reduce((s, g) => s + g.quantity, 0)} người)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {session.guests.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{g.name}</span>
                        {g.quantity > 1 && <span className="text-sm text-gray-500">x{g.quantity}</span>}
                        {g.status === "paid"
                          ? <Badge variant="default" className="text-xs">Đã TT</Badge>
                          : g.amount > 0 && <Badge variant="secondary" className="text-xs">Chưa TT</Badge>}
                      </div>
                      {g.notes && <p className="text-xs text-gray-400 mt-0.5">{g.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {(g.amount > 0 || session.guestFee > 0) && (
                        <span className="text-sm font-medium text-orange-600">
                          {(g.amount || session.guestFee * g.quantity).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ
                        </span>
                      )}
                      {g.status !== "paid" && (g.amount > 0 || session.guestFee > 0) && session.paymentReady && (
                        <Link href={`/sessions/${session.id}/guest-payment/${g.id}`}>
                          <Button variant="outline" size="sm">QR TT</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Đăng ký vãng lai
              {session.guestFee > 0 && <span className="ml-2 text-sm font-normal text-orange-500">{session.guestFee.toLocaleString("vi-VN")}đ/người</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={registerGuest} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <Label>Tên *</Label>
                  <Input placeholder="Họ tên" value={guestForm.name} onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="w-24 space-y-1">
                  <Label>Số lượng</Label>
                  <Input type="number" min="1" value={guestForm.quantity} onChange={e => setGuestForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea rows={2} placeholder="Thông tin thêm..." value={guestForm.notes} onChange={e => setGuestForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button type="submit" variant="outline" className="w-full" disabled={guestLoading}>
                {guestLoading ? "Đang đăng ký..." : "Đăng ký vãng lai"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

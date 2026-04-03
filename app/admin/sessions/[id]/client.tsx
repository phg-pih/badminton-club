"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Payment = { status: string; amount: number; paidAt: string | null } | null;
type Attendance = { id: string; memberId: string; member: { name: string }; payment: Payment; createdAt: string };
type Guest = { id: string; name: string; quantity: number; notes: string | null; amount: number; status: string; paidAt: string | null; createdAt: string };
type Session = {
  id: string; date: string; courtCost: number; shuttleCost: number; waterCost: number;
  guestFee: number; notes: string | null; paymentReady: boolean;
  attendances: Attendance[]; guests: Guest[];
};

export function AdminSessionClient({ id }: { id: string }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ date: "", courtCost: "", shuttleCost: "", waterCost: "", guestFee: "", notes: "" });
  const [savingInfo, setSavingInfo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingPayment, setTogglingPayment] = useState<string | null>(null);
  const [togglingGuestPayment, setTogglingGuestPayment] = useState<string | null>(null);
  const [togglingPaymentReady, setTogglingPaymentReady] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then(r => r.json())
      .then(data => {
        setSession(data);
        setInfoForm({
          date: new Date(data.date).toISOString().slice(0, 10),
          courtCost: String(data.courtCost),
          shuttleCost: String(data.shuttleCost),
          waterCost: String(data.waterCost),
          guestFee: String(data.guestFee),
          notes: data.notes ?? "",
        });
      });
  }, [id]);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: infoForm.date,
          courtCost: Number(infoForm.courtCost) || 0,
          shuttleCost: Number(infoForm.shuttleCost) || 0,
          waterCost: Number(infoForm.waterCost) || 0,
          guestFee: Number(infoForm.guestFee) || 0,
          notes: infoForm.notes || null,
        }),
      });
      if (!res.ok) { toast.error("Lỗi lưu thông tin"); return; }
      const updated = await res.json();
      setSession(s => s ? { ...s, ...updated } : s);
      setEditingInfo(false);
      toast.success("Đã lưu thông tin buổi đánh");
    } finally {
      setSavingInfo(false);
    }
  }

  async function togglePayment(memberId: string, currentStatus: string) {
    setTogglingPayment(memberId);
    try {
      const paid = currentStatus !== "paid";
      const res = await fetch(`/api/sessions/${id}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, paid }),
      });
      if (!res.ok) { toast.error("Lỗi cập nhật thanh toán"); return; }
      const updated = await fetch(`/api/sessions/${id}`).then(r => r.json());
      setSession(updated);
      toast.success(paid ? "Đã đánh dấu đã thanh toán" : "Đã huỷ thanh toán");
    } finally {
      setTogglingPayment(null);
    }
  }

  async function toggleGuestPayment(guestId: string, currentStatus: string) {
    setTogglingGuestPayment(guestId);
    try {
      const paid = currentStatus !== "paid";
      const res = await fetch(`/api/sessions/${id}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      });
      if (!res.ok) { toast.error("Lỗi cập nhật thanh toán"); return; }
      const updated = await fetch(`/api/sessions/${id}`).then(r => r.json());
      setSession(updated);
      toast.success(paid ? "Đã đánh dấu đã thanh toán" : "Đã huỷ thanh toán");
    } finally {
      setTogglingGuestPayment(null);
    }
  }

  async function togglePaymentReady() {
    if (!session) return;
    setTogglingPaymentReady(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReady: !session.paymentReady }),
      });
      if (!res.ok) { toast.error("Lỗi cập nhật"); return; }
      setSession(s => s ? { ...s, paymentReady: !s.paymentReady } : s);
      toast.success(!session.paymentReady ? "Đã mở thanh toán QR" : "Đã đóng thanh toán QR");
    } finally {
      setTogglingPaymentReady(false);
    }
  }

  async function deleteSession() {
    if (!confirm("Xoá buổi đánh này? Hành động không thể hoàn tác.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Lỗi xoá buổi"); return; }
      toast.success("Đã xoá buổi đánh");
      router.push("/admin/sessions");
    } finally {
      setDeleting(false);
    }
  }

  if (!session) return <div className="text-gray-400 py-8 text-center">Đang tải...</div>;

  const total = session.courtCost + session.shuttleCost + session.waterCost;
  const perPerson = session.attendances.length > 0 ? total / session.attendances.length : 0;
  const paidCount = session.attendances.filter(a => a.payment?.status === "paid").length;
  const guestTotal = session.guests.reduce((s, g) => s + g.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {new Date(session.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h1>
          <p className="text-gray-500 text-sm">{session.notes || <span className="italic text-gray-300">Chưa có ghi chú</span>}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sessions/${id}`} target="_blank">
            <Button variant="outline" size="sm">Trang điểm danh →</Button>
          </Link>
          <Button
            variant={session.paymentReady ? "default" : "outline"}
            size="sm"
            onClick={togglePaymentReady}
            disabled={togglingPaymentReady}
          >
            {session.paymentReady ? "✓ QR TT đang mở" : "Mở QR TT"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditingInfo(true)}>Sửa thông tin</Button>
          <Button variant="destructive" size="sm" onClick={deleteSession} disabled={deleting}>
            {deleting ? "Đang xoá..." : "Xoá buổi"}
          </Button>
        </div>
      </div>

      {editingInfo && (
        <Card>
          <CardHeader><CardTitle>Sửa thông tin buổi đánh</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveInfo} className="space-y-4">
              <div className="space-y-1">
                <Label>Ngày đánh</Label>
                <Input type="date" value={infoForm.date} onChange={e => setInfoForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tiền sân (đ)</Label>
                  <Input type="number" min="0" value={infoForm.courtCost} onChange={e => setInfoForm(f => ({ ...f, courtCost: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Tiền cầu (đ)</Label>
                  <Input type="number" min="0" value={infoForm.shuttleCost} onChange={e => setInfoForm(f => ({ ...f, shuttleCost: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Tiền nước (đ)</Label>
                  <Input type="number" min="0" value={infoForm.waterCost} onChange={e => setInfoForm(f => ({ ...f, waterCost: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Phí vãng lai / người (đ)</Label>
                  <Input type="number" min="0" value={infoForm.guestFee} onChange={e => setInfoForm(f => ({ ...f, guestFee: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea rows={2} placeholder="Địa điểm, thông tin thêm..." value={infoForm.notes} onChange={e => setInfoForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={savingInfo}>{savingInfo ? "Đang lưu..." : "Lưu"}</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingInfo(false); setInfoForm(f => ({ ...f, notes: session.notes ?? "" })); }}>Huỷ</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Tiền sân", value: session.courtCost },
          { label: "Tiền cầu", value: session.shuttleCost },
          { label: "Tiền nước", value: session.waterCost },
          { label: "Tổng / thành viên", value: perPerson },
          { label: "Phí vãng lai / người", value: session.guestFee },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-gray-500">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-lg font-bold">{value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thành viên ({session.attendances.length}) — Đã TT: {paidCount}/{session.attendances.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {session.attendances.map(att => (
              <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{att.member.name}</span>
                <div className="flex items-center gap-2">
                  {perPerson > 0 && <span className="text-sm text-gray-500">{perPerson.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ</span>}
                  <Badge variant={att.payment?.status === "paid" ? "default" : "secondary"}>
                    {att.payment?.status === "paid" ? "Đã TT" : "Chưa TT"}
                  </Badge>
                  {att.payment?.paidAt && (
                    <span className="text-xs text-gray-400">{new Date(att.payment.paidAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                  {att.payment && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      disabled={togglingPayment === att.memberId}
                      onClick={() => togglePayment(att.memberId, att.payment!.status)}
                    >
                      {togglingPayment === att.memberId ? "..." : att.payment.status === "paid" ? "Huỷ TT" : "Đánh dấu TT"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {session.attendances.length === 0 && <p className="text-center text-gray-400 py-4">Chưa có ai điểm danh</p>}
          </div>
        </CardContent>
      </Card>

      {session.guests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Vãng lai ({guestTotal} người{session.guestFee > 0 && ` — ${session.guestFee.toLocaleString("vi-VN")}đ/người`})
              {" — "}Đã TT: {session.guests.filter(g => g.status === "paid").length}/{session.guests.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.guests.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{g.name}</span>
                    {g.quantity > 1 && <span className="ml-2 text-sm text-gray-500">x{g.quantity}</span>}
                    {g.notes && <p className="text-sm text-gray-400">{g.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {g.amount > 0 && <span className="text-sm font-medium text-orange-600">{g.amount.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ</span>}
                    <Badge variant={g.status === "paid" ? "default" : "secondary"}>
                      {g.status === "paid" ? "Đã TT" : "Chưa TT"}
                    </Badge>
                    {g.paidAt && <span className="text-xs text-gray-400">{new Date(g.paidAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
                    {g.amount > 0 && (
                      <Button
                        size="sm" variant="ghost" className="h-6 text-xs"
                        disabled={togglingGuestPayment === g.id}
                        onClick={() => toggleGuestPayment(g.id, g.status)}
                      >
                        {togglingGuestPayment === g.id ? "..." : g.status === "paid" ? "Huỷ TT" : "Đánh dấu TT"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

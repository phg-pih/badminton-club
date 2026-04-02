"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function NewSessionForm({ defaultGuestFee }: { defaultGuestFee: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    courtCost: "",
    shuttleCost: "",
    waterCost: "",
    guestFee: defaultGuestFee > 0 ? String(defaultGuestFee) : "",
    notes: "",
  });

  const total = (Number(form.courtCost) || 0) + (Number(form.shuttleCost) || 0) + (Number(form.waterCost) || 0);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          courtCost: Number(form.courtCost) || 0,
          shuttleCost: Number(form.shuttleCost) || 0,
          waterCost: Number(form.waterCost) || 0,
          guestFee: Number(form.guestFee) || 0,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) { toast.error("Lỗi tạo buổi"); return; }
      const session = await res.json();
      toast.success("Đã tạo buổi đánh");
      router.push(`/admin/sessions/${session.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Tạo buổi đánh mới</h1>
      <Card>
        <CardHeader><CardTitle>Thông tin buổi đánh</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Ngày đánh</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Tiền sân (đ)</Label>
                <Input type="number" min="0" placeholder="0" value={form.courtCost} onChange={e => set("courtCost", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tiền cầu (đ)</Label>
                <Input type="number" min="0" placeholder="0" value={form.shuttleCost} onChange={e => set("shuttleCost", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tiền nước (đ)</Label>
                <Input type="number" min="0" placeholder="0" value={form.waterCost} onChange={e => set("waterCost", e.target.value)} />
              </div>
            </div>
            {total > 0 && (
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                Tổng thành viên: <strong>{total.toLocaleString("vi-VN")}đ</strong>
              </p>
            )}
            <div className="space-y-1">
              <Label>Phí vãng lai / người (đ)</Label>
              <Input type="number" min="0" placeholder="0" value={form.guestFee} onChange={e => set("guestFee", e.target.value)} />
              <p className="text-xs text-gray-400">
                Mỗi vãng lai sẽ đóng khoản phí này (tách riêng với phí thành viên)
                {defaultGuestFee > 0 && ` · Mặc định từ cấu hình: ${defaultGuestFee.toLocaleString("vi-VN")}đ`}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Ghi chú</Label>
              <Textarea placeholder="Địa điểm, thông tin thêm..." value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Tạo buổi"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Huỷ</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

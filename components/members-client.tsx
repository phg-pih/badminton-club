"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Member = { id: string; name: string; phone: string | null; active: boolean };

export function MembersClient({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) { toast.error("Lỗi thêm thành viên"); return; }
      const member = await res.json();
      setMembers(prev => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)));
      setName(""); setPhone("");
      toast.success("Đã thêm thành viên");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(member: Member) {
    setEditingId(member.id);
    setEditName(member.name);
    setEditPhone(member.phone ?? "");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() || null }),
    });
    if (!res.ok) { toast.error("Lỗi cập nhật"); return; }
    const updated = await res.json();
    setMembers(prev => prev.map(m => m.id === id ? updated : m).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingId(null);
    toast.success("Đã cập nhật");
  }

  async function toggleActive(member: Member) {
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !member.active }),
    });
    if (!res.ok) { toast.error("Lỗi cập nhật"); return; }
    const updated = await res.json();
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    toast.success(updated.active ? "Đã kích hoạt" : "Đã vô hiệu hoá");
  }

  async function deleteMember(member: Member) {
    if (!confirm(`Xoá thành viên "${member.name}"? Hành động này không thể hoàn tác.`)) return;
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Lỗi xoá");
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== member.id));
    toast.success("Đã xoá thành viên");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý thành viên</h1>

      <Card>
        <CardHeader><CardTitle>Thêm thành viên mới</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addMember} className="flex gap-3">
            <Input placeholder="Tên thành viên *" value={name} onChange={e => setName(e.target.value)} required className="flex-1" />
            <Input placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} className="w-40" />
            <Button type="submit" disabled={loading}>Thêm</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danh sách thành viên ({members.filter(m => m.active).length} đang hoạt động)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="border rounded-lg">
                {editingId === member.id ? (
                  <div className="flex gap-2 p-3 items-center">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1" placeholder="Tên *" />
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-36" placeholder="SĐT" />
                    <Button size="sm" onClick={() => saveEdit(member.id)}>Lưu</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Huỷ</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <span className="font-medium">{member.name}</span>
                      {member.phone && <span className="ml-2 text-sm text-gray-500">{member.phone}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={member.active ? "default" : "secondary"}>
                        {member.active ? "Hoạt động" : "Ngưng"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(member)}>Sửa</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(member)}>
                        {member.active ? "Vô hiệu hoá" : "Kích hoạt"}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteMember(member)}>
                        Xoá
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

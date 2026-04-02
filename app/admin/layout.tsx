import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold text-lg">🏸 CLB Admin</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/members" className="text-gray-600 hover:text-black">Thành viên</Link>
            <Link href="/admin/sessions" className="text-gray-600 hover:text-black">Buổi đánh</Link>
          </nav>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">Đăng xuất</Button>
        </form>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}

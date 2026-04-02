export const dynamic = "force-dynamic";
import { AdminSessionClient } from "./client";

export default async function AdminSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminSessionClient id={id} />;
}

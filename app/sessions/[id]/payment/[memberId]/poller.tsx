"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentPoller({ sessionId, memberId }: { sessionId: string; memberId: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/sessions/${sessionId}/payment/${memberId}`);
      if (!res.ok) return;
      const { status } = await res.json();
      if (status === "paid") {
        clearInterval(interval);
        router.refresh();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [sessionId, memberId, router]);

  return null;
}

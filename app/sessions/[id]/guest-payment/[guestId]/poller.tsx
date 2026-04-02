"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function GuestPaymentPoller({ sessionId, guestId }: { sessionId: string; guestId: string }) {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/sessions/${sessionId}/guests/${guestId}`);
      if (!res.ok) return;
      const { status } = await res.json();
      if (status === "paid") {
        clearInterval(interval);
        router.refresh();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [sessionId, guestId, router]);
  return null;
}

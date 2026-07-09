"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Target = { makerId: string } | { labelId: string } | { seriesId: string };

// 新作発売日通知(第一の核の再訪問導線)。メーカー/レーベル/シリーズページのいずれかに置く。
export default function NotifyButton(props: Target) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const column = "makerId" in props ? "maker_id" : "labelId" in props ? "label_id" : "series_id";
  const targetId = "makerId" in props ? props.makerId : "labelId" in props ? props.labelId : props.seriesId;
  const body = "makerId" in props
    ? { makerId: props.makerId }
    : "labelId" in props
      ? { labelId: props.labelId }
      : { seriesId: props.seriesId };

  useEffect(() => {
    if (!session) {
      setSubscribed(false);
      return;
    }
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }
    supabase
      .from("notification_subscriptions")
      .select("id")
      .eq(column, targetId)
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setSubscribed(Boolean(data)));
  }, [session, column, targetId]);

  async function toggle() {
    if (!session) {
      router.push("/login");
      return;
    }
    setBusy(true);
    const method = subscribed ? "DELETE" : "POST";
    const res = await fetch("/api/notifications", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) setSubscribed(!subscribed);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || busy}
      aria-pressed={subscribed}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        subscribed
          ? "border-sky-500 bg-sky-500/10 text-sky-300"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
      }`}
    >
      {subscribed ? "🔔 新作通知 登録済み" : "🔔 新作を通知する"}
    </button>
  );
}

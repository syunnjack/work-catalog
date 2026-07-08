"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

// 中古相場(第二の核)の再訪問導線。価格変動通知の登録/解除のみを扱い、
// 値下がり目標額の入力はスコープ外(既定でnotify_below_price_yen=nullのまま登録する)。
export default function PriceWatchButton({ workId }: { workId: string }) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [watching, setWatching] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) {
      setWatching(false);
      return;
    }
    // 登録状況の読み取りはRLS(read own subscriptions)に従うため、anon key + セッションで直接問い合わせる。
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }
    supabase
      .from("price_watch_subscriptions")
      .select("work_id")
      .eq("work_id", workId)
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setWatching(Boolean(data)));
  }, [session, workId]);

  async function toggle() {
    if (!session) {
      router.push("/login");
      return;
    }
    setBusy(true);
    const method = watching ? "DELETE" : "POST";
    const res = await fetch("/api/price-watch", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ workId }),
    });
    setBusy(false);
    if (res.ok) setWatching(!watching);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || busy}
      aria-pressed={watching}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        watching
          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
      }`}
    >
      {watching ? "🔔 値下がり通知 登録済み" : "🔔 値下がりを通知する"}
    </button>
  );
}

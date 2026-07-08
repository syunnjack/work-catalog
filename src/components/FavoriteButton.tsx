"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function FavoriteButton({ workId }: { workId: string }) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) {
      setFavorited(false);
      return;
    }
    // お気に入りの読み取りはRLS(read own favorites)に従うため、anon key + セッションで直接問い合わせる。
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }
    supabase
      .from("favorites")
      .select("work_id")
      .eq("work_id", workId)
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setFavorited(Boolean(data)));
  }, [session, workId]);

  async function toggle() {
    if (!session) {
      router.push("/login");
      return;
    }
    setBusy(true);
    const method = favorited ? "DELETE" : "POST";
    const res = await fetch("/api/favorites", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ workId }),
    });
    setBusy(false);
    if (res.ok) setFavorited(!favorited);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || busy}
      aria-pressed={favorited}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        favorited
          ? "border-rose-500 bg-rose-500/10 text-rose-300"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
      }`}
    >
      {favorited ? "♥ お気に入り済み" : "♡ お気に入りに追加"}
    </button>
  );
}

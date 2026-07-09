"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const STARS = [1, 2, 3, 4, 5];

export default function StarRating({
  workId,
  ratingAvg,
  ratingCount,
}: {
  workId: string;
  ratingAvg: number | null;
  ratingCount: number;
}) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [myRating, setMyRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    if (!session) {
      setMyRating(null);
      return;
    }
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }
    supabase
      .from("work_ratings")
      .select("rating")
      .eq("work_id", workId)
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setMyRating((data as { rating: number } | null)?.rating ?? null));
  }, [session, workId]);

  async function submitRating(rating: number) {
    if (!session) {
      router.push("/login");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ workId, rating }),
    });
    setBusy(false);
    if (res.ok) setMyRating(rating);
  }

  const displayValue = hovered ?? myRating ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
        {STARS.map((value) => (
          <button
            key={value}
            type="button"
            disabled={loading || busy}
            onMouseEnter={() => setHovered(value)}
            onClick={() => submitRating(value)}
            aria-label={`${value}`}
            className="text-xl leading-none disabled:cursor-not-allowed"
          >
            <span className={value <= displayValue ? "text-amber-400" : "text-neutral-700"}>★</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        {ratingCount > 0 ? `平均 ${ratingAvg?.toFixed(1)}（${ratingCount}件）` : "まだ評価はありません"}
        {myRating && <span className="ml-2 text-amber-400">あなたの評価: {myRating}</span>}
      </p>
    </div>
  );
}

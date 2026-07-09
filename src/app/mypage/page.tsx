"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { PointTransaction } from "@/types/database";

const REASON_LABEL: Record<PointTransaction["reason"], string> = {
  favorite_added: "お気に入り登録",
  comment_posted: "コメント投稿",
  price_watch_registered: "価格変動通知の登録",
  notification_registered: "新作通知の登録",
};

// ユーザーポイント(将来の会員特典の下地)の残高・履歴表示。
// 現時点では交換先はなく、エンゲージメントの可視化のみを目的とする。
export default function MyPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }
    supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setTransactions((data ?? []) as PointTransaction[]));
  }, [session, loading, router]);

  if (loading || !session) return null;

  const balance = transactions?.reduce((sum, t) => sum + t.points, 0) ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-white">マイページ</h1>
      <p className="mt-1 text-xs text-neutral-500">{session.user.email}でログイン中です。</p>

      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs text-neutral-500">ポイント残高</p>
        <p className="mt-1 text-3xl font-bold text-white">{balance}pt</p>
        <p className="mt-2 text-xs text-neutral-500">
          現時点でポイントに交換先はありません。今後の会員特典検討のための試験的な仕組みです。
        </p>
      </div>

      <h2 className="mt-8 text-sm font-bold text-neutral-300">ポイント履歴</h2>
      {transactions === null ? (
        <p className="mt-3 text-sm text-neutral-400">読み込み中...</p>
      ) : transactions.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">まだポイント履歴はありません。</p>
      ) : (
        <ul className="mt-3 space-y-1 text-sm">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between border-b border-neutral-900 py-1.5 text-neutral-300">
              <span>{REASON_LABEL[t.reason]}</span>
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">{new Date(t.created_at).toLocaleDateString("ja-JP")}</span>
                <span className="font-medium text-neutral-100">+{t.points}pt</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

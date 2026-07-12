"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import ShareButtons from "@/components/ShareButtons";
import type { PointTransaction } from "@/types/database";

const REASON_LABEL: Record<PointTransaction["reason"], string> = {
  favorite_added: "お気に入り登録",
  comment_posted: "コメント投稿",
  price_watch_registered: "価格変動通知の登録",
  notification_registered: "新作通知の登録",
  comment_liked: "コメントへのいいね",
  work_rated: "作品の評価",
  market_price_reported: "中古相場の報告",
};

// ユーザーポイント(将来の会員特典の下地)の残高・履歴表示。
// 現時点では交換先はなく、エンゲージメントの可視化のみを目的とする。
interface SharingState {
  favorites_public: boolean;
  favorites_share_token: string;
}

export default function MyPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[] | null>(null);
  const [sharing, setSharing] = useState<SharingState | null>(null);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [copied, setCopied] = useState(false);

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
    supabase
      .from("users")
      .select("favorites_public, favorites_share_token")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setSharing((data as SharingState | null) ?? { favorites_public: false, favorites_share_token: "" }));
  }, [session, loading, router]);

  async function updateSharing(action: "enable" | "disable" | "regenerate") {
    if (!session) return;
    setSharingBusy(true);
    setCopied(false);
    const res = await fetch("/api/mypage/favorites-sharing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action }),
    });
    setSharingBusy(false);
    if (res.ok) {
      const data = await res.json();
      setSharing({ favorites_public: data.favorites_public, favorites_share_token: data.favorites_share_token });
    }
  }

  if (loading || !session) return null;

  const balance = transactions?.reduce((sum, t) => sum + t.points, 0) ?? 0;
  const shareUrl = sharing?.favorites_share_token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/list/${sharing.favorites_share_token}`
    : "";

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

      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs font-bold text-neutral-300">お気に入りリストの公開</p>
        <p className="mt-1 text-xs text-neutral-500">
          自分だけの推し作品リストを友達やSNSでシェアできます。公開すると、URLを知っている人がお気に入り作品一覧を見られるようになります。
        </p>

        {sharing === null ? (
          <p className="mt-3 text-xs text-neutral-500">読み込み中...</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {sharing.favorites_public ? (
                <button
                  type="button"
                  disabled={sharingBusy}
                  onClick={() => updateSharing("disable")}
                  className="rounded-full border border-neutral-700 px-4 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  非公開にする
                </button>
              ) : (
                <button
                  type="button"
                  disabled={sharingBusy}
                  onClick={() => updateSharing("enable")}
                  className="rounded-full border border-sky-500 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-300 hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  公開する
                </button>
              )}
              <button
                type="button"
                disabled={sharingBusy}
                onClick={() => updateSharing("regenerate")}
                className="rounded-full border border-neutral-700 px-4 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                URLを再発行
              </button>
            </div>

            {sharing.favorites_public && shareUrl && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                  }}
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-400"
                >
                  {copied ? "コピーしました" : "コピー"}
                </button>
              </div>
            )}
            {sharing.favorites_public && shareUrl && (
              <div className="mt-2">
                <ShareButtons url={shareUrl} title="お気に入りリストを公開しました" />
              </div>
            )}
          </>
        )}
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

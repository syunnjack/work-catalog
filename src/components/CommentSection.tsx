"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface Comment {
  id: string;
  anonymous_name: string | null;
  body: string;
  like_count: number;
  created_at: string;
}

export default function CommentSection({ workId }: { workId: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`/api/comments?workId=${workId}`)
      .then((res) => res.json())
      .then((data: { comments?: Comment[] }) => setComments(data.comments ?? []));
  }

  useEffect(load, [workId]);

  useEffect(() => {
    if (!session) {
      setLikedIds(new Set());
      return;
    }
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }
    supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", session.user.id)
      .then(({ data }) => setLikedIds(new Set((data ?? []).map((row: { comment_id: string }) => row.comment_id))));
  }, [session, comments]);

  async function toggleLike(commentId: string) {
    if (!session) {
      router.push("/login");
      return;
    }
    setLikeBusyId(commentId);
    const liked = likedIds.has(commentId);
    const res = await fetch(`/api/comments/${commentId}/like`, {
      method: liked ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setLikeBusyId(null);
    if (res.ok) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (liked) next.delete(commentId);
        else next.add(commentId);
        return next;
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, like_count: c.like_count + (liked ? -1 : 1) } : c))
      );
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ workId, body, anonymousName: anonymousName || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "投稿に失敗しました。");
      return;
    }
    setBody("");
    load();
  }

  return (
    <section className="mt-10">
      <h2 className="text-base font-bold text-neutral-100">コメント</h2>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        {!session && (
          <input
            type="text"
            placeholder="表示名（未入力の場合は「名無しさん」）"
            value={anonymousName}
            onChange={(e) => setAnonymousName(e.target.value)}
            maxLength={50}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 focus:border-neutral-400 focus:outline-none"
          />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="コメントを入力"
          className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-400 focus:outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="self-end rounded-full bg-white px-4 py-1.5 text-xs font-bold text-neutral-900 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          投稿する
        </button>
      </form>

      <ul className="mt-4 divide-y divide-neutral-800">
        {comments.map((comment) => {
          const liked = likedIds.has(comment.id);
          return (
            <li key={comment.id} className="py-3 text-sm">
              <p className="text-neutral-200">{comment.body}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  {comment.anonymous_name ?? "登録ユーザー"} ・ {new Date(comment.created_at).toLocaleDateString("ja-JP")}
                </p>
                <button
                  type="button"
                  onClick={() => toggleLike(comment.id)}
                  disabled={likeBusyId === comment.id}
                  aria-pressed={liked}
                  className={`rounded-full border px-2 py-0.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    liked ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-neutral-700 text-neutral-400 hover:border-neutral-400"
                  }`}
                >
                  {liked ? "♥" : "♡"} {comment.like_count}
                </button>
              </div>
            </li>
          );
        })}
        {comments.length === 0 && <p className="py-3 text-xs text-neutral-500">まだコメントはありません。</p>}
      </ul>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

interface Comment {
  id: string;
  anonymous_name: string | null;
  body: string;
  like_count: number;
  created_at: string;
}

export default function CommentSection({ workId }: { workId: string }) {
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
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
        {comments.map((comment) => (
          <li key={comment.id} className="py-3 text-sm">
            <p className="text-neutral-200">{comment.body}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {comment.anonymous_name ?? "登録ユーザー"} ・ {new Date(comment.created_at).toLocaleDateString("ja-JP")}
            </p>
          </li>
        ))}
        {comments.length === 0 && <p className="py-3 text-xs text-neutral-500">まだコメントはありません。</p>}
      </ul>
    </section>
  );
}

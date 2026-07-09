"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { UsedMarketPlatform } from "@/types/database";

// ユーザーからの中古相場報告フォーム。送信内容は運営者が/adminで確認してapprovedにするまでは
// 相場情報として表示されない(docs/used-market-pricing.md「運用ルール」)。
export default function MarketPriceReportForm({ workId, platforms }: { workId: string; platforms: UsedMarketPlatform[] }) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [platformId, setPlatformId] = useState(platforms[0]?.id ?? "");
  const [priceYen, setPriceYen] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (platforms.length === 0) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    const price = Number.parseInt(priceYen, 10);
    if (!Number.isFinite(price) || price <= 0) {
      setError("価格を正しく入力してください。");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/market-price-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ workId, platformId, priceYen: price, note: note || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "送信に失敗しました。");
      return;
    }
    setPriceYen("");
    setNote("");
    setMessage("報告ありがとうございます。運営者が確認後に反映されます。");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs font-bold text-neutral-300">中古相場を報告する</p>
      <p className="mt-1 text-[11px] text-neutral-500">「この値段で買えた/売れた」という情報を投稿できます。運営者の確認後に反映されます。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={platformId}
          onChange={(e) => setPlatformId(e.target.value)}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-400 focus:outline-none"
        >
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          placeholder="価格(円)"
          value={priceYen}
          onChange={(e) => setPriceYen(e.target.value)}
          className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-400 focus:outline-none"
        />
        <input
          type="text"
          placeholder="メモ(任意)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          className="min-w-[8rem] flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || busy || !priceYen}
          className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-neutral-900 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          報告する
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {message && <p className="mt-2 text-xs text-emerald-400">{message}</p>}
    </form>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import type { DataPartner, DataPartnerApiKey } from "@/types/database";

const PLAN_LABEL: Record<DataPartner["plan"], string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const REVIEW_STATUS_LABEL: Record<DataPartner["review_status"], string> = {
  pending: "審査中",
  approved: "承認済み",
  rejected: "却下",
  suspended: "停止中",
};

const AVAILABLE_SCOPES = ["catalog_read", "used_market_read"];

// 法人向けデータ/APIサービス(第三の核)の契約先登録・APIキー発行管理画面。
// 用途審査(本人確認・利用目的ヒアリング)はシステム外で行い、その結果をここに記録するだけ。
export default function DataPartnersAdminPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [partners, setPartners] = useState<DataPartner[] | null>(null);
  const [keys, setKeys] = useState<DataPartnerApiKey[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issuedKey, setIssuedKey] = useState<{ partnerId: string; key: string } | null>(null);
  const [scopeSelection, setScopeSelection] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    plan: "starter" as DataPartner["plan"],
    reviewStatus: "pending" as DataPartner["review_status"],
    contractNote: "",
  });

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    const res = await fetch("/api/admin/data-partners", { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.status === 403) {
      setForbidden(true);
      return;
    }
    if (!res.ok) {
      setError("契約先の取得に失敗しました。");
      return;
    }
    const body = await res.json();
    setPartners(body.partners);
    setKeys(body.keys);
  }, [session]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    load();
  }, [session, loading, router, load]);

  async function createPartner(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusyId("create");
    setError(null);
    const res = await fetch("/api/admin/data-partners", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(form),
    });
    setBusyId(null);
    if (!res.ok) {
      setError("契約先の登録に失敗しました。");
      return;
    }
    setForm({ companyName: "", contactName: "", contactEmail: "", plan: "starter", reviewStatus: "pending", contractNote: "" });
    load();
  }

  async function updateReviewStatus(partnerId: string, reviewStatus: DataPartner["review_status"]) {
    if (!session) return;
    setBusyId(partnerId);
    await fetch(`/api/admin/data-partners/${partnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ reviewStatus }),
    });
    setBusyId(null);
    load();
  }

  async function issueKey(partnerId: string) {
    if (!session) return;
    const scopes = scopeSelection[partnerId] ?? [];
    if (scopes.length === 0) {
      setError("スコープを1つ以上選択してください。");
      return;
    }
    setBusyId(partnerId);
    setError(null);
    const res = await fetch(`/api/admin/data-partners/${partnerId}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ scopes }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "APIキーの発行に失敗しました。");
      return;
    }
    const data = await res.json();
    setIssuedKey({ partnerId, key: data.apiKey });
    load();
  }

  async function revokeKey(partnerId: string, keyId: string) {
    if (!session) return;
    setBusyId(keyId);
    await fetch(`/api/admin/data-partners/${partnerId}/keys/${keyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setBusyId(null);
    load();
  }

  function toggleScope(partnerId: string, scope: string) {
    setScopeSelection((prev) => {
      const current = prev[partnerId] ?? [];
      const next = current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope];
      return { ...prev, [partnerId]: next };
    });
  }

  if (loading || !session) return null;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-neutral-300">このページを表示する権限がありません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-neutral-500 hover:underline">
        ← メーカー提出情報レビューに戻る
      </Link>
      <h1 className="mt-2 text-xl font-bold text-white">法人向けデータ/APIサービス 契約先管理</h1>
      <p className="mt-1 text-xs text-neutral-500">
        用途審査(本人確認・利用目的ヒアリング)はこの画面の外で行い、結果をここに記録します。承認済みの契約先にのみAPIキーを発行できます。
      </p>

      {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

      <form onSubmit={createPartner} className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
        <p className="col-span-2 text-xs font-bold text-neutral-300">新規契約先登録</p>
        <input
          required
          placeholder="会社名"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-neutral-100"
        />
        <input
          required
          placeholder="担当者名"
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-neutral-100"
        />
        <input
          required
          type="email"
          placeholder="連絡先メール"
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-neutral-100"
        />
        <select
          value={form.plan}
          onChange={(e) => setForm({ ...form, plan: e.target.value as DataPartner["plan"] })}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-neutral-100"
        >
          {Object.entries(PLAN_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={form.reviewStatus}
          onChange={(e) => setForm({ ...form, reviewStatus: e.target.value as DataPartner["review_status"] })}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-neutral-100"
        >
          {Object.entries(REVIEW_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <textarea
          placeholder="審査メモ(任意)"
          value={form.contractNote}
          onChange={(e) => setForm({ ...form, contractNote: e.target.value })}
          className="col-span-2 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-neutral-100"
        />
        <button
          type="submit"
          disabled={busyId === "create"}
          className="col-span-2 justify-self-end rounded-full bg-white px-4 py-1.5 text-xs font-bold text-neutral-900 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          登録する
        </button>
      </form>

      <h2 className="mt-8 text-sm font-bold text-neutral-300">契約先一覧</h2>
      {partners === null ? (
        <p className="mt-3 text-sm text-neutral-400">読み込み中...</p>
      ) : partners.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">契約先はまだ登録されていません。</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {partners.map((partner) => {
            const partnerKeys = keys.filter((k) => k.partner_id === partner.id);
            return (
              <li key={partner.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-neutral-100">{partner.company_name}</span>
                  <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
                    {PLAN_LABEL[partner.plan]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {partner.contact_name} / {partner.contact_email}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-neutral-500">審査状況:</span>
                  <select
                    value={partner.review_status}
                    disabled={busyId === partner.id}
                    onChange={(e) => updateReviewStatus(partner.id, e.target.value as DataPartner["review_status"])}
                    className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-100"
                  >
                    {Object.entries(REVIEW_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 border-t border-neutral-800 pt-3">
                  <p className="text-xs font-bold text-neutral-300">APIキー</p>
                  {partnerKeys.length === 0 ? (
                    <p className="mt-1 text-xs text-neutral-500">発行済みのキーはありません。</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {partnerKeys.map((key) => (
                        <li key={key.id} className="flex items-center justify-between text-xs text-neutral-400">
                          <span>
                            {key.scopes.join(", ")} ・ {key.status === "active" ? "有効" : "失効済み"}
                          </span>
                          {key.status === "active" && (
                            <button
                              type="button"
                              disabled={busyId === key.id}
                              onClick={() => revokeKey(partner.id, key.id)}
                              className="rounded-full border border-red-700 px-2 py-0.5 text-red-300 hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              失効
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {partner.review_status === "approved" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {AVAILABLE_SCOPES.map((scope) => (
                        <label key={scope} className="flex items-center gap-1 text-xs text-neutral-400">
                          <input
                            type="checkbox"
                            checked={(scopeSelection[partner.id] ?? []).includes(scope)}
                            onChange={() => toggleScope(partner.id, scope)}
                          />
                          {scope}
                        </label>
                      ))}
                      <button
                        type="button"
                        disabled={busyId === partner.id}
                        onClick={() => issueKey(partner.id)}
                        className="rounded-full border border-emerald-600 bg-emerald-600/10 px-3 py-1 text-xs text-emerald-300 hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        新規キー発行
                      </button>
                    </div>
                  )}

                  {issuedKey?.partnerId === partner.id && (
                    <div className="mt-2 rounded-md border border-amber-700 bg-amber-950/30 p-2 text-xs text-amber-200">
                      <p className="font-bold">この場でしか表示されません。今すぐ控えてください:</p>
                      <code className="mt-1 block break-all">{issuedKey.key}</code>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

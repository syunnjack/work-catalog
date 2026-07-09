"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { MakerSubmission, WorkMarketPriceReport } from "@/types/database";

const SUBMISSION_TYPE_LABEL: Record<MakerSubmission["submission_type"], string> = {
  new_work: "新規作品の追加",
  work_correction: "作品情報の修正",
  cast_credit_addition: "出演者クレジットの追加",
  cast_credit_correction: "出演者クレジットの修正",
  distribution_link: "配信/販売先リンク",
};

type MarketPriceReportWithJoins = WorkMarketPriceReport & {
  works: { title: string; product_code: string } | null;
  used_market_platforms: { name: string } | null;
};

// メーカー/レーベルからの公式情報提出(/api/maker-submissions)のレビュー画面。
// ここではstatusの承認/却下のみを行う。works/work_actress/aliasesへの反映は、
// 提出元を確認できた運営者が内容を見ながら別途手動で行う(自動反映はしない)。
export default function AdminPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [submissions, setSubmissions] = useState<MakerSubmission[] | null>(null);
  const [priceReports, setPriceReports] = useState<MarketPriceReportWithJoins[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    const [submissionsRes, priceReportsRes] = await Promise.all([
      fetch("/api/admin/maker-submissions?status=pending", { headers: { Authorization: `Bearer ${session.access_token}` } }),
      fetch("/api/admin/market-price-reports?status=pending", { headers: { Authorization: `Bearer ${session.access_token}` } }),
    ]);
    if (submissionsRes.status === 403 || priceReportsRes.status === 403) {
      setForbidden(true);
      return;
    }
    if (!submissionsRes.ok || !priceReportsRes.ok) {
      setError("情報の取得に失敗しました。");
      return;
    }
    const submissionsBody = await submissionsRes.json();
    const priceReportsBody = await priceReportsRes.json();
    setSubmissions(submissionsBody.submissions);
    setPriceReports(priceReportsBody.reports);
  }, [session]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    load();
  }, [session, loading, router, load]);

  async function review(id: string, status: "approved" | "rejected") {
    if (!session) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/maker-submissions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!res.ok) {
      setError("審査結果の更新に失敗しました。");
      return;
    }
    setSubmissions((prev) => prev?.filter((s) => s.id !== id) ?? null);
  }

  async function reviewPriceReport(id: string, status: "approved" | "rejected") {
    if (!session) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/market-price-reports/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!res.ok) {
      setError("審査結果の更新に失敗しました。");
      return;
    }
    setPriceReports((prev) => prev?.filter((r) => r.id !== id) ?? null);
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold text-white">メーカー提出情報レビュー</h1>
      <p className="mt-1 text-xs text-neutral-500">
        審査待ちの提出のみを表示します。承認後、works/出演者クレジット等への反映は内容を確認した上で別途手動で行ってください。
      </p>

      {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

      {submissions === null ? (
        <p className="mt-6 text-sm text-neutral-400">読み込み中...</p>
      ) : submissions.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-400">審査待ちの提出はありません。</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {submissions.map((submission) => (
            <li key={submission.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
                  {SUBMISSION_TYPE_LABEL[submission.submission_type]}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(submission.created_at).toLocaleString("ja-JP")}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-neutral-500">提出元組織</dt>
                <dd className="text-neutral-100">{submission.submitter_organization}</dd>
                <dt className="text-neutral-500">連絡先</dt>
                <dd className="text-neutral-100">{submission.submitter_contact}</dd>
                {submission.maker_id && (
                  <>
                    <dt className="text-neutral-500">maker_id</dt>
                    <dd className="text-neutral-100">{submission.maker_id}</dd>
                  </>
                )}
                {submission.work_id && (
                  <>
                    <dt className="text-neutral-500">work_id</dt>
                    <dd className="text-neutral-100">{submission.work_id}</dd>
                  </>
                )}
              </dl>
              <pre className="mt-3 overflow-x-auto rounded-md border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300">
                {JSON.stringify(submission.payload, null, 2)}
              </pre>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === submission.id}
                  onClick={() => review(submission.id, "approved")}
                  className="rounded-full border border-emerald-600 bg-emerald-600/10 px-4 py-1.5 text-xs font-medium text-emerald-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  承認
                </button>
                <button
                  type="button"
                  disabled={busyId === submission.id}
                  onClick={() => review(submission.id, "rejected")}
                  className="rounded-full border border-red-700 bg-red-700/10 px-4 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  却下
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-xl font-bold text-white">中古相場報告レビュー</h2>
      <p className="mt-1 text-xs text-neutral-500">
        審査待ちの報告のみを表示します。承認するとwork_market_prices(price_type=user_reported)へ即時反映されます。
      </p>

      {priceReports === null ? (
        <p className="mt-6 text-sm text-neutral-400">読み込み中...</p>
      ) : priceReports.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-400">審査待ちの報告はありません。</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {priceReports.map((report) => (
            <li key={report.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
                  {report.works?.title ?? report.work_id}（{report.works?.product_code}）
                </span>
                <span className="text-xs text-neutral-500">{new Date(report.created_at).toLocaleString("ja-JP")}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-neutral-500">プラットフォーム</dt>
                <dd className="text-neutral-100">{report.used_market_platforms?.name}</dd>
                <dt className="text-neutral-500">価格</dt>
                <dd className="text-neutral-100">¥{report.price_yen.toLocaleString("ja-JP")}</dd>
                {report.note && (
                  <>
                    <dt className="text-neutral-500">メモ</dt>
                    <dd className="text-neutral-100">{report.note}</dd>
                  </>
                )}
                {report.source_url && (
                  <>
                    <dt className="text-neutral-500">出典URL</dt>
                    <dd className="truncate text-neutral-100">{report.source_url}</dd>
                  </>
                )}
              </dl>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === report.id}
                  onClick={() => reviewPriceReport(report.id, "approved")}
                  className="rounded-full border border-emerald-600 bg-emerald-600/10 px-4 py-1.5 text-xs font-medium text-emerald-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  承認
                </button>
                <button
                  type="button"
                  disabled={busyId === report.id}
                  onClick={() => reviewPriceReport(report.id, "rejected")}
                  className="rounded-full border border-red-700 bg-red-700/10 px-4 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  却下
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

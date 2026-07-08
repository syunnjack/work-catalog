"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "age-gate-confirmed-v1";

// クリックして同意する年齢確認ゲート。ページ上部の注意書きだけでは不十分なため、
// 実際に18歳以上であることを確認するまでコンテンツを隠す（成人向けサイトの最低限の対応）。
export default function AgeGate() {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    setConfirmed(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (confirmed !== false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 text-center">
      <div className="max-w-sm">
        <p className="text-lg font-bold text-white">年齢確認</p>
        <p className="mt-3 text-sm text-neutral-300">
          このサイトはアダルトコンテンツの情報を含みます。あなたは18歳以上ですか？
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(STORAGE_KEY, "true");
              setConfirmed(true);
            }}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200"
          >
            はい、18歳以上です
          </button>
          <a
            href="https://www.google.com/"
            className="rounded-full border border-neutral-600 px-6 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
          >
            いいえ、退出します
          </a>
        </div>
      </div>
    </div>
  );
}

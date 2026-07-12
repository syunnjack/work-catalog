"use client";

import { useEffect } from "react";

// 作品ページの閲覧計測ビーコン。ISRキャッシュされたHTMLはアクセスごとに再生成されないため、
// クライアント側のマウント時に1回だけPOSTする(SSR側でview_countを直接加算しない)。
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/works/${slug}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [slug]);

  return null;
}

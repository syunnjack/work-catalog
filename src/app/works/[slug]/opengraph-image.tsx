import { ImageResponse } from "next/og";
import { getWorkBySlug } from "@/lib/data";
import { SITE_NAME } from "@/lib/constants";

export const alt = "作品情報";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// SNSシェア時のプレビュー画像。作品画像そのものは使わず、タイトル・品番・メーカー・評価点のみの
// テキストベースのカードにする(第三者プラットフォームのフィード上でのアダルト画像露出を避けるため)。
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);

  const title = work?.title ?? "作品が見つかりません";
  const meta = [work?.product_code, work?.maker?.name].filter(Boolean).join("　／　");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 28, color: "#a3a3a3" }}>{SITE_NAME}</div>
        <div style={{ fontSize: 56, fontWeight: 700, marginTop: 24, lineHeight: 1.3, maxWidth: 1000 }}>
          {title.length > 42 ? `${title.slice(0, 42)}…` : title}
        </div>
        {meta && <div style={{ fontSize: 30, color: "#d4d4d4", marginTop: 32 }}>{meta}</div>}
        {work?.rating_avg && work.rating_count > 0 && (
          <div style={{ display: "flex", fontSize: 32, color: "#fbbf24", marginTop: 24 }}>
            ★ {work.rating_avg.toFixed(1)}（{work.rating_count}件）
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}

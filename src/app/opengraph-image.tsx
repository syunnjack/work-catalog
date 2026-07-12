import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// SNSシェア時のプレビュー画像。実際の作品画像は載せず、サイト名とキャッチコピーのみの
// テキストベースのカードにする(第三者プラットフォームのフィード上でのアダルト画像露出を避けるため)。
export default function Image() {
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
        <div style={{ fontSize: 72, fontWeight: 700 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 32, color: "#a3a3a3", marginTop: 24, maxWidth: 900 }}>{SITE_DESCRIPTION}</div>
      </div>
    ),
    { ...size }
  );
}

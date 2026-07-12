"use client";

import { useState } from "react";

// DMMの「準備中」画像(now_printing.jpg)は縦長(590x800等)で返ってくるが、
// 実際のパッケージ画像(pl.jpg)は常に横長(800x500前後)。読み込み後の向きで判定し、
// 未公開画像と分かった場合は自サイト側の空プレースホルダーに差し替える
// (発売前のVR作品等でDMM側がまだ本番画像を用意していないケースへの対応)。
export default function WorkThumbnail({
  src,
  alt,
  className,
  placeholderClassName,
}: {
  src: string;
  alt: string;
  className: string;
  placeholderClassName?: string;
}) {
  const [unavailable, setUnavailable] = useState(false);

  if (unavailable) {
    return placeholderClassName ? <div className={placeholderClassName} aria-hidden /> : null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 許諾済み外部画像(DMM等)をそのまま表示する
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setUnavailable(true)}
      onLoad={(event) => {
        const img = event.currentTarget;
        if (img.naturalWidth > 0 && img.naturalHeight > img.naturalWidth) {
          setUnavailable(true);
        }
      }}
    />
  );
}

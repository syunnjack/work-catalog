"use client";

import { useEffect, useRef, useState } from "react";

// DMMの「準備中」画像(now_printing.jpg)は縦長(590x800等)で返ってくるが、
// 実際のパッケージ画像(pl.jpg)は常に横長(800x500前後)。読み込み後の向きで判定し、
// 未公開画像と分かった場合は自サイト側の空プレースホルダーに差し替える
// (発売前のVR作品等でDMM側がまだ本番画像を用意していないケースへの対応)。
//
// SSRされたimg要素はハイドレーション前からブラウザが読み込みを開始しているため、
// キャッシュ済み・高速な画像だとReactがonLoadを取り付ける前に読み込みが完了してしまい、
// イベントを取りこぼすことがある。マウント時にimg.completeを直接チェックすることで
// 「既に読み込み済みだった」ケースも確実に判定する。
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
  const imgRef = useRef<HTMLImageElement>(null);

  function checkOrientation(img: HTMLImageElement) {
    if (img.naturalWidth > 0 && img.naturalHeight > img.naturalWidth) {
      setUnavailable(true);
    }
  }

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) {
      checkOrientation(img);
    }
  }, []);

  if (unavailable) {
    return (
      <div className={`${placeholderClassName ?? "aspect-video w-full rounded bg-neutral-800"} flex items-center justify-center`}>
        <span className="text-xs text-neutral-500">近日公開</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 許諾済み外部画像(DMM等)をそのまま表示する
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setUnavailable(true)}
      onLoad={(event) => checkOrientation(event.currentTarget)}
    />
  );
}

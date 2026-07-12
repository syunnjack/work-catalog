// SNSシェア導線(UGCバズ施策)。ログイン不要で誰でも押せるよう、単純なリンクのみで構成する
// (クリック計測やポイント付与とは連携しない。共有元ページのog:image/twitter:imageが
// プレビューに使われる)。
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500">シェア:</span>
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-400 hover:text-white"
      >
        X
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-400 hover:text-white"
      >
        LINE
      </a>
    </div>
  );
}

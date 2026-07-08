// 出演者情報が未クレジットの作品に表示する注記。
// 本サイトは第三者による出演者の推測・特定を一切行わないため、公式サイトへの外部リンクのみを示す。
export default function OfficialInfoNotice({ externalUrl }: { externalUrl?: string }) {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-300">
      <p className="font-medium text-neutral-100">出演者情報: 公式クレジットなし</p>
      <p className="mt-1">
        本サイトは独自に出演者を特定・推測することはありません。最新の出演者情報は公式サイトでご確認ください。
      </p>
      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2 inline-block text-neutral-100 underline hover:text-white"
        >
          公式サイトで確認する →
        </a>
      )}
    </div>
  );
}

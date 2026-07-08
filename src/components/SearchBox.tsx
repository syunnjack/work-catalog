// SSRページでも動くGETフォーム検索（JS無効環境でも/search?q=に遷移して機能する）。
export default function SearchBox() {
  return (
    <form action="/search" method="get" role="search" className="flex items-center gap-2">
      <input
        type="text"
        name="q"
        placeholder="作品名・品番・メーカー・レーベル・女優名で検索"
        className="w-full rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white"
      >
        検索
      </button>
    </form>
  );
}

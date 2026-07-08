import { AFFILIATE_DISCLOSURE_TEXT } from "@/lib/constants";

export default function DisclosureNotice() {
  return (
    <p className="mt-6 text-[11px] leading-relaxed text-neutral-600">
      {AFFILIATE_DISCLOSURE_TEXT}
      外部リンクは公式または提携先です。画像は許諾済みのもの、または権利元提供素材のみ掲載しています。在庫・価格・決済方法は変動するため、最終確認は送客先で行ってください。
    </p>
  );
}

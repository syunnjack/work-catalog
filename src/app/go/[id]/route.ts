import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { mockWorkDistributionLinks } from "@/lib/mock-data";

// アフィリエイト計測用リダイレクト。SEO対象外（robots.tsでクロール制限済み）。
// idはwork_distribution_links.id（OfferCompareTableが `/go/[link.id]` で参照する）。
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let destinationUrl: string | null = null;

  try {
    const supabase = getSupabaseServerClient();
    const { data: link } = await supabase.from("work_distribution_links").select("*").eq("id", id).maybeSingle();
    if (link?.platform_work_url) {
      destinationUrl = link.platform_work_url as string;
      // work_distribution_link_id基準で常に記録する(ランキングのクリック数/CTR算出に使う)。
      // affiliate_link_idはASP提携リンクがある場合のみ併記する(成果計測用)。
      await supabase.from("affiliate_click_logs").insert({
        affiliate_link_id: link.affiliate_link_id ?? null,
        work_distribution_link_id: link.id,
        referer_path: request.headers.get("referer"),
        user_agent: request.headers.get("user-agent"),
      });
    }
  } catch {
    const mockLink = mockWorkDistributionLinks.find((l) => l.id === id);
    destinationUrl = mockLink?.platform_work_url ?? null;
  }

  if (!destinationUrl) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  return NextResponse.redirect(destinationUrl, { status: 302 });
}

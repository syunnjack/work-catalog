import { NextRequest, NextResponse } from "next/server";
import { withPartnerAuth } from "@/lib/partner-api";

export async function GET(request: NextRequest) {
  return withPartnerAuth(request, "/api/v1/partner/labels", { requiredScope: "catalog_read" }, async ({ supabase }) => {
    const { data, error } = await supabase.from("labels").select("slug, name, description, makers(name)").order("name");
    if (error) {
      return NextResponse.json({ error: "レーベル一覧の取得に失敗しました。" }, { status: 502 });
    }
    type Row = { slug: string; name: string; description: string | null; makers: { name: string } | null };
    const items = ((data ?? []) as unknown as Row[]).map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      maker: row.makers?.name ?? null,
    }));
    return NextResponse.json({ items });
  });
}

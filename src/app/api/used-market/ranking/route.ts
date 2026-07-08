import { NextResponse } from "next/server";
import { getPremiumWorkRanking } from "@/lib/data";

export async function GET() {
  const items = await getPremiumWorkRanking(50);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=300" } });
}

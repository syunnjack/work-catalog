import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ works: [], actresses: [], makers: [], labels: [], series: [] });
  }
  const result = await search(q);
  return NextResponse.json(result, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } });
}

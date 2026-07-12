import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// 作品ページの閲覧計測。works.view_count(ランキングの「閲覧数順」で使用)を加算し、
// view_logsにも1件記録する。ISRでキャッシュされたページのサーバーコンポーネントは
// 実際のアクセスごとに再実行されないため、クライアント側からのビーコンで計測する。
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: work } = await supabase.from("works").select("id, view_count").eq("slug", slug).maybeSingle();
  if (!work) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await supabase.from("works").update({ view_count: work.view_count + 1 }).eq("id", work.id);
  await supabase.from("view_logs").insert({
    work_id: work.id,
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}

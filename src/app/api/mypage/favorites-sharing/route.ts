import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { favoritesSharingSchema } from "@/lib/schemas";

// お気に入りリストの公開共有設定(有効化/無効化/共有URLの再発行)。
// upsertするのは、public.usersの行がまだ無い(auth.usersトリガー導入前に登録したユーザー等)
// 場合にも対応するため。
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = favoritesSharingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const update: { favorites_public?: boolean; favorites_share_token?: string } = {};
  if (parsed.data.action === "enable") update.favorites_public = true;
  if (parsed.data.action === "disable") update.favorites_public = false;
  if (parsed.data.action === "regenerate") update.favorites_share_token = randomUUID();

  const { data, error } = await supabase
    .from("users")
    .upsert({ id: userId, ...update }, { onConflict: "id" })
    .select("favorites_public, favorites_share_token")
    .single();

  if (error) {
    return NextResponse.json({ error: "設定の更新に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, ...data });
}

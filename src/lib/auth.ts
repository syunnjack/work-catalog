import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// クライアント側のSupabase Authセッションから取得したアクセストークンを
// `Authorization: Bearer <token>` ヘッダーで受け取り、ユーザーを検証する。
// 注意: サインイン/サインアップ画面はまだ実装していないため、このヘルパーはAPI契約としては
// 完成しているが、クライアント側でSupabase Authセッションを取得できるようになるまでは
// 実際には呼び出されない（favorites/comments/price-watchの各APIから利用）。
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// クライアント側のSupabase Authセッションから取得したアクセストークンを
// `Authorization: Bearer <token>` ヘッダーで受け取り、ユーザーを検証する。
// 注意: サインイン/サインアップ画面はまだ実装していないため、このヘルパーはAPI契約としては
// 完成しているが、クライアント側でSupabase Authセッションを取得できるようになるまでは
// 実際には呼び出されない（favorites/comments/price-watchの各APIから利用）。
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const user = await getAuthenticatedUser(request);
  return user?.id ?? null;
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

// /admin(メーカー提出情報レビュー画面)へのアクセス制御。運営者は少数(基本1名)のため、
// public.usersにis_adminのようなロール列を追加するのではなく、環境変数のメール許可リストで判定する。
export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

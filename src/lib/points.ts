import type { SupabaseClient } from "@supabase/supabase-js";

// ユーザーポイント(将来の会員特典の下地)。交換先は未定のため、ここでは加算のみを扱う。
// ポイント数は暫定値であり、実際の会員特典設計が決まった時点で見直す前提。
export const POINT_VALUES = {
  favorite_added: 1,
  comment_posted: 2,
  price_watch_registered: 1,
  notification_registered: 1,
  comment_liked: 1,
  work_rated: 1,
  market_price_reported: 2,
} as const;

export type PointReason = keyof typeof POINT_VALUES;

// 呼び出し側のメイン処理(お気に入り登録等)を失敗させないよう、ポイント記録の失敗は握りつぶす。
export async function awardPoints(supabase: SupabaseClient, userId: string, reason: PointReason, referenceId?: string): Promise<void> {
  try {
    await supabase.from("point_transactions").insert({
      user_id: userId,
      points: POINT_VALUES[reason],
      reason,
      reference_id: referenceId ?? null,
    });
  } catch {
    // ポイントは補助的な仕組みのため、記録に失敗してもメイン処理は成功させる。
  }
}

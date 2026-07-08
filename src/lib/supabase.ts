import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// サーバー側専用クライアント。環境変数が未設定の場合は例外を投げ、呼び出し側で
// mock-data.tsへのフォールバックを判断できるようにする（lib/data.tsのパターン）。
export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabaseの環境変数(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)が未設定です。");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// クライアント側（ブラウザ）用。anon keyのみを使い、RLSに従う。
export function getSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabaseの環境変数(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)が未設定です。");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: true },
  });
}

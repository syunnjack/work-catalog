"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AuthNav() {
  const { session, loading, signOut } = useAuth();

  if (loading) return null;

  if (session) {
    return (
      <button
        type="button"
        onClick={() => signOut()}
        className="shrink-0 rounded-full px-2.5 py-1.5 text-gray-300 hover:bg-neutral-800"
        title={session.user.email ?? ""}
      >
        ログアウト
      </button>
    );
  }

  return (
    <Link href="/login" className="shrink-0 rounded-full px-2.5 py-1.5 text-neutral-300 hover:bg-neutral-800">
      ログイン
    </Link>
  );
}

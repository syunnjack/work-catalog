import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import AgeGate from "@/components/AgeGate";
import { AGE_GATE_NOTICE, resolveBaseUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(resolveBaseUrl()),
  title: `${SITE_NAME}｜品番・作品名・メーカー・レーベルから探す作品カタログ`,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full">
      <body className="flex min-h-full flex-col bg-neutral-950 text-neutral-100 antialiased">
        <AgeGate />
        <div className="border-b border-neutral-900 bg-neutral-900/60 px-4 py-1.5 text-center text-[11px] text-neutral-400">
          {AGE_GATE_NOTICE}
        </div>
        <AppHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-900 px-4 py-8 text-center text-xs text-neutral-600">
          © {SITE_NAME}
        </footer>
      </body>
    </html>
  );
}

import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import SearchBox from "./SearchBox";
import AuthNav from "./AuthNav";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-white">
          {SITE_NAME}
        </Link>
        <div className="min-w-[200px] flex-1">
          <SearchBox />
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}

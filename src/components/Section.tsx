import type { ReactNode } from "react";
import Link from "next/link";

export default function Section({
  title,
  moreHref,
  children,
}: {
  title: string;
  moreHref?: string;
  children: ReactNode;
}) {
  return (
    <section className="py-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-100">{title}</h2>
        {moreHref && (
          <Link href={moreHref} className="text-xs font-medium text-neutral-400 hover:text-neutral-100 hover:underline">
            もっと見る →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

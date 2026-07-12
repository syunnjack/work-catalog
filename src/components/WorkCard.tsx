import Link from "next/link";
import type { Work } from "@/types/database";
import WorkThumbnail from "./WorkThumbnail";

export default function WorkCard({ work }: { work: Work }) {
  return (
    <Link
      href={`/works/${work.slug}`}
      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-3 transition hover:border-neutral-600"
    >
      {work.permitted_thumbnail_url ? (
        <WorkThumbnail
          src={work.permitted_thumbnail_url}
          alt={work.title}
          className="aspect-video w-full rounded bg-neutral-800 object-cover"
          placeholderClassName="aspect-video w-full rounded bg-neutral-800"
        />
      ) : (
        <div className="aspect-video w-full rounded bg-neutral-800" aria-hidden />
      )}
      <p className="mt-2 truncate text-sm font-medium text-neutral-100">{work.title}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{work.product_code}</p>
      {work.release_date && <p className="mt-0.5 text-xs text-neutral-500">{work.release_date}</p>}
    </Link>
  );
}

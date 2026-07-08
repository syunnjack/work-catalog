import Link from "next/link";

export interface Tag {
  href: string;
  label: string;
}

export default function TagCloud({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.href}
          href={tag.href}
          className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition hover:border-neutral-400 hover:text-white"
        >
          {tag.label}
        </Link>
      ))}
    </div>
  );
}

import Link from "next/link";

export interface Crumb {
  name: string;
  href: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="パンくずリスト" className="text-xs text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden>/</span>}
            {index === items.length - 1 ? (
              <span className="text-neutral-300">{item.name}</span>
            ) : (
              <Link href={item.href} className="hover:text-neutral-200 hover:underline">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

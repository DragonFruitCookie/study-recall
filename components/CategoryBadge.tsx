import { categoryStyle } from "@/lib/categoryColor";

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded px-1.5 py-px text-[11px] leading-4 font-medium ring-1 ring-inset ${categoryStyle(category)}`}
    >
      {category}
    </span>
  );
}

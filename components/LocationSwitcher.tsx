import Link from "next/link";
import type { Business } from "@/lib/types";
import { BuildingIcon } from "./Icons";

export default function LocationSwitcher({
  businesses,
  activeBusinessId,
  basePath,
}: {
  businesses: Business[];
  activeBusinessId: string;
  basePath: string;
}) {
  if (businesses.length <= 1) return null;

  return (
    <div
      className="no-print rounded-panel bg-white border border-black/[0.08] px-3 py-2 flex flex-wrap items-center gap-2"
      aria-label="Business locations"
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted pr-1">
        <BuildingIcon size={14} />
        <span>Location:</span>
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {businesses.map((b) => {
          const active = b.id === activeBusinessId;
          return (
            <Link
              key={b.id}
              href={`${basePath}?biz=${encodeURIComponent(b.id)}`}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-cobalt-600 text-white"
                  : "bg-canvas border border-black/[0.08] text-ink-secondary hover:text-ink hover:bg-surface-subtle"
              }`}
            >
              {b.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}


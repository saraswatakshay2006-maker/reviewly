import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PlatformSignature from "@/components/PlatformSignature";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-6 py-10 bg-canvas text-center">
      <Link href="/">
        <BrandMark />
      </Link>

      <div className="max-w-md rounded-card bg-white border border-black/[0.09] p-8 sm:p-10 shadow-panel space-y-4">
        <p className="font-mono text-xs font-medium text-cobalt-600">404</p>
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-ink-secondary leading-relaxed">
          The review page, card link, or workspace route you requested does not exist or may have been updated.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-5 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-control border border-black/[0.12] bg-white hover:bg-canvas px-5 py-2.5 text-sm font-medium text-ink transition-colors"
          >
            Open dashboard
          </Link>
        </div>
      </div>

      <PlatformSignature compact />
    </main>
  );
}

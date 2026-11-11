import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PlatformSignature from "@/components/PlatformSignature";
import { CreditCardIcon, NfcIcon, ShieldCheckIcon } from "@/components/Icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-canvas">
      <main className="lg:col-span-7 flex flex-col justify-between px-5 sm:px-10 py-8">
        <div>
          <Link href="/" aria-label="Return to Reviewly home">
            <BrandMark />
          </Link>
        </div>

        <div className="w-full max-w-[420px] mx-auto my-10">{children}</div>

        <div className="pt-4">
          <PlatformSignature compact />
        </div>
      </main>

      <aside className="hidden lg:flex lg:col-span-5 bg-surface-dark text-white p-12 flex-col justify-between border-l border-white/10">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight leading-snug text-balance">
            Transparent customer trust infrastructure, scoped to your business.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
            Manage NFC tap cards, printable QR stands, live customer rating pages, and your private team feedback inbox from one place.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              icon: NfcIcon,
              title: "Dynamic NFC & QR endpoints",
              body: "Update your Google destination anytime without reprogramming physical cards.",
            },
            {
              icon: ShieldCheckIcon,
              title: "Compliant across all 5 stars",
              body: "Public Google links and private feedback appear equally for every rating.",
            },
            {
              icon: CreditCardIcon,
              title: "Organization-scoped isolation",
              body: "Every workspace session, card token, and feedback note stays strictly private.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl bg-surface-darkElevated border border-white/10 p-4 flex items-start gap-3.5"
              >
                <div className="h-9 w-9 rounded-lg bg-cobalt-500/20 text-cobalt-200 flex items-center justify-center shrink-0">
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

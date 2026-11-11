import { ShieldCheckIcon } from "./Icons";

export default function PlatformSignature({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center select-none">
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <ShieldCheckIcon size={13} className="text-ink-muted" />
        <span>Powered by Reviewly</span>
      </div>
      {!compact && (
        <p className="text-xs leading-snug text-ink-muted/85">
          Transparent customer feedback — every rating welcomed equally.
        </p>
      )}
    </div>
  );
}

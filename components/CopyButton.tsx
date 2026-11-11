"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons";

export default function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-subtle hover:text-ink active:scale-[0.98] ${className}`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <CheckIcon size={13} className="text-emerald-700" />
          <span className="text-emerald-700">{copiedLabel}</span>
        </>
      ) : (
        <>
          <CopyIcon size={13} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}


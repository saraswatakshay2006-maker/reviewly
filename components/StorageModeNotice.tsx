"use client";

import { useEffect, useState } from "react";

export default function StorageModeNotice() {
  const [ephemeral, setEphemeral] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/storage-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.mode === "memory") {
          setEphemeral(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!ephemeral) return null;

  return (
    <div
      role="status"
      className="mb-5 rounded-control border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed"
    >
      <span className="font-semibold">Cloudflare database binding missing:</span>{" "}
      This deployment is running in temporary edge isolate memory, so sign-ups reset across isolates. Bind a free{" "}
      <strong className="font-semibold">Cloudflare D1 database</strong> named{" "}
      <code className="font-mono font-semibold">DB</code> (or KV{" "}
      <code className="font-mono font-semibold">REVIEWLY_KV</code>) in Pages → Settings → Bindings and redeploy.
    </div>
  );
}


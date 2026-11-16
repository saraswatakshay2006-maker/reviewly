import fs from "node:fs";
import path from "node:path";

const BASE_EDGE_TARGETS = [
  "app/page.tsx",
  "app/api/ai-assist/route.ts",
  "app/api/auth/login/route.ts",
  "app/api/auth/signup/route.ts",
  "app/api/billing/overview/route.ts",
  "app/api/billing/quote/route.ts",
  "app/api/billing/checkout/route.ts",
  "app/api/billing/verify/route.ts",
  "app/api/billing/cancel/route.ts",
  "app/api/billing/invoices/[id]/route.ts",
  "app/api/webhooks/razorpay/route.ts",
  "app/api/events/route.ts",
  "app/api/feedback/route.ts",
  "app/api/public/review-status/route.ts",
  "app/api/qr/[slug]/route.ts",
  "app/api/reports/export/route.ts",
  "app/api/storage-status/route.ts",
  "app/api/team/route.ts",
  "app/api/team/[id]/route.ts",
  "app/api/admin/bootstrap/route.ts",
  "app/api/admin/overview/route.ts",
  "app/api/admin/organizations/[id]/route.ts",
  "app/api/admin/businesses/[id]/route.ts",
  "app/api/admin/users/[id]/route.ts",
  "app/api/admin/cards/[id]/route.ts",
  "app/api/admin/feedback/[id]/route.ts",
  "app/api/admin/plans/route.ts",
  "app/api/admin/plans/[id]/route.ts",
  "app/api/admin/subscriptions/action/route.ts",
  "app/api/admin/coupons/route.ts",
  "app/api/admin/settings/route.ts",
  "app/api/admin/payments/route.ts",
  "app/api/admin/standee/themes/route.ts",
  "app/api/admin/standee/themes/[id]/route.ts",
  "app/api/standee/[businessId]/route.ts",
  "app/api/standee/[businessId]/reset/route.ts",
  "app/t/[cardId]/route.ts",
  "app/r/[slug]/page.tsx",
  "app/review/[slug]/page.tsx",
  "app/admin/page.tsx",
  "app/app/layout.tsx",
  "app/app/page.tsx",
  "app/app/billing/page.tsx",
  "app/app/cards/page.tsx",
  "app/app/standee/page.tsx",
  "app/app/feedback/page.tsx",
  "app/app/team/page.tsx",
  "app/app/settings/page.tsx",
];

// Helper to recursively discover all route.ts files in app/
function findRoutesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findRoutesRecursively(fullPath));
    } else if (entry.name === "route.ts" || entry.name === "route.js") {
      const rel = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
      results.push(rel);
    }
  }
  return results;
}

const discoveredRoutes = findRoutesRecursively(path.join(process.cwd(), "app"));
const allTargets = Array.from(new Set([...BASE_EDGE_TARGETS, ...discoveredRoutes]));

const mode = process.argv.includes("--restore") ? "restore" : "enable";
const marker = 'export const runtime = "edge";';

let touchedCount = 0;
for (const rel of allTargets) {
  const abs = path.join(process.cwd(), rel);
  if (!fs.existsSync(abs)) continue;
  let src = fs.readFileSync(abs, "utf8");
  if (mode === "enable") {
    if (!src.includes(marker)) {
      src = src.trimEnd() + `\n\n${marker}\n`;
      fs.writeFileSync(abs, src, "utf8");
      touchedCount++;
    }
  } else {
    if (src.includes(marker)) {
      src = src.replace(/\r?\n*export const runtime = "edge";\r?\n?/g, "\n").trimEnd() + "\n";
      fs.writeFileSync(abs, src, "utf8");
      touchedCount++;
    }
  }
}

console.log(
  `Cloudflare Pages edge runtime directives ${mode}d across ${allTargets.length} routes (${touchedCount} modified).`
);

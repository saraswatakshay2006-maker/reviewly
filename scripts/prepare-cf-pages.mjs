import fs from "node:fs";
import path from "node:path";

const EDGE_TARGETS = [
  "app/api/ai-assist/route.ts",
  "app/api/auth/login/route.ts",
  "app/api/auth/signup/route.ts",
  "app/api/events/route.ts",
  "app/api/feedback/route.ts",
  "app/api/qr/[slug]/route.ts",
  "app/api/storage-status/route.ts",
  "app/api/admin/bootstrap/route.ts",
  "app/api/admin/overview/route.ts",
  "app/api/admin/organizations/[id]/route.ts",
  "app/api/admin/businesses/[id]/route.ts",
  "app/api/admin/users/[id]/route.ts",
  "app/api/admin/cards/[id]/route.ts",
  "app/api/admin/feedback/[id]/route.ts",
  "app/t/[cardId]/route.ts",
  "app/r/[slug]/page.tsx",
  "app/admin/page.tsx",
  "app/app/layout.tsx",
  "app/app/page.tsx",
  "app/app/cards/page.tsx",
  "app/app/feedback/page.tsx",
  "app/app/settings/page.tsx",
];

const mode = process.argv.includes("--restore") ? "restore" : "enable";
const marker = 'export const runtime = "edge";';

for (const rel of EDGE_TARGETS) {
  const abs = path.join(process.cwd(), rel);
  let src = fs.readFileSync(abs, "utf8");
  if (mode === "enable") {
    if (!src.includes(marker)) {
      src = src.trimEnd() + `\n\n${marker}\n`;
      fs.writeFileSync(abs, src, "utf8");
    }
  } else {
    src = src.replace(/\r?\n*export const runtime = "edge";\r?\n?/g, "\n").trimEnd() + "\n";
    fs.writeFileSync(abs, src, "utf8");
  }
}

console.log(`Cloudflare Pages edge runtime directives ${mode}d across ${EDGE_TARGETS.length} routes.`);

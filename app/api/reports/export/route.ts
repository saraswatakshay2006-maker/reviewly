import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationEntitlements } from "@/lib/entitlements";
import { exportOrgCsvReport } from "@/lib/repo";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getOrganizationEntitlements(user.organizationId);
  if (!ctx) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (user.role !== "super_admin" && !ctx.isUsable) {
    return NextResponse.json(
      { error: "Workspace subscription is expired or paused." },
      { status: 403 }
    );
  }

  if (user.role !== "super_admin" && !ctx.featureFlags.exportReports) {
    return NextResponse.json(
      { error: "Exportable CSV reports require the Pro or Enterprise plan." },
      { status: 403 }
    );
  }

  const csv = await exportOrgCsvReport(ctx.organization.id);
  const stamp = new Date().toISOString().slice(0, 10);
  const slug =
    ctx.organization.slug.replace(/[^a-z0-9-_]/gi, "") || "workspace";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reviewly-${slug}-report-${stamp}.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

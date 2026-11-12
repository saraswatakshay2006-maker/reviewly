import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportOrgCsvReport, getOrganizationById } from "@/lib/repo";
import {
  getPlanEntitlements,
  isSubscriptionActive,
  resolveSubscription,
} from "@/lib/subscriptions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getOrganizationById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const sub = resolveSubscription(org);
  if (user.role !== "super_admin" && !isSubscriptionActive(sub)) {
    return NextResponse.json(
      { error: "Workspace subscription is expired or paused." },
      { status: 403 }
    );
  }

  const entitlements = getPlanEntitlements(sub);
  if (user.role !== "super_admin" && !entitlements.features.exportReports) {
    return NextResponse.json(
      { error: "Exportable CSV reports require the Pro or Enterprise plan." },
      { status: 403 }
    );
  }

  const csv = await exportOrgCsvReport(org.id);
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = org.slug.replace(/[^a-z0-9-_]/gi, "") || "workspace";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reviewly-${slug}-report-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

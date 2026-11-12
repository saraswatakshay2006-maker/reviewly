import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnerBillingOverview } from "@/lib/billing";
import { syncExpiredSubscriptions } from "@/lib/entitlements";
import { isRazorpayConfigured } from "@/lib/razorpay";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncExpiredSubscriptions(user.organizationId);
  const overview = await getOwnerBillingOverview(user.organizationId);
  if (!overview) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      razorpayConfigured: isRazorpayConfigured(),
      ...overview,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}


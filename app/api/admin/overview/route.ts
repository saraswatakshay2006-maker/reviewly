import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { exportSanitizedBackup, getSaasSnapshot } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (req.nextUrl.searchParams.get("export") === "1") {
    const backup = await exportSanitizedBackup();
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="reviewly-saas-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const snapshot = await getSaasSnapshot();
  return NextResponse.json(
    { ok: true, ...snapshot },
    { headers: { "Cache-Control": "no-store" } }
  );
}

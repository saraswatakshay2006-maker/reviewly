import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { writeDB, uid } from "@/lib/db";

const patchPaymentSchema = z.object({
  paymentId: z.string().min(1),
  status: z.enum(["REFUNDED", "PARTIALLY_REFUNDED", "FAILED"]),
  reason: z.string().min(3).max(300),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchPaymentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment update" }, { status: 400 });
  }

  try {
    const updated = await writeDB((db) => {
      const p = db.payments.find((x) => x.id === parsed.data.paymentId);
      if (!p) throw new Error("Payment not found");
      const prevStatus = p.status;
      p.status = parsed.data.status;
      p.failureReason =
        parsed.data.status === "FAILED" ? parsed.data.reason : p.failureReason;
      p.updatedAt = new Date().toISOString();

      db.subscriptionAuditLogs.push({
        id: uid(),
        subscriptionId: p.subscriptionId,
        organizationId: p.organizationId,
        businessId: p.businessId,
        adminId: admin.id,
        actorEmail: admin.email,
        action: "admin_payment_status_update",
        previousValues: { paymentId: p.id, status: prevStatus },
        newValues: { paymentId: p.id, status: p.status },
        reason: parsed.data.reason,
        createdAt: p.updatedAt,
      });
      return p;
    });

    return NextResponse.json({ ok: true, payment: updated });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}


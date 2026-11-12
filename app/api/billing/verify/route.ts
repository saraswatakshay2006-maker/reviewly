import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import {
  finalizeVerifiedPayment,
  markPaymentFailed,
} from "@/lib/billing";
import {
  fetchRazorpayPayment,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { listBusinessesForOrg } from "@/lib/repo";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1).optional(),
  razorpay_signature: z.string().min(1).optional(),
  failed: z.boolean().optional(),
  failureReason: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOwnerOrAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment verification payload" }, { status: 400 });
  }

  const d = parsed.data;
  if (d.failed) {
    await markPaymentFailed({
      organizationId: user.organizationId,
      gatewayOrderId: d.razorpay_order_id,
      gatewayPaymentId: d.razorpay_payment_id,
      failureReason: d.failureReason || "Payment cancelled or failed at checkout",
    });
    return NextResponse.json(
      { ok: false, error: d.failureReason || "Payment did not complete." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!d.razorpay_payment_id || !d.razorpay_signature) {
    return NextResponse.json(
      { error: "Missing Razorpay payment signature fields" },
      { status: 400 }
    );
  }

  const validSig = await verifyRazorpayPaymentSignature({
    orderId: d.razorpay_order_id,
    paymentId: d.razorpay_payment_id,
    signature: d.razorpay_signature,
  });

  if (!validSig) {
    await markPaymentFailed({
      organizationId: user.organizationId,
      gatewayOrderId: d.razorpay_order_id,
      gatewayPaymentId: d.razorpay_payment_id,
      failureReason: "Invalid Razorpay payment signature",
    });
    return NextResponse.json(
      { error: "Payment signature verification failed. Subscription was not activated." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // When payment id resolves at Razorpay API, also capture payment method & check status
  let paymentMethod: string | null = "razorpay";
  const remote = await fetchRazorpayPayment(d.razorpay_payment_id);
  if (remote) {
    if (remote.status === "failed") {
      await markPaymentFailed({
        organizationId: user.organizationId,
        gatewayOrderId: d.razorpay_order_id,
        gatewayPaymentId: d.razorpay_payment_id,
        failureReason: "Gateway reported payment status failed",
      });
      return NextResponse.json(
        { error: "Gateway reported this payment as failed." },
        { status: 400 }
      );
    }
    if (remote.method) paymentMethod = remote.method;
  }

  try {
    const result = await finalizeVerifiedPayment({
      organizationId: user.organizationId,
      gatewayOrderId: d.razorpay_order_id,
      gatewayPaymentId: d.razorpay_payment_id,
      paymentMethod,
      actorEmail: user.email,
      source: "verify_api",
    });

    const businesses = await listBusinessesForOrg(user.organizationId);
    revalidatePath("/app");
    revalidatePath("/app/billing");
    revalidatePath("/app/settings");
    for (const biz of businesses) {
      revalidatePath(`/r/${biz.publicSlug}`);
    }

    return NextResponse.json(
      {
        ok: true,
        alreadyFinalized: result.alreadyFinalized,
        payment: result.payment,
        subscription: result.subscription,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Could not finalize subscription" },
      { status: 400 }
    );
  }
}


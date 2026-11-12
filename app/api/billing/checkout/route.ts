import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import {
  calculateCheckoutQuote,
  createPendingPaymentRecord,
} from "@/lib/billing";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rateLimit";
import {
  createRazorpayOrder,
  getRazorpayPublicKeyId,
  isRazorpayConfigured,
} from "@/lib/razorpay";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  billingInterval: z.enum(["monthly", "annual"]).default("monthly"),
  couponCode: z.string().max(40).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOwnerOrAdminRole(user.role)) {
    return NextResponse.json(
      { error: "Only workspace owners or business admins can purchase or renew plans." },
      { status: 403 }
    );
  }

  const rl = checkRateLimit({
    key: `checkout:${user.organizationId}:${clientIpFromHeaders(req.headers)}`,
    limit: 15,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      {
        error:
          "Razorpay online checkout is not configured on this server (missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).",
        code: "RAZORPAY_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  try {
    // Price, proration, coupon, and tax are computed exclusively on the server from DB records
    const quote = await calculateCheckoutQuote({
      organizationId: user.organizationId,
      planId: parsed.data.planId,
      billingInterval: parsed.data.billingInterval,
      couponCode: parsed.data.couponCode ?? null,
    });

    const receipt = `rcpt_${user.organizationId.slice(0, 8)}_${Date.now()}`;
    const order = await createRazorpayOrder({
      amountInr: quote.totalAmountInr,
      currency: "INR",
      receipt,
      notes: {
        organizationId: user.organizationId,
        planId: quote.planId,
        billingInterval: quote.billingInterval,
        userId: user.id,
      },
    });

    const payment = await createPendingPaymentRecord({
      organizationId: user.organizationId,
      planId: quote.planId,
      billingInterval: quote.billingInterval,
      couponCode: quote.couponCode,
      discountAmountInr: quote.discountAmountInr,
      taxAmountInr: quote.taxAmountInr,
      amountInr: quote.totalAmountInr,
      gatewayOrderId: order.id,
    });

    return NextResponse.json(
      {
        ok: true,
        keyId: getRazorpayPublicKeyId(),
        orderId: order.id,
        amountPaise: order.amount,
        currency: order.currency,
        paymentId: payment.id,
        quote,
        prefill: {
          name: user.name,
          email: user.email,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Could not start checkout" },
      { status: 400 }
    );
  }
}


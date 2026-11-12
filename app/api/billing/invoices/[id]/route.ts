import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPaymentInvoiceForOrg } from "@/lib/billing";

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await getPaymentInvoiceForOrg(
    id,
    user.organizationId,
    user.role === "super_admin"
  );
  if (!data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { payment, organization, business, plan, owner } = data;
  if (!payment.invoiceNumber && payment.status !== "SUCCESS" && payment.status !== "REFUNDED" && payment.status !== "PARTIALLY_REFUNDED") {
    return NextResponse.json(
      { error: "Invoices are only available for completed payments." },
      { status: 400 }
    );
  }

  const invNo = payment.invoiceNumber || `REC-${payment.id.slice(0, 10).toUpperCase()}`;
  const issuedDate = new Date(payment.paidAt || payment.createdAt).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Invoice ${esc(invNo)} — Reviewly</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #f8fafc; }
    .card { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .muted { color: #64748b; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; }
    th, td { text-align: left; padding: 12px 8px; border-bottom: 1px solid #e2e8f0; }
    th { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .total { font-size: 18px; font-weight: 700; }
    @media print { body { background: #fff; padding: 0; } .no-print { display: none; } .card { border: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="row">
      <div>
        <h1 style="margin:0;font-size:22px;">Reviewly Tax Receipt / Invoice</h1>
        <p class="muted" style="margin:4px 0 0;">Invoice No: <strong>${esc(invNo)}</strong></p>
        <p class="muted" style="margin:2px 0 0;">Date: ${esc(issuedDate)}</p>
      </div>
      <div style="text-align:right;">
        <span class="badge">${esc(payment.status)}</span>
        <p class="muted" style="margin:8px 0 0;">Payment ID: ${esc(payment.gatewayPaymentId || payment.id)}</p>
        ${payment.gatewayOrderId ? `<p class="muted" style="margin:2px 0 0;">Order ID: ${esc(payment.gatewayOrderId)}</p>` : ""}
      </div>
    </div>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />

    <div class="row">
      <div>
        <p class="muted" style="margin:0 0 4px;">Billed To</p>
        <p style="margin:0;font-weight:600;">${esc(organization?.name || business?.name || "Client Workspace")}</p>
        ${owner ? `<p class="muted" style="margin:2px 0 0;">${esc(owner.name)} (${esc(owner.email)})</p>` : ""}
        ${business?.address ? `<p class="muted" style="margin:2px 0 0;">${esc(business.address)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <p class="muted" style="margin:0 0 4px;">Payment Method</p>
        <p style="margin:0;font-weight:600;text-transform:uppercase;">${esc(payment.paymentMethod || payment.gateway)}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Billing Cycle</th>
          <th class="num">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Reviewly ${esc(plan?.name || payment.planId)} Subscription</td>
          <td style="text-transform:capitalize;">${esc(payment.billingInterval)}</td>
          <td class="num">₹${(payment.amountInr + payment.discountAmountInr - payment.taxAmountInr).toLocaleString("en-IN")}</td>
        </tr>
        ${
          payment.discountAmountInr > 0
            ? `<tr><td colspan="2">Discount ${payment.couponCode ? `(${esc(payment.couponCode)})` : ""}</td><td class="num">-₹${payment.discountAmountInr.toLocaleString("en-IN")}</td></tr>`
            : ""
        }
        ${
          payment.taxAmountInr > 0
            ? `<tr><td colspan="2">Tax / GST</td><td class="num">₹${payment.taxAmountInr.toLocaleString("en-IN")}</td></tr>`
            : ""
        }
        <tr>
          <td colspan="2" class="total">Total Paid</td>
          <td class="num total">₹${payment.amountInr.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>

    <div class="no-print" style="margin-top:24px;text-align:right;">
      <button onclick="window.print()" style="background:#1A4BE0;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="reviewly-${invNo}.html"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}


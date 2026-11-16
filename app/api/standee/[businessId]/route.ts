import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  getBusinessById,
  getStandeeDesignForBusiness,
  saveStandeeDesign,
} from "@/lib/repo";
import { inferEmblemType } from "@/lib/logoEmblems";

const standeeSaveSchema = z.object({
  themeId: z.string().min(1).max(60),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
  }),
  businessName: z.string().min(1).max(120),
  tagline: z.string().max(200).default(""),
  logoUrl: z.string().max(10_000_000).default(""),
  emblemType: z.string().max(40).optional(),
  headline: z.string().max(120).default("Loved Our Service?"),
  mainHeadline: z.string().max(120).default("Review Us"),
  supportingText: z.string().max(300).default("Your honest feedback helps us improve and serve you better."),
  footerText: z.string().max(80).default("THANK YOU!"),
  qrScanLabel: z.string().max(40).default("SCAN"),
  qrScanInstruction: z.string().max(100).default("Scan the QR code with your phone"),
  nfcTapLabel: z.string().max(40).default("TAP"),
  nfcTapInstruction: z.string().max(100).default("Tap your NFC-enabled phone here"),
  benefit1: z.string().max(60).default("Share Your Experience"),
  benefit2: z.string().max(60).default("Help Us Improve"),
  benefit3: z.string().max(60).default("Support Our Growth"),
  bleedEnabled: z.boolean().default(false),
  cropMarks: z.boolean().default(false),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessId } = await params;
  const business = await getBusinessById(businessId);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Isolation check: business must belong to user's organization unless super_admin
  if (user.role !== "super_admin" && business.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const design = await getStandeeDesignForBusiness(businessId);
  return NextResponse.json({ ok: true, design }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessId } = await params;
  const business = await getBusinessById(businessId);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (user.role !== "super_admin" && business.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = standeeSaveSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid design payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const emblemType =
      parsed.data.emblemType ||
      inferEmblemType(business.category, business.name, business.description);
    const updated = await saveStandeeDesign(businessId, {
      ...parsed.data,
      emblemType,
    });
    return NextResponse.json(
      { ok: true, design: updated },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Save failed" },
      { status: 500 }
    );
  }
}

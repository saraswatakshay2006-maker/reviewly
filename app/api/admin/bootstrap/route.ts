import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  hashPassword,
  sessionCookieName,
  signSession,
  verifyOrgSignupCode,
} from "@/lib/auth";
import { getEnv } from "@/lib/cloudflare";
import {
  countSuperAdmins,
  createOrganization,
  createUser,
  getUserByEmail,
} from "@/lib/repo";
import { PLAN_DEFAULTS } from "@/lib/subscriptions";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  accessCode: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const existingAdmins = await countSuperAdmins();
  if (existingAdmins > 0) {
    return NextResponse.json(
      { error: "Super admin is already initialized. Sign in with your super admin account." },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const envSuperSecret = getEnv("SUPER_ADMIN_SECRET")?.trim();
  const matchesEnvSecret =
    Boolean(envSuperSecret) && parsed.data.accessCode.trim() === envSuperSecret;
  const matchesOrgCode = await verifyOrgSignupCode(parsed.data.accessCode);

  if (!matchesEnvSecret && !matchesOrgCode) {
    return NextResponse.json(
      { error: "Invalid access code. Super admin was not created." },
      { status: 403 }
    );
  }

  const existingEmail = await getUserByEmail(parsed.data.email);
  if (existingEmail) {
    return NextResponse.json(
      { error: "Email is already registered" },
      { status: 409 }
    );
  }

  const org = await createOrganization("Reviewly Platform Admin", "platform-admin", {
    plan: "enterprise",
    status: "active",
    monthlyPriceInr: 0,
    cardLimit: PLAN_DEFAULTS.enterprise.cardLimit,
    renewalDate: null,
    notes: "Platform Super Admin workspace",
  });

  const { hash, salt } = await hashPassword(parsed.data.password);
  const user = await createUser({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: hash,
    salt,
    role: "super_admin",
    organizationId: org.id,
  });

  const token = await signSession(user.id);
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:";
  const store = await cookies();
  store.set(sessionCookieName(), token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isHttps,
  });

  return NextResponse.json(
    { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    { status: 201 }
  );
}

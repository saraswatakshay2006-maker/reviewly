import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  hashPassword,
  signSession,
  sessionCookieName,
  verifyOrgSignupCode,
} from "@/lib/auth";
import { createOrganization, createUser, getUserByEmail } from "@/lib/repo";
import { cookies } from "next/headers";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  orgName: z.string().min(1).max(80),
  orgCode: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
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

  if (!(await verifyOrgSignupCode(parsed.data.orgCode))) {
    return NextResponse.json(
      { error: "Invalid organisation code. Account was not created." },
      { status: 403 }
    );
  }

  const existingUser = await getUserByEmail(parsed.data.email);
  if (existingUser) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const orgSlug =
    parsed.data.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "workspace";
  const org = await createOrganization(parsed.data.orgName, orgSlug);

  const { hash, salt } = await hashPassword(parsed.data.password);
  let user;
  try {
    user = await createUser({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: hash,
      salt,
      role: "owner",
      organizationId: org.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 409 }
    );
  }

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
    { ok: true, user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 }
  );
}

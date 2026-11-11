import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, signSession, sessionCookieName } from "@/lib/auth";
import { getStorageMode } from "@/lib/db";
import { countUsers, getUserByEmail } from "@/lib/repo";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (
    !user ||
    !(await verifyPassword(parsed.data.password, user.salt, user.passwordHash))
  ) {
    if (!user && getStorageMode() === "memory" && (await countUsers()) === 0) {
      return NextResponse.json(
        {
          error:
            "No persistent database is bound to this Cloudflare deployment yet (edge memory reset). Bind a Cloudflare D1 database named DB or KV namespace named REVIEWLY_KV in Pages → Settings → Bindings, then redeploy.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
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

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}

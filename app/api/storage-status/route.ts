import { NextResponse } from "next/server";
import { getStorageMode } from "@/lib/db";

export async function GET() {
  return NextResponse.json(
    { mode: getStorageMode() },
    { headers: { "Cache-Control": "no-store" } }
  );
}


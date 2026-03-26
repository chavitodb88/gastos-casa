import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { db } from "@/db";

export async function POST(request: Request) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { error: "Missing sql parameter" },
        { status: 400 }
      );
    }

    // Only allow read-only queries
    const normalized = sql.trim().toUpperCase();
    if (!normalized.startsWith("SELECT") && !normalized.startsWith("PRAGMA")) {
      return NextResponse.json(
        { error: "Only SELECT queries allowed" },
        { status: 403 }
      );
    }

    const stmt = db.$client.prepare(sql);
    const rows = stmt.all();

    return NextResponse.json({ rows, count: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Query error" },
      { status: 500 }
    );
  }
}

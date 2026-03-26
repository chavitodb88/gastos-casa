import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { db } from "@/db";

export async function POST(request: Request) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sql, params } = await request.json();

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { error: "Missing sql parameter" },
        { status: 400 }
      );
    }

    // Allow INSERT, UPDATE, DELETE but NOT DROP, ALTER, CREATE
    const normalized = sql.trim().toUpperCase();
    const forbidden = ["DROP", "ALTER", "CREATE", "TRUNCATE", "ATTACH", "DETACH"];
    if (forbidden.some((kw) => normalized.startsWith(kw))) {
      return NextResponse.json(
        { error: "Forbidden operation" },
        { status: 403 }
      );
    }

    const stmt = db.$client.prepare(sql);
    const result = stmt.run(...(params ?? []));

    return NextResponse.json({
      changes: result.changes,
      lastInsertRowid: Number(result.lastInsertRowid),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Execute error" },
      { status: 500 }
    );
  }
}

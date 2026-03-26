import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.arrayBuffer();
    const dbPath = path.join(process.cwd(), "data", "gastos.db");

    // Remove WAL/SHM files if they exist
    for (const ext of ["-wal", "-shm"]) {
      const f = dbPath + ext;
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    fs.writeFileSync(dbPath, Buffer.from(data));

    return NextResponse.json({
      ok: true,
      size: data.byteLength,
      message: "Database uploaded. Restart the app to apply.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload error" },
      { status: 500 }
    );
  }
}

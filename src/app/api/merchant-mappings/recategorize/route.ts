import { NextResponse } from "next/server";
import { recategorizeUnmapped } from "@/services/merchant-mappings";

export async function POST() {
  try {
    const count = await recategorizeUnmapped();
    return NextResponse.json({ recategorized: count });
  } catch (error) {
    console.error("Error recategorizing unmapped:", error);
    return NextResponse.json(
      { error: "Error al recategorizar transacciones sin mapeo" },
      { status: 500 }
    );
  }
}

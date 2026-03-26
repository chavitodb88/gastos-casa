import { NextResponse } from "next/server";
import { generateFixedForMonth } from "@/services/fixed-templates";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const now = new Date();
    const day = now.getDate();

    let targetMonth: number;
    let targetYear: number;

    if (day >= 20) {
      // Target next month
      targetMonth = now.getMonth() + 2; // getMonth() is 0-based, so +2
      targetYear = now.getFullYear();
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear += 1;
      }
    } else {
      targetMonth = now.getMonth() + 1;
      targetYear = now.getFullYear();
    }

    const results = await generateFixedForMonth(targetMonth, targetYear);

    return NextResponse.json({
      month: targetMonth,
      year: targetYear,
      generated: results,
    });
  } catch (error) {
    console.error("Error generating fixed transactions:", error);
    return NextResponse.json(
      { error: "Error al generar las transacciones fijas" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboard";
import { db } from "@/db";
import { importBatches } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();

    const month = searchParams.get("month")
      ? Number(searchParams.get("month"))
      : now.getMonth() + 1;
    const year = searchParams.get("year")
      ? Number(searchParams.get("year"))
      : now.getFullYear();

    // Debug: include import batches data
    const batches = db.select().from(importBatches).all();

    const data = await getDashboardData(month, year);
    return NextResponse.json({ ...data, _debug_batches: batches });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos del dashboard" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboard";

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

    const data = await getDashboardData(month, year);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos del dashboard" },
      { status: 500 }
    );
  }
}

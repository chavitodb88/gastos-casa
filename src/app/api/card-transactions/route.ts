import { NextResponse } from "next/server";
import { getCardTransactions } from "@/services/card-transactions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
      year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
      categoryId: searchParams.get("categoryId")
        ? Number(searchParams.get("categoryId"))
        : undefined,
      merchant: searchParams.get("merchant") || undefined,
    };

    const result = await getCardTransactions(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching card transactions:", error);
    return NextResponse.json(
      { error: "Error al obtener las transacciones de tarjeta" },
      { status: 500 }
    );
  }
}

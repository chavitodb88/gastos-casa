import { NextResponse } from "next/server";
import { transactionSchema } from "@/lib/validators";
import { getTransactions, createTransaction } from "@/services/transactions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
      year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
      type: searchParams.get("type") as "INCOME" | "EXPENSE" | "TRANSFER" | undefined,
      categoryId: searchParams.get("categoryId")
        ? Number(searchParams.get("categoryId"))
        : undefined,
      accountId: searchParams.get("accountId")
        ? Number(searchParams.get("accountId"))
        : undefined,
      isPaid: searchParams.get("isPaid") !== null
        ? searchParams.get("isPaid") === "true"
        : undefined,
      isFixed: searchParams.get("isFixed") !== null
        ? searchParams.get("isFixed") === "true"
        : undefined,
    };

    const result = await getTransactions(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Error al obtener las transacciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createTransaction(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Error al crear la transacción" },
      { status: 500 }
    );
  }
}

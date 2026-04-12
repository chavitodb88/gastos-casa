import { NextResponse } from "next/server";
import { debtSchema } from "@/lib/validators";
import { getDebts, createDebt, getPersonNames } from "@/services/debts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Return person names list for autocomplete
    if (searchParams.get("persons") === "true") {
      const persons = getPersonNames();
      return NextResponse.json(persons);
    }

    const filters = {
      type: searchParams.get("type") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      personName: searchParams.get("personName") ?? undefined,
    };

    const result = getDebts(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json(
      { error: "Error al obtener las deudas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = debtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = createDebt(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating debt:", error);
    return NextResponse.json(
      { error: "Error al crear la deuda" },
      { status: 500 }
    );
  }
}

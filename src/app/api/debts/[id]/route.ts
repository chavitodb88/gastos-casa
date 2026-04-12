import { NextResponse } from "next/server";
import { debtSchema, settleDebtSchema } from "@/lib/validators";
import { updateDebt, deleteDebt, settleDebt, getDebtById } from "@/services/debts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debt = getDebtById(Number(id));

    if (!debt) {
      return NextResponse.json(
        { error: "Deuda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(debt);
  } catch (error) {
    console.error("Error fetching debt:", error);
    return NextResponse.json(
      { error: "Error al obtener la deuda" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = debtSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = updateDebt(Number(id), parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Deuda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating debt:", error);
    return NextResponse.json(
      { error: "Error al actualizar la deuda" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteDebt(Number(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Deuda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting debt:", error);
    return NextResponse.json(
      { error: "Error al eliminar la deuda" },
      { status: 500 }
    );
  }
}

// PATCH = settle the debt
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = settleDebtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settled = settleDebt(Number(id), parsed.data);

    if (!settled) {
      return NextResponse.json(
        { error: "Deuda no encontrada o ya liquidada" },
        { status: 404 }
      );
    }

    return NextResponse.json(settled);
  } catch (error) {
    console.error("Error settling debt:", error);
    return NextResponse.json(
      { error: "Error al liquidar la deuda" },
      { status: 500 }
    );
  }
}

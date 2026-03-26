import { NextResponse } from "next/server";
import { merchantMappingSchema } from "@/lib/validators";
import {
  updateMerchantMapping,
  deleteMerchantMapping,
} from "@/services/merchant-mappings";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = merchantMappingSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateMerchantMapping(Number(id), parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Mapeo de comercio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating merchant mapping:", error);
    return NextResponse.json(
      { error: "Error al actualizar el mapeo de comercio" },
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
    const deleted = await deleteMerchantMapping(Number(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Mapeo de comercio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting merchant mapping:", error);
    return NextResponse.json(
      { error: "Error al eliminar el mapeo de comercio" },
      { status: 500 }
    );
  }
}

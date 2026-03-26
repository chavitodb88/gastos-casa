import { NextResponse } from "next/server";
import { fixedTemplateSchema } from "@/lib/validators";
import {
  updateFixedTemplate,
  deleteFixedTemplate,
} from "@/services/fixed-templates";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = fixedTemplateSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateFixedTemplate(Number(id), parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Plantilla fija no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating fixed template:", error);
    return NextResponse.json(
      { error: "Error al actualizar la plantilla fija" },
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
    const deleted = await deleteFixedTemplate(Number(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Plantilla fija no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fixed template:", error);
    return NextResponse.json(
      { error: "Error al eliminar la plantilla fija" },
      { status: 500 }
    );
  }
}

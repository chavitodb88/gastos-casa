import { NextResponse } from "next/server";
import { fixedTemplateSchema } from "@/lib/validators";
import {
  getFixedTemplates,
  createFixedTemplate,
} from "@/services/fixed-templates";

export async function GET() {
  try {
    const result = await getFixedTemplates();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching fixed templates:", error);
    return NextResponse.json(
      { error: "Error al obtener las plantillas fijas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = fixedTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createFixedTemplate(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating fixed template:", error);
    return NextResponse.json(
      { error: "Error al crear la plantilla fija" },
      { status: 500 }
    );
  }
}

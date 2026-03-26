import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { categorySchema } from "@/lib/validators";

export async function GET() {
  try {
    const result = await db.select().from(categories).orderBy(categories.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [created] = await db.insert(categories).values(parsed.data).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}

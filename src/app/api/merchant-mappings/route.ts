import { NextResponse } from "next/server";
import { merchantMappingSchema } from "@/lib/validators";
import {
  getMerchantMappings,
  createMerchantMapping,
} from "@/services/merchant-mappings";

export async function GET() {
  try {
    const result = await getMerchantMappings();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching merchant mappings:", error);
    return NextResponse.json(
      { error: "Error al obtener los mapeos de comercios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = merchantMappingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createMerchantMapping(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating merchant mapping:", error);
    return NextResponse.json(
      { error: "Error al crear el mapeo de comercio" },
      { status: 500 }
    );
  }
}

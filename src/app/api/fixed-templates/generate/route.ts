import { NextResponse } from "next/server";
import { generateFixedForMonth } from "@/services/fixed-templates";

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();
    const result = await generateFixedForMonth(month, year);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating fixed transactions:", error);
    return NextResponse.json(
      { error: "Error generating fixed transactions" },
      { status: 500 }
    );
  }
}

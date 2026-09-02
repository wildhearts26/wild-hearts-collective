import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Monthly membership is no longer offered. Create a free studio account and buy class passes instead.",
    },
    { status: 410 },
  );
}

import { NextResponse } from "next/server";
import { buildHealthModel } from "@/lib/health/checks";

export const dynamic = "force-dynamic";

export async function GET() {
  const model = await buildHealthModel();
  return NextResponse.json(model, {
    status: model.ok ? 200 : 503,
  });
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { identifyDeck } from "@/lib/anthropic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const imageUrls = body?.imageUrls;

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: "At least one image URL is required." }, { status: 400 });
  }

  try {
    const result = await identifyDeck(imageUrls);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Identification failed" },
      { status: 502 }
    );
  }
}

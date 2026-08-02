import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getSession();
        if (!session.authenticated) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024,
          // Default token validity is only 30s — too short for a large phone photo on a
          // slow connection. Give uploads up to 10 minutes to finish.
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    // Temporary diagnostic: report what this running function actually sees for the token env
    // var, without exposing the secret itself, to settle whether it's really missing at runtime
    // vs. a dashboard/deployment mismatch.
    const raw = process.env.BLOB_READ_WRITE_TOKEN;
    const tokenDiag = raw
      ? `present, length ${raw.length}, ${raw.slice(0, 15)}...${raw.slice(-6)}`
      : "not set";
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
        diag: { BLOB_READ_WRITE_TOKEN: tokenDiag, VERCEL_ENV: process.env.VERCEL_ENV ?? "unset" },
      },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth/dal";

const ALLOWED_TYPES = ["audio/mp4", "audio/x-m4a", "audio/aac", "audio/mpeg", "audio/wav"];

export async function POST(request: Request) {
  await getCurrentUser();
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: 150 * 1024 * 1024, // 150MB
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload mislukt" },
      { status: 400 },
    );
  }
}

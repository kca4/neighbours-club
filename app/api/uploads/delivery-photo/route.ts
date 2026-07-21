import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

// Accepted image MIME types. capture="environment" on mobile reliably produces
// JPEG; PNG and WebP are accepted from desktop testing workflows.
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Extension lookup so the Blob path has a real extension.
const TYPE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// POST /api/uploads/delivery-photo?orderId=<id>
// Body: multipart/form-data with field "photo" (File).
// Returns: { ok: true, url: string } — the public Vercel Blob URL.
//
// Requires: BLOB_READ_WRITE_TOKEN env var (set in Vercel dashboard under
// Storage → Blob → your store → Tokens). Also works locally when the token is
// present in .env.local — no local emulator is needed.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP images are accepted" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Photo must be under 5 MB" },
      { status: 400 }
    );
  }

  const ext = TYPE_EXT[file.type] ?? "jpg";
  const timestamp = Date.now();
  const blobPath = `delivery-photos/${orderId}/${timestamp}.${ext}`;

  const blob = await put(blobPath, file, {
    access: "public",
    contentType: file.type,
  });

  // POST-PILOT TODO: configure a retention/lifecycle policy to auto-delete
  // delivery photos N days after the delivery date (90 days is a reasonable
  // starting point). Vercel Blob supports this in the dashboard under
  // Storage → Blob → your store → Lifecycle. Implement before photo volume
  // becomes significant.

  return NextResponse.json({ ok: true, url: blob.url });
}

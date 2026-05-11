import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace stub with real file upload to cloud storage:
//   1. Parse multipart form data (use formdata-node or built-in Web API)
//   2. Validate file type (JPEG/PNG only) and size (< 5 MB)
//   3. Upload to S3/R2/GCS with a path like: delivery-photos/{orderId}/{timestamp}.jpg
//   4. Return the public URL
//   5. Store URL on DeliveryOrder.deliveryPhotoUrl via /api/driver/orders/[orderId]/status

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // TODO: implement real file upload
  // Stub: return a placeholder URL so client code can proceed in development
  const orderId = req.nextUrl.searchParams.get("orderId") ?? "unknown";
  const placeholderUrl = `/placeholder-delivery-photo-${orderId}.jpg`;

  return NextResponse.json({ ok: true, url: placeholderUrl });
}

import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client using server-side env vars
const awsRegion = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;

const s3 = new S3Client({ region: awsRegion });

export async function POST(req: Request) {
  try {
    if (!awsRegion || !bucketName) {
      return NextResponse.json(
        { success: false, message: "Missing AWS_REGION or AWS_BUCKET_NAME" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const filename: string = body?.filename;
    const fileType: string = body?.fileType;
    const fileSize: number | undefined = body?.fileSize; // optional: bytes

    if (!filename || !fileType) {
      return NextResponse.json(
        { success: false, message: "filename and fileType are required" },
        { status: 400 }
      );
    }

    // Basic type validation: allow images and PDF only
    const allowedPrefixes = ["image/", "application/pdf"];
    if (!allowedPrefixes.some((p) => fileType.startsWith(p))) {
      return NextResponse.json(
        { success: false, message: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Optional size check: if provided, limit to ~25MB
    const MAX_BYTES = 25 * 1024 * 1024;
    if (typeof fileSize === "number" && fileSize > MAX_BYTES) {
      return NextResponse.json(
        { success: false, message: "File too large (max 25MB)" },
        { status: 413 }
      );
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      ContentType: fileType,
      ACL: "public-read",
    });

    // Short-lived URL, 60 seconds
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });

    return NextResponse.json({ success: true, uploadURL });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to generate pre-signed URL", error: String(error) },
      { status: 500 }
    );
  }
}

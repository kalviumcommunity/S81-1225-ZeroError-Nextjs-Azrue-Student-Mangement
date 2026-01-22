import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BlobSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

// Determine storage provider via env
const provider = (process.env.STORAGE_PROVIDER || "aws").toLowerCase(); // 'aws' | 'azure'

// AWS envs
const awsRegion = process.env.AWS_REGION;
const awsBucketName = process.env.AWS_BUCKET_NAME;
const awsPublicRead = (process.env.AWS_S3_PUBLIC_READ || "false").toLowerCase() === "true";

// Azure envs
const azureAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const azureAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const azureContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Initialize clients lazily
const s3 = awsRegion ? new S3Client({ region: awsRegion }) : undefined;

export async function POST(req: Request) {
  try {
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

    if (provider === "aws") {
      if (!awsRegion || !awsBucketName || !s3) {
        return NextResponse.json(
          { success: false, message: "Missing AWS_REGION or AWS_BUCKET_NAME" },
          { status: 500 }
        );
      }

      const command = new PutObjectCommand({
        Bucket: awsBucketName,
        Key: filename,
        ContentType: fileType,
        ...(awsPublicRead ? { ACL: "public-read" } : {}),
      });

      const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });

      const fileURL = `https://${awsBucketName}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(
        filename
      )}`;

      return NextResponse.json({ success: true, provider: "aws", uploadURL, fileURL });
    }

    if (provider === "azure") {
      if (!azureAccountName || !azureAccountKey || !azureContainerName) {
        return NextResponse.json(
          { success: false, message: "Missing Azure storage env vars" },
          { status: 500 }
        );
      }

      const sharedKey = new StorageSharedKeyCredential(azureAccountName, azureAccountKey);
      const startsOn = new Date();
      const expiresOn = new Date(Date.now() + 60 * 1000); // 60 seconds

      const sas = generateBlobSASQueryParameters(
        {
          containerName: azureContainerName,
          blobName: filename,
          permissions: BlobSASPermissions.parse("cw"), // create + write
          startsOn,
          expiresOn,
        },
        sharedKey
      ).toString();

      const baseURL = `https://${azureAccountName}.blob.core.windows.net/${azureContainerName}/${encodeURIComponent(
        filename
      )}`;
      const uploadURL = `${baseURL}?${sas}`;

      // Azure requires blob type header when uploading via REST
      const uploadHeaders = {
        "x-ms-blob-type": "BlockBlob",
        "x-ms-blob-content-type": fileType,
      } as const;

      return NextResponse.json({ success: true, provider: "azure", uploadURL, fileURL: baseURL, uploadHeaders });
    }

    return NextResponse.json(
      { success: false, message: `Unsupported STORAGE_PROVIDER: ${provider}` },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to generate upload URL", error: String(error) },
      { status: 500 }
    );
  }
}

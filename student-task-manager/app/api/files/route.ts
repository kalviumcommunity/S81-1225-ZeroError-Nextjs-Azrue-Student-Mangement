import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { fileName, fileURL, fileSize, mimeType } = await req.json();

    if (!fileName || !fileURL) {
      return NextResponse.json(
        { success: false, message: "fileName and fileURL are required" },
        { status: 400 }
      );
    }

    const file = await prisma.file.create({
      data: {
        name: fileName,
        url: fileURL,
        size: typeof fileSize === "number" ? fileSize : null,
        mimeType: typeof mimeType === "string" ? mimeType : null,
      },
    });

    return NextResponse.json({ success: true, file });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to store file link", error: String(error) },
      { status: 500 }
    );
  }
}

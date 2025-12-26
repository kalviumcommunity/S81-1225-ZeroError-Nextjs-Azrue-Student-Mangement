import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { userSchema } from "@/lib/schemas/userSchema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = userSchema.parse(body);

    // In a real app, insert into DB here using `data`
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error",
          errors: error.errors.map((e) => ({ field: e.path[0], message: e.message })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, message: "Unexpected error" }, { status: 500 });
  }
}

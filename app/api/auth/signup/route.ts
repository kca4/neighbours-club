import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Normalize email before validation
    if (typeof body.email === "string") {
      body.email = body.email.toLowerCase().trim();
    }
    // Normalize name
    if (typeof body.name === "string") {
      body.name = body.name.trim();
    }
    // Treat empty phone string as absent
    if (body.phone === "" || body.phone === null) {
      body.phone = undefined;
    }

    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name, phone } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone ?? null,
        role: "MEMBER",
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

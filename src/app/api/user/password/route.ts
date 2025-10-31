import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { account } from "@/db/auth-schema";
import { eq, and } from "drizzle-orm";
import { hash, compare } from "bcrypt";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get user's account with credential provider
    const userAccount = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    if (userAccount.length === 0 || !userAccount[0].password) {
      return NextResponse.json(
        { error: "No password found for this account" },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, userAccount[0].password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "credential")
        )
      );

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}

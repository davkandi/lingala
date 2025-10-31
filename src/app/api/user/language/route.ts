import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth, authDb } from "@/lib/auth";
import { user } from "@/db/auth-postgres-schema";
import { eq } from "drizzle-orm";

const SUPPORTED_LANGUAGES = new Set(["en", "fr"]);

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { language } = body;

    if (typeof language !== "string" || !SUPPORTED_LANGUAGES.has(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    await authDb
      .update(user)
      .set({
        preferredLanguage: language,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating language preference:", error);
    return NextResponse.json(
      { error: "Failed to update language preference" },
      { status: 500 }
    );
  }
}

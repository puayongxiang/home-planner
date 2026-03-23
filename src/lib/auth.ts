import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isEditorEmail } from "@/lib/editorAccess";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function requireAuthenticatedUser(): Promise<User | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return user;
}

export async function requireEditorUser(): Promise<User | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email?.toLowerCase();
  if (!isEditorEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return user;
}

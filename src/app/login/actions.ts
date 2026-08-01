"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function login(_prevState: { error?: string }, formData: FormData) {
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");
  const to = typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/collection";

  if (typeof password !== "string" || password.length === 0 || password !== process.env.APP_PASSWORD) {
    return { error: "Incorrect password." };
  }

  const session = await getSession();
  session.authenticated = true;
  await session.save();

  redirect(to);
}

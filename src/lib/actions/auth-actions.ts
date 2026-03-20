"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Whitelisted admin emails that can self-register
const ALLOWED_ADMIN_EMAILS = [
  "eli@bakery.com",
  "teresa.hobson.hobbs@gmail.com",
  "wendynatalie@icloud.com",
];

export async function setupAccount(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
    return { error: "This email is not authorised for admin access." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();

  // Check if account already exists by trying to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: "__check_exists__",
  });

  // If error is "Invalid login credentials" the user exists
  // If error is something else or no error, handle accordingly
  if (signInError && signInError.message === "Invalid login credentials") {
    return { error: "An account with this email already exists. Please sign in instead." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    // User may already exist
    if (error.message.includes("already registered") || error.message.includes("already been registered")) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    return { error: error.message };
  }

  redirect("/admin");
}

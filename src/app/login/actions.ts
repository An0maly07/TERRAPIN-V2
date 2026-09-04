"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Result shape consumed by useActionState on the login page. */
export type AuthState = {
    error?: string;
    /** Signup succeeded but email confirmation is required before a session exists. */
    needsConfirmation?: boolean;
} | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string): string {
    const v = formData.get(name);
    return typeof v === "string" ? v.trim() : "";
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
    const email = field(formData, "email");
    const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";

    if (!EMAIL_RE.test(email) || password.length === 0) {
        return { error: "Enter a valid email and password." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
    const email = field(formData, "email");
    const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
    const username = field(formData, "username");

    if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
    if (password.length < 6) return { error: "Password must be at least 6 characters." };
    if (username.length < 3 || username.length > 32) {
        return { error: "Username must be 3–32 characters." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                full_name: username,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    // With email confirmation enabled there is no session yet. Redirecting
    // here used to bounce straight back to /login and wipe the success
    // message — return state instead so the page can show it.
    if (!data.session) {
        return { needsConfirmation: true };
    }

    revalidatePath("/", "layout");
    redirect("/");
}

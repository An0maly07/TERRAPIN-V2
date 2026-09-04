/**
 * Supabase client for TerraPin multiplayer (Realtime Broadcast + Presence).
 *
 * This is the SAME cookie-backed browser client used for auth, so the realtime
 * socket carries the user's JWT. That is a prerequisite for Supabase Realtime
 * Authorization (private channels + RLS on realtime.messages); a bare anon
 * client could never be authorized.
 *
 * Lazy-initialized to avoid crashing during Next.js static prerendering
 * (env vars aren't available at build time on Vercel).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

export function getSupabase(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        throw new Error(
            "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
    }
    return createClient() as SupabaseClient;
}

/** @deprecated Use getSupabase() instead — kept for compatibility */
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
    },
});

"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { usePlayerStore } from "@/stores/player-store";

/**
 * Loads the player's progression from Supabase when an authenticated
 * user is detected. Should be called once in a layout or page component.
 * Skips loading for anonymous / guest users.
 */
export function usePlayerInit() {
  const { user, loading } = useAuth();
  const loadFromSupabase = usePlayerStore((s) => s.loadFromSupabase);
  const loadedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.is_anonymous) return;
    // Only load once per user session
    if (loadedUserRef.current === user.id) return;

    loadedUserRef.current = user.id;
    loadFromSupabase(user.id);
  }, [user, loading, loadFromSupabase]);
}

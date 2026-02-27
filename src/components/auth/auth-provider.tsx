"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    // Memoize the client so we don't create a new instance every render
    const supabase = useMemo(() => createClient(), []);

    const refreshUser = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
    }, [supabase]);

    // Re-check auth on every route change (handles server action redirects
    // where cookies are set server-side but the client doesn't know yet)
    useEffect(() => {
        refreshUser();
    }, [pathname, refreshUser]);

    useEffect(() => {
        // Listen for client-side auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

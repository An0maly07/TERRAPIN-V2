"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Mail, Globe2, Save, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const getProfile = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("profiles")
                .select("username, full_name")
                .eq("id", user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username || "");
                setFullName(data.full_name || "");
            }
        } catch {
            console.error("Error loading profile");
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }
        if (user) {
            getProfile();
        }
    }, [user, authLoading, router, getProfile]);

    async function updateProfile() {
        if (!user) return;

        try {
            setSaving(true);
            setMessage(null);

            const { error } = await supabase.from("profiles").upsert({
                id: user.id,
                username,
                full_name: fullName,
                updated_at: new Date().toISOString(),
            });

            if (error) throw error;
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error updating profile";
            setMessage({ type: "error", text: msg });
        } finally {
            setSaving(false);
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{ x: [0, 50, -30, 0], y: [0, -40, 50, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl"
                />
                <motion.div
                    animate={{ x: [0, -50, 30, 0], y: [0, 30, -50, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl"
                />
                <div className="absolute inset-0 bg-radial-[at_center] from-transparent to-black/40" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative z-10 w-full max-w-[500px] px-6"
            >
                {/* Back button */}
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        <span className="gradient-text">Account</span> Settings
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your profile and preferences
                    </p>
                </div>

                {/* Card */}
                <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/30">
                    {/* Avatar */}
                    <div className="mb-8 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white shadow-lg shadow-primary/25">
                            {(fullName?.[0] || user.email?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{fullName || "Explorer"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="account-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Email
                            </label>
                            <div className="group relative">
                                <Mail
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    id="account-email"
                                    type="text"
                                    value={user.email || ""}
                                    disabled
                                    className="h-12 w-full rounded-xl border border-white/[0.05] bg-white/[0.02] pl-12 pr-4 text-sm text-muted-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="account-fullname" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Full Name
                            </label>
                            <div className="group relative">
                                <User
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                                />
                                <input
                                    id="account-fullname"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="account-username" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Username
                            </label>
                            <div className="group relative">
                                <Globe2
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                                />
                                <input
                                    id="account-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Your username (min 3 chars)"
                                    minLength={3}
                                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success"
                                        ? "border-green-500/20 bg-green-500/10 text-green-400"
                                        : "border-red-500/20 bg-red-500/10 text-red-400"
                                    }`}
                            >
                                {message.text}
                            </motion.div>
                        )}

                        {/* Save Button */}
                        <motion.button
                            onClick={updateProfile}
                            disabled={saving}
                            whileHover={{ scale: saving ? 1 : 1.02 }}
                            whileTap={{ scale: saving ? 1 : 0.98 }}
                            className="shimmer relative flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </motion.button>

                        {/* Sign Out */}
                        <form action="/auth/signout" method="post">
                            <button
                                type="submit"
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
                            >
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

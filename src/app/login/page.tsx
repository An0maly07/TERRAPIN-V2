"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Globe2, Loader2 } from "lucide-react";
import { login, signup } from "./actions";
import { useNotificationStore } from "@/stores/notifications";
import Link from "next/link";

type AuthMode = "login" | "signup";

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        setSuccessMessage(null);

        startTransition(async () => {
            const action = mode === "login" ? login : signup;
            const result = await action(formData);

            if (result?.error) {
                setError(result.error);
            } else if (mode === "signup") {
                setSuccessMessage("Check your email to confirm your account!");
                addNotification({
                    type: "warning",
                    title: "Verify Your Account",
                    message: "We sent a confirmation link to your email. Please verify your account to unlock all features.",
                    icon: "📧",
                });
            }
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            {/* Animated background orbs */}
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
                <motion.div
                    animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
                />
                <div className="absolute inset-0 bg-radial-[at_center] from-transparent to-black/40" />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative z-10 w-full max-w-[440px] px-6"
            >
                {/* Logo / Branding */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-8 text-center"
                >
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110">
                            <Globe2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-3xl font-extrabold tracking-tight">
                            <span className="gradient-text">Terra</span>
                            <span className="text-foreground">Pin</span>
                        </span>
                    </Link>
                    <p className="mt-3 text-sm text-muted-foreground">
                        {mode === "login"
                            ? "Welcome back, explorer"
                            : "Begin your journey"}
                    </p>
                </motion.div>

                {/* Card */}
                <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/30">
                    {/* Mode Toggle */}
                    <div className="relative mb-8 flex rounded-2xl bg-white/[0.04] p-1">
                        <motion.div
                            className="absolute inset-y-1 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg"
                            animate={{
                                left: mode === "login" ? "4px" : "50%",
                                right: mode === "login" ? "50%" : "4px",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setMode("login");
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${mode === "login" ? "text-white" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode("signup");
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${mode === "signup" ? "text-white" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <form action={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {mode === "signup" && (
                                <motion.div
                                    key="username-field"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <label htmlFor="username" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Username
                                    </label>
                                    <div className="group relative">
                                        <User
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                                        />
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            minLength={3}
                                            placeholder="Choose a username"
                                            className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Email
                            </label>
                            <div className="group relative">
                                <Mail
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                                />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Password
                            </label>
                            <div className="group relative">
                                <Lock
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                                />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={6}
                                    placeholder={mode === "login" ? "Your password" : "Min 6 characters"}
                                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-12 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error / Success Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                                >
                                    {error}
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"
                                >
                                    {successMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isPending}
                            whileHover={{ scale: isPending ? 1 : 1.02 }}
                            whileTap={{ scale: isPending ? 1 : 0.98 }}
                            className="shimmer relative flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {mode === "login" ? "Sign In" : "Create Account"}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/[0.08]" />
                        <span className="text-xs font-medium text-muted-foreground/50">OR</span>
                        <div className="h-px flex-1 bg-white/[0.08]" />
                    </div>

                    {/* Back to Home */}
                    <Link
                        href="/"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-foreground"
                    >
                        <Globe2 size={18} />
                        Continue as Guest
                    </Link>
                </div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="mt-6 text-center text-xs text-muted-foreground/40"
                >
                    By continuing, you agree to TerraPin&apos;s Terms of Service
                </motion.p>
            </motion.div>
        </div>
    );
}

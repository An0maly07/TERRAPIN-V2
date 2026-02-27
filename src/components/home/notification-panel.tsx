"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    X,
    Check,
    CheckCheck,
    Info,
    AlertTriangle,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Trash2,
} from "lucide-react";
import {
    useNotificationStore,
    type Notification,
} from "@/stores/notifications";
import Link from "next/link";

/* ─── Helpers ─── */

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const typeConfig = {
    info: {
        icon: Info,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        dot: "bg-blue-400",
        glow: "shadow-blue-500/20",
    },
    success: {
        icon: CheckCircle2,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        dot: "bg-green-400",
        glow: "shadow-green-500/20",
    },
    warning: {
        icon: AlertTriangle,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        dot: "bg-amber-400",
        glow: "shadow-amber-500/20",
    },
    error: {
        icon: AlertCircle,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        dot: "bg-red-400",
        glow: "shadow-red-500/20",
    },
};

/* ─── Notification Item ─── */

function NotificationItem({ notification }: { notification: Notification }) {
    const { markAsRead, removeNotification } = useNotificationStore();
    const config = typeConfig[notification.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className={`group relative mb-2 flex gap-3 rounded-xl border p-3.5 transition-all duration-200 ${
                notification.read
                    ? "border-white/[0.04] bg-white/[0.01] opacity-50 hover:opacity-70"
                    : `border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]`
            }`}
        >
            {/* Unread indicator bar */}
            {!notification.read && (
                <div
                    className={`absolute top-3 bottom-3 left-0 w-[3px] rounded-full ${config.dot}`}
                />
            )}

            {/* Icon */}
            <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.border}`}
            >
                {notification.icon ? (
                    <span className="text-base">{notification.icon}</span>
                ) : (
                    <Icon size={16} className={config.color} />
                )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-foreground">
                    {notification.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {notification.message}
                </p>

                <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[0.65rem] text-muted-foreground/50">
                        {timeAgo(notification.timestamp)}
                    </span>
                    {notification.action && (
                        <Link
                            href={notification.action.href}
                            className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold ${config.color} hover:underline`}
                        >
                            {notification.action.label}
                            <ExternalLink size={10} />
                        </Link>
                    )}
                </div>
            </div>

            {/* Hover actions */}
            <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!notification.read && (
                    <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                        aria-label="Mark as read"
                    >
                        <Check size={14} />
                    </button>
                )}
                <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Remove notification"
                >
                    <X size={14} />
                </button>
            </div>
        </motion.div>
    );
}

/* ─── Slide-in Panel (right side drawer) ─── */

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const { notifications, markAllAsRead, clearAll, unreadCount } =
        useNotificationStore();

    const count = unreadCount();

    // Escape key to close
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
                    />

                    {/* Panel — slides from right */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                        }}
                        className="fixed top-0 right-0 bottom-0 z-[201] flex w-full max-w-[420px] flex-col border-l border-white/[0.06] bg-[oklch(0.12_0.025_260)] shadow-2xl shadow-black/60"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                                    <Bell size={18} className="text-white/70" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-foreground">
                                        Notifications
                                    </h2>
                                    {count > 0 && (
                                        <p className="text-xs text-primary">
                                            {count} unread
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                                aria-label="Close notifications"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Actions bar */}
                        {notifications.length > 0 && (
                            <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-2.5">
                                {count > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                                    >
                                        <CheckCheck size={14} />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                                >
                                    <Trash2 size={14} />
                                    Clear all
                                </button>
                            </div>
                        )}

                        {/* Notification list */}
                        <div className="flex-1 overflow-y-auto px-3 py-3">
                            {notifications.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03]">
                                        <Bell
                                            size={28}
                                            className="text-muted-foreground/20"
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground/50">
                                        No notifications
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/30">
                                        You&apos;re all caught up!
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/* ─── Bell Icon with Badge ─── */

export function NotificationBell() {
    const count = useNotificationStore((s) => s.unreadCount());

    return (
        <>
            <Bell size={20} />
            <AnimatePresence>
                {count > 0 && (
                    <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25,
                        }}
                        className="absolute -top-1.5 -right-1.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1.5 text-[0.6rem] font-bold text-white shadow-[0_2px_10px_rgba(244,63,94,0.5)] ring-2 ring-[oklch(0.13_0.02_260)]"
                    >
                        {count > 9 ? "9+" : count}
                    </motion.span>
                )}
            </AnimatePresence>
        </>
    );
}

/* ─── Toast Notifications (fixed bottom-right) ─── */

function ToastItem({ notification }: { notification: Notification }) {
    const { dismissToast, markAsRead } = useNotificationStore();
    const config = typeConfig[notification.type];
    const Icon = config.icon;

    const handleDismiss = () => {
        dismissToast(notification.id);
        markAsRead(notification.id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`pointer-events-auto flex w-[360px] gap-3 rounded-xl border p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl ${config.border} bg-[oklch(0.14_0.025_260/97%)]`}
        >
            {/* Left color bar */}
            <div className={`w-[3px] shrink-0 self-stretch rounded-full ${config.dot}`} />

            {/* Icon */}
            <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.border}`}
            >
                {notification.icon ? (
                    <span className="text-sm">{notification.icon}</span>
                ) : (
                    <Icon size={14} className={config.color} />
                )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-foreground">
                    {notification.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {notification.message}
                </p>
            </div>

            {/* Close */}
            <button
                onClick={handleDismiss}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-white/[0.08] hover:text-foreground"
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}

export function NotificationToastContainer() {
    const toastIds = useNotificationStore((s) => s.toastIds);
    const notifications = useNotificationStore((s) => s.notifications);

    const toasts = toastIds
        .map((id) => notifications.find((n) => n.id === id))
        .filter(Boolean) as Notification[];

    if (toasts.length === 0) return null;

    return (
        <div className="pointer-events-none fixed right-6 bottom-6 z-[300] flex flex-col-reverse gap-3">
            <AnimatePresence mode="popLayout">
                {toasts.slice(0, 3).map((toast) => (
                    <ToastItem key={toast.id} notification={toast} />
                ))}
            </AnimatePresence>
        </div>
    );
}

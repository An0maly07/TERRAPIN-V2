import { create } from "zustand";

export interface Notification {
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    icon?: string;
    action?: {
        label: string;
        href: string;
    };
}

interface NotificationStore {
    notifications: Notification[];
    /** Toasts are short-lived IDs shown as slide-in popups */
    toastIds: string[];
    addNotification: (
        notification: Omit<Notification, "id" | "timestamp" | "read">
    ) => string;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    unreadCount: () => number;
    dismissToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    toastIds: [],

    addNotification: (notification) => {
        const id = crypto.randomUUID();
        set((state) => ({
            notifications: [
                {
                    ...notification,
                    id,
                    timestamp: Date.now(),
                    read: false,
                },
                ...state.notifications,
            ],
            toastIds: [id, ...state.toastIds],
        }));

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
            set((state) => ({
                toastIds: state.toastIds.filter((t) => t !== id),
            }));
        }, 5000);

        return id;
    },

    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
        })),

    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({
                ...n,
                read: true,
            })),
        })),

    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
            toastIds: state.toastIds.filter((t) => t !== id),
        })),

    clearAll: () => set({ notifications: [], toastIds: [] }),

    unreadCount: () => get().notifications.filter((n) => !n.read).length,

    dismissToast: (id) =>
        set((state) => ({
            toastIds: state.toastIds.filter((t) => t !== id),
        })),
}));

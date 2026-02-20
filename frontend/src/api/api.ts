import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_BASE,
});

// Attach JWT token automatically
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Redirect to login on 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) => {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    return api.post<{ access_token: string }>('/api/auth/token', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
};

// ── Notifications ─────────────────────────────────────────────────────────────
export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    channel: string;
    recipient: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    scheduled_at: string | null;
    retry_count: number;
    celery_task_id: string | null;
    error_message: string | null;
}

export interface NotificationEventItem {
    id: string;
    notification_id: string;
    event_type: string;
    previous_status: string | null;
    new_status: string | null;
    message: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

export interface NotificationEventsResponse {
    items: NotificationEventItem[];
}

export interface NotificationsResponse {
    items: NotificationItem[];
    total: number;
}

export interface StatsResponse {
    total: number;
    sent: number;
    failed: number;
    queued: number;
    processing: number;
    scheduled: number;
    pending: number;
    channels: Record<string, number>;
}

export interface GetNotificationsParams {
    limit?: number;
    search?: string;
    status?: string;
    channel?: string;
}

export const getNotifications = (params?: GetNotificationsParams) =>
    api.get<NotificationsResponse>('/api/notifications', { params });
export const getNotification = (id: string) =>
    api.get<NotificationItem>(`/api/notifications/${id}`);
export const getNotificationEvents = (id: string) =>
    api.get<NotificationEventsResponse>(`/api/notifications/${id}/events`);
export const createNotification = (data: Partial<NotificationItem>) =>
    api.post<NotificationItem>('/api/notifications', data);
export const retryNotification = (id: string) =>
    api.post(`/api/notifications/${id}/retry`);
export const deleteNotification = (id: string) =>
    api.delete(`/api/notifications/${id}`);

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = () => api.get<StatsResponse>('/api/stats');

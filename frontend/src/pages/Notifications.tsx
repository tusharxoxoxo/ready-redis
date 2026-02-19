import { useEffect, useState, useCallback, type ChangeEvent } from 'react';
import { getNotifications, retryNotification } from '../api/api';
import type { NotificationItem } from '../api/api';
import { StatusBadge, ChannelBadge } from '../components/StatusBadge';
import NotificationDetail from '../components/NotificationDetail';
import { useNavigate } from 'react-router-dom';

interface Toast {
    id: number;
    msg: string;
    type: string;
}

function ToastList({ toasts }: { toasts: Toast[] }) {
    return (
        <div className="toast-wrap">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
            ))}
        </div>
    );
}

function fmt(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function Notifications() {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [channelFilter, setChannelFilter] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const navigate = useNavigate();

    const addToast = (msg: string, type = 'success') => {
        const id = Date.now();
        setToasts((p) => [...p, { id, msg, type }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
    };

    const fetchData = useCallback(async () => {
        try {
            const params: Record<string, string | number> = { limit: 100 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (channelFilter) params.channel = channelFilter;
            const res = await getNotifications(params);
            setItems(res.data.items);
            setTotal(res.data.total);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, channelFilter]);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 10000);
        return () => clearInterval(id);
    }, [fetchData]);

    const handleAction = (msg: string, type: 'success' | 'error') => {
        addToast(msg, type);
        fetchData();
    };

    const handleQuickRetry = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await retryNotification(id);
            addToast('Re-queued!', 'success');
            fetchData();
        } catch (err) {
            const e = err as { response?: { data?: { detail?: string } } };
            addToast(e.response?.data?.detail || 'Retry failed', 'error');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">{total} total · auto-refreshes every 10s</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/create')}>
                    ✉️ Send Notification
                </button>
            </div>

            <div className="filters">
                <input
                    className="search-input"
                    type="search"
                    placeholder="🔍 Search title, recipient, message…"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {['pending', 'queued', 'processing', 'sent', 'failed', 'scheduled', 'cancelled'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select
                    className="filter-select"
                    value={channelFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setChannelFilter(e.target.value)}
                >
                    <option value="">All Channels</option>
                    <option value="email">📧 Email</option>
                    <option value="sms">📱 SMS</option>
                    <option value="push">🔔 Push</option>
                </select>
                <button className="btn btn-ghost" onClick={fetchData}>🔃</button>
            </div>

            <div className="card">
                <div className="table-wrap">
                    {loading ? (
                        <div className="empty-state loading-pulse"><p>Loading…</p></div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p>No notifications found.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Channel</th>
                                    <th>Recipient</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((n) => (
                                    <tr key={n.id} onClick={() => setSelectedId(n.id)}>
                                        <td style={{ maxWidth: 200 }}>
                                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                                        </td>
                                        <td><ChannelBadge channel={n.channel} /></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{n.recipient}</td>
                                        <td><StatusBadge status={n.status} /></td>
                                        <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{n.priority}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmt(n.created_at)}</td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            {(n.status === 'failed' || n.status === 'cancelled') && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={(e) => handleQuickRetry(e, n.id)}
                                                >
                                                    🔃
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {selectedId !== null && (
                <NotificationDetail
                    id={selectedId}
                    onClose={() => setSelectedId(null)}
                    onAction={handleAction}
                />
            )}

            <ToastList toasts={toasts} />
        </div>
    );
}

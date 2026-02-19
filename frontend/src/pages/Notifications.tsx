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
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.type === 'success' ? (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2.5 8l4 4 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                        </svg>
                    )}
                    {t.msg}
                </div>
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
                <div className="page-heading">
                    <span className="page-eyebrow">Records</span>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">{total} total · auto-refreshes every 10s</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/create')}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                    </svg>
                    Send Notification
                </button>
            </div>

            <div className="filters">
                <input
                    className="search-input"
                    type="search"
                    placeholder="Search title, recipient, message…"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                >
                    <option value="">All statuses</option>
                    {['pending', 'queued', 'processing', 'sent', 'failed', 'scheduled', 'cancelled'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select
                    className="filter-select"
                    value={channelFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setChannelFilter(e.target.value)}
                >
                    <option value="">All channels</option>
                    <option value="email">email</option>
                    <option value="sms">sms</option>
                    <option value="push">push</option>
                </select>
                <button className="btn btn-ghost btn-icon" onClick={fetchData} title="Refresh">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round" />
                        <path d="M8 1v4l2.5-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <div className="card">
                <div className="table-wrap">
                    {loading ? (
                        <div>
                            <div className="loading-bar" style={{ borderRadius: 0, marginBottom: 0 }} />
                            <div className="empty-state"><p>Loading…</p></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <svg className="empty-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <path d="M20 5A10 10 0 0 1 30 15v7l3 5H7l3-5v-7A10 10 0 0 1 20 5Z" />
                                <path d="M16 32a4 4 0 0 0 8 0" />
                            </svg>
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
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((n) => (
                                    <tr key={n.id} onClick={() => setSelectedId(n.id)}>
                                        <td style={{ maxWidth: 220 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '0.825rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>{n.title}</div>
                                        </td>
                                        <td><ChannelBadge channel={n.channel} /></td>
                                        <td className="td-mono">{n.recipient}</td>
                                        <td><StatusBadge status={n.status} /></td>
                                        <td className="td-mono" style={{ textTransform: 'capitalize' }}>{n.priority}</td>
                                        <td className="td-mono">{fmt(n.created_at)}</td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            {(n.status === 'failed' || n.status === 'cancelled') && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={(e) => handleQuickRetry(e, n.id)}
                                                    title="Retry"
                                                >
                                                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round" />
                                                        <path d="M8 1v4l2.5-2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Retry
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

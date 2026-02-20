import { useEffect, useState, useRef } from 'react';
import { getNotification, getNotificationEvents, retryNotification, deleteNotification } from '../api/api';
import type { NotificationItem, NotificationEventItem } from '../api/api';
import { StatusBadge, ChannelBadge } from './StatusBadge';

function fmt(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

interface NotificationDetailProps {
    id: string;
    onClose: () => void;
    onAction: (msg: string, type: 'success' | 'error') => void;
}

export default function NotificationDetail({ id, onClose, onAction }: NotificationDetailProps) {
    const [notif, setNotif] = useState<NotificationItem | null>(null);
    const [events, setEvents] = useState<NotificationEventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const [notifRes, eventsRes] = await Promise.all([
                    getNotification(id),
                    getNotificationEvents(id),
                ]);
                setNotif(notifRes.data);
                setEvents(eventsRes.data.items);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleRetry = async () => {
        setActionLoading(true);
        try {
            await retryNotification(id);
            onAction('Notification re-queued for delivery', 'success');
            onClose();
        } catch (e) {
            const err = e as { response?: { data?: { detail?: string } } };
            onAction(err.response?.data?.detail || 'Retry failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this notification? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            await deleteNotification(id);
            onAction('Notification deleted', 'success');
            onClose();
        } catch {
            onAction('Delete failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleOverlayClick = (e: { target: EventTarget | null }) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
            <div className="modal">
                <div className="modal-header">
                    <div>
                        <div className="modal-id">ID #{id}</div>
                        <div className="modal-title">Notification Detail</div>
                    </div>
                    <button className="close-btn" onClick={onClose} title="Close">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div>
                            <div className="loading-bar" />
                            <div className="empty-state"><p>Loading…</p></div>
                        </div>
                    ) : notif ? (
                        <>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <div className="detail-label">Status</div>
                                    <div className="detail-value"><StatusBadge status={notif.status} /></div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Channel</div>
                                    <div className="detail-value"><ChannelBadge channel={notif.channel} /></div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Recipient</div>
                                    <div className="detail-value mono">{notif.recipient}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Priority</div>
                                    <div className="detail-value" style={{
                                        textTransform: 'capitalize',
                                        color: {
                                            low: 'var(--green)',
                                            normal: 'var(--blue)',
                                            high: 'var(--yellow)',
                                            critical: 'var(--red)',
                                        }[notif.priority] ?? 'var(--text)',
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: '0.8rem',
                                    }}>
                                        {notif.priority}
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Created</div>
                                    <div className="detail-value mono">{fmt(notif.created_at)}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Updated</div>
                                    <div className="detail-value mono">{fmt(notif.updated_at)}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Scheduled At</div>
                                    <div className="detail-value mono">{fmt(notif.scheduled_at)}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Retry Count</div>
                                    <div className="detail-value mono">{notif.retry_count}</div>
                                </div>
                            </div>

                            <div className="detail-item" style={{ marginBottom: 12 }}>
                                <div className="detail-label" style={{ marginBottom: 6 }}>Title</div>
                                <div className="message-box" style={{ fontWeight: 600, color: 'var(--text)' }}>
                                    {notif.title}
                                </div>
                            </div>

                            <div className="detail-item" style={{ marginBottom: 12 }}>
                                <div className="detail-label" style={{ marginBottom: 6 }}>Message</div>
                                <div className="message-box">{notif.message}</div>
                            </div>

                            {notif.celery_task_id && (
                                <div className="detail-item" style={{ marginBottom: 12 }}>
                                    <div className="detail-label" style={{ marginBottom: 6 }}>Celery Task ID</div>
                                    <code style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: '0.7rem',
                                        color: 'var(--text-3)',
                                        wordBreak: 'break-all',
                                        display: 'block',
                                        lineHeight: 1.5,
                                    }}>
                                        {notif.celery_task_id}
                                    </code>
                                </div>
                            )}

                            {notif.error_message && (
                                <div className="error-box">
                                    <strong>Error:</strong> {notif.error_message}
                                </div>
                            )}

                            <div className="detail-item" style={{ marginTop: 12 }}>
                                <div className="detail-label" style={{ marginBottom: 6 }}>Event Timeline</div>
                                {events.length === 0 ? (
                                    <div className="message-box">No events recorded.</div>
                                ) : (
                                    <div className="message-box">
                                        {events.map((ev) => (
                                            <div key={ev.id} style={{ marginBottom: 8 }}>
                                                <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                                                    {fmt(ev.created_at)}
                                                </div>
                                                <div>
                                                    {ev.event_type}
                                                    {ev.previous_status ? ` (${ev.previous_status} → ${ev.new_status})` : ''}
                                                </div>
                                                {ev.message && <div style={{ color: 'var(--red)' }}>{ev.message}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state"><p>Notification not found.</p></div>
                    )}
                </div>

                <div className="modal-footer">
                    {(notif?.status === 'failed' || notif?.status === 'cancelled') && (
                        <button
                            className="btn btn-success btn-sm"
                            onClick={handleRetry}
                            disabled={actionLoading}
                        >
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round" />
                                <path d="M8 1v4l2.5-2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Retry
                        </button>
                    )}
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleDelete}
                        disabled={actionLoading}
                    >
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 4h10M5.5 4V2.5h5V4" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="3.5" y="4" width="9" height="9" rx="1" />
                            <path d="M6.5 7v3.5M9.5 7v3.5" strokeLinecap="round" />
                        </svg>
                        Delete
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

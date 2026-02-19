import { useEffect, useState, useRef } from 'react';
import { getNotification, retryNotification, deleteNotification } from '../api/api';
import { StatusBadge, ChannelBadge } from './StatusBadge';

function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
}

export default function NotificationDetail({ id, onClose, onAction }) {
    const [notif, setNotif] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const overlayRef = useRef(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getNotification(id);
                setNotif(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleRetry = async () => {
        setActionLoading(true);
        try {
            await retryNotification(id);
            onAction('Notification re-queued for delivery!', 'success');
            onClose();
        } catch (e) {
            onAction(e.response?.data?.detail || 'Retry failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this notification?')) return;
        setActionLoading(true);
        try {
            await deleteNotification(id);
            onAction('Notification deleted.', 'success');
            onClose();
        } catch (e) {
            onAction('Delete failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
            <div className="modal">
                <div className="modal-header">
                    <span className="modal-title">🔍 Notification Detail</span>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="empty-state loading-pulse"><p>Loading…</p></div>
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
                                    <div className="detail-value">{notif.recipient}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Priority</div>
                                    <div className="detail-value" style={{ textTransform: 'capitalize' }}>{notif.priority}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Created</div>
                                    <div className="detail-value">{fmt(notif.created_at)}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Updated</div>
                                    <div className="detail-value">{fmt(notif.updated_at)}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Scheduled At</div>
                                    <div className="detail-value">{fmt(notif.scheduled_at)}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Retry Count</div>
                                    <div className="detail-value">{notif.retry_count}</div>
                                </div>
                            </div>

                            <div className="detail-item">
                                <div className="detail-label">Title</div>
                                <div className="message-box">{notif.title}</div>
                            </div>

                            <div className="detail-item" style={{ marginTop: 12 }}>
                                <div className="detail-label">Message</div>
                                <div className="message-box">{notif.message}</div>
                            </div>

                            {notif.celery_task_id && (
                                <div className="detail-item" style={{ marginTop: 12 }}>
                                    <div className="detail-label">Celery Task ID</div>
                                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.celery_task_id}</code>
                                </div>
                            )}

                            {notif.error_message && (
                                <div className="error-box">⚠️ {notif.error_message}</div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state"><p>Notification not found.</p></div>
                    )}
                </div>

                <div className="modal-footer">
                    {notif?.status === 'failed' || notif?.status === 'cancelled' ? (
                        <button
                            className="btn btn-success btn-sm"
                            onClick={handleRetry}
                            disabled={actionLoading}
                        >
                            🔃 Retry
                        </button>
                    ) : null}
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleDelete}
                        disabled={actionLoading}
                    >
                        🗑 Delete
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

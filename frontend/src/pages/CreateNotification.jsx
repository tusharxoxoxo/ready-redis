import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '../api/api';

function Toast({ toasts }) {
    return (
        <div className="toast-wrap">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
            ))}
        </div>
    );
}

const INITIAL = {
    title: '',
    message: '',
    channel: 'email',
    recipient: '',
    priority: 'normal',
    scheduled_at: '',
};

export default function CreateNotification() {
    const [form, setForm] = useState(INITIAL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toasts, setToasts] = useState([]);
    const navigate = useNavigate();

    const addToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts((p) => [...p, { id, msg, type }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = { ...form };
            if (!payload.scheduled_at) delete payload.scheduled_at;
            else payload.scheduled_at = new Date(payload.scheduled_at).toISOString();
            await createNotification(payload);
            addToast('✅ Notification queued successfully!', 'success');
            setForm(INITIAL);
            setTimeout(() => navigate('/notifications'), 1500);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(
                Array.isArray(detail)
                    ? detail.map((d) => d.msg).join(', ')
                    : detail || 'Failed to send notification'
            );
        } finally {
            setLoading(false);
        }
    };

    const recipientPlaceholder =
        form.channel === 'email' ? 'user@example.com' :
            form.channel === 'sms' ? '+1234567890' :
                'device-token or user-id';

    return (
        <div style={{ maxWidth: 680 }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Send Notification</h1>
                    <p className="page-subtitle">Create and queue a new notification for delivery</p>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    {error && (
                        <div className="login-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Channel *</label>
                                <select className="form-control" name="channel" value={form.channel} onChange={handleChange} required>
                                    <option value="email">📧 Email</option>
                                    <option value="sms">📱 SMS</option>
                                    <option value="push">🔔 Push</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select className="form-control" name="priority" value={form.priority} onChange={handleChange}>
                                    <option value="low">🟢 Low</option>
                                    <option value="normal">🔵 Normal</option>
                                    <option value="high">🟠 High</option>
                                    <option value="critical">🔴 Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Recipient *</label>
                            <input
                                className="form-control"
                                name="recipient"
                                value={form.recipient}
                                onChange={handleChange}
                                placeholder={recipientPlaceholder}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input
                                className="form-control"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Notification title"
                                maxLength={255}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Message *</label>
                            <textarea
                                className="form-control"
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Notification body / content…"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Schedule At (optional)</label>
                            <input
                                className="form-control"
                                type="datetime-local"
                                name="scheduled_at"
                                value={form.scheduled_at}
                                onChange={handleChange}
                            />
                            <span className="form-error" style={{ color: 'var(--text-muted)' }}>
                                Leave blank to send immediately
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? '🔄 Sending…' : '🚀 Send Notification'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => navigate('/notifications')}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Toast toasts={toasts} />
        </div>
    );
}

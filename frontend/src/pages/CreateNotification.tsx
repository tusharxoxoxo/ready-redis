import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '../api/api';

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

interface FormState {
    title: string;
    message: string;
    channel: string;
    recipient: string;
    priority: string;
    scheduled_at: string;
}

const INITIAL: FormState = {
    title: '',
    message: '',
    channel: 'email',
    recipient: '',
    priority: 'normal',
    scheduled_at: '',
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    email: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
            <path d="M1.5 5l6.5 5 6.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    sms: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="1" width="8" height="14" rx="2" />
            <path d="M7 12h2" strokeLinecap="round" />
        </svg>
    ),
    push: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2A5 5 0 0 1 13 7v3l1.5 2.5H1.5L3 10V7A5 5 0 0 1 8 2Z" />
            <path d="M6 13.5a2 2 0 0 0 4 0" />
        </svg>
    ),
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'var(--green)',
    normal: 'var(--blue)',
    high: 'var(--yellow)',
    critical: 'var(--red)',
};

export default function CreateNotification() {
    const [form, setForm] = useState<FormState>(INITIAL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const navigate = useNavigate();

    const addToast = (msg: string, type = 'success') => {
        const id = Date.now();
        setToasts((p) => [...p, { id, msg, type }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload: Partial<FormState> = { ...form };
            if (!payload.scheduled_at) {
                delete payload.scheduled_at;
            } else {
                payload.scheduled_at = new Date(payload.scheduled_at).toISOString();
            }
            await createNotification(payload);
            addToast('Notification queued successfully', 'success');
            setForm(INITIAL);
            setTimeout(() => navigate('/notifications'), 1400);
        } catch (err) {
            const e = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
            const detail = e.response?.data?.detail;
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
            form.channel === 'sms' ? '+1 234 567 8900' :
                'device-token or user-id';

    return (
        <div style={{ maxWidth: 700 }}>
            <div className="page-header">
                <div className="page-heading">
                    <span className="page-eyebrow">Compose</span>
                    <h1 className="page-title">Send Notification</h1>
                    <p className="page-subtitle">Create and queue a new notification for delivery</p>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 20 }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="8" cy="8" r="6.5" />
                                <path d="M8 5v4M8 11v.5" strokeLinecap="round" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <div className="form-section-title">Delivery</div>

                            {/* Channel selector as visual toggle */}
                            <div className="form-group">
                                <label className="form-label">
                                    Channel <span className="required">*</span>
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['email', 'sms', 'push'] as const).map((ch) => (
                                        <button
                                            key={ch}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, channel: ch }))}
                                            style={{
                                                flex: 1,
                                                padding: '10px 12px',
                                                borderRadius: 'var(--r-sm)',
                                                border: `1px solid ${form.channel === ch ? 'var(--amber)' : 'var(--border)'}`,
                                                background: form.channel === ch ? 'var(--amber-dim)' : 'var(--bg3)',
                                                color: form.channel === ch ? 'var(--amber)' : 'var(--text-2)',
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: '0.72rem',
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                                cursor: 'pointer',
                                                transition: 'all 0.18s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {CHANNEL_ICONS[ch]}
                                            {ch}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Recipient <span className="required">*</span>
                                </label>
                                <input
                                    className="form-control"
                                    name="recipient"
                                    value={form.recipient}
                                    onChange={handleChange}
                                    placeholder={recipientPlaceholder}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="form-section-title">Content</div>

                            <div className="form-group">
                                <label className="form-label">
                                    Title <span className="required">*</span>
                                </label>
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
                                <label className="form-label">
                                    Message <span className="required">*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Notification body content…"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="form-section-title">Options</div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select
                                        className="form-control"
                                        name="priority"
                                        value={form.priority}
                                        onChange={handleChange}
                                        style={{ borderLeftColor: PRIORITY_COLORS[form.priority], borderLeftWidth: 2 }}
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Schedule At</label>
                                    <input
                                        className="form-control"
                                        type="datetime-local"
                                        name="scheduled_at"
                                        value={form.scheduled_at}
                                        onChange={handleChange}
                                    />
                                    <span className="form-hint">Leave blank to send immediately</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'spin-dot 0.8s linear infinite' }}>
                                            <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                                        </svg>
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M2 8l12-6-5 12-2-4-5-2Z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Send Notification
                                    </>
                                )}
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

            <ToastList toasts={toasts} />
        </div>
    );
}

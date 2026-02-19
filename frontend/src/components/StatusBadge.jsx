const STATUS_MAP = {
    sent: { cls: 'badge-sent', icon: '✅' },
    pending: { cls: 'badge-pending', icon: '⏳' },
    failed: { cls: 'badge-failed', icon: '❌' },
    queued: { cls: 'badge-queued', icon: '🔄' },
    processing: { cls: 'badge-processing', icon: '⚡' },
    scheduled: { cls: 'badge-scheduled', icon: '📅' },
    cancelled: { cls: 'badge-cancelled', icon: '🚫' },
};

const CHANNEL_MAP = {
    email: { cls: 'badge-email', icon: '📧' },
    sms: { cls: 'badge-sms', icon: '📱' },
    push: { cls: 'badge-push', icon: '🔔' },
};

export function StatusBadge({ status }) {
    const { cls, icon } = STATUS_MAP[status] || { cls: '', icon: '•' };
    return (
        <span className={`badge ${cls}`}>
            {icon} {status}
        </span>
    );
}

export function ChannelBadge({ channel }) {
    const { cls, icon } = CHANNEL_MAP[channel] || { cls: '', icon: '•' };
    return (
        <span className={`badge ${cls}`}>
            {icon} {channel}
        </span>
    );
}

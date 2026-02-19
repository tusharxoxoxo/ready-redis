interface BadgeEntry {
    cls: string;
    icon: string;
}

const STATUS_MAP: Record<string, BadgeEntry> = {
    sent: { cls: 'badge-sent', icon: '✅' },
    pending: { cls: 'badge-pending', icon: '⏳' },
    failed: { cls: 'badge-failed', icon: '❌' },
    queued: { cls: 'badge-queued', icon: '🔄' },
    processing: { cls: 'badge-processing', icon: '⚡' },
    scheduled: { cls: 'badge-scheduled', icon: '📅' },
    cancelled: { cls: 'badge-cancelled', icon: '🚫' },
};

const CHANNEL_MAP: Record<string, BadgeEntry> = {
    email: { cls: 'badge-email', icon: '📧' },
    sms: { cls: 'badge-sms', icon: '📱' },
    push: { cls: 'badge-push', icon: '🔔' },
};

interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const { cls, icon } = STATUS_MAP[status] ?? { cls: '', icon: '•' };
    return (
        <span className={`badge ${cls}`}>
            {icon} {status}
        </span>
    );
}

interface ChannelBadgeProps {
    channel: string;
}

export function ChannelBadge({ channel }: ChannelBadgeProps) {
    const { cls, icon } = CHANNEL_MAP[channel] ?? { cls: '', icon: '•' };
    return (
        <span className={`badge ${cls}`}>
            {icon} {channel}
        </span>
    );
}

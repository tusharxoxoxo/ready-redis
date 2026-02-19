interface BadgeEntry {
    cls: string;
    dot: string;
    label: string;
}

const STATUS_MAP: Record<string, BadgeEntry> = {
    sent: { cls: 'badge-sent', dot: 'sent', label: 'sent' },
    pending: { cls: 'badge-pending', dot: 'pending', label: 'pending' },
    failed: { cls: 'badge-failed', dot: 'failed', label: 'failed' },
    queued: { cls: 'badge-queued', dot: 'queued', label: 'queued' },
    processing: { cls: 'badge-processing', dot: 'processing', label: 'processing' },
    scheduled: { cls: 'badge-scheduled', dot: 'scheduled', label: 'scheduled' },
    cancelled: { cls: 'badge-cancelled', dot: 'cancelled', label: 'cancelled' },
};

const CHANNEL_MAP: Record<string, BadgeEntry> = {
    email: { cls: 'badge-email', dot: '', label: 'email' },
    sms: { cls: 'badge-sms', dot: '', label: 'sms' },
    push: { cls: 'badge-push', dot: '', label: 'push' },
};

interface StatusBadgeProps { status: string; }

export function StatusBadge({ status }: StatusBadgeProps) {
    const entry = STATUS_MAP[status] ?? { cls: '', dot: '', label: status };
    return (
        <span className={`badge ${entry.cls}`}>
            <span className={`badge-dot ${entry.dot}`} />
            {entry.label}
        </span>
    );
}

interface ChannelBadgeProps { channel: string; }

export function ChannelBadge({ channel }: ChannelBadgeProps) {
    const entry = CHANNEL_MAP[channel] ?? { cls: '', dot: '', label: channel };
    return (
        <span className={`badge ${entry.cls}`}>
            {entry.label}
        </span>
    );
}

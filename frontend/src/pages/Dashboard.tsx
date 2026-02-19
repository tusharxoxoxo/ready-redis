import { useEffect, useState, useCallback } from 'react';
import { getStats } from '../api/api';
import type { StatsResponse } from '../api/api';

type NumericStatKey = 'total' | 'sent' | 'failed' | 'queued' | 'processing' | 'scheduled' | 'pending';

interface StatConfig {
    key: NumericStatKey;
    label: string;
    cls: string;
    icon: React.ReactNode;
}

const STAT_CONFIG: StatConfig[] = [
    {
        key: 'total', label: 'Total', cls: 'total',
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1.5" y="1.5" width="5" height="5" rx="0.5" />
                <rect x="9.5" y="1.5" width="5" height="5" rx="0.5" />
                <rect x="1.5" y="9.5" width="5" height="5" rx="0.5" />
                <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
            </svg>
        ),
    },
    {
        key: 'sent', label: 'Sent', cls: 'sent',
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        key: 'queued', label: 'Queued', cls: 'queued',
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="6.5" />
            </svg>
        ),
    },
    {
        key: 'processing', label: 'Processing', cls: 'queued',
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: 'failed', label: 'Failed', cls: 'failed',
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M10.5 5.5l-5 5M5.5 5.5l5 5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: 'scheduled', label: 'Scheduled', cls: 'scheduled',
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" />
                <path d="M5 2v3M11 2v3M2 7h12" strokeLinecap="round" />
            </svg>
        ),
    },
];

export default function Dashboard() {
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await getStats();
            setStats(res.data);
            setLastUpdated(new Date());
        } catch (e) {
            console.error('Failed to fetch stats', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const total = stats?.total ?? 0;
    const channels = stats?.channels ?? {};
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

    const channelItems = [
        { label: 'Email', key: 'email', cls: 'bar-email' },
        { label: 'SMS', key: 'sms', cls: 'bar-sms' },
        { label: 'Push', key: 'push', cls: 'bar-push' },
    ];

    return (
        <div>
            <div className="page-header">
                <div className="page-heading">
                    <span className="page-eyebrow">Overview</span>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()} · ` : ''}
                        Auto-refreshes every 10s
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={fetchStats} title="Refresh metrics">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round" />
                        <path d="M8 1v4l2.5-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Refresh
                </button>
            </div>

            {loading ? (
                <div>
                    <div className="loading-bar" />
                    <div className="empty-state">
                        <p>Loading metrics…</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="stat-grid">
                        {STAT_CONFIG.map(({ key, label, cls, icon }) => (
                            <div key={key} className={`stat-card ${cls}`}>
                                <div className="stat-header">
                                    <div className="stat-label">{label}</div>
                                    <div className="stat-icon-wrap">{icon}</div>
                                </div>
                                <div className="stat-value animate-count">
                                    {stats?.[key] ?? 0}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="channels-card">
                            <div className="channels-header">
                                <span className="channels-title">Channel Distribution</span>
                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--text-3)' }}>
                                    {total} total
                                </span>
                            </div>
                            <div className="channel-bar-group">
                                {channelItems.map(({ label, key, cls }) => {
                                    const count = channels[key] || 0;
                                    const p = pct(count);
                                    return (
                                        <div key={key} className="channel-bar-item">
                                            <div className="channel-bar-label">
                                                <span className="ch-name">{label}</span>
                                                <span className="channel-bar-meta">{count} · {p}%</span>
                                            </div>
                                            <div className="channel-bar-track">
                                                <div
                                                    className={`channel-bar-fill ${cls}`}
                                                    style={{ width: `${p}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {total === 0 && (
                        <div style={{ marginTop: 20 }}>
                            <div className="empty-state">
                                <svg className="empty-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <rect x="4" y="4" width="32" height="32" rx="4" />
                                    <path d="M20 12v8l6 6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p>No notifications yet. <a href="/create">Send your first one</a></p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

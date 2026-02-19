import { useEffect, useState, useCallback } from 'react';
import { getStats } from '../api/api';

const STAT_CONFIG = [
    { key: 'total', label: 'Total', icon: '📊', cls: 'total' },
    { key: 'sent', label: 'Sent', icon: '✅', cls: 'sent' },
    { key: 'queued', label: 'Queued', icon: '🔄', cls: 'queued' },
    { key: 'processing', label: 'Processing', icon: '⚡', cls: 'queued' },
    { key: 'failed', label: 'Failed', icon: '❌', cls: 'failed' },
    { key: 'scheduled', label: 'Scheduled', icon: '📅', cls: 'scheduled' },
];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await getStats();
            setStats(res.data);
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

    const total = stats?.total || 0;
    const channels = stats?.channels || {};

    const pct = (n) => total === 0 ? 0 : Math.round((n / total) * 100);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Live notification metrics · auto-refreshes every 10s</p>
                </div>
                <button className="btn btn-ghost" onClick={fetchStats}>🔃 Refresh</button>
            </div>

            {loading ? (
                <div className="empty-state loading-pulse">
                    <div className="empty-icon">📡</div>
                    <p>Loading metrics…</p>
                </div>
            ) : (
                <>
                    <div className="stat-grid">
                        {STAT_CONFIG.map(({ key, label, icon, cls }) => (
                            <div key={key} className={`stat-card ${cls}`}>
                                <div className="stat-icon">{icon}</div>
                                <div className="stat-label">{label}</div>
                                <div className="stat-value">{stats?.[key] ?? 0}</div>
                            </div>
                        ))}
                    </div>

                    <div className="card channels-card">
                        <div className="channels-title">📡 Channel Distribution</div>
                        <div className="channel-bar-group">
                            {[
                                { label: '📧 Email', key: 'email', cls: 'bar-email' },
                                { label: '📱 SMS', key: 'sms', cls: 'bar-sms' },
                                { label: '🔔 Push', key: 'push', cls: 'bar-push' },
                            ].map(({ label, key, cls }) => (
                                <div key={key} className="channel-bar-item">
                                    <div className="channel-bar-label">
                                        <span>{label}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{channels[key] || 0} ({pct(channels[key] || 0)}%)</span>
                                    </div>
                                    <div className="channel-bar-track">
                                        <div
                                            className={`channel-bar-fill ${cls}`}
                                            style={{ width: `${pct(channels[key] || 0)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {total === 0 && (
                        <div style={{ marginTop: 24 }}>
                            <div className="empty-state">
                                <div className="empty-icon">🚀</div>
                                <p>No notifications yet. <a href="/create" style={{ color: 'var(--accent2)' }}>Send your first one!</a></p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

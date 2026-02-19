import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            const e = err as { response?: { data?: { detail?: string } } };
            setError(e.response?.data?.detail || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-wrap">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo-mark">
                            <div className="login-logo-box">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect x="3" y="3" width="6" height="6" fill="#0b0d11" />
                                    <rect x="11" y="3" width="6" height="6" fill="#0b0d11" />
                                    <rect x="3" y="11" width="6" height="6" fill="#0b0d11" />
                                    <rect x="11" y="11" width="6" height="6" fill="#0b0d11" opacity="0.5" />
                                </svg>
                            </div>
                            <span className="login-brand">NotifyHub</span>
                        </div>
                        <h1 className="login-title">Sign in</h1>
                        <p className="login-subtitle">Access the notification management dashboard</p>
                    </div>

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
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                className="form-control"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                                autoFocus
                                autoComplete="username"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 24 }}>
                            <label className="form-label">Password</label>
                            <input
                                className="form-control"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary login-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'spin-dot 0.8s linear infinite' }}>
                                        <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                                    </svg>
                                    Authenticating…
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M10 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3" strokeLinecap="round" />
                                        <path d="M6.5 10.5l3-2.5-3-2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M9.5 8H2" strokeLinecap="round" />
                                    </svg>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: "'IBM Plex Mono', monospace" }}>
                        default: <code>admin</code> / <code>admin123</code>
                    </p>
                </div>
            </div>
        </div>
    );
}

import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U';

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="2" width="5" height="5" fill="#ffffff" />
                        <rect x="9" y="2" width="5" height="5" fill="#ffffff" />
                        <rect x="2" y="9" width="5" height="5" fill="#ffffff" />
                        <rect x="9" y="9" width="5" height="5" fill="#ffffff" opacity="0.6" />
                    </svg>
                </div>
                <div className="brand-text">
                    <span className="brand-name">NotifyHub</span>
                    <span className="brand-sub">Dashboard</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Navigation</div>

                <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
                        <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
                        <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
                        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
                    </svg>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6v2.5l1 2H2.5l1-2V6A4.5 4.5 0 0 1 8 1.5Z" />
                        <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
                    </svg>
                    <span>Notifications</span>
                </NavLink>

                <NavLink to="/create" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="2" width="12" height="12" rx="2" />
                        <path d="M8 5.5v5M5.5 8h5" strokeLinecap="round" />
                    </svg>
                    <span>Send Notification</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="user-chip">
                    <div className="user-avatar">{initials}</div>
                    <span className="user-name">{user?.username}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10.5 5V3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2" strokeLinecap="round" />
                        <path d="M6.5 8h8M12 5.5l2.5 2.5L12 10.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text">Sign out</span>
                </button>
            </div>
        </aside>
    );
}

import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span>🔔</span>
                <span>NotifyHub</span>
            </div>

            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="icon">📊</span>
                <span>Dashboard</span>
            </NavLink>

            <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="icon">📋</span>
                <span>Notifications</span>
            </NavLink>

            <NavLink to="/create" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="icon">✉️</span>
                <span>Send Notification</span>
            </NavLink>

            <div className="sidebar-footer">
                <div style={{ padding: '8px 12px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    👤 {user?.username}
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    🚪 <span className="text">Sign out</span>
                </button>
            </div>
        </aside>
    );
}

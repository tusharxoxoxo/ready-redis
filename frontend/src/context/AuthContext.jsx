import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) {
            // Decode username from JWT payload (middle segment)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ username: payload.sub });
            } catch {
                setUser(null);
            }
        } else {
            setUser(null);
        }
    }, [token]);

    const login = async (username, password) => {
        const res = await apiLogin(username, password);
        const newToken = res.data.access_token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        return newToken;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

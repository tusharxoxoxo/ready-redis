import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin } from '../api/api';

interface User {
    username: string;
}

interface AuthContextValue {
    token: string | null;
    user: User | null;
    login: (username: string, password: string) => Promise<string>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (token) {
            // Decode username from JWT payload (middle segment)
            try {
                const payload = JSON.parse(atob(token.split('.')[1])) as { sub: string };
                setUser({ username: payload.sub });
            } catch {
                setUser(null);
            }
        } else {
            setUser(null);
        }
    }, [token]);

    const login = async (username: string, password: string): Promise<string> => {
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

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

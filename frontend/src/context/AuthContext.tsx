import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getToken, getUser, clearAuthData, setupTokenExpiryCheck, isTokenExpired } from '../utils/tokenManager';
import { authServices } from '../services/apiServices';
import { decodeToken } from '../utils/tokenManager';

interface User {
    user_id: string;
    nama: string;
    email: string;
    role: string;
    departemen: string;
    jabatan: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    checkTokenExpiry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state dari localStorage
    useEffect(() => {
        const initAuth = () => {
            const storedToken = getToken();
            const storedUser = getUser();

            if (storedToken && !isTokenExpired(storedToken)) {
                setToken(storedToken);
                setUser(storedUser);
            } else {
                clearAuthData();
                setToken(null);
                setUser(null);
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    useEffect(() => {
        if (token) {
            const cleanup = setupTokenExpiryCheck(() => {
                setUser(null);
                setToken(null);
                clearAuthData();
            });

            return cleanup;
        }
    }, [token]);

    const login = async (email: string, password: string) => {
        try {
            const response = await authServices.login(email, password);

            const decoded = decodeToken(response.token);

            const userData = {
            ...response.user,
            user_id: decoded?.id 
            };

            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(response.token);
            setUser(userData);
            
            return userData;
        } catch (error) {
            clearAuthData();
            setUser(null);
            setToken(null);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authServices.logout();
        } finally {
            setUser(null);
            setToken(null);
            clearAuthData();
        }
    };

    const refreshToken = async () => {
        try {
            const response = await authServices.refreshToken();
            setToken(response.token);
        } catch (error) {
            setUser(null);
            setToken(null);
            throw error;
        }
    };

    const checkTokenExpiry = () => {
        if (token && isTokenExpired(token)) {
            logout();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!token && !isTokenExpired(token),
                login,
                logout,
                refreshToken,
                checkTokenExpiry,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Hook untuk menggunakan auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth harus digunakan dalam AuthProvider');
    }
    return context;
}

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/Config";

interface AuthContextType {
    currentUser: any;
    userProfile: any;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<any>;
    register: (userData: any) => Promise<any>;
    logout: () => Promise<any>;
    getAccessToken: () => Promise<string | null>;
    refreshUserProfile: () => Promise<any>;
    sendOTP: (phone: string) => Promise<any>;
    verifyOTP: (phone: string, otp: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
                const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

                if (token && storedUser) {
                    const user = JSON.parse(storedUser);
                    setCurrentUser(user);
                    // Verify token and fetch fresh profile
                    await fetchMe(token);
                }
            } catch (err) {
                console.warn("Auth initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const fetchMe = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCurrentUser(data.user);
                    setUserProfile(data.user); // Assuming user profile is included in me
                    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
                }
            } else {
                // Token might be invalid
                await logout();
            }
        } catch (e) {
            console.warn("Error fetching current user", e);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                console.log("[AuthContext] Login failed:", data.error);
                throw new Error(data.error || 'Login failed');
            }

            const { token, user } = data;
            console.log("[AuthContext] Login success, token:", token ? "YES" : "NO", "User:", user?.email || user?.phone);

            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

            setCurrentUser(user);
            setUserProfile(user);

            return { success: true, user };
        } catch (err: any) {
            console.error("[AuthContext] Login error catch:", err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: any) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Registration failed');
            }

            const { token, user } = data;
            if (token) {
                await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
                await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
                setCurrentUser(user);
                setUserProfile(user);
            }

            return { success: true, user };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);

            // Optional: call backend logout if needed
            // await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });

            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
            await AsyncStorage.removeItem(AUTH_USER_KEY);

            setCurrentUser(null);
            setUserProfile(null);

            return { success: true };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const getAccessToken = async () => {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    };

    const refreshUserProfile = async () => {
        const token = await getAccessToken();
        if (token) {
            await fetchMe(token);
        }
    }

    const sendOTP = async (phone: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            return await response.json();
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const verifyOTP = async (phone: string, otp: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });
            const data = await response.json();

            if (data.success && data.token) {
                await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
                await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
                setCurrentUser(data.user);
                setUserProfile(data.user);
            }

            return data;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const value = {
        currentUser,
        userProfile,
        isAuthenticated: !!currentUser,
        loading,
        error,
        login,
        register,
        logout,
        getAccessToken,
        refreshUserProfile,
        sendOTP,
        verifyOTP
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

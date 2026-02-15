import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabase";
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
                // Check for persisted session in AsyncStorage first? 
                // Supabase handles this automatically with persistSession: true.

                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setCurrentUser(session.user);
                    await fetchUserProfile(session.user.id);
                }
            } catch (err) {
                console.warn("Auth initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setCurrentUser(session.user);
                await fetchUserProfile(session.user.id);
            } else {
                setCurrentUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const fetchUserProfile = async (userId: string) => {
        // Placeholder for fetching user profile from backend database if separate from auth
        // For now we just use auth metadata or empty
        try {
            // const result = await getUserProfile(userId); ...
            // Adapted from web's getUserProfile logic if needed.
            // Web uses: await getUserProfile();
        } catch (e) {
            console.warn("Error fetching user profile", e);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (err: any) {
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
            const { email, password, ...metadata } = userData;
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                },
            });
            if (error) throw error;
            return { success: true, user: data.user };
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
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    };

    const refreshUserProfile = async () => {
        if (!currentUser) return;
        await fetchUserProfile(currentUser.id);
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
            return await response.json();
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

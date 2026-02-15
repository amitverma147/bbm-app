import { API_BASE_URL } from "../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const validateCoupon = async (code: string, cartData: any, token: string | null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                code,
                cart_data: cartData,
            }),
        });
        return await response.json();
    } catch (error) {
        console.error("Error validating coupon:", error);
        return { success: false, error: (error as any).message };
    }
};

export const applyCoupon = async (code: string, cartData: any, sessionId: string, token: string | null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/coupons/apply`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                code,
                cart_data: cartData,
                session_id: sessionId,
            }),
        });
        return await response.json();
    } catch (error) {
        console.error("Error applying coupon:", error);
        return { success: false, error: (error as any).message };
    }
};

export const removeCoupon = async (lockToken: string, token: string | null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/coupons/remove`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ lock_token: lockToken }),
        });
        return await response.json();
    } catch (error) {
        console.error("Error removing coupon:", error);
        return { success: false, error: (error as any).message };
    }
};

export const getAvailableCoupons = async (cartValue: number, token: string | null) => {
    try {
        const url = `${API_BASE_URL}/coupons/available${cartValue ? `?cart_value=${cartValue}` : ""}`;
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(url, { headers });
        return await response.json();
    } catch (error) {
        console.error("Error fetching available coupons:", error);
        return { success: false, error: (error as any).message };
    }
};

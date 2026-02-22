import { API_BASE_URL } from "../constants/Config";

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    is_frozen: boolean;
    frozen_reason?: string;
    created_at: string;
    updated_at: string;
}

export interface WalletOrderPayload {
    user_id: string;
    product_id: string; // "default-product-id" if multiple?
    user_name: string;
    product_name: string;
    product_total_price: number;
    user_address: string;
    mobile: string;
    payment_method: "WALLET";
    order_status: "pending";
    payment_status: "completed";
    total_price: number;
    delivery_address: any;
    items: any[];
}

export const getWalletTransactions = async (token: string, page = 1, limit = 20) => {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        const response = await fetch(`${API_BASE_URL}/wallet/transactions?${queryParams}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
    }
};

export const createWalletTopupOrder = async (amount: number, token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/wallet/topup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error creating topup order:", error);
        throw error;
    }
};

export const verifyWalletTopup = async (paymentData: any, token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/wallet/topup/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error verifying topup:", error);
        throw error;
    }
};

export const getWalletDetails = async (token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/wallet`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching wallet details:", error);
        throw error;
    }
};

export const createWalletOrder = async (orderData: WalletOrderPayload, token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/wallet-orders/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error creating wallet order:", error);
        throw error;
    }
};

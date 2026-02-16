import { API_BASE_URL } from "../constants/Config";

export interface OrderItem {
    product_id: string;
    variant_id?: string;
    quantity: number;
    price: number | string;
    product_type?: string;
}

export interface CreateOrderPayload {
    user_id: string;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    total: number;
    address: string; // Full address string or ID? Backend seems to take string for 'placeOrder' and detailed object for 'placeOrderWithDetailedAddress'
    payment_method: 'COD' | 'Razorpay' | 'Wallet' | 'prepaid';
    coupon_code?: string;
    coupon_discount?: number;
    mobile?: string;
    receiver_name?: string;
    // Charge settings
    handling_charge?: number;
    surge_charge?: number;
    platform_charge?: number;
    discount_charge?: number;
}

export const placeOrder = async (orderData: CreateOrderPayload, token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/order/place`, {
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
        console.error("Error placing order:", error);
        throw error;
    }
};

export const getMyOrders = async (token: string, page = 1, limit = 10) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/my-orders?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching my orders:", error);
        throw error;
    }
}

export const getOrderDetails = async (orderId: string, token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching order details:", error);
        throw error;
    }
}

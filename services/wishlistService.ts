import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export interface WishlistProduct {
    id: string;
    name: string;
    price: number;
    old_price?: number;
    image?: string;
    weight?: string;
    uom?: string;
    rating?: number;
    review_count?: number;
    variants?: any[];
}

export interface WishlistItem {
    id: string;
    user_id: string;
    product_id: string;
    added_at: string;
    product: WishlistProduct;
}

// Get user's wishlist
export const getWishlist = async (): Promise<{ success: boolean; wishlist: WishlistItem[]; count?: number; error?: string }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error fetching wishlist:', error);
        return { success: false, wishlist: [], error: error.message };
    }
};

// Add item to wishlist
export const addToWishlist = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId }),
        });

        return await response.json();
    } catch (error: any) {
        console.error('Error adding to wishlist:', error);
        return { success: false, error: error.message };
    }
};

// Remove item from wishlist (by product_id)
export const removeFromWishlist = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
            method: 'DELETE',
            headers,
        });

        return await response.json();
    } catch (error: any) {
        console.error('Error removing from wishlist:', error);
        return { success: false, error: error.message };
    }
};

// Check if product is in wishlist
export const checkWishlistItem = async (productId: string): Promise<{ success: boolean; inWishlist: boolean }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wishlist/check/${productId}`, {
            method: 'GET',
            headers,
        });

        return await response.json();
    } catch (error: any) {
        console.error('Error checking wishlist:', error);
        return { success: false, inWishlist: false };
    }
};

// Clear entire wishlist
export const clearWishlist = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            method: 'DELETE',
            headers,
        });

        return await response.json();
    } catch (error: any) {
        console.error('Error clearing wishlist:', error);
        return { success: false, error: error.message };
    }
};

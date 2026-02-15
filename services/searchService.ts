import { API_BASE_URL } from '../constants/Config';

// Basic service configuration


export const searchAll = async (query: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            // Fallback for demo if API fails or endpoint is different
            console.warn('Search API failed, returning empty array');
            return { success: false, results: [] };
        }
        const data = await response.json();
        return { success: true, results: data };
    } catch (error) {
        console.error('Search service error:', error);
        return { success: false, error };
    }
};

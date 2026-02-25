import { API_BASE_URL } from '../constants/Config';

// Basic service configuration


export const searchAll = async (query: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            console.warn('Search API failed, returning empty array');
            return { success: false, results: [] };
        }
        const data = await response.json();
        // searchController unifiedSearch returns { success: true, results: { products, categories, stores, total } }
        return { success: true, results: data.results || { products: [], categories: [], stores: [], total: 0 } };
    } catch (error) {
        console.error('Search service error:', error);
        return { success: false, error };
    }
};

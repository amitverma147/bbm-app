import { API_BASE_URL } from '../constants/Config';
import { cachedFetch, getCached } from './apiCache';

// Fetch active sections configuration
export const getActiveSections = async () => {
    try {
        const url = `${API_BASE_URL}/product-sections/active`;
        const data = await cachedFetch(url);
        if (!data) return getDefaultSections();
        return data.success ? data.data : getDefaultSections();
    } catch (error) {
        console.error('Home service (sections) error:', error);
        return getDefaultSections();
    }
};

// Generic fetcher for section data — now uses cachedFetch for deduplication
export const getSectionData = async (endpoint: string) => {
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const data = await cachedFetch(url);
        if (!data) return [];
        return data.products || data.data || data || [];
    } catch (error) {
        console.error(`Home service (data) error for ${endpoint}:`, error);
        return [];
    }
}

// Synchronous cache check — returns cached products instantly or null
export const getCachedSectionData = (endpoint: string): any[] | null => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const data = getCached(url);
    if (!data) return null;
    const products = data.products || data.data || data;
    return Array.isArray(products) ? products : null;
};

// Fallback sections if API fails
const getDefaultSections = () => [
    { id: '1', component_name: 'HeroSection', display_order: 1 },
    { id: '2', component_name: 'ShopByCategory', display_order: 2 },
    { id: '3', component_name: 'NewArrivals', section_name: 'New Arrivals', display_order: 3 },
    { id: '4', component_name: 'BigBestMartDeals', section_name: 'Big Best Mart Deals', display_order: 4 },
];


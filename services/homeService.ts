import { API_BASE_URL } from '../constants/Config';

// Fetch active sections configuration
export const getActiveSections = async () => {
    try {
        const url = `${API_BASE_URL}/product-sections/active`;
        console.log('Fetching active sections from:', url);
        const response = await fetch(url);
        console.log('Active sections response status:', response.status);

        if (!response.ok) {
            const text = await response.text();
            console.warn('Failed to fetch active sections:', text);
            return getDefaultSections();
        }
        const data = await response.json();
        console.log('Active sections data success:', data.success);
        return data.success ? data.data : getDefaultSections();
    } catch (error) {
        console.error('Home service (sections) error:', error);
        return getDefaultSections();
    }
};

// Generic fetcher for section data
export const getSectionData = async (endpoint: string) => {
    try {
        // Construct URL: handle if endpoint is full URL or relative
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        // Adjust based on your API response structure (data.products, data.data, or direct array)
        return data.products || data.data || data || [];
    } catch (error) {
        console.error(`Home service (data) error for ${endpoint}:`, error);
        return [];
    }
}

// Fallback sections if API fails
const getDefaultSections = () => [
    { id: '1', component_name: 'HeroSection', display_order: 1 },
    { id: '2', component_name: 'ShopByCategory', display_order: 2 },
    { id: '3', component_name: 'NewArrivals', section_name: 'New Arrivals', display_order: 3 },
    { id: '4', component_name: 'BigBestMartDeals', section_name: 'Big Best Mart Deals', display_order: 4 },
];

import { API_BASE_URL } from '../constants/Config';
import { cachedFetch } from './apiCache';

// TypeScript Interfaces
export interface Group {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    image_url: string;
    subcategory_id: string;
    featured: boolean;
    active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface Brand {
    id: string;
    name: string;
    image_url: string;
}

// Add helper for mapped category — cached
export const getMappedCategoryForSection = async (sectionKey: string) => {
    try {
        const url = `${API_BASE_URL}/section-mappings/${sectionKey}/categories?exclude_inferred=true`;
        const data = await cachedFetch(url);
        if (data?.success && data.categories && data.categories.length > 0) {
            return {
                id: data.categories[0].category_id || data.categories[0].id
            };
        }
    } catch (error) {
        console.error(`Error fetching category mapping for ${sectionKey}:`, error);
    }
    return null;
};

// Categories hierarchy — cached (rarely changes)
export const getCategoriesHierarchy = async () => {
    try {
        const url = `${API_BASE_URL}/categories/hierarchy`;
        const data = await cachedFetch(url);
        if (!data) return { success: false, categories: [] };
        return data;
    } catch (error) {
        console.error('Categories hierarchy service error:', error);
        return { success: false, categories: [] };
    }
};

export const getCategories = async () => {
    try {
        const url = `${API_BASE_URL}/categories`;
        const data = await cachedFetch(url);
        if (!data) return [];
        return data.categories || data;
    } catch (error) {
        console.error('Categories service error:', error);
        return [];
    }
};

export const getGroupsBySubcategory = async (subcategoryId: string): Promise<Group[]> => {
    try {
        const url = `${API_BASE_URL}/categories/groups/subcategory/${subcategoryId}`;
        const data = await cachedFetch(url);
        return data?.success && data.groups ? data.groups : [];
    } catch (error) {
        console.error('Error fetching groups by subcategory:', error);
        return [];
    }
};

export const getBrands = async (): Promise<Brand[]> => {
    try {
        const url = `${API_BASE_URL}/brands/list`;
        const data = await cachedFetch(url);
        return data?.success && data.brands ? data.brands : [];
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
};

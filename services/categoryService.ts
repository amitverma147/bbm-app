import { API_BASE_URL } from '../constants/Config';

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

// Add helper for mapped category
export const getMappedCategoryForSection = async (sectionKey: string) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/section-mappings/${sectionKey}/categories?exclude_inferred=true`
        );
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.categories && data.categories.length > 0) {
                // Return the ID of the first mapped category
                return {
                    id: data.categories[0].category_id || data.categories[0].id
                };
            }
        }
    } catch (error) {
        console.error(`Error fetching category mapping for ${sectionKey}:`, error);
    }
    return null;
};

export const getCategoriesHierarchy = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/hierarchy`);
        if (!response.ok) {
            console.warn('Categories hierarchy API failed');
            return { success: false, categories: [] };
        }
        const data = await response.json();
        return data; // Expected { success: true, categories: [...] }
    } catch (error) {
        console.error('Categories hierarchy service error:', error);
        return { success: false, categories: [] };
    }
};

export const getCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) {
            console.warn('Categories API failed');
            return [];
        }
        const data = await response.json();
        return data.categories || data;
    } catch (error) {
        console.error('Categories service error:', error);
        return [];
    }
};

export const getGroupsBySubcategory = async (subcategoryId: string): Promise<Group[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/groups/subcategory/${subcategoryId}`);
        if (!response.ok) {
            console.warn('Groups API failed');
            return [];
        }
        const data = await response.json();
        return data.success && data.groups ? data.groups : [];
    } catch (error) {
        console.error('Error fetching groups by subcategory:', error);
        return [];
    }
};

export const getBrands = async (): Promise<Brand[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/brands/list`);
        if (!response.ok) {
            console.warn('Brands API failed');
            return [];
        }
        const data = await response.json();
        return data.success && data.brands ? data.brands : [];
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
};

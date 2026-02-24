import { API_BASE_URL } from '../constants/Config';

export const getProductsByCategory = async (categoryName: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/productsroute/category/${encodeURIComponent(categoryName)}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.products : [];
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }
};

export const getProductsBySubcategory = async (subcategoryId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/productsroute/subcategory/${subcategoryId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.products : [];
    } catch (error) {
        console.error('Error fetching products by subcategory:', error);
        return [];
    }
};

export const getProductsByGroup = async (groupId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/productsroute/group/${groupId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.products : [];
    } catch (error) {
        console.error('Error fetching products by group:', error);
        return [];
    }
};

export const getProductsByStore = async (storeId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/product-recommended-stores/${storeId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.products : [];
    } catch (error) {
        console.error('Error fetching products by store:', error);
        return [];
    }
};

export const getProductsByBrand = async (brandId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/productsroute/brand/${brandId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.products : [];
    } catch (error) {
        console.error('Error fetching products by brand:', error);
        return [];
    }
};

export const getProductDetails = async (productId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/productsroute/id/${productId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.success ? data.product : null;
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
};

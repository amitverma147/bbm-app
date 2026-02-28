import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

// Get user profile
export const getUserProfile = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            headers,
        });
        return await response.json();
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        return { success: false, error: error.message };
    }
};

// Update user profile
export const updateUserProfile = async (data: { name?: string; phone?: string }) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/user/profile/update`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
};

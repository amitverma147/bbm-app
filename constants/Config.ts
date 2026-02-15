import { Platform } from 'react-native';

// Dynamic API URL determination
// Dynamic API URL determination
const getApiBaseUrl = () => {
    if (__DEV__) {
        // Use LAN IP for physical Android device testing (from logs: 192.168.1.5)
        // If using Emulator, you can switch back to 'http://10.0.2.2:8000/api'
        if (Platform.OS === 'android') {
             return 'http://192.168.29.144:8000/api';
        }
        // For iOS Simulator, localhost usually works fine
        if (Platform.OS === 'ios') {
            return 'http://localhost:8000/api';
        }
        // For web or other environments
        return 'http://localhost:8000/api';
    }
    // Production URL
    return 'https://big-best-backend.vercel.app/api';
};

export const API_BASE_URL = getApiBaseUrl();

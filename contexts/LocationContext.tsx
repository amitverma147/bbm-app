import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/Config";
import * as Location from 'expo-location';

interface LocationContextType {
    pincode: string;
    location: string;
    selectedAddress: any;
    addresses: any[];
    isLoadingAddresses: boolean;
    setPincode: (pincode: string) => void;
    setLocation: (location: string) => void;
    setSelectedAddress: (address: any) => void;
    clearLocation: () => void;
    fetchAddresses: () => void;
    detectCurrentLocation: () => Promise<void>;
    isLocationSet: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [pincode, setPincodeState] = useState("");
    const [location, setLocationState] = useState("");
    const [selectedAddress, setSelectedAddressState] = useState<any>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

    const LOCATION_CACHE_KEY = "user_location_cache";
    const PINCODE_CACHE_KEY = "user_pincode";

    useEffect(() => {
        loadCachedLocation();
    }, []);

    const loadCachedLocation = async () => {
        try {
            const cachedPincode = await AsyncStorage.getItem(PINCODE_CACHE_KEY);
            if (cachedPincode) setPincodeState(cachedPincode);

            const cachedLocationStr = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
            if (cachedLocationStr) {
                const cached = JSON.parse(cachedLocationStr);
                if (cached.location) setLocationState(cached.location);
            }
        } catch (e) {
            console.warn("Error loading location cache", e);
        }
    };

    const setPincode = async (newPincode: string) => {
        setPincodeState(newPincode);
        if (newPincode) {
            await AsyncStorage.setItem(PINCODE_CACHE_KEY, newPincode);
        } else {
            await AsyncStorage.removeItem(PINCODE_CACHE_KEY);
        }
    };

    const setLocation = async (newLocation: string) => {
        setLocationState(newLocation);
        if (newLocation) {
            await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ location: newLocation }));
        } else {
            await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
        }
    };

    const setSelectedAddress = (address: any) => {
        setSelectedAddressState(address);
        if (address) {
            if (address.postal_code || address.pincode) {
                setPincode(address.postal_code || address.pincode);
            }
            if (address.city) {
                setLocation(address.city);
            }
        }
    };

    const clearLocation = async () => {
        setPincodeState("");
        setLocationState("");
        setSelectedAddressState(null);
        await AsyncStorage.multiRemove([PINCODE_CACHE_KEY, LOCATION_CACHE_KEY]);
    };

    const fetchAddresses = async () => {
        setIsLoadingAddresses(true);
        try {
            // We need authentication token here. 
            // Ideally AuthContext should provide an axios instance with interceptors,
            // or we get token from storage/AuthContext.
            const token = await AsyncStorage.getItem('auth_token'); // Or however token is stored

            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/user/addresses`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setAddresses(data.addresses || []);
                // If no selected address, select default or first
                if (!selectedAddress && data.addresses?.length > 0) {
                    const defaultAddr = data.addresses.find((a: any) => a.is_default) || data.addresses[0];
                    setSelectedAddress(defaultAddr);
                }
            }
        } catch (e) {
            console.warn("Error fetching addresses", e);
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    const detectCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;

            // Try backend geocode
            try {
                const token = await AsyncStorage.getItem('auth_token');
                let addressData = null;

                if (token) {
                    const response = await fetch(`${API_BASE_URL}/user/addresses/geocode?lat=${latitude}&lng=${longitude}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        addressData = data.data;
                    }
                }

                // If backend fails or no token, try direct OSM or fallback
                if (!addressData) {
                    // Fallback to nominatim direct if needed, or just set coords
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                        { headers: { 'User-Agent': 'BigBestMartApp/1.0' } }
                    );
                    addressData = await response.json();
                }

                if (addressData) {
                    // Format as a temporary address object
                    const tempAddress = {
                        id: 'current_location',
                        address_line_1: addressData.display_name?.split(',')[0] || 'Current Location',
                        city: addressData.address?.city || addressData.address?.town || addressData.address?.village || '',
                        state: addressData.address?.state || '',
                        postal_code: addressData.address?.postcode || '',
                        is_temp: true, // Marker for temporary location
                        ...addressData
                    };
                    setSelectedAddress(tempAddress);
                } else {
                    setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                }

            } catch (e) {
                console.warn("Reverse geocode failed", e);
                setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
            }

        } catch (error) {
            console.warn("Error getting location", error);
        }
    };

    const value = {
        pincode,
        location,
        selectedAddress,
        addresses,
        isLoadingAddresses,
        setPincode,
        setLocation,
        setSelectedAddress,
        clearLocation,
        fetchAddresses,
        detectCurrentLocation,
        isLocationSet: !!pincode || !!location || !!selectedAddress,
    };

    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export default LocationContext;

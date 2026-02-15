import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        // Placeholder for API call
        setIsLoadingAddresses(true);
        try {
            // const result = await getUserAddresses();
            // if (result.success) setAddresses(result.addresses);
        } catch (e) {
            console.warn("Error fetching addresses", e);
        } finally {
            setIsLoadingAddresses(false);
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
        isLocationSet: !!pincode || !!location || !!selectedAddress,
    };

    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export default LocationContext;

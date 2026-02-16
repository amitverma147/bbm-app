import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';
import LocationPickerModal from '../components/LocationPickerModal';
import AddressDetailsFormModal from '../components/AddressDetailsFormModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';

const AddressesScreen = () => {
    const router = useRouter();
    const { addresses, fetchAddresses, isLoadingAddresses, selectedAddress, setSelectedAddress } = useLocation();

    // Manage modals for adding new address
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleAddNew = () => {
        setShowLocationPicker(true);
    };

    const handleLocationPicked = (loc: any) => {
        setPickedLocation(loc);
        setShowLocationPicker(false);
        setTimeout(() => setShowAddressForm(true), 500);
    };

    const handleSaveAddress = async (addressData: any) => {
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/user/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData)
            });

            const result = await response.json();
            if (result.success) {
                setShowAddressForm(false);
                fetchAddresses();
                Alert.alert("Success", "Address saved successfully");
            } else {
                Alert.alert("Error", result.message || "Failed to save address");
            }
        } catch (error) {
            console.error("Save address error:", error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Delete Address", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('auth_token');
                        await fetch(`${API_BASE_URL}/user/addresses/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        fetchAddresses(); // Refresh list
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        ]);
    };

    const renderAddressItem = ({ item }: { item: any }) => {
        const isSelected = selectedAddress?.id === item.id;
        return (
            <View className={`bg-white mx-4 mb-4 p-4 rounded-2xl border ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-100'} shadow-sm`}>
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center">
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isSelected ? 'bg-orange-100' : 'bg-gray-100'}`}>
                            <Feather name={item.label === 'Home' ? 'home' : item.label === 'Work' ? 'briefcase' : 'map-pin'} size={16} color={isSelected ? '#EA580C' : '#4B5563'} />
                        </View>
                        <Text className="text-base font-bold text-gray-900">{item.label}</Text>
                        {item.is_default && <View className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-[10px]"><Text className="text-[10px] font-bold text-gray-500">DEFAULT</Text></View>}
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-1">
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                <Text className="text-gray-600 text-sm leading-5 mb-2 pl-11">
                    {item.address_line_1 || item.street_address}, {item.city} - {item.postal_code || item.pincode}
                </Text>

                <View className="pl-11">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Contact</Text>
                    <Text className="text-gray-900 text-xs font-bold">{item.receiver_name} • {item.receiver_phone}</Text>
                </View>

                {!isSelected && (
                    <TouchableOpacity
                        onPress={() => setSelectedAddress(item)}
                        className="mt-4 border-t border-gray-100 pt-3 flex-row justify-center"
                    >
                        <Text className="text-orange-600 font-bold text-sm">Set as Current Location</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView edges={["top"]} className="bg-white flex-1">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 bg-white z-10">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3 w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-100">
                            <Ionicons name="chevron-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">Saved Addresses</Text>
                    </View>
                    <TouchableOpacity onPress={handleAddNew} className="bg-black w-10 h-10 rounded-full items-center justify-center shadow-md">
                        <Feather name="plus" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {isLoadingAddresses ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#EA580C" />
                    </View>
                ) : (
                    <FlatList
                        data={addresses}
                        renderItem={renderAddressItem}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 px-10">
                                <Text className="text-gray-500 mb-4">No saved addresses found.</Text>
                                <TouchableOpacity onPress={handleAddNew} className="bg-orange-600 px-6 py-3 rounded-xl">
                                    <Text className="text-white font-bold">Add New Address</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}

                {/* Integration of picker modals reusing components */}
                <LocationPickerModal
                    visible={showLocationPicker}
                    onClose={() => setShowLocationPicker(false)}
                    onConfirm={handleLocationPicked}
                />

                <AddressDetailsFormModal
                    visible={showAddressForm}
                    onClose={() => setShowAddressForm(false)}
                    onBack={() => {
                        setShowAddressForm(false);
                        setShowLocationPicker(true);
                    }}
                    onSave={handleSaveAddress}
                    initialLocation={pickedLocation}
                    loading={isSaving}
                />

            </SafeAreaView>
        </View>
    );
};

export default AddressesScreen;

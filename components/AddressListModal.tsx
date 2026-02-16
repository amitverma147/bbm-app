import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddressListModalProps {
    visible: boolean;
    onClose: () => void;
    onAddNew: () => void;
    onSelect: (address: any) => void;
}

const AddressListModal: React.FC<AddressListModalProps> = ({ visible, onClose, onAddNew, onSelect }) => {
    const { addresses, fetchAddresses, isLoadingAddresses, selectedAddress, detectCurrentLocation, location } = useLocation();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (visible && currentUser) {
            fetchAddresses();
        }
    }, [visible, currentUser]);

    const handleDetectLocation = async () => {
        await detectCurrentLocation();
        onClose();
    };

    const renderAddressItem = ({ item }: { item: any }) => {
        const isSelected = selectedAddress?.id === item.id;
        return (
            <TouchableOpacity
                style={[styles.addressCard, isSelected && styles.selectedCard]}
                onPress={() => onSelect(item)}
            >
                <View style={styles.iconContainer}>
                    <Feather
                        name={item.label === 'Home' ? 'home' : item.label === 'Work' ? 'briefcase' : 'map-pin'}
                        size={20}
                        color={isSelected ? '#FF6B00' : '#4b5563'}
                    />
                </View>
                <View style={styles.addressInfo}>
                    <View style={styles.row}>
                        <Text style={styles.addressLabel}>{item.label || item.address_name}</Text>
                        {item.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultText}>DEFAULT</Text></View>}
                    </View>
                    <Text style={styles.addressText} numberOfLines={2}>
                        {item.address_line_1 || item.street_address}, {item.city}, {item.postal_code || item.pincode}
                    </Text>
                    <Text style={styles.phoneText}>
                        {item.receiver_name} | {item.receiver_phone}
                    </Text>
                </View>
                {isSelected && (
                    <View style={styles.checkIcon}>
                        <Ionicons name="checkmark-circle" size={24} color="#FF6B00" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Select Location</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#1f2937" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleDetectLocation}>
                            <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
                                <Feather name="crosshair" size={20} color="#0284c7" />
                            </View>
                            <View>
                                <Text style={[styles.actionTitle, { color: '#0284c7' }]}>Use Current Location</Text>
                                <Text style={styles.actionSubtitle}>{location || "Using GPS"}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onAddNew}>
                            <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
                                <Feather name="plus" size={20} color="#ea580c" />
                            </View>
                            <Text style={[styles.actionTitle, { color: '#ea580c' }]}>Add New Address</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionHeader}>SAVED ADDRESSES</Text>

                    {isLoadingAddresses ? (
                        <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={addresses}
                            renderItem={renderAddressItem}
                            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                            contentContainerStyle={styles.listContainer}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No saved addresses found.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        padding: 5,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
    },
    actionContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    sectionHeader: {
        paddingHorizontal: 20,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        marginBottom: 10,
        letterSpacing: 1,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    addressCard: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    selectedCard: {
        borderColor: '#FF6B00',
        backgroundColor: '#fff7ed',
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    addressInfo: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    defaultBadge: {
        marginLeft: 8,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    addressLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    addressText: {
        fontSize: 14,
        color: '#4b5563',
        marginTop: 2,
        lineHeight: 20,
    },
    phoneText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 6,
    },
    checkIcon: {
        marginLeft: 12,
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
    },
});

export default AddressListModal;

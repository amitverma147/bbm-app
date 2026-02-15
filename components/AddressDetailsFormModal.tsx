import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface AddressDetailsFormModalProps {

    visible: boolean;
    onClose: () => void;
    onBack: () => void;
    onSave: (addressData: any) => void;
    initialLocation: any;
    loading?: boolean;
}

const AddressDetailsFormModal: React.FC<AddressDetailsFormModalProps> = ({
    visible,
    onClose,
    onBack,
    onSave,
    initialLocation,
    loading = false
}) => {
    const { currentUser } = useAuth();

    // Form State
    const [addressType, setAddressType] = useState('Home'); // Home, Work, Others
    const [otherLabel, setOtherLabel] = useState('');
    const [flatNo, setFlatNo] = useState('');
    const [buildingName, setBuildingName] = useState('');
    const [landmark, setLandmark] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');

    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (visible && initialLocation) {
            const addr = initialLocation.address;
            if (addr) {
                setCity(addr.city || addr.town || addr.village || addr.suburb || '');
                setState(addr.state || '');
                setPincode(addr.postcode || '');
                setFlatNo(addr.house_number || '');

                // Try to infer building name if house number exists but building doesn't
                // This is heuristic based
                if (!addr.building && addr.road) {
                    // setBuildingName(addr.road); 
                }
                if (addr.building) {
                    setBuildingName(addr.building);
                }

                // Construct landmark
                const parts = [];
                if (addr.road) parts.push(addr.road);
                if (addr.suburb) parts.push(addr.suburb);
                if (parts.length > 0) setLandmark(parts.join(', '));
            }
        }
    }, [visible, initialLocation]);

    // Auto-fill user details
    useEffect(() => {
        if (currentUser) {
            if (currentUser.user_metadata?.full_name) setReceiverName(currentUser.user_metadata.full_name);
            if (currentUser.user_metadata?.phone) setReceiverPhone(currentUser.user_metadata.phone);
        }
    }, [currentUser]);

    const validate = () => {
        const newErrors: any = {};
        if (!flatNo) newErrors.flatNo = "Flat / House No. is required";
        if (!buildingName) newErrors.buildingName = "Building / Area is required";
        if (!receiverName) newErrors.receiverName = "Name is required";
        if (!receiverPhone || receiverPhone.length < 10) newErrors.receiverPhone = "Valid phone number is required";
        if (!city) newErrors.city = "City is required";
        if (!state) newErrors.state = "State is required";
        if (!pincode) newErrors.pincode = "Pincode is required";
        if (addressType === 'Others' && !otherLabel) newErrors.otherLabel = "Label is required"; // e.g., 'Friend's House'

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            const finalData = {
                ...initialLocation, // coordinates
                type: addressType === 'Others' ? otherLabel : addressType,
                flat_no: flatNo,
                building_name: buildingName,
                landmark,
                receiver_name: receiverName,
                receiver_phone: receiverPhone,
                address_line_1: `${flatNo}, ${buildingName}`,
                address_line_2: landmark,
                city,
                state,
                postal_code: pincode,
                pincode: pincode, // duplication for safety depending on api
            };
            onSave(finalData);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Address Details</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                            {/* Location Preview */}
                            <View style={styles.locationPreview}>
                                <View style={styles.mapIcon}>
                                    <Feather name="map-pin" size={24} color="#6b7280" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.locationTitle} numberOfLines={1}>
                                            {initialLocation?.address?.display_name || "Selected Location"}
                                        </Text>
                                        <TouchableOpacity onPress={onBack} style={styles.changeBtn}>
                                            <Text style={styles.changeBtnText}>CHANGE</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.locationSubtitle} numberOfLines={2}>
                                        {initialLocation?.address?.display_name}
                                    </Text>
                                </View>
                            </View>

                            {/* Address Type */}
                            <Text style={styles.sectionLabel}>Save address as</Text>
                            <View style={styles.typeContainer}>
                                {['Home', 'Work', 'Others'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.typeChip, addressType === type && styles.activeTypeChip]}
                                        onPress={() => setAddressType(type)}
                                    >
                                        {type === 'Home' && <Feather name="home" size={14} color={addressType === type ? '#E91E63' : '#6b7280'} />}
                                        {type === 'Work' && <Feather name="briefcase" size={14} color={addressType === type ? '#E91E63' : '#6b7280'} />}
                                        {type === 'Others' && <Feather name="map-pin" size={14} color={addressType === type ? '#E91E63' : '#6b7280'} />}
                                        <Text style={[styles.typeText, addressType === type && styles.activeTypeText]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {addressType === 'Others' && (
                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.input, errors.otherLabel && styles.inputError]}
                                        placeholder="Label (e.g. Friend's House)"
                                        value={otherLabel}
                                        onChangeText={setOtherLabel}
                                    />
                                    {errors.otherLabel && <Text style={styles.errorText}>{errors.otherLabel}</Text>}
                                </View>
                            )}

                            {/* Fields */}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={[styles.input, errors.flatNo && styles.inputError]}
                                    placeholder="Flat / House No / Floor *"
                                    value={flatNo}
                                    onChangeText={setFlatNo}
                                />
                                {errors.flatNo && <Text style={styles.errorText}>{errors.flatNo}</Text>}
                            </View>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={[styles.input, errors.buildingName && styles.inputError]}
                                    placeholder="Building / Apartment / Area *"
                                    value={buildingName}
                                    onChangeText={setBuildingName}
                                />
                                {errors.buildingName && <Text style={styles.errorText}>{errors.buildingName}</Text>}
                            </View>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Landmark (Optional)"
                                    value={landmark}
                                    onChangeText={setLandmark}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <TextInput
                                        style={[styles.input, errors.city && styles.inputError]}
                                        placeholder="City *"
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <TextInput
                                        style={[styles.input, errors.state && styles.inputError]}
                                        placeholder="State *"
                                        value={state}
                                        onChangeText={setState}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={[styles.input, errors.pincode && styles.inputError]}
                                    placeholder="Pincode *"
                                    value={pincode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    onChangeText={setPincode}
                                />
                                {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
                            </View>

                            {/* Receiver Info */}
                            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 20 }}>
                                <Text style={styles.sectionLabel}>Receiver Details</Text>

                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.input, errors.receiverName && styles.inputError]}
                                        placeholder="Receiver Name *"
                                        value={receiverName}
                                        onChangeText={setReceiverName}
                                    />
                                    {errors.receiverName && <Text style={styles.errorText}>{errors.receiverName}</Text>}
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }, errors.receiverPhone && styles.inputError]}>
                                        <Text style={{ marginRight: 10, color: '#6b7280' }}>+91</Text>
                                        <TextInput
                                            style={{ flex: 1 }}
                                            placeholder="Mobile Number *"
                                            value={receiverPhone}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            onChangeText={setReceiverPhone}
                                        />
                                    </View>
                                    {errors.receiverPhone && <Text style={styles.errorText}>{errors.receiverPhone}</Text>}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Address</Text>
                                )}
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937'
    },
    closeBtn: {
        padding: 5
    },
    locationPreview: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 25
    },
    mapIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    locationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
        marginRight: 10
    },
    locationSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4
    },
    changeBtn: {
        borderWidth: 1,
        borderColor: '#ff6b00',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#fff0e6'
    },
    changeBtnText: {
        color: '#ff6b00',
        fontSize: 10,
        fontWeight: 'bold'
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: 'white'
    },
    activeTypeChip: {
        borderColor: '#E91E63',
        backgroundColor: '#fce4ec'
    },
    typeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280'
    },
    activeTypeText: {
        color: '#E91E63'
    },
    inputGroup: {
        marginBottom: 15
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1f2937',
        backgroundColor: '#fff'
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2'
    },
    errorText: {
        color: '#ef4444',
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4
    },
    saveBtn: {
        backgroundColor: '#E91E63',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#E91E63",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default AddressDetailsFormModal;

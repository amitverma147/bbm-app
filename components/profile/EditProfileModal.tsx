import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { updateUserProfile } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, onSuccess }) => {
    const { userProfile, refreshUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    });

    useEffect(() => {
        if (visible && userProfile) {
            setFormData({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
            });
        }
    }, [visible, userProfile]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setLoading(true);
        try {
            const result = await updateUserProfile({
                name: formData.name.trim(),
                phone: formData.phone.trim(),
            });

            if (result.success) {
                Alert.alert('Success', 'Profile updated successfully');
                await refreshUserProfile();
                onSuccess?.();
                onClose();
            } else {
                Alert.alert('Error', result.error || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View className="bg-white rounded-t-3xl">
                        {/* Header */}
                        <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                            >
                                <Ionicons name="close" size={20} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="px-5 pt-6 pb-2" keyboardShouldPersistTaps="handled">
                            {/* Avatar Preview */}
                            <View className="items-center mb-8">
                                <View className="w-20 h-20 rounded-full bg-orange-100 items-center justify-center border-2 border-orange-200">
                                    <Text className="text-3xl font-black text-orange-600">
                                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            </View>

                            {/* Name Field */}
                            <View className="mb-5">
                                <Text className="text-sm font-bold text-gray-700 mb-2">Full Name</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4">
                                    <Feather name="user" size={18} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 py-4 px-3 text-gray-900 text-sm font-medium"
                                        placeholder="Enter your name"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.name}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Phone Field */}
                            <View className="mb-5">
                                <Text className="text-sm font-bold text-gray-700 mb-2">Phone Number</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4">
                                    <Feather name="phone" size={18} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 py-4 px-3 text-gray-900 text-sm font-medium"
                                        placeholder="Enter your phone number"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {/* Email (Read-only) */}
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-gray-700 mb-2">Email</Text>
                                <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-2xl px-4 opacity-60">
                                    <Feather name="mail" size={18} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 py-4 px-3 text-gray-500 text-sm font-medium"
                                        value={userProfile?.email || 'Not provided'}
                                        editable={false}
                                    />
                                </View>
                                <Text className="text-[10px] text-gray-400 mt-1 ml-1">Email cannot be changed</Text>
                            </View>
                        </ScrollView>

                        {/* Footer Buttons */}
                        <View className="px-5 pb-8 pt-2 flex-row gap-3">
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 py-4 rounded-2xl border border-gray-200 items-center justify-center bg-white"
                            >
                                <Text className="font-bold text-gray-700">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={loading}
                                className={`flex-1 py-4 rounded-2xl items-center justify-center flex-row ${loading ? 'bg-orange-300' : 'bg-orange-600'}`}
                            >
                                {loading && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
                                <Text className="text-white font-bold text-base">
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default EditProfileModal;

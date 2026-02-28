import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Group } from '../services/categoryService';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    groups: Group[];
    selectedGroupIds: string[];
    onApply: (selectedGroupIds: string[]) => void;
}

const FilterModal = ({ visible, onClose, groups, selectedGroupIds, onApply }: FilterModalProps) => {
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedGroupIds);

    // Sync temp selections when modal opens or selectedGroupIds change
    useEffect(() => {
        setTempSelectedIds(selectedGroupIds);
    }, [visible, selectedGroupIds]);

    const toggleGroup = (groupId: string) => {
        if (tempSelectedIds.includes(groupId)) {
            setTempSelectedIds(tempSelectedIds.filter(id => id !== groupId));
        } else {
            setTempSelectedIds([...tempSelectedIds, groupId]);
        }
    };

    const handleClearAll = () => {
        setTempSelectedIds([]);
    };

    const handleApply = () => {
        onApply(tempSelectedIds);
        onClose();
    };

    const activeGroups = groups.filter(group => group.active);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-2xl pb-6" style={{ maxHeight: '75%' }}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-5 pt-4 pb-3 border-b border-gray-200">
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900">Filter by Group</Text>
                            {tempSelectedIds.length > 0 && (
                                <Text className="text-xs text-orange-600 font-semibold mt-0.5">
                                    {tempSelectedIds.length} group{tempSelectedIds.length > 1 ? 's' : ''} selected
                                </Text>
                            )}
                        </View>
                        {tempSelectedIds.length > 0 && (
                            <TouchableOpacity 
                                onPress={handleClearAll}
                                className="mr-3"
                            >
                                <Text className="text-sm font-semibold text-orange-600">Clear all</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} className="p-1.5">
                            <Feather name="x" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Groups List */}
                    <ScrollView className="flex-1 px-5 py-3" showsVerticalScrollIndicator={false}>
                        {activeGroups.length === 0 ? (
                            <View className="py-12 items-center">
                                <MaterialCommunityIcons name="filter-off-outline" size={56} color="#D1D5DB" />
                                <Text className="text-gray-400 mt-4 text-center font-medium">No groups available</Text>
                                <Text className="text-gray-400 text-sm text-center mt-1">
                                    Check back later for filter options
                                </Text>
                            </View>
                        ) : (
                            <View className="space-y-2">
                                {activeGroups.map((group) => {
                                    const isSelected = tempSelectedIds.includes(group.id);
                                    return (
                                        <TouchableOpacity
                                            key={group.id}
                                            onPress={() => toggleGroup(group.id)}
                                            className={`flex-row items-center p-3.5 rounded-xl border ${
                                                isSelected
                                                    ? 'bg-orange-50 border-orange-500'
                                                    : 'bg-white border-gray-200'
                                            }`}
                                            activeOpacity={0.7}
                                        >
                                            {/* Group Image */}
                                            {group.image_url && (
                                                <Image 
                                                    source={{ uri: group.image_url }}
                                                    className="w-10 h-10 rounded-lg mr-3"
                                                    resizeMode="cover"
                                                />
                                            )}
                                            
                                            {/* Group Name */}
                                            <Text
                                                className={`flex-1 font-semibold text-base ${
                                                    isSelected ? 'text-orange-900' : 'text-gray-900'
                                                }`}
                                                numberOfLines={2}
                                            >
                                                {group.name}
                                            </Text>

                                            {/* Checkbox */}
                                            <View
                                                className={`w-6 h-6 rounded-md items-center justify-center ${
                                                    isSelected
                                                        ? 'bg-orange-600'
                                                        : 'bg-white border-2 border-gray-300'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <Feather name="check" size={14} color="white" strokeWidth={3} />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer Actions */}
                    <View className="px-5 pt-3 border-t border-gray-200">
                        <TouchableOpacity
                            onPress={handleApply}
                            className="py-3.5 bg-orange-600 rounded-xl items-center active:bg-orange-700"
                            activeOpacity={0.8}
                        >
                            <Text className="font-bold text-white text-base">
                                {tempSelectedIds.length > 0 
                                    ? `Apply ${tempSelectedIds.length} Filter${tempSelectedIds.length > 1 ? 's' : ''}` 
                                    : 'Show All Products'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default FilterModal;

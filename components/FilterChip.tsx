import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FilterChipProps {
    label: string;
    onRemove: () => void;
    imageUrl?: string;
}

const FilterChip = ({ label, onRemove, imageUrl }: FilterChipProps) => {
    return (
        <View className="flex-row items-center bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 mr-2 shadow-sm">
            {imageUrl && (
                <Image 
                    source={{ uri: imageUrl }}
                    className="w-6 h-6 rounded mr-1.5"
                    resizeMode="cover"
                />
            )}
            <Text className="text-gray-900 text-sm font-medium mr-1" numberOfLines={1}>
                {label}
            </Text>
            <TouchableOpacity onPress={onRemove} className="ml-0.5 p-0.5">
                <Feather name="x" size={14} color="#9CA3AF" />
            </TouchableOpacity>
        </View>
    );
};

export default FilterChip;

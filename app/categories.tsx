import { View, Text, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../components/Header'
import CategorySidebar from '../components/CategorySidebar'
import SubCategoryGrid from '../components/SubCategoryGrid'
import { getCategories } from '../services/categoryService'

// Dummy categories for fallback
const DUMMY_CATEGORIES = [
    { id: '1', name: 'Vegetables', image: null },
    { id: '2', name: 'Fruits', image: null },
    { id: '3', name: 'Dairy', image: null },
    { id: '4', name: 'Bakery', image: null },
    { id: '5', name: 'Snacks', image: null },
    { id: '6', name: 'Drinks', image: null },
    { id: '7', name: 'Personal Care', image: null },
    { id: '8', name: 'Home Care', image: null },
];

const Categories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const data = await getCategories();
        if (data && data.length > 0) {
            setCategories(data);
            setSelectedCategory(data[0]);
        } else {
            // Fallback to dummy data
            setCategories(DUMMY_CATEGORIES);
            setSelectedCategory(DUMMY_CATEGORIES[0]);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Header />
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FD5B00" />
                </View>
            ) : (
                <View className="flex-1 flex-row">
                    <CategorySidebar
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                    />
                    <SubCategoryGrid category={selectedCategory} />
                </View>
            )}
        </SafeAreaView>
    )
}

export default Categories

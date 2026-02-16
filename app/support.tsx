import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

const SupportScreen = () => {
    const router = useRouter();

    const contactMethods = [
        {
            id: 'call',
            title: 'Call Us',
            subtitle: '+91 98765 43210',
            icon: <Feather name="phone" size={24} color="#EA580C" />,
            action: () => Linking.openURL('tel:+919876543210')
        },
        {
            id: 'email',
            title: 'Email Us',
            subtitle: 'support@bigbestmart.com',
            icon: <Feather name="mail" size={24} color="#EA580C" />,
            action: () => Linking.openURL('mailto:support@bigbestmart.com')
        },
        {
            id: 'chat',
            title: 'Chat with Us',
            subtitle: 'Available 24/7',
            icon: <Ionicons name="chatbubbles-outline" size={24} color="#EA580C" />,
            action: () => {/* Open chat widget if available */ }
        }
    ];

    const faqs = [
        {
            id: '1',
            question: 'How do I track my order?',
            answer: 'You can track your order by going to the "Your Orders" section in your profile.'
        },
        {
            id: '2',
            question: 'What is the return policy?',
            answer: 'We accept returns within 7 days of delivery for damaged or incorrect items.'
        },
        {
            id: '3',
            question: 'How can I change my delivery address?',
            answer: 'You can manage your delivery addresses in the "Saved Addresses" section of your profile.'
        }
    ];

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView edges={["top"]} className="bg-white flex-1">
                <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full border border-gray-100 items-center justify-center mr-3 bg-gray-50 active:bg-gray-200"
                    >
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 tracking-tight">
                        Help & Support
                    </Text>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                    {/* Contact Grid */}
                    <View className="p-4">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Contact Us</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {contactMethods.map((method) => (
                                <TouchableOpacity
                                    key={method.id}
                                    onPress={method.action}
                                    className="w-[48%] bg-white border border-gray-100 p-4 rounded-2xl mb-4 shadow-sm items-center justify-center"
                                >
                                    <View className="w-12 h-12 bg-orange-50 rounded-full items-center justify-center mb-3">
                                        {method.icon}
                                    </View>
                                    <Text className="font-bold text-gray-900 mb-1">{method.title}</Text>
                                    <Text className="text-xs text-gray-500">{method.subtitle}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* FAQ Section */}
                    <View className="px-4">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</Text>
                        {faqs.map((faq, index) => (
                            <View key={faq.id} className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <Text className="font-bold text-gray-900 mb-2">{index + 1}. {faq.question}</Text>
                                <Text className="text-gray-600 text-sm leading-5">{faq.answer}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default SupportScreen;

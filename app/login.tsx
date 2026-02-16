import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Login: React.FC = () => {
    const router = useRouter();
    const { login, sendOTP, verifyOTP } = useAuth();

    // UI State
    const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const handleEmailLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                Alert.alert("Success", "Login Successful");
                router.replace('/(tabs)');
            } else {
                Alert.alert("Error", result.error || "Login Failed");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert("Error", "Please enter a valid phone number");
            return;
        }

        setLoading(true);
        try {
            const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
            const result = await sendOTP(formattedPhone);
            if (result.success) {
                setOtpSent(true);
                Alert.alert("Success", "OTP Sent Successfully");
            } else {
                Alert.alert("Error", result.error || "Failed to send OTP");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            Alert.alert("Error", "Please enter key");
            return;
        }

        setLoading(true);
        try {
            const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
            const result = await verifyOTP(formattedPhone, otp);
            if (result.success) {
                Alert.alert("Success", "Login Successful");
                router.replace('/(tabs)');
            } else {
                Alert.alert("Error", result.error || "Invalid OTP");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-6">
                {/* Header */}
                <View className="mb-8 mt-4">
                    <Text className="text-3xl font-bold text-gray-900">Welcome Back!</Text>
                    <Text className="text-gray-500 text-base mt-2">Sign in to continue</Text>
                </View>

                {/* Toggle Login Method */}
                <View className="flex-row bg-gray-100 p-1 rounded-xl mb-8">
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${loginMethod === 'email' ? 'bg-[#FD5B00]' : 'bg-transparent'}`}
                        onPress={() => setLoginMethod('email')}
                    >
                        <Ionicons name="mail-outline" size={20} color={loginMethod === 'email' ? 'white' : 'gray'} />
                        <Text className={`font-semibold ml-2 ${loginMethod === 'email' ? 'text-white' : 'text-gray-500'}`}>Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${loginMethod === 'otp' ? 'bg-[#FD5B00]' : 'bg-transparent'}`}
                        onPress={() => setLoginMethod('otp')}
                    >
                        <Ionicons name="phone-portrait-outline" size={20} color={loginMethod === 'otp' ? 'white' : 'gray'} />
                        <Text className={`font-semibold ml-2 ${loginMethod === 'otp' ? 'text-white' : 'text-gray-500'}`}>Phone</Text>
                    </TouchableOpacity>
                </View>

                {/* Forms */}
                {loginMethod === 'email' ? (
                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-700 font-medium mb-2 ml-1">Email Address</Text>
                            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-12">
                                <Ionicons name="mail-outline" size={20} color="gray" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-gray-900"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-700 font-medium mb-2 ml-1">Password</Text>
                            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-12">
                                <Ionicons name="lock-closed-outline" size={20} color="gray" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-gray-900"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="gray" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleEmailLogin} disabled={loading}
                            className={`bg-[#FD5B00] rounded-xl py-4 mt-6 flex-row justify-center items-center shadow-lg shadow-orange-200 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <Text className="text-white text-lg font-bold">Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/signup')} className="mt-4 flex-row justify-center">
                            <Text className="text-gray-500">Don't have an account? </Text>
                            <Text className="text-[#FD5B00] font-bold">Sign Up</Text>
                        </TouchableOpacity>

                        {/* Forgot Password Link - Optional */}
                        {/* <TouchableOpacity onPress={() => {}} className="mt-2 flex-row justify-center">
                             <Text className="text-[#FD5B00] font-medium">Forgot Password?</Text>
                        </TouchableOpacity> */}
                    </View>
                ) : (
                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-700 font-medium mb-2 ml-1">Phone Number</Text>
                            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-12">
                                <Text className="text-gray-500 font-medium">+91</Text>
                                <View className="h-full w-[1px] bg-gray-300 mx-3" />
                                <TextInput
                                    className="flex-1 text-base text-gray-900"
                                    placeholder="Enter your mobile number"
                                    value={phone}
                                    onChangeText={(text) => {
                                        const val = text.replace(/\D/g, '');
                                        if (val.length <= 10) setPhone(val);
                                    }}
                                    keyboardType="phone-pad"
                                    editable={!otpSent}
                                />
                                {otpSent && (
                                    <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); }}>
                                        <Text className="text-[#FD5B00] font-medium text-xs">CHANGE</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {otpSent && (
                            <View>
                                <Text className="text-gray-700 font-medium mb-2 ml-1">Enter OTP</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-12">
                                    <Ionicons name="key-outline" size={20} color="gray" />
                                    <TextInput
                                        className="flex-1 ml-3 text-base text-gray-900 tracking-widest"
                                        placeholder="XXXXXX"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={otpSent ? handleVerifyOTP : handleSendOTP}
                            disabled={loading}
                            className={`bg-[#FD5B00] rounded-xl py-4 mt-6 flex-row justify-center items-center shadow-lg shadow-orange-200 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <Text className="text-white text-lg font-bold">
                                    {otpSent ? 'Verify & Login' : 'Send OTP'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/signup')} className="mt-4 flex-row justify-center">
                            <Text className="text-gray-500">Don't have an account? </Text>
                            <Text className="text-[#FD5B00] font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Login;

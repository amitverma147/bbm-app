import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (location: { lat: number; lng: number; address: any }) => void;
    initialLocation?: { lat: number; lng: number };
}


const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ visible, onClose, onConfirm, initialLocation }) => {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState("Locating...");
    const [currentCoords, setCurrentCoords] = useState(initialLocation || { lat: 28.6139, lng: 77.2090 }); // Default Delhi
    const [addressDetails, setAddressDetails] = useState<any>(null);

    // HTML/JS for Leaflet Map
    const mapHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { width: 100%; height: 100vh; }
                .leaflet-control-container .leaflet-routing-container-hide { display: none; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', { zoomControl: false }).setView([${currentCoords.lat}, ${currentCoords.lng}], 15);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                // Send center updates to RN
                function sendCenter() {
                    var center = map.getCenter();
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'center',
                        lat: center.lat,
                        lng: center.lng
                    }));
                }

                map.on('moveend', sendCenter);
                
                // Expose function to fly to location
                window.flyTo = function(lat, lng) {
                    map.flyTo([lat, lng], 15);
                }
            </script>
        </body>
        </html>
    `;

    useEffect(() => {
        if (visible) {
            getCurrentLocation();
        }
    }, [visible]);

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setAddress("Permission to access location was denied");
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setCurrentCoords({ lat: latitude, lng: longitude });

            // Move map
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`window.flyTo(${latitude}, ${longitude}); true;`);
            }
            // Fetch address
            fetchAddress(latitude, longitude);

        } catch (error) {
            console.warn("Location error:", error);
            setAddress("Failed to get current location");
        } finally {
            setLoading(false);
        }
    };

    const fetchAddress = async (lat: number, lng: number) => {
        setAddress("Fetching address...");
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'BigBestMartApp/1.0'
                    }
                }
            );
            const data = await response.json();

            if (data.display_name) {
                setAddress(data.display_name);
                setAddressDetails(data); // Includes .address object
            } else {
                setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
            }
        } catch (error) {
            setAddress("Address not found");
        }
    };

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'center') {
                setCurrentCoords({ lat: data.lat, lng: data.lng });
                fetchAddress(data.lat, data.lng);
            }
        } catch (e) {
            // ignore
        }
    };

    const handleConfirm = () => {
        onConfirm({
            lat: currentCoords.lat,
            lng: currentCoords.lng,
            address: addressDetails || { display_name: address }
        });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Feather name="arrow-left" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Location</Text>
                </View>

                {/* Map Container */}
                <View style={{ flex: 1, position: 'relative' }}>
                    <WebView
                        ref={webViewRef}
                        source={{ html: mapHtml }}
                        style={{ flex: 1 }}
                        onMessage={handleMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />

                    {/* Fixed Center Pin */}
                    <View style={styles.centerPinContainer} pointerEvents="none">
                        <View style={styles.pin}>
                            <View style={styles.pinHead} />
                            <View style={styles.pinStick} />
                            <View style={styles.pinPulse} />
                        </View>
                    </View>

                    {/* Current Location Button */}
                    <TouchableOpacity
                        style={styles.currentLocationButton}
                        onPress={getCurrentLocation}
                    >
                        <Feather name="crosshair" size={24} color="#FF6B00" />
                    </TouchableOpacity>

                    {/* Address Overlay */}
                    <View style={styles.addressOverlay}>
                        <Text style={styles.deliveringToText}>Your order will be delivered here</Text>
                        <View style={styles.addressBox}>
                            <Feather name="map-pin" size={20} color="#FF6B00" style={{ marginTop: 2 }} />
                            <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text numberOfLines={2} style={styles.addressText}>{address}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirm Location</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        zIndex: 10
    },
    closeButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    centerPinContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        paddingBottom: 36 // Adjust for pin height to center tip
    },
    pin: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinHead: {
        width: 16,
        height: 16,
        backgroundColor: '#FF6B00',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 22
    },
    pinStick: {
        width: 2,
        height: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        marginTop: -1,
        zIndex: 21
    },
    pinPulse: {
        width: 30,
        height: 30,
        backgroundColor: 'rgba(255, 107, 0, 0.2)',
        borderRadius: 15,
        position: 'absolute',
        top: -7,
        zIndex: 20
    },
    currentLocationButton: {
        position: 'absolute',
        bottom: 220, // Above address overlay
        right: 20,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 30
    },
    addressOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        paddingBottom: 40,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 30
    },
    deliveringToText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    addressBox: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6'
    },
    addressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: 20
    },
    confirmButton: {
        backgroundColor: '#FF6B00',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#FF6B00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default LocationPickerModal;

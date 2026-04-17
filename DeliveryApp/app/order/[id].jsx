import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, SOCKET_URL, ORDER_SERVICE_URL } from '../../services/api';
import io from 'socket.io-client';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

let globalSocket = null;
let globalLocationTimer = null;
let currentlyTrackingOrderId = null;

const startGlobalTracking = async (orderId, onActive) => {
  if (currentlyTrackingOrderId === orderId && globalSocket?.connected) {
    onActive(true);
    return;
  }

  // Cleanup any existing instances
  stopGlobalTracking();

  // 1. Request Permissions (Foreground first, then Background)
  let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    Alert.alert('Permission Denied', 'Foreground location permission is required.');
    return;
  }

  // Background permission is optional but highly recommended for reliability
  try {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
       console.log('Background location permission not granted. Tracking may stop when app is minimized.');
    }
  } catch (e) {
    console.log('Background permission request error:', e);
  }

  const token = await SecureStore.getItemAsync('driverToken');
  if (!token) {
    Alert.alert('Auth Error', 'No driver token found. Please relogin.');
    return;
  }

  // 2. Setup Socket
  globalSocket = io(SOCKET_URL, { 
    auth: { token }, 
    forceNew: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10
  });
  
  globalSocket.on('connect_error', (err) => {
    console.log('Delivery socket connect_error:', err.message);
    // Silent fail in background is better than constant alerts, 
    // but useful for debugging in foreground.
  });

  globalSocket.on('connect', () => {
    console.log('Global tracker connected for order', orderId);
    currentlyTrackingOrderId = orderId;
    
    // Explicitly join the room so we can verify the ID matches the Vendor perfectly in the server logs
    globalSocket.emit('join_tracking_room', orderId);
    
    onActive(true);
  });

  // 3. Start Location Watcher (Independent of socket connect event to ensure it starts immediately)
    globalLocationTimer = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 5000,
        distanceInterval: 0
      },
      (loc) => {
        if (globalSocket && globalSocket.connected) {
           globalSocket.emit('driver_location_update', { 
             orderId, 
             latitude: loc.coords.latitude, 
             longitude: loc.coords.longitude 
           });
        }
      }
    );
};

const stopGlobalTracking = () => {
  if (globalLocationTimer) {
     globalLocationTimer.remove(); // watchPositionAsync returns an object with a remove method
     globalLocationTimer = null;
  }
  if (globalSocket) globalSocket.disconnect();
  
  globalSocket = null;
  currentlyTrackingOrderId = null;
};

export default function OrderDeliveryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [trackingActive, setTrackingActive] = useState(currentlyTrackingOrderId === id);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order?.status === 'SHIPPED') {
      startGlobalTracking(id, setTrackingActive);
    }
  }, [order?.status, id]);

  const fetchOrder = async () => {
    try {
      const data = await api.get(`/orders/${id}/delivery`);
      if (data.id) setOrder(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async () => {
    setLoading(true);
    try {
      await api.put(`/orders/${id}/collect`);
      setOrder((prev) => ({ ...prev, status: 'SHIPPED' }));
      Alert.alert('Collected', 'You have collected the order. Start driving!');
      startGlobalTracking(id, setTrackingActive);
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP from the vendor.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put(`/orders/${id}/deliver`, { otp });
      if (res.message) {
         throw new Error(res.message);
      }
      setOrder((prev) => ({ ...prev, status: 'DELIVERED' }));
      Alert.alert('Success', 'Order successfully delivered!');
      stopGlobalTracking();
      setTrackingActive(false);
      router.back();
    } catch (e) {
      Alert.alert('Error', e.message || 'Invalid OTP or network error.');
    } finally {
      setLoading(false);
    }
  };



  if (loading && !order) return <ActivityIndicator style={styles.center} size="large" />;
  if (!order) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>← Back to Orders</Text>
      </TouchableOpacity>
      
      <View style={styles.card}>
        <Text style={styles.title}>Order #{order.id.substring(0,8)}</Text>
        <Text style={styles.detail}>Status: <Text style={styles.bold}>{order.status}</Text></Text>
        <Text style={styles.detail}>Store: {order.supplierId}</Text>
        <Text style={styles.detail}>Price: ₹{order.totalPrice?.toFixed(2)}</Text>
        <Text style={styles.detail}>Pay Method: {order.paymentMethod}</Text>
      </View>

      {order.status === 'CONFIRMED' && (
        <TouchableOpacity style={styles.collectBtn} onPress={handleCollect} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>COLLECT ORDER</Text>}
        </TouchableOpacity>
      )}

      {order.status === 'SHIPPED' && (
        <View style={styles.deliverSection}>
           <Text style={styles.helper}>Order is in transit. Enter Vendor's PIN to complete delivery.</Text>
           <TextInput 
             style={styles.input} 
             placeholder="6-Digit OTP" 
             keyboardType="number-pad"
             maxLength={6}
             value={otp}
             onChangeText={setOtp}
           />
           <TouchableOpacity style={styles.deliverBtn} onPress={handleDeliver} disabled={loading}>
             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>MARK DELIVERED</Text>}
           </TouchableOpacity>

           {trackingActive && (
             <Text style={styles.trackingHelper}>📡 Broadcasting location to Vendor && Supplier...</Text>
           )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20, paddingTop: 60 },
  backBtn: { marginBottom: 20 },
  backTxt: { color: '#2563eb', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  detail: { fontSize: 16, color: '#475569', marginBottom: 5 },
  bold: { fontWeight: 'bold', color: '#16a34a' },
  collectBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  deliverSection: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 10 },
  helper: { color: '#1e3a8a', fontSize: 14, fontWeight: '600', marginBottom: 15 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#93c5fd', borderRadius: 8, padding: 15, fontSize: 18, textAlign: 'center', letterSpacing: 5, marginBottom: 15 },
  deliverBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  trackingHelper: { marginTop: 15, textAlign: 'center', color: '#10b981', fontSize: 13, fontWeight: 'bold' }
});

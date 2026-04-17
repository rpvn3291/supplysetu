import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import io from 'socket.io-client';
import MapComponent from '../components/MapComponent';

const haversineDistance = (coords1, coords2) => {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371; // Earth root radius in km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const SOCKET_URL = process.env.EXPO_PUBLIC_COMMUNITY_API_URL;

/**
 * ORDER DETAIL SCREEN
 * Shows the deep-dive of a specific order including items and status.
 */
export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routedDistance, setRoutedDistance] = useState(null);
  const [routedEtaMinutes, setRoutedEtaMinutes] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const data = await api.get(`/orders/${orderId}`);
        setOrder(data);
      } catch (err) {
        console.error("Detail Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  // Connect to tracking socket if SHIPPED
  useEffect(() => {
    if (order && order.status === 'SHIPPED') {
      let mySock;

      const connectSocket = async () => {
        const SecureStore = require('expo-secure-store');
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return null;

        const _socket = io(SOCKET_URL, { 
          auth: { token }, 
          forceNew: true,
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10
        });

        _socket.on('connect_error', (err) => {
          console.log('Vendor socket connect_error:', err.message);
          import('react-native').then(rn => rn.Alert.alert('Vendor Socket Error', err.message));
        });

        _socket.on('connect', () => {
          _socket.emit('join_tracking_room', order.id);
        });

        _socket.on('location_update', (data) => {
          setDriverLocation({ lat: data.latitude, lon: data.longitude, time: data.timestamp });
        });

        return _socket;
      };
      
      connectSocket().then(s => { mySock = s; });

      return () => {
        if (mySock) mySock.disconnect();
      };
    }
  }, [order?.status]);

  useEffect(() => {
    if (driverLocation && order?.vendorLocationLat && order?.vendorLocationLon) {
      const getRoute = async () => {
        try {
          const start = `${driverLocation.lon},${driverLocation.lat}`;
          const end = `${order.vendorLocationLon},${order.vendorLocationLat}`;
          const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
          
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            setRoutedDistance(route.distance / 1000); 
            setRoutedEtaMinutes(Math.ceil(route.duration / 60)); 
            
            const coords = route.geometry.coordinates.map(c => ({
              latitude: c[1],
              longitude: c[0]
            }));
            setRouteCoordinates(coords);
          }
        } catch (e) {
          console.log('OSRM route error', e);
        }
      };
      
      getRoute();
    }
  }, [driverLocation?.lat, driverLocation?.lon, order?.vendorLocationLat, order?.vendorLocationLon]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  );

  if (!order) return (
    <View style={styles.center}>
      <Text>Order not found.</Text>
    </View>
  );

  let distanceKm = routedDistance !== null ? routedDistance : null;
  let etaMinutes = routedEtaMinutes !== null ? routedEtaMinutes : null;

  if (distanceKm === null && driverLocation && order.vendorLocationLat && order.vendorLocationLon) {
    distanceKm = haversineDistance(
      { lat: driverLocation.lat, lon: driverLocation.lon },
      { lat: order.vendorLocationLat, lon: order.vendorLocationLon }
    );
    etaMinutes = Math.max(1, Math.ceil(distanceKm / 0.5));
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Status Header */}
        <View style={styles.header}>
          <Text style={styles.orderLabel}>Order ID</Text>
          <Text style={styles.orderId}>#{order.id?.toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: order.status === 'PENDING' ? '#fef3c7' : '#dcfce7' }]}>
            <Text style={[styles.statusText, { color: order.status === 'PENDING' ? '#b45309' : '#15803d' }]}>
              {order.status}
            </Text>
          </View>
        </View>

        {order.status !== 'DELIVERED' && (
          <View style={styles.otpContainer}>
             <Text style={styles.otpLabel}>Delivery PIN (Share with Driver)</Text>
             <Text style={styles.otpValue}>{order.deliveryOtp || '123456'}</Text>
          </View>
        )}

        {/* Delivery Info Mockup / Live Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.timelineText}>Order Placed ({new Date(order.createdAt).toLocaleTimeString()})</Text>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: order.status !== 'PENDING' ? '#16a34a' : '#ddd' }]} />
              <Text style={[styles.timelineText, { color: order.status === 'PENDING' ? '#9ca3af' : '#111827' }]}>
                Supplier Accepted
              </Text>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: (order.status === 'SHIPPED' || order.status === 'DELIVERED') ? '#16a34a' : '#ddd' }]} />
              <Text style={[styles.timelineText, { color: (order.status !== 'SHIPPED' && order.status !== 'DELIVERED') ? '#9ca3af' : '#111827' }]}>
                Driver Collected
              </Text>
            </View>
          </View>

          {/* Active GPS Widget */}
          {order.status === 'SHIPPED' && (
            <View style={[styles.trackingWidget, { padding: 0, overflow: 'hidden' }]}>
              <View style={{ padding: 15, backgroundColor: '#f0fdf4' }}>
                <Text style={styles.trackingTitle}>📡 Live GPS Tracker</Text>
                {driverLocation ? (
                  <View>
                    <Text style={styles.trackingData}>
                      Last Ping: {new Date(driverLocation.time).toLocaleTimeString()}
                    </Text>
                    {distanceKm !== null && (
                      <Text style={[styles.trackingData, { fontWeight: 'bold', marginTop: 5, color: '#047857' }]}>
                        📍 Distance: {distanceKm.toFixed(2)} km  |  ⏱️ ETA: ~{etaMinutes} min
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.trackingData}>Waiting for driver GPS signal...</Text>
                )}
              </View>
              {driverLocation && (
                <MapComponent
                  style={{ width: '100%', height: 250 }}
                  initialRegion={{
                    latitude: driverLocation.lat,
                    longitude: driverLocation.lon,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  region={{
                    latitude: driverLocation.lat,
                    longitude: driverLocation.lon,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  driverLocation={driverLocation}
                  vendorLocation={order.vendorLocationLat && order.vendorLocationLon ? { lat: order.vendorLocationLat, lon: order.vendorLocationLon } : null}
                  routeCoordinates={routeCoordinates}
                />
              )}
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.orderItems?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name || 'Product'} x {item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Summary */}
        <View style={styles.totalSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.val}>₹{order.totalPrice?.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.val}>₹0.00</Text>
          </View>
          <View style={[styles.row, { marginTop: 10, borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 }]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalVal}>₹{order.totalPrice?.toFixed(2)}</Text>
          </View>
        </View>

        {order.status === 'DELIVERED' && (
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: '#fef08a', borderColor: '#fef08a', marginBottom: 15 }]} 
            onPress={() => navigation.navigate('WriteReview', { orderId: order.id, supplierId: order.supplierId })}
          >
            <Text style={[styles.backBtnText, { color: '#854d0e' }]}>Write a Review</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Back to Orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30, backgroundColor: '#f9fafb', padding: 20, borderRadius: 20 },
  orderLabel: { color: '#6b7280', fontSize: 14 },
  orderId: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginVertical: 5 },
  statusBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, marginTop: 5 },
  statusText: { fontWeight: 'bold', fontSize: 14 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  timeline: { paddingLeft: 10, borderLeftWidth: 2, borderColor: '#f3f4f6', marginLeft: 10 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, marginLeft: -17, marginRight: 15 },
  timelineText: { fontSize: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemName: { fontSize: 16, color: '#374151' },
  itemPrice: { fontSize: 16, fontWeight: '600', color: '#111827' },
  totalSection: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#6b7280' },
  val: { color: '#111827', fontWeight: '500' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  totalVal: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  backBtn: { marginTop: 20, padding: 18, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  backBtnText: { color: '#4b5563', fontWeight: 'bold' },
  otpContainer: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#bfdbfe' },
  otpLabel: { color: '#1d4ed8', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  otpValue: { fontSize: 32, fontWeight: 'bold', color: '#1e3a8a', letterSpacing: 5 },
  trackingWidget: { backgroundColor: '#f0fdf4', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 10 },
  trackingTitle: { color: '#166534', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  trackingData: { color: '#15803d', fontSize: 14, lineHeight: 20 }
});
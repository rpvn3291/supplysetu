import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Fixed: Using non-deprecated SafeAreaView
import { api } from '../services/api';

/**
 * ORDER DETAIL SCREEN
 * Shows the deep-dive of a specific order including items and status.
 */
export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

        {/* Delivery Info Mockup */}
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
          </View>
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
  backBtnText: { color: '#4b5563', fontWeight: 'bold' }
});
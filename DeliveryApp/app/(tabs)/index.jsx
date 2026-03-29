import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function DeliveryHomeScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Available'); // 'Available' | 'Active'
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const endpoint = activeTab === 'Available' ? '/orders/ready' : '/orders/active-deliveries';
      const data = await api.get(endpoint); 
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Dashboard</Text>
        <Text style={styles.subtitle}>Manage your delivery requests</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Available' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('Available')}
          >
            <Text style={[styles.tabText, activeTab === 'Available' && styles.activeTabText]}>Available Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Active' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('Active')}
          >
            <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>My Deliveries</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList 
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {activeTab === 'Available' 
              ? 'No delivery requests nearby right now.' 
              : 'You have no active deliveries.'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push(`/order/${item.id}`)}
          >
            <View style={styles.cardHeader}>
               <Text style={styles.orderId}>#{item.id.substring(0,8)}</Text>
               <View style={styles.badge}><Text style={styles.badgeText}>{item.status}</Text></View>
            </View>
            <Text style={styles.detail}>Store: {item.supplierId?.substring(0,6) || "Unknown"}</Text>
            <Text style={styles.detail}>Pay: {item.paymentMethod}</Text>
            <Text style={styles.price}>₹{item.totalPrice?.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 5 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 50 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#166534', fontWeight: 'bold', fontSize: 12 },
  detail: { color: '#475569', fontSize: 14, marginBottom: 5 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginTop: 5 },
  tabContainer: { flexDirection: 'row', marginTop: 20, backgroundColor: '#f8fafc', borderRadius: 8, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTabBtn: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { color: '#64748b', fontWeight: '600' },
  activeTabText: { color: '#2563eb', fontWeight: 'bold' }
});

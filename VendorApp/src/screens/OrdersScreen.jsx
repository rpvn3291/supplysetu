import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

/**
 * ORDERS SCREEN
 * Fixed: Added TouchableOpacity to imports and Received navigation as prop.
 */
export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useContext(AuthContext);

  const loadOrders = async () => {
    try {
      const data = await api.get('/orders/myorders');
      setOrders(data || []);
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) loadOrders();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#16a34a" />;

  return (
    <View style={styles.container}>
      <FlatList 
        data={orders}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={{ padding: 15 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
            activeOpacity={0.7}
          >
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>Order #{item.id?.substring(0,8).toUpperCase()}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.amount}>Total: ₹{item.totalPrice?.toFixed(2)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: item.status === 'PENDING' ? '#fef3c7' : '#dcfce7' }]}>
                <Text style={[styles.badgeText, { color: item.status === 'PENDING' ? '#b45309' : '#15803d' }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#9ca3af' }}>No orders placed yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#16a34a' },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
  date: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  amount: { color: '#374151', fontSize: 14, marginTop: 4, fontWeight: '500' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold' }
});
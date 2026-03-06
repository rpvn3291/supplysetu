import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { api } from '../services/api';
import { CartContext } from '../context/CartContext';

/**
 * MARKET SCREEN
 * Fetches real products from your product-service.
 */
export default function MarketScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart } = useContext(CartContext);

  const loadProducts = async () => {
    try {
      // Calls your product microservice via the centralized API helper
      const data = await api.get('/products');
      setProducts(data.products || []);
    } catch (err) {
      console.error("Market fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
      <Text style={{ marginTop: 10, color: '#666' }}>Fetching Market Prices...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList 
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 15 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>₹{item.price} / {item.unit}</Text>
              <Text style={styles.supplier}>{item.supplierName || 'Verified Supplier'}</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No products available in your area yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  price: { color: '#16a34a', fontWeight: 'bold', fontSize: 16, marginTop: 4 },
  supplier: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#9ca3af' }
});
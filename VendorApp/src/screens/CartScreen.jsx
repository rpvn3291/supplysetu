import React, { useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CartContext } from '../context/CartContext';
import { api } from '../services/api';

/**
 * CART SCREEN
 * Handles order assembly and POSTing to the order-service.
 */
export default function CartScreen() {
  const { cart, total, removeFromCart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    // Assembly of the Order DTO
    const orderData = {
      supplierId: cart[0].supplierId,
      totalPrice: total,
      orderItems: cart.map(i => ({ 
        productId: i._id, 
        quantity: i.quantity, 
        price: i.price, 
        unitOfMeasure: i.unit 
      })),
      vendorLocationLat: 17.3850, 
      vendorLocationLon: 78.4867
    };

    try {
      const res = await api.post('/orders', orderData);
      if (res.id || res._id) {
        Alert.alert("Success 🚀", "Supply order has been broadcasted to the supplier!");
        clearCart();
      } else {
        Alert.alert("Order Failed", res.message || "Could not process checkout.");
      }
    } catch (e) {
      Alert.alert("Network Error", "Check if your Order Microservice is running.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>Your cart is empty.</Text>
      <Text style={styles.subEmpty}>Items you add from the market will appear here.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList 
        data={cart}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bold}>{item.name}</Text>
              <Text style={styles.gray}>Qty: {item.quantity} {item.unit}</Text>
              <Text style={styles.price}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item._id)} style={styles.removeBtn}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Order</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#374151' },
  subEmpty: { textAlign: 'center', color: '#9ca3af', marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bold: { fontWeight: 'bold', fontSize: 17 },
  gray: { color: '#6b7280', marginTop: 2 },
  price: { color: '#16a34a', fontWeight: 'bold', marginTop: 4 },
  removeBtn: { padding: 10 },
  footer: { padding: 25, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 18, color: '#6b7280' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  checkoutBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});
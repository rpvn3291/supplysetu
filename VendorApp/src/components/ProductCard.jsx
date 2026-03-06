import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProductCard({ product, onAdd }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price} / {product.unit}</Text>
        <Text style={styles.supplier}>{product.supplierName}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={onAdd}>
        <Text style={styles.btnText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    elevation: 2 
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { color: '#16a34a', fontWeight: 'bold', marginTop: 4 },
  supplier: { fontSize: 12, color: '#666' },
  btn: { backgroundColor: '#16a34a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
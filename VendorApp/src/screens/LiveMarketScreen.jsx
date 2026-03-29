import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function LiveMarketScreen() {
  const [activeMarkets, setActiveMarkets] = useState([]);
  const [socket, setSocket] = useState(null);
  const { token } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (!token) return;

    // Connect to Community Service
    const COMMUNITY_URL = 'http://192.168.29.42:3005'; 
    const newSocket = io(COMMUNITY_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    newSocket.on('active_markets_list', (markets) => {
      setActiveMarkets(Object.values(markets).filter(m => !m.closed && m.stockQuantity > 0));
    });

    newSocket.on('new_market_started', (marketData) => {
      setActiveMarkets((prev) => {
        if (!prev.some(m => m.marketId === marketData.marketId)) {
           return [...prev, marketData];
        }
        return prev;
      });
    });

    newSocket.on('market_closed', ({ marketId }) => {
        setActiveMarkets((prev) => prev.filter(m => m.marketId !== marketId));
    });

    return () => newSocket.disconnect();
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Live Breaking Deals</Text>
      <FlatList 
        data={activeMarkets}
        keyExtractor={(item) => item.marketId}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <View style={styles.liveBadge}>
                 <Text style={styles.badgeText}>● LIVE</Text>
              </View>
              <Text style={styles.name}>{item.productName}</Text>
              <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
              <Text style={styles.stock}>Stock Left: {item.stockQuantity}</Text>
            </View>
            <TouchableOpacity 
                style={styles.joinBtn} 
                onPress={() => navigation.navigate('LiveSession', { marketId: item.marketId })}
            >
              <Text style={styles.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No Live Deals currently running. Check back later!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', margin: 15, color: '#1f2937' },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  liveBadge: { backgroundColor: '#fecaca', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 5 },
  badgeText: { color: '#dc2626', fontSize: 10, fontWeight: 'bold' },
  name: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  price: { color: '#16a34a', fontWeight: 'bold', fontSize: 18, marginTop: 4 },
  stock: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  joinBtn: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#9ca3af', paddingHorizontal: 20 }
});

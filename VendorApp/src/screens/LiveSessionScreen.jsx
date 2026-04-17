import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert } from 'react-native';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function LiveSessionScreen() {
  const [market, setMarket] = useState(null);
  const [socket, setSocket] = useState(null);
  const [quantityState, setQuantityState] = useState({});
  const [notifications, setNotifications] = useState([]);
  
  const { token } = useContext(AuthContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { marketId } = route.params;

  useEffect(() => {
    if (!token) return;

    const COMMUNITY_URL = process.env.EXPO_PUBLIC_COMMUNITY_API_URL;    const newSocket = io(COMMUNITY_URL, {
      auth: { token },
      forceNew: true
    });
    setSocket(newSocket);

    if (newSocket.connected) {
        newSocket.emit('join_market', marketId);
    }
    
    newSocket.on('connect', () => {
        newSocket.emit('join_market', marketId);
    });

    newSocket.on('market_update', (marketData) => {
      setMarket(marketData);
    });

    newSocket.on('market_closed', () => {
        Alert.alert("Market Closed", "Session has ended or stock ran out.");
        setMarket(prev => prev ? { ...prev, closed: true } : null);
    });

    newSocket.on('market_purchase', (data) => {
        setNotifications(prev => [...prev, data.message]);
    });

    newSocket.on('market_error', (data) => {
        Alert.alert("Live Market Error", data.message);
    });

    newSocket.on('connect_error', (err) => {
        Alert.alert("Connection Error", "Could not connect to the live server. Please try again.");
        navigation.goBack();
    });

    return () => newSocket.disconnect();
  }, [marketId, token]);

  const handleBuy = (productId, maxStock) => {
    const qty = parseInt(quantityState[productId] || '1', 10);
    if (socket && market && !market.closed && qty > 0) {
      if (qty > maxStock) {
          Alert.alert("Stock Issue", `Only ${maxStock} left.`);
          return;
      }
      socket.emit('buy_product', { marketId, productId, quantity: qty });
      setQuantityState(prev => ({ ...prev, [productId]: '1' }));
    }
  };

  if (!market) return (
    <SafeAreaView style={styles.center}>
      <Text style={{color: '#666'}}>Connecting to Live Session...</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.marketCard}>
         <View style={styles.liveBadge}><Text style={styles.badgeText}>● LIVE FLASH DEAL</Text></View>
         <Text style={styles.name}>{market.title || "Exclusive Mega Deal"}</Text>
      </View>

      {!market.closed && market.products?.length > 0 ? (
        <ScrollView style={{maxHeight: 250, marginBottom: 15}} nestedScrollEnabled>
            {market.products.map((p, idx) => (
                <View key={p.productId || idx} style={styles.buySection}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center'}}>
                        <Text style={styles.buyLabel}>{p.productName}</Text>
                        <Text style={styles.price}>₹{p.price.toFixed(2)}</Text>
                    </View>
                    <Text style={{color: '#6b7280', marginBottom: 10}}>Stock left: <Text style={{fontWeight: 'bold', color: '#3b82f6'}}>{p.stockQuantity}</Text></Text>
                    
                    {p.stockQuantity > 0 ? (
                        <View style={styles.buyRow}>
                            <TextInput 
                                style={styles.input}
                                keyboardType="numeric"
                                value={quantityState[p.productId] || '1'}
                                onChangeText={(val) => setQuantityState(prev => ({...prev, [p.productId]: val}))}
                            />
                            <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(p.productId, p.stockQuantity)}>
                                <Text style={styles.buyBtnText}>Quick Buy</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.closedSection, {padding: 10, marginBottom: 0}]}><Text style={styles.closedText}>Sold Out!</Text></View>
                    )}
                </View>
            ))}
        </ScrollView>
      ) : (
          <View style={styles.closedSection}>
             <Text style={styles.closedText}>This Live Deal has Ended</Text>
          </View>
      )}

      <Text style={styles.logTitle}>Live Activity Feed</Text>
      <ScrollView style={styles.logs}>
         {notifications.map((msg, idx) => (
             <Text key={idx} style={styles.logText}>⚡ {msg}</Text>
         ))}
         {notifications.length === 0 && <Text style={{color:'#aaa', textAlign:'center', marginTop:20}}>Waiting for purchases...</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  marketCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2, marginBottom: 20 },
  liveBadge: { backgroundColor: '#fecaca', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  badgeText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { color: '#16a34a', fontWeight: 'bold', fontSize: 22 },
  stock: { color: '#3b82f6', fontWeight: 'bold', fontSize: 16 },
  buySection: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 1, marginBottom: 20 },
  buyLabel: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  buyRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 15, fontSize: 18, backgroundColor: '#fff' },
  buyBtn: { backgroundColor: '#16a34a', paddingHorizontal: 25, justifyContent: 'center', borderRadius: 8, paddingVertical: 10 },
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closedSection: { padding: 20, backgroundColor: '#fee2e2', borderRadius: 10, marginBottom: 20 },
  closedText: { color: '#dc2626', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
  logTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  logs: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, elevation: 1 },
  logText: { color: '#4b5563', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 8 }
});

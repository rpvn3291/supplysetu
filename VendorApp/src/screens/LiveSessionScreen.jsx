import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert } from 'react-native';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function LiveSessionScreen() {
  const [market, setMarket] = useState(null);
  const [socket, setSocket] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [notifications, setNotifications] = useState([]);
  
  const { token } = useContext(AuthContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { marketId } = route.params;

  useEffect(() => {
    if (!token) return;

    const COMMUNITY_URL = 'https://community-4v39.onrender.com'; 
    const newSocket = io(COMMUNITY_URL, {
      auth: { token }
    });
    setSocket(newSocket);

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

  const handleBuy = () => {
    const qty = parseInt(quantity, 10);
    if (socket && market && !market.closed && qty > 0) {
      if (qty > market.stockQuantity) {
          Alert.alert("Stock Issue", `Only ${market.stockQuantity} left.`);
          return;
      }
      socket.emit('buy_product', { marketId, quantity: qty });
      setQuantity('1');
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
         <View style={styles.liveBadge}><Text style={styles.badgeText}>● LIVE SELLING</Text></View>
         <Text style={styles.name}>{market.productName}</Text>
         <View style={styles.row}>
            <Text style={styles.price}>₹{market.price.toFixed(2)}</Text>
            <Text style={styles.stock}>{market.stockQuantity} Remaining</Text>
         </View>
      </View>

      {!market.closed && market.stockQuantity > 0 ? (
        <View style={styles.buySection}>
            <Text style={styles.buyLabel}>Quantity Needed:</Text>
            <View style={styles.buyRow}>
               <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
               />
               <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
                  <Text style={styles.buyBtnText}>Quick Buy</Text>
               </TouchableOpacity>
            </View>
        </View>
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
  buyLabel: { fontSize: 16, color: '#4b5563', marginBottom: 10 },
  buyRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 15, fontSize: 18, backgroundColor: '#fff' },
  buyBtn: { backgroundColor: '#16a34a', paddingHorizontal: 25, justifyContent: 'center', borderRadius: 8 },
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  closedSection: { padding: 20, backgroundColor: '#fee2e2', borderRadius: 10, marginBottom: 20 },
  closedText: { color: '#dc2626', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
  logTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  logs: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, elevation: 1 },
  logText: { color: '#4b5563', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 8 }
});

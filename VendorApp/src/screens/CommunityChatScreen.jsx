import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function CommunityChatScreen() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Community State
  const [presidentId, setPresidentId] = useState(null);
  const [activePoll, setActivePoll] = useState(null);
  const [activeBulkOrder, setActiveBulkOrder] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  
  // Inputs for President features
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('');
  
  const [bulkOrderProduct, setBulkOrderProduct] = useState('');
  const [bulkOrderProductId, setBulkOrderProductId] = useState('');
  const [bulkOrderSupplierId, setBulkOrderSupplierId] = useState('');
  
  const [bulkCommitQuantity, setBulkCommitQuantity] = useState('');

  const { token, decodeToken } = useContext(AuthContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { pincode } = route.params;
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    
    // Attempt decoding token to get user ID
    try {
        let decoded;
        if (decodeToken) {
            decoded = decodeToken(token);
        } else {
            // Simplified Base64 decode for React Native
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const pad = base64.length % 4;
            const padded = pad ? base64 + new Array(5 - pad).join('=') : base64;
            
            // Fast polyfill for atob
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            let str = '';
            let i = 0;
            for (
              let bc = 0, bs, buffer, idx = 0;
              buffer = padded.charAt(idx++);
              ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                bc++ % 4) ? str += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
            ) {
              buffer = chars.indexOf(buffer);
            }
            decoded = JSON.parse(str);
        }
        if (decoded && decoded.id) setMyUserId(decoded.id);
    } catch(e) { console.log('Decode error:', e); }

    const COMMUNITY_URL = process.env.EXPO_PUBLIC_COMMUNITY_API_URL;    const newSocket = io(COMMUNITY_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
        newSocket.emit('join_room', pincode);
    });

    newSocket.on('community_info', (data) => setPresidentId(data.presidentId));
    newSocket.on('chat_history', (history) => setMessages(Array.isArray(history) ? history : []));
    newSocket.on('receive_message', (msg) => {
        setMessages(prev => Array.isArray(prev) ? [...prev, msg] : [msg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
    });

    // Event Listeners for Polls
    newSocket.on('poll_update', (poll) => setActivePoll(poll));
    newSocket.on('new_poll', (poll) => setActivePoll(poll));
    newSocket.on('poll_error', (err) => Alert.alert("Poll Error", err.message));

    // Event Listeners for Bulk Orders
    newSocket.on('bulk_order_update', (order) => setActiveBulkOrder(order));
    newSocket.on('new_bulk_order', (order) => setActiveBulkOrder(order));
    newSocket.on('bulk_order_finalized', (data) => {
        Alert.alert("Success!", data.message);
        setActiveBulkOrder(null);
    });
    newSocket.on('bulk_order_error', (err) => Alert.alert("Bulk Order Error", err.message));
    
    newSocket.on('error_message', (err) => Alert.alert("Community Error", err.message));
    newSocket.on('connect_error', () => {
        Alert.alert("Connection Error", "Could not connect to the community server.");
        navigation.goBack();
    });

    return () => newSocket.disconnect();
  }, [pincode, token]);

  const isPresident = myUserId === presidentId;

  const sendMessage = () => {
    if (inputText.trim() && socket) {
      socket.emit('send_message', { pincode, message: inputText.trim() });
      setInputText('');
    }
  };

  const handleVote = (option) => {
      if(socket) socket.emit('vote', { pincode, option });
  };

  const handleCommitBulk = () => {
      if(socket && bulkCommitQuantity) {
          socket.emit('commit_to_bulk_order', { pincode, quantity: parseInt(bulkCommitQuantity, 10) });
          setBulkCommitQuantity('');
      }
  };

  // President Functions
  const handleStartPoll = () => {
      if(socket && pollQuestion && pollOptions) {
          const optionsArr = pollOptions.split(',').map(o => o.trim()).filter(o => o);
          socket.emit('start_poll', { pincode, question: pollQuestion, options: optionsArr });
          setPollQuestion(''); setPollOptions('');
      }
  };

  const [searchResults, setSearchResults] = useState([]);
  const handleSearchProducts = async (text) => {
      setBulkOrderProduct(text);
      setBulkOrderProductId('');
      setBulkOrderSupplierId('');
      if (!text) {
          setSearchResults([]);
          return;
      }
      try {
          const res = await fetch(`http://192.168.29.42:3002/api/products?search=${text}`);
          const data = await res.json();
          setSearchResults(data.products || []);
      } catch(e) {
          console.error(e);
      }
  };

  const selectProduct = (p) => {
      setBulkOrderProduct(p.name);
      setBulkOrderProductId(p._id);
      setBulkOrderSupplierId(p.supplierId);
      setSearchResults([]);
  };

  const handleStartBulkOrder = () => {
      if(socket && bulkOrderProduct && bulkOrderProductId && bulkOrderSupplierId) {
          socket.emit('start_bulk_order', { pincode, productId: bulkOrderProductId, productName: bulkOrderProduct, supplierId: bulkOrderSupplierId });
          setBulkOrderProduct(''); setBulkOrderProductId(''); setBulkOrderSupplierId('');
      } else if (socket && bulkOrderProduct) {
          Alert.alert("Warning", "Please select a valid product from the dropdown list.");
      }
  };

  const handleFinalizeBulkOrder = () => {
      if(socket) {
          socket.emit('finalize_bulk_order', { pincode, pricePerUnit: 100 });
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <Text style={styles.pincodeTitle}>Pincode {pincode} Hub</Text>
         {isPresident && <View style={styles.presidentBadge}><Text style={styles.presidentText}>President</Text></View>}
      </View>

      <FlatList
        ref={flatListRef}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item, idx) => item._id ? item._id.toString() : idx.toString()}
        contentContainerStyle={{ padding: 15 }}
        ListHeaderComponent={() => (
            <View>
                {/* Active Poll Widget */}
                {activePoll && (
                    <View style={styles.widgetCard}>
                        <Text style={styles.widgetTitle}>📊 Community Poll: {activePoll.question}</Text>
                        {Object.keys(activePoll.options || {}).map(key => (
                            <TouchableOpacity key={key} style={styles.optionBtn} onPress={() => handleVote(key)}>
                                <Text style={styles.optionTxt}>{key}</Text>
                                <Text style={styles.voteCount}>{activePoll.options[key]} votes</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Active Bulk Order Widget */}
                {activeBulkOrder && (
                     <View style={[styles.widgetCard, {borderColor: '#16a34a', borderWidth: 1}]}>
                         <Text style={[styles.widgetTitle, {color: '#16a34a'}]}>📦 Active Bulk Order: {activeBulkOrder.productName}</Text>
                         <Text style={{color: '#4b5563', marginBottom: 10}}>Total Community Pledged: {activeBulkOrder.total} units</Text>
                         
                         <View style={{flexDirection: 'row', gap: 10}}>
                             <TextInput style={styles.smallInput} placeholder="Qty" keyboardType="numeric" value={bulkCommitQuantity} onChangeText={setBulkCommitQuantity} />
                             <TouchableOpacity style={styles.smallBtn} onPress={handleCommitBulk}>
                                 <Text style={styles.btnText}>Pledge</Text>
                             </TouchableOpacity>
                         </View>

                         {isPresident && (
                              <TouchableOpacity style={[styles.presidentButton, {marginTop: 15}]} onPress={handleFinalizeBulkOrder}>
                                  <Text style={styles.btnText}>FINALIZE & PLACE BIG ORDER</Text>
                              </TouchableOpacity>
                         )}
                     </View>
                )}

                 {/* President Controls */}
                {isPresident && !activePoll && !activeBulkOrder && (
                     <View style={styles.presidentTools}>
                         <Text style={styles.presidentToolsTitle}>President Tools</Text>
                         <TextInput style={styles.inputBox} placeholder="Poll Question" value={pollQuestion} onChangeText={setPollQuestion} />
                         <TextInput style={styles.inputBox} placeholder="Options (comma separated)" value={pollOptions} onChangeText={setPollOptions} />
                         <TouchableOpacity style={styles.presidentButton} onPress={handleStartPoll}><Text style={styles.btnText}>Start Poll</Text></TouchableOpacity>
                         
                         <View style={{height: 15}} />
                         <TextInput style={styles.inputBox} placeholder="Search Product for Bulk Order..." value={bulkOrderProduct} onChangeText={handleSearchProducts} />
                         
                         {searchResults.length > 0 && (
                             <View style={{maxHeight: 150, backgroundColor: '#fff', borderColor: '#ca8a04', borderWidth: 1, borderRadius: 5, marginBottom: 10}}>
                                 <ScrollView nestedScrollEnabled>
                                     {searchResults.map(p => (
                                         <TouchableOpacity key={p._id} onPress={() => selectProduct(p)} style={{padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee'}}>
                                             <Text style={{fontWeight: 'bold'}}>{p.name}</Text>
                                             <Text style={{fontSize: 12, color: '#666'}}>Supplier: {p.supplierName} - ₹{p.price}</Text>
                                         </TouchableOpacity>
                                     ))}
                                 </ScrollView>
                             </View>
                         )}

                         <TouchableOpacity style={[styles.presidentButton, {backgroundColor: '#16a34a'}]} onPress={handleStartBulkOrder}><Text style={styles.btnText}>Start Bulk Order</Text></TouchableOpacity>
                     </View>
                )}
            </View>
        )}
        renderItem={({ item }) => {
            const isMe = item.userId === myUserId;
            return (
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    {!isMe && <Text style={styles.senderName}>{item.isPresident ? '👑 President' : 'Vendor'}</Text>}
                    <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>{item.message}</Text>
                </View>
            );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        <View style={styles.inputArea}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#fff', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  pincodeTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  presidentBadge: { backgroundColor: '#fef08a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  presidentText: { color: '#854d0e', fontSize: 12, fontWeight: 'bold' },
  
  // Chat
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  myBubble: { backgroundColor: '#8b5cf6', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  myMessageText: { color: '#fff', fontSize: 15 },
  otherMessageText: { color: '#1f2937', fontSize: 15 },
  senderName: { fontSize: 10, color: '#6b7280', marginBottom: 2, fontWeight: 'bold' },
  
  // Input
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb' },
  chatInput: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  sendButton: { backgroundColor: '#8b5cf6', justifyContent: 'center', borderRadius: 20, paddingHorizontal: 20 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
  
  // Widgets
  widgetCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
  widgetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  optionBtn: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 8 },
  optionTxt: { fontWeight: 'bold', color: '#374151' },
  voteCount: { color: '#8b5cf6', fontWeight: 'bold' },
  smallInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10 },
  smallBtn: { backgroundColor: '#8b5cf6', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  
  // President tools
  presidentTools: { backgroundColor: '#fef08a', padding: 15, borderRadius: 10, marginBottom: 15 },
  presidentToolsTitle: { fontWeight: 'bold', color: '#854d0e', marginBottom: 10 },
  inputBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ca8a04', padding: 10, borderRadius: 8, marginBottom: 10 },
  presidentButton: { backgroundColor: '#ca8a04', padding: 12, borderRadius: 8 }
});

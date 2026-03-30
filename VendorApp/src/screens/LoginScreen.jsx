import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function LoginScreen() {
  const { signIn, continueAsGuest } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Required", "Enter email and password");
    
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.token) {
        await signIn(data.token);
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Network Error", "Check your connection and backend IP address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Supply Setu</Text>
      <Text style={styles.subtitle}>Vendor Mobile Edition</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email Address" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log In</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest} disabled={loading}>
        <Text style={styles.guestBtnText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#16a34a' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  input: { width: '100%', height: 50, borderBottomWidth: 1.5, borderColor: '#ddd', marginBottom: 20, paddingHorizontal: 10, fontSize: 16 },
  btn: { backgroundColor: '#16a34a', width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  guestBtn: { backgroundColor: 'transparent', width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#16a34a' },
  guestBtnText: { color: '#16a34a', fontWeight: '600', fontSize: 16 }
});
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// Make sure to set your actual Auth Microservice IP
const API_URL = 'http://192.168.29.42:3001/api/auth'; 

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      // Ensure the user is actually a driver
      if (response.data.user.role !== 'DRIVER') {
          Alert.alert("Access Denied", "Only Delivery Drivers can log into this application.");
          return;
      }
      
      await login(response.data.token, response.data.user);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials or network issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="bicycle" size={60} color="#16a34a" />
        </View>
        <Text style={styles.title}>SupplySetu Delivery</Text>
        <Text style={styles.subtitle}>Log in to start your shift</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="driver@supplysetu.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>New driver? <Text style={{fontWeight: 'bold', color: '#16a34a'}}>Register here</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    backgroundColor: '#dcfce7',
    padding: 20,
    borderRadius: 50,
    marginBottom: 20
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 5 },
  form: { paddingHorizontal: 30 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#6b7280', fontSize: 15 }
});

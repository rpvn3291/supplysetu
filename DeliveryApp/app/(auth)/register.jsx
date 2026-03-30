import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://supplysetu-lzxv.onrender.com/api/auth';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    vehicleType: 'Bike',
    licensePlate: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (Object.values(form).some(val => val === '')) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role: 'DRIVER',
        email: form.email,
        password: form.password,
        profileData: {
          firstName: form.firstName,
          lastName: form.lastName,
          phoneNumber: form.phoneNumber,
          vehicleType: form.vehicleType,
          licensePlate: form.licensePlate,
          pincode: form.pincode
        }
      };

      await axios.post(`${API_URL}/register`, payload);
      Alert.alert('Success', 'Registration complete! You can now log in.');
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 30, paddingBottom: 60 }}>
       <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
         <Ionicons name="arrow-back" size={28} color="#111827" />
       </TouchableOpacity>

      <Text style={styles.title}>Become a Driver</Text>
      <Text style={styles.subtitle}>Join our delivery fleet</Text>

      <Text style={styles.label}>First Name</Text>
      <TextInput style={styles.input} value={form.firstName} onChangeText={(t) => setForm({...form, firstName: t})} />

      <Text style={styles.label}>Last Name</Text>
      <TextInput style={styles.input} value={form.lastName} onChangeText={(t) => setForm({...form, lastName: t})} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(t) => setForm({...form, email: t})} />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} secureTextEntry value={form.password} onChangeText={(t) => setForm({...form, password: t})} />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput style={styles.input} keyboardType="phone-pad" value={form.phoneNumber} onChangeText={(t) => setForm({...form, phoneNumber: t})} />

      <Text style={styles.label}>Vehicle Type (e.g. Bike, Van)</Text>
      <TextInput style={styles.input} value={form.vehicleType} onChangeText={(t) => setForm({...form, vehicleType: t})} />

      <Text style={styles.label}>License Plate number</Text>
      <TextInput style={styles.input} autoCapitalize="characters" value={form.licensePlate} onChangeText={(t) => setForm({...form, licensePlate: t})} />

      <Text style={styles.label}>Operating Pincode</Text>
      <TextInput style={styles.input} keyboardType="numeric" maxLength={6} value={form.pincode} onChangeText={(t) => setForm({...form, pincode: t})} />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 5, marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 15, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#16a34a', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

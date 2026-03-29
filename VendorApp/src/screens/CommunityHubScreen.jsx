import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CommunityHubScreen() {
  const [pincode, setPincode] = useState('');
  const navigation = useNavigation();

  const handleJoin = () => {
    if (!pincode || pincode.length < 5) {
      Alert.alert('Invalid Pincode', 'Please enter a valid postal code to join your local community.');
      return;
    }
    // Navigate to Chat screen passing the pincode
    navigation.navigate('CommunityChat', { pincode });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.center}>
        <View style={styles.card}>
            <Text style={styles.title}>Join Local Community</Text>
            <Text style={styles.subtitle}>Connect with other street vendors in your area to negotiate better bulk deals directly from suppliers.</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Enter Pincode (e.g. 110001)"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
            />
            
            <TouchableOpacity style={styles.btn} onPress={handleJoin}>
                <Text style={styles.btnText}>Enter Community Room</Text>
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', width: '100%', padding: 25, borderRadius: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#8b5cf6', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 15, fontSize: 18, backgroundColor: '#f9fafb', marginBottom: 20, textAlign: 'center', letterSpacing: 2 },
  btn: { backgroundColor: '#8b5cf6', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export default function WriteReviewScreen({ route, navigation }) {
  const { orderId, supplierId } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!orderId || !supplierId) {
      Alert.alert('Error', 'Missing order or supplier information.');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/reviews', {
        targetUserId: supplierId,
        orderId,
        rating: Number(rating),
        comment
      });
      
      Alert.alert('Success', 'Your review has been submitted to the blockchain!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
       Alert.alert('Error', error.message || 'Failed to submit the review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>Write a Product Review</Text>
        <Text style={styles.subtitle}>Order: #{orderId?.substring(0,8) || 'Unknown'}</Text>
        
        <View style={styles.ratingContainer}>
           <Text style={styles.label}>Rating: {rating}/5</Text>
           <View style={styles.starsRow}>
             {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={[styles.star, { color: rating >= star ? '#eab308' : '#e5e7eb' }]}>★</Text>
                </TouchableOpacity>
             ))}
           </View>
        </View>

        <Text style={styles.label}>Comment (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Share details of your experience..."
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 30 },
  ratingContainer: { marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 10 },
  starsRow: { flexDirection: 'row' },
  star: { fontSize: 45, marginRight: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 15, fontSize: 16, marginTop: 5, marginBottom: 30, height: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#eab308', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});

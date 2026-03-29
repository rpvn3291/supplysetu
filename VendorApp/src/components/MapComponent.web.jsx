import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapComponent = ({ style }) => {
  return (
    <View style={[style, styles.placeholder]}>
      <Text style={styles.text}>📍 Native map view is not available on web.</Text>
      <Text style={styles.subtext}>You can still see the tracking data in the dashboard.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center'
  },
  subtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center'
  }
});

export default MapComponent;

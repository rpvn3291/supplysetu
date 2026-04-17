import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// API Base URLs
export const ORDER_SERVICE_URL = process.env.EXPO_PUBLIC_ORDER_API_URL;
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_API_URL;

const getHeaders = async () => {
  const token = await SecureStore.getItemAsync('driverToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  get: async (endpoint) => {
    const headers = await getHeaders();
    const response = await fetch(`${ORDER_SERVICE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return response.json();
  },
  put: async (endpoint, body) => {
    const headers = await getHeaders();
    const response = await fetch(`${ORDER_SERVICE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return response.json();
  },
};

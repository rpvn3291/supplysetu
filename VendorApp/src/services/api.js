import * as SecureStore from 'expo-secure-store';

/**
 * CENTRALIZED API SERVICE
 * This handles all communication with your backend microservices.
 */

// REPLACE WITH YOUR ACTUAL IP ADDRESS (e.g., http://192.168.1.5:3000/api)
const BASE_URL = "http://192.168.29.42:3000/api"; 

export const api = {
  /**
   * Helper for GET requests
   */
  get: async (endpoint) => {
    const token = await SecureStore.getItemAsync('userToken');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  /**
   * Helper for POST requests
   */
  post: async (endpoint, body) => {
    const token = await SecureStore.getItemAsync('userToken');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response.json();
  },
};
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * CENTRALIZED API SERVICE
 * This handles all communication with your backend microservices.
 */

// Production Gateway URL
const BASE_URL = "https://supplysetu-lzxv.onrender.com/api"; 

/*
// Local Development logic (commented out for now as requested)
import Constants from 'expo-constants';
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0];
const DEV_BASE_URL = __DEV__ && localhost ? `http://${localhost}:3000/api` : BASE_URL;
*/

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
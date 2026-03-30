import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Production Gateway URL
export const ORDER_SERVICE_URL = "https://supplysetu-lzxv.onrender.com/api";

/*
// Local Development logic (commented out for now as requested)
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0];
const DEV_ORDER_SERVICE_URL = __DEV__ && localhost ? `http://${localhost}:3000/api` : ORDER_SERVICE_URL;
*/

export const SOCKET_URL = "https://community-4v39.onrender.com"; // Keeping local IP for socket as it's not deployed yet

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

import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { usePushNotifications } from '../hooks/usePushNotifications';
import axios from 'axios';

// Production Gateway URL
const API_URL = 'https://supplysetu-lzxv.onrender.com/api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('driverToken');
        const storedUser = await SecureStore.getItemAsync('driverUser');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load storage', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoading]);

  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (token && expoPushToken) {
      axios.put(`${API_URL}/push-token`, { token: expoPushToken }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(e => console.log('Failed to sync push token', e.message));
    }
  }, [token, expoPushToken]);

  const login = async (newToken, userData) => {
    await SecureStore.setItemAsync('driverToken', newToken);
    await SecureStore.setItemAsync('driverUser', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('driverToken');
    await SecureStore.deleteItemAsync('driverUser');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

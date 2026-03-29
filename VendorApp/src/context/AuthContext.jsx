import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { usePushNotifications } from '../hooks/usePushNotifications';
import axios from 'axios';

const API_URL = 'http://192.168.29.42:3001/api/auth';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        setUserToken(token);
      } catch (e) {
        console.log("Token restore error", e);
      }
      setIsLoading(false);
    };
    loadToken();
  }, []);

  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (userToken && expoPushToken) {
      axios.put(`${API_URL}/push-token`, { token: expoPushToken }, {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch(e => console.log('Failed to sync push token', e.message));
    }
  }, [userToken, expoPushToken]);

  const signIn = async (token) => {
    await SecureStore.setItemAsync('userToken', token);
    setUserToken(token);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('userToken');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ token: userToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
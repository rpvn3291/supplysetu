import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import LoginScreen from '../screens/LoginScreen';
import MarketScreen from '../screens/MarketScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import LiveMarketScreen from '../screens/LiveMarketScreen'; // NEW
import LiveSessionScreen from '../screens/LiveSessionScreen'; // NEW
import CommunityHubScreen from '../screens/CommunityHubScreen'; // NEW
import CommunityChatScreen from '../screens/CommunityChatScreen'; // NEW
import WriteReviewScreen from '../screens/WriteReviewScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * BOTTOM TAB NAVIGATOR
 */
function MainTabs() {
  const { cart } = useContext(CartContext);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Tab.Navigator 
      screenOptions={{ 
        tabBarActiveTintColor: '#16a34a',
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Tab.Screen name="Market" component={MarketScreen} options={{ title: 'B2B Market' }} />
      <Tab.Screen name="LiveDeals" component={LiveMarketScreen} options={{ title: 'Live Deals', tabBarActiveTintColor: '#ef4444' }} />
      <Tab.Screen name="Community" component={CommunityHubScreen} options={{ title: 'Community', tabBarActiveTintColor: '#8b5cf6' }} />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ 
          title: 'My Cart',
          tabBarBadge: cartCount > 0 ? cartCount : null 
        }} 
      />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

/**
 * MAIN APP NAVIGATOR
 */
export default function AppNavigator() {
  const { token, isLoading, isGuest } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null && !isGuest ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="AppTabs" component={MainTabs} />
            <Stack.Screen 
              name="OrderDetail" 
              component={OrderDetailScreen} 
              options={{ 
                headerShown: true, 
                title: 'Order Status',
                headerBackTitle: 'Back'
              }} 
            />
            <Stack.Screen 
              name="LiveSession" 
              component={LiveSessionScreen} 
              options={{ 
                headerShown: true, 
                title: 'Live Selling',
                headerBackTitle: 'Back',
                headerTintColor: '#dc2626'
              }} 
            />
            <Stack.Screen 
              name="CommunityChat" 
              component={CommunityChatScreen} 
              options={{ 
                headerShown: true, 
                title: 'Local Community',
                headerBackTitle: 'Leave',
                headerTintColor: '#8b5cf6'
              }} 
            />
            <Stack.Screen 
              name="WriteReview" 
              component={WriteReviewScreen} 
              options={{ 
                headerShown: true, 
                title: 'Review Product',
                headerBackTitle: 'Cancel',
                headerTintColor: '#eab308'
              }} 
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
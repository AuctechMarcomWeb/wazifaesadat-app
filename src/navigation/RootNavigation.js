import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setToken, setUser } from '../redux/slice/userSlice';
import { preloadToken } from '../api/apiConfig';
import { getProfile } from '../api/auth';
import AuthNavigation from './AuthNavigation';
import UnauthNavigation from './UnauthNavigation';

const RootNavigation = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Pre-warm token cache for faster API calls
        await preloadToken();

        // Restore from AsyncStorage
        const savedToken = await AsyncStorage.getItem('authToken');
        const savedUser = await AsyncStorage.getItem('userData');

        if (savedToken) {
          dispatch(setToken(savedToken));
        }

        if (savedUser) {
          dispatch(setUser(JSON.parse(savedUser)));
        }

        // Fetch fresh profile with permissions after token is set
        if (savedToken) {
          try {
            console.log('📡 Fetching profile with permissions...');
            const profileResult = await getProfile();

            if (profileResult.success && profileResult.user) {
              console.log('✅ Profile fetched successfully');
              // Update user with fresh permissions
              dispatch(
                setUser({
                  ...profileResult.user,
                  permissions: profileResult.permissions || [],
                  role: profileResult.role,
                })
              );

              // Save updated user data
              await AsyncStorage.setItem(
                'userData',
                JSON.stringify(profileResult.user)
              );
            } else {
              console.warn('⚠️ Profile fetch failed:', profileResult.message);
            }
          } catch (profileError) {
            console.error('❌ Error fetching profile:', profileError.message);
            // Don't fail the bootstrap - user can still navigate
          }
        }
      } catch (e) {
        console.error('❌ Error in bootstrap:', e.message);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Check both token and isAuthenticated flag
  const isUserAuthenticated = token && isAuthenticated;

  return (
    <NavigationContainer>
      {isUserAuthenticated ? <AuthNavigation /> : <UnauthNavigation />}
    </NavigationContainer>
  );
};

export default RootNavigation;



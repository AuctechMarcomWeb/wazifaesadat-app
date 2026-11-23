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

const loadingContainerStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
};

const RootNavigation = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user } = useSelector((state) => state.user);
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
              console.log('📋 isNew:', profileResult.user?.isNew);
              
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
      <View style={loadingContainerStyle}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Check both token and isAuthenticated flag
  const isUserAuthenticated = token && isAuthenticated;

  // If user is authenticated but isNew is true, we'll handle it in AuthNavigation
  // by showing CreateProfile first. For now, let's check if we should show Unauth screens
  
  return (
    <NavigationContainer>
      {isUserAuthenticated ? (
        user?.isNew ? (
          // For now, treat new user as unauthenticated to show CreateProfile flow
          <UnauthNavigation initialRouteName="CreateProfile" />
        ) : (
          <AuthNavigation />
        )
      ) : (
        <UnauthNavigation />
      )}
    </NavigationContainer>
  );
};

export default RootNavigation;



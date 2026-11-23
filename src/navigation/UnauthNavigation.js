import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../Screens/UnauthScreen/SplashScreen/SplashScreen';
import LoginScreen from '../Screens/UnauthScreen/LoginScreen/LoginScreen';
import SignupScreen from '../Screens/UnauthScreen/SignupScreen';
import OtpVerifyScreen from '../Screens/UnauthScreen/OtpVerifyScreen';
import CreateProfileScreen from '../Screens/UnauthScreen/CreateProfileScreen';

const Stack = createNativeStackNavigator();

const UnauthNavigation = ({ initialRouteName = 'Splash' }) => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ animationEnabled: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animationEnabled: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          animationEnabled: true,
          animationTypeForReplace: 'pop',
        }}
      />
      <Stack.Screen
        name="OtpVerify"
        component={OtpVerifyScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="CreateProfile"
        component={CreateProfileScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default UnauthNavigation;

import React, { useEffect, useRef } from 'react';

import {
  View,
  Text,
  Image,
  StatusBar,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),

      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, loadingAnim]);

  return (
    <LinearGradient
      colors={colors.gradients.logo}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        backgroundColor={colors.primary2}
        barStyle="light-content"
        translucent={false}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/awsm-logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Organization Details */}
        <Animated.View
          style={[styles.organizationContainer, { opacity: fadeAnim }]}
        >
          {/* Gold Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />

            <View style={styles.diamond} />

            <View style={styles.dividerLine} />
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            A Trust for Education, Scholarship,
          </Text>

          <Text style={styles.tagline}>Welfare and Community Service</Text>
        </Animated.View>
      </View>

      {/* Loading Section */}
      <Animated.View
        style={[styles.loadingContainer, { opacity: loadingAnim }]}
      >
        <ActivityIndicator size="large" color={colors.accent} />

        <Text style={styles.loadingText}>Preparing your experience...</Text>

        <Text style={styles.footerText}>© AWSM | All Rights Reserved</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Main Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },

  // Logo
  logoContainer: {
    width: wp('88%'),
    height: wp('23%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  // Organization Details
  organizationContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp('52%'),
    marginBottom: hp('2.2%'),
    alignSelf: 'center',
  },

  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.accent,
  },

  diamond: {
    width: 10,
    height: 10,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 13,
  },

  // Tagline
  tagline: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#E9F5EC',
    textAlign: 'center',
    lineHeight: 25,
    letterSpacing: 0.3,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingBottom: hp('4%'),
  },

  loadingText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.white,
    marginTop: hp('1.8%'),
  },

  footerText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: '#D6DCCF',
    marginTop: hp('2.5%'),
    letterSpacing: 0.3,
  },
});

export default SplashScreen;

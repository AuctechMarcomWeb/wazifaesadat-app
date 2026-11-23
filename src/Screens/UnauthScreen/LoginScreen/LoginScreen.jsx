import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import AppLayout from '../../../components/AppLayout/AppLayout';
import {
  loginWithPassword,
  getProfile,
  loginWithGoogle,
} from '../../../api/auth';
import { loginSuccess, loginError } from '../../../redux/slice/userSlice';

const GoogleLogoSvg = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.54-1.14 2.85-2.4 3.72v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.22z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
    />
  </Svg>
);

GoogleSignin.configure({
  webClientId:
    '598449951150-tl4nn3mckhrgf22fqf1p182jncualhn1.apps.googleusercontent.com',
  offlineAccess: false,
});
const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // eslint-disable-line no-unused-vars
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const isBusy = loading || googleLoading;

  const completeLoginSession = async (token, fallbackUser = null) => {
    console.log('🔑 Saving token to AsyncStorage');
    await AsyncStorage.setItem('authToken', token);
    await new Promise(resolve => setTimeout(resolve, 400));

    console.log('📡 Fetching profile...');
    const profileResult = await getProfile();

    if (profileResult.success) {
      console.log('✅ Profile fetched:', {
        isNew: profileResult.user?.isNew,
        userId: profileResult.user?.userId,
      });

      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(profileResult.user),
      );

      const fullUser = {
        ...profileResult.user,
        permissions: profileResult.permissions,
        role: profileResult.role,
      };

      console.log('📤 Dispatching loginSuccess to Redux');
      dispatch(
        loginSuccess({
          token,
          user: fullUser,
        }),
      );

      // ✅ Check if new user needs profile creation
      if (profileResult.user?.isNew) {
        console.log('🔴 User is NEW - navigating to CreateProfile');
        setTimeout(() => {
          navigation?.navigate?.('CreateProfile');
        }, 100);
      } else {
        console.log(
          '🟢 User is existing - RootNavigation will handle redirect',
        );
      }

      return true;
    }

    if (fallbackUser) {
      console.log('⚠️ Using fallback user:', {
        isNew: fallbackUser?.isNew,
      });

      await AsyncStorage.setItem('userData', JSON.stringify(fallbackUser));
      dispatch(
        loginSuccess({
          token,
          user: fallbackUser,
        }),
      );

      if (fallbackUser?.isNew) {
        console.log('🔴 Fallback user is NEW - navigating to CreateProfile');
        setTimeout(() => {
          navigation?.navigate?.('CreateProfile');
        }, 100);
      }

      return true;
    }

    setError(profileResult.message || 'Failed to fetch profile');
    dispatch(loginError(profileResult.message));
    return false;
  };

  const handleLogin = async () => {
    setError('');
    const identifier = userId.trim();

    if (!identifier) {
      setError('Please enter User ID, Email, or Mobile Number');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const loginResult = await loginWithPassword(identifier, password);

      if (loginResult.success) {
        await completeLoginSession(loginResult.token, loginResult.user);
      } else {
        setError(loginResult.message || 'Login failed. Please try again.');
        dispatch(loginError(loginResult.message));
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please try again.';
      setError(errorMsg);
      dispatch(loginError(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isBusy) return;

    setError('');
    setGoogleLoading(true);

    try {
      console.log('🔵 Google Sign-In initiated');

      // 1. Check Google Play Services
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // 2. Open Google Sign-In
      const response = await GoogleSignin.signIn();

      // 3. Handle cancellation
      if (response.type !== 'success') {
        console.log('⚠️ Google Sign-In cancelled');
        return;
      }

      // 4. Get Google ID Token
      let idToken = response.data?.idToken;

      // Fallback: Fetch token directly
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken;
      }

      if (!idToken) {
        throw new Error(
          'Google ID token not received. Please check Google configuration.',
        );
      }

      console.log('✅ Google ID Token received');

      // 5. Send ID Token to Backend
      console.log('📡 Sending token to backend...');
      const loginResult = await loginWithGoogle(idToken);

      console.log('📥 Google Login API Response:', {
        success: loginResult?.success,
        hasUser: !!loginResult?.user,
        isNew: loginResult?.user?.isNew,
      });

      // 6. Normalize Backend Response
      const responseData =
        loginResult?.data?.data || loginResult?.data || loginResult;

      const token =
        responseData?.authToken || responseData?.token || loginResult?.token;

      const user = responseData?.user || responseData;

      // 7. Validate Backend Response
      if (!loginResult?.success || !token) {
        throw new Error(
          loginResult?.message ||
            responseData?.message ||
            'Google login failed. Invalid server response.',
        );
      }

      console.log('✅ Google login successful - completing session');

      // 8. Save Login Session, Redux & Navigate
      await completeLoginSession(token, user);
    } catch (err) {
      console.log('❌ Google Sign-In Error:', err);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      let errorMessage = 'Google Sign-In failed. Please try again.';

      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services is not available.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      dispatch(loginError(errorMessage));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AppLayout>
      <StatusBar backgroundColor="#005A32" barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Premium Green Header */}
          <LinearGradient
            colors={['#006B3B', '#00834A', '#004D28']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />

            <View style={styles.headerContent}>
              <View style={styles.logoCard}>
                <Image
                  source={require('../../../assets/awsm-logo-transparent.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.headerBadge}>
                <Icon name="shield-check" size={13} color="#F4D47B" />
                <Text style={styles.headerBadgeText}>
                  Education • Scholarship • Welfare
                </Text>
              </View>
            </View>

            <View style={styles.headerBottomCurve} />
          </LinearGradient>

          {/* Main Login Form Section */}
          <View style={styles.mainContent}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.formTitle}>Welcome Back</Text>
                  <Text style={styles.formSubtitle}>
                    Sign in with User ID, Email, or Google
                  </Text>
                </View>

                <View style={styles.lockIcon}>
                  <Icon name="lock-check" size={22} color="#007A43" />
                </View>
              </View>

              {/* Error Message */}
              {!!error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle-outline" size={18} color="#D93636" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* User ID / Email / Mobile Field */}
              <Text style={styles.label}>User ID</Text>
              <View
                style={[
                  styles.inputContainer,
                  (focusedField === 'userId' || !!userId) && styles.inputActive,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Icon
                    name={
                      userId.includes('@') ? 'email-outline' : 'account-outline'
                    }
                    size={20}
                    color="#007A43"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  // placeholder="Enter User ID, Email, or Mobile"
                  placeholder="Enter User ID"
                  placeholderTextColor="#A0AAB0"
                  value={userId}
                  onChangeText={setUserId}
                  onFocus={() => setFocusedField('userId')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                />
              </View>

              {/* Password Field */}
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  (focusedField === 'password' || !!password) &&
                    styles.inputActive,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Icon name="lock-outline" size={20} color="#007A43" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0AAB0"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isBusy}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isBusy}
                >
                  <Icon
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#7B8794"
                  />
                </TouchableOpacity>
              </View>

              {/* Remember Me (Forgot Password replaced as requested) */}
              {/* <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.rememberContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  disabled={isBusy}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxActive,
                    ]}
                  >
                    {rememberMe && (
                      <Icon name="check" size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </TouchableOpacity>
              </View> */}

              {/* Login Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleLogin}
                disabled={isBusy}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#00834A', '#006B3B', '#004E27']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>
                        Login to Account
                      </Text>
                      <View style={styles.buttonArrow}>
                        <Icon name="arrow-right" size={18} color="#FFFFFF" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              {/* Continue with Google (SVG Icon) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGoogleLogin}
                disabled={isBusy}
                style={[styles.googleButton, isBusy && styles.disabledButton]}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#1F3329" />
                ) : (
                  <>
                    <View style={styles.googleIconWrap}>
                      <GoogleLogoSvg size={20} />
                    </View>
                    <Text style={styles.googleButtonText}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Sign Up Redirect */}
              <View style={styles.signupRow}>
                <Text style={styles.signupPrompt}>
                  Don&apos;t have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation?.navigate?.('Signup')}
                  disabled={isBusy}
                >
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerDivider}>
                <View style={styles.footerLine} />
                <View style={styles.footerDiamond} />
                <View style={styles.footerLine} />
              </View>
              <Text style={styles.footerTitle}>
                Anjuman Wazifa-e-Sadat Wa Momineen
              </Text>
              <Text style={styles.copyright}>© AWSM | All Rights Reserved</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('3%'),
  },
  header: {
    height: hp('32%'),
    minHeight: 230,
    maxHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: 'relative',
    paddingTop: hp('1.5%'),
  },
  circleOne: {
    position: 'absolute',
    width: wp('70%'),
    height: wp('70%'),
    borderRadius: wp('35%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    top: -wp('30%'),
    right: -wp('15%'),
  },
  circleTwo: {
    position: 'absolute',
    width: wp('60%'),
    height: wp('60%'),
    borderRadius: wp('30%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    bottom: -wp('25%'),
    left: -wp('20%'),
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: wp('5%'),
  },
  logoCard: {
    width: wp('90%'),
    height: hp('11%'),
    minHeight: 75,
    maxHeight: 95,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: hp('0.5%'),
  },
  headerBadgeText: {
    fontSize: wp('2.9%'),
    fontFamily: FontFamily.medium,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  headerBottomCurve: {
    position: 'absolute',
    bottom: -35,
    width: wp('100%'),
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 100,
  },
  mainContent: {
    paddingHorizontal: wp('5%'),
    marginTop: -hp('4.5%'),
    zIndex: 3,
  },
  formCard: {
    backgroundColor: colors?.white || '#FFFFFF',
    borderRadius: 24,
    padding: wp('5.5%'),
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 6,
    shadowColor: '#0D3D24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('2.2%'),
  },
  formTitle: {
    fontSize: wp('4.8%'),
    fontFamily: FontFamily.bold,
    color: '#123F2A',
  },
  formSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#7A8C82',
    marginTop: 3,
  },
  lockIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E6F4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFD7D7',
    padding: 11,
    borderRadius: 10,
    marginBottom: hp('1.8%'),
  },
  errorText: {
    flex: 1,
    color: '#D93636',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    marginLeft: 8,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#2B4237',
    marginBottom: hp('0.6%'),
  },
  inputContainer: {
    height: hp('6.8%'),
    minHeight: 50,
    maxHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 12,
    paddingHorizontal: wp('3%'),
    marginBottom: hp('2%'),
  },
  inputActive: {
    borderColor: '#006B3B',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E8F3EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: wp('2.5%'),
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#1F3329',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#A8BCB0',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
  },
  checkboxActive: {
    backgroundColor: '#006B3B',
    borderColor: '#006B3B',
  },
  rememberText: {
    fontSize: FontSize.sm,
    color: '#5C6E63',
    fontFamily: FontFamily.medium,
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#006B3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loginButton: {
    height: hp('6.8%'),
    minHeight: 50,
    maxHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('1.6%'),
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2ECE5',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#7A8C82',
  },
  googleButton: {
    height: hp('6.8%'),
    minHeight: 50,
    maxHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D6E2DA',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#0D3D24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#1F3329',
  },
  disabledButton: {
    opacity: 0.65,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('1.8%'),
  },
  signupPrompt: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#5C6E63',
  },
  signupLink: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#006B3B',
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('1.4%'),
  },
  securityText: {
    fontSize: FontSize.sm,
    color: '#758A7E',
    fontFamily: FontFamily.regular,
    marginLeft: 5,
  },
  footer: {
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp('35%'),
    marginBottom: hp('1.2%'),
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9B65C',
  },
  footerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: '#D9B65C',
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 8,
  },
  footerTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#cad5ce',
    textAlign: 'center',
  },
  copyright: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: '#8C9E93',
    marginTop: 6,
  },
});

export default LoginScreen;

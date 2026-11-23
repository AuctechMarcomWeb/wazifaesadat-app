


import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import AppLayout from '../../components/AppLayout/AppLayout';
import { loginSuccess } from '../../redux/slice/userSlice';
import { registerWithOtp, verifyEmailOtp } from '../../api/auth';

const OTP_LENGTH = 4;

const OtpVerifyScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { email = '', contact = '', channel = 'email' } = route?.params || {};

  const targetEmail = (email || contact || '').trim().toLowerCase();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleDigitChange = (value, index) => {
    setError('');
    const clean = value.replace(/\D/g, '');

    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Support pasting full 4-digit OTP
    if (clean.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      clean
        .slice(0, OTP_LENGTH)
        .split('')
        .forEach((ch, idx) => {
          next[idx] = ch;
        });
      setDigits(next);
      const focusIdx = Math.min(clean.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setInfoMessage('');
    const otpCode = digits.join('');

    if (!targetEmail) {
      setError('Email address is missing. Please go back and try again.');
      return;
    }

    if (otpCode.length < OTP_LENGTH) {
      setError(`Please enter all ${OTP_LENGTH} digits of the OTP`);
      return;
    }

    setVerifying(true);

    try {
      const result = await verifyEmailOtp(targetEmail, otpCode);

      if (result.success && result.token) {
        await AsyncStorage.setItem('authToken', result.token);
        if (result.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(result.user));
          dispatch(loginSuccess({ token: result.token, user: result.user }));
        }

        // ✅ Debug: Log the user object to verify isNew is present
        console.log('🔍 Verification Result:', {
          success: result.success,
          userExists: !!result.user,
          userKeys: result.user ? Object.keys(result.user) : [],
          isNewValue: result.user?.isNew,
        });

        // ✅ Check isNew and navigate immediately
        if (result.user?.isNew) {
          console.log('🔄 Navigating to CreateProfile - isNew is true');
          navigation?.replace?.('CreateProfile');
        } else {
          console.log('✅ Navigating to Login - isNew is false or not set');
          navigation?.replace?.('Login');
        }
      } else {
        setError(
          result.message || 'OTP verification failed. Please try again.',
        );
      }
    } catch (err) {
      setError(err?.message || 'OTP verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (secondsLeft > 0 || resending || verifying) return;
    setError('');
    setInfoMessage('');

    if (!targetEmail) {
      setError('Email address is missing. Please go back and try again.');
      return;
    }

    setResending(true);

    try {
      const result = await registerWithOtp(targetEmail);

      if (result.success) {
        setDigits(Array(OTP_LENGTH).fill(''));
        setSecondsLeft(60);
        setInfoMessage(`A new 4-digit code was sent to ${targetEmail}.`);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message || 'Could not resend OTP.');
      }
    } catch (err) {
      setError(err?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
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
          {/* Header */}
          <LinearGradient
            colors={['#006B3B', '#00834A', '#004D28']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation?.goBack?.()}
              disabled={verifying || resending}
            >
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.otpHeroCircle}>
                <Icon name="message-badge-outline" size={32} color="#F4D47B" />
              </View>
              <Text style={styles.headerTitle}>OTP Verification</Text>
              <Text style={styles.headerSubtitle}>
                {channel === 'mobile'
                  ? '4-digit SMS code sent to your mobile'
                  : '4-digit verification code sent to your email'}
              </Text>
            </View>
          </LinearGradient>

          {/* Card */}
          <View style={styles.mainContent}>
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Enter Verification Code</Text>
              <Text style={styles.cardSubtitle}>
                Code sent to{' '}
                <Text style={styles.contactHighlight}>
                  {targetEmail || 'your email'}
                </Text>
              </Text>

              {!!error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle-outline" size={18} color="#D93636" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {!!infoMessage && (
                <View style={styles.infoContainer}>
                  <Icon name="check-circle-outline" size={18} color="#006B3B" />
                  <Text style={styles.infoText}>{infoMessage}</Text>
                </View>
              )}

              {/* 4-Box OTP Input */}
              <View style={styles.otpRow}>
                {digits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={el => {
                      inputRefs.current[index] = el;
                    }}
                    style={[
                      styles.otpBox,
                      focusedIndex === index && styles.otpBoxFocused,
                      !!digit && styles.otpBoxFilled,
                    ]}
                    value={digit}
                    onChangeText={val => handleDigitChange(val, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                    editable={!verifying && !resending}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVerifyOtp}
                disabled={verifying || resending}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#00834A', '#006B3B', '#004E27']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.verifyButton}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.verifyButtonText}>
                        Verify & Continue
                      </Text>
                      <View style={styles.buttonArrow}>
                        <Icon name="check" size={18} color="#FFFFFF" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Resend Timer */}
              <View style={styles.resendRow}>
                {secondsLeft > 0 ? (
                  <Text style={styles.timerText}>
                    Resend OTP in{' '}
                    <Text style={styles.timerBold}>{secondsLeft}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={verifying || resending}
                  >
                    <Text style={styles.resendLink}>
                      {resending ? 'Sending OTP...' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: hp('3%') },
  header: {
    height: hp('28%'),
    minHeight: 205,
    maxHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: hp('2%'),
    left: wp('5%'),
    zIndex: 4,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: wp('6%'),
  },
  otpHeroCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  mainContent: {
    paddingHorizontal: wp('5%'),
    marginTop: -hp('2.5%'),
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
  cardTitle: {
    fontSize: wp('4.6%'),
    fontFamily: 'Poppins-Bold',
    color: '#123F2A',
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#7A8C82',
    marginTop: 4,
    marginBottom: hp('2%'),
  },
  contactHighlight: {
    fontFamily: 'Poppins-SemiBold',
    color: '#1F3329',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFD7D7',
    padding: 11,
    borderRadius: 10,
    marginBottom: hp('1.6%'),
  },
  errorText: {
    flex: 1,
    color: '#D93636',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EC',
    borderWidth: 1,
    borderColor: '#B8DEC8',
    padding: 11,
    borderRadius: 10,
    marginBottom: hp('1.6%'),
  },
  infoText: {
    flex: 1,
    color: '#006B3B',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('3.5%'),
    marginBottom: hp('2.4%'),
  },
  otpBox: {
    width: wp('14%'),
    height: wp('15%'),
    maxWidth: 58,
    maxHeight: 62,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DCE5E0',
    backgroundColor: '#F8FAF9',
    textAlign: 'center',
    fontSize: wp('5.5%'),
    fontFamily: 'Poppins-Bold',
    color: '#123F2A',
  },
  otpBoxFocused: {
    borderColor: '#006B3B',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderColor: '#00834A',
    backgroundColor: '#EBF6F0',
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
  verifyButton: {
    height: hp('6.8%'),
    minHeight: 50,
    maxHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  verifyButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
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
  resendRow: {
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  timerText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#7A8C82',
  },
  timerBold: {
    fontFamily: 'Poppins-SemiBold',
    color: '#1F3329',
  },
  resendLink: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#006B3B',
  },
});

export default OtpVerifyScreen;
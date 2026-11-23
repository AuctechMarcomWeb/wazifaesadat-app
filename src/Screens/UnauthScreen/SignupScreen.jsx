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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import AppLayout from '../../components/AppLayout/AppLayout';
import { registerWithOtp } from '../../api/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await registerWithOtp(trimmedEmail);

      if (result.success) {
        navigation?.navigate?.('OtpVerify', {
          email: result.email || trimmedEmail,
          channel: result.channel || 'email',
        });
      } else {
        setError(result.message || 'Unable to send OTP. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
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
              disabled={loading}
            >
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.logoCard}>
                <Image
                  source={require('../../assets/awsm-logo-transparent.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.mainContent}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.formTitle}>Create Account</Text>
                  <Text style={styles.formSubtitle}>
                    Enter your email to receive an OTP
                  </Text>
                </View>

                <View style={styles.badgeIcon}>
                  <Icon name="email-fast-outline" size={22} color="#007A43" />
                </View>
              </View>

              {!!error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle-outline" size={18} color="#D93636" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email */}
              <Text style={styles.label}>Email Address</Text>
              <View
                style={[
                  styles.inputContainer,
                  (focusedField === 'email' || !!email) && styles.inputActive,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Icon name="email-outline" size={20} color="#007A43" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#A0AAB0"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSendOtp}
                disabled={loading}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#00834A', '#006B3B', '#004E27']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        Continue & Verify OTP
                      </Text>
                      <View style={styles.buttonArrow}>
                        <Icon name="arrow-right" size={18} color="#FFFFFF" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation?.navigate?.('Login')}
                  disabled={loading}
                >
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
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
    paddingHorizontal: wp('5%'),
  },
  logoCard: {
    width: wp('80%'),
    height: hp('9%'),
    minHeight: 62,
    maxHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  logo: { width: '100%', height: '100%' },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: wp('2.9%'),
    fontFamily: FontFamily.medium,
    color: '#FFFFFF',
    marginLeft: 6,
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
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
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
  badgeIcon: {
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
    marginBottom: hp('1.6%'),
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
    marginBottom: hp('0.5%'),
  },
  inputContainer: {
    height: hp('6.5%'),
    minHeight: 48,
    maxHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 12,
    paddingHorizontal: wp('3%'),
    marginBottom: hp('1.6%'),
  },
  inputActive: { borderColor: '#006B3B', backgroundColor: '#FFFFFF' },
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
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: hp('0.6%'),
    elevation: 4,
    shadowColor: '#006B3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitButton: {
    height: hp('6.8%'),
    minHeight: 50,
    maxHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  submitButtonText: {
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('1.8%'),
  },
  loginPrompt: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#5C6E63',
  },
  loginLink: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#006B3B',
  },
});

export default SignupScreen;
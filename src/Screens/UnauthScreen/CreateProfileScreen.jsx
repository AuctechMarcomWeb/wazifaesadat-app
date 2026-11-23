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
  Alert,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import {
  CountryPicker,
  StatePicker,
  CityPicker,
} from 'react-native-country-state-city-picker';

import AppLayout from '../../components/AppLayout/AppLayout';
import { loginSuccess } from '../../redux/slice/userSlice';

import { updateUserProfile, verifyWhatsAppOtp, resendWhatsAppOtp } from '../../api/auth';

const OTP_LENGTH = 6;

const GREEN = '#006B3B';

const CreateProfileScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const reduxUser = useSelector(
    state => state?.user?.user || state?.auth?.user,
  );

  const routeUser = route?.params?.user;
  const targetUserId =
    routeUser?._id ||
    routeUser?.id ||
    route?.params?.userId ||
    reduxUser?._id ||
    reduxUser?.id;

  // Profile fields
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(
    routeUser?.name || reduxUser?.name || '',
  );

  const [phone, setPhone] = useState(
    routeUser?.phone || reduxUser?.phone || '',
  );
  const [phoneCode, setPhoneCode] = useState('+91');

  // Country, State, City objects
  const [country, setCountry] = useState(null);
  const [state, setState] = useState(null);
  const [city, setCity] = useState(null);

  // Loading and errors
  const [loading, setLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState('');

  // OTP
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));

  const inputRefs = useRef([]);

  // --------------------------------
  // TIMER EFFECT
  // --------------------------------

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // --------------------------------
  // COUNTRY SELECTION
  // --------------------------------

  const handleCountryChange = selectedCountry => {
    setCountry(selectedCountry);
    setState(null);
    setCity(null);

    // Country data in this package documents ISO code,
    // flag and currency, but not a guaranteed calling-code field.
    // Keep +91 until you connect a calling-code data source.
    setPhoneCode(
      selectedCountry?.dialCode ||
        selectedCountry?.callingCode ||
        selectedCountry?.phoneCode ||
        '+91',
    );

    setError('');
  };

  // --------------------------------
  // STATE SELECTION
  // --------------------------------

  const handleStateChange = selectedState => {
    setState(selectedState);
    setCity(null);
    setError('');
  };

  // --------------------------------
  // CITY SELECTION
  // --------------------------------

  const handleCityChange = selectedCity => {
    setCity(selectedCity);
    setError('');
  };

  // --------------------------------
  // SAVE AUTH SESSION
  // --------------------------------

  const saveSession = async (token, updatedUser) => {
    if (token) {
      await AsyncStorage.setItem('authToken', token);
    }

    if (updatedUser) {
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      // ✅ Just update Redux
      // RootNavigation will automatically detect isAuthenticated = true
      // and switch to AuthNavigation (where CommunityPost is available)
      dispatch(
        loginSuccess({
          token: token || undefined,
          user: updatedUser,
        }),
      );
      
      // ✅ That's it! Don't manually navigate
      // Navigation happens automatically via RootNavigation
    }
  };

  // --------------------------------
  // UPDATE PROFILE API
  // --------------------------------

  const handleCreateProfile = async () => {
    setError('');

    const name = fullName.trim();
    const mobile = phone.trim();

    if (!targetUserId) {
      setError('User ID not found. Please log in again.');
      return;
    }

    if (!name) {
      setError('Please enter your full name');
      return;
    }

    if (!country) {
      setError('Please select your country');
      return;
    }

    if (!state) {
      setError('Please select your state');
      return;
    }

    if (!city) {
      setError('Please select your city');
      return;
    }

    if (!mobile || mobile.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `${phoneCode}${mobile}`;

      const payload = {
        name,
        fullName: name,
        country: country.name,
        countryCode: country.isoCode,
        state: state.name,
        stateCode: state.isoCode,
        city: city.name,
        phone: mobile,
        phoneCode,
        whatsappNumber: fullPhone,
      };

      console.log('Update Profile Payload:', { id: targetUserId, ...payload });

      const result = await updateUserProfile(targetUserId, payload);

      if (result?.success) {
        if (result.whatsappPending) {
          setDigits(Array(OTP_LENGTH).fill(''));
          setSecondsLeft(60); // Start 60-second countdown
          setStep(2);
          setError('');

          Alert.alert(
            'Details Submitted',
            'Your details have been submitted successfully. Please check your WhatsApp and enter the code to verify your number.',
          );
        } else {
          const existingToken = await AsyncStorage.getItem('authToken');
          await saveSession(existingToken, result.user);
        }
      } else {
        setError(result?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.log('Update Profile Error:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to update profile',
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // OTP INPUT HANDLER
  // --------------------------------

  const handleDigitChange = (value, index) => {
    setError('');

    const clean = value.replace(/\D/g, '');

    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Handle OTP paste
    if (clean.length > 1) {
      const next = Array(OTP_LENGTH).fill('');

      clean
        .slice(0, OTP_LENGTH)
        .split('')
        .forEach((digit, idx) => {
          next[idx] = digit;
        });

      setDigits(next);

      const nextIndex = Math.min(clean.length, OTP_LENGTH - 1);

      inputRefs.current[nextIndex]?.focus();
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

  // --------------------------------
  // VERIFY WHATSAPP OTP
  // --------------------------------

  const handleVerifyOtp = async () => {
    setError('');

    const otpCode = digits.join('');

    if (otpCode.length !== OTP_LENGTH) {
      setError(`Please enter all ${OTP_LENGTH} digits`);
      return;
    }

    setOtpVerifying(true);

    try {
      const result = await verifyWhatsAppOtp(targetUserId, otpCode);

      if (result?.success) {
        await saveSession(result.token, result.user);
      } else {
        setError(result?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.log('Verify OTP Error:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'OTP verification failed',
      );
    } finally {
      setOtpVerifying(false);
    }
  };

  // --------------------------------
  // RESEND WHATSAPP OTP
  // --------------------------------

  const handleResendWhatsAppOtp = async () => {
    if (secondsLeft > 0 || resending || otpVerifying) return;
    setError('');

    if (!targetUserId) {
      setError('User ID not found. Please try again.');
      return;
    }

    const fullPhone = `${phoneCode}${phone}`;

    if (!fullPhone || fullPhone.length < 10) {
      setError('WhatsApp number is not available. Please go back and try again.');
      return;
    }

    setResending(true);

    try {
      const result = await resendWhatsAppOtp(targetUserId, fullPhone);

      if (result?.success) {
        setDigits(Array(OTP_LENGTH).fill(''));
        setSecondsLeft(60);
        setError('');
        inputRefs.current[0]?.focus();
      } else {
        setError(result?.message || 'Could not resend OTP.');
      }
    } catch (err) {
      console.log('Resend OTP Error:', err);
      setError(err?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // --------------------------------
  // SKIP OTP (BUTTON ONLY)
  // --------------------------------

  const handleSkipOtp = async () => {
    if (skipLoading) return;
    setSkipLoading(true);
    setError('');

    try {
      console.log('🔵 Skip OTP clicked');
      console.log('📋 Target User ID:', targetUserId);

      // ✅ Call backend to mark profile complete
      // This updates database isNew = false
      const skipResult = await updateUserProfile(targetUserId, {
        name: fullName,
        phone: phone.trim(),
        country: country?.name,
        countryCode: country?.isoCode,
        state: state?.name,
        stateCode: state?.isoCode,
        city: city?.name,
        // ⭐ Intentionally NOT including whatsappNumber
        // So backend will set isNew = false without sending WhatsApp OTP
      });

      console.log('Skip Result:', skipResult);

      if (skipResult?.success) {
        const existingToken = await AsyncStorage.getItem('authToken');
        const updatedUser = {
          ...skipResult.user,
          isNew: false, // Mark complete
        };

        console.log('✅ Calling saveSession after skip');
        await saveSession(existingToken, updatedUser);
      } else {
        setError(skipResult?.message || 'Unable to skip');
      }
    } catch (err) {
      console.log('❌ Skip OTP Error:', err);
      setError(err?.message || 'Unable to continue');
    } finally {
      setSkipLoading(false);
    }
  };

  // --------------------------------
  // COMMON ERROR COMPONENT
  // --------------------------------

  const ErrorMessage = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={19} color="#D93636" />

        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  // --------------------------------
  // STEP 1: CREATE PROFILE
  // --------------------------------

  if (step === 1) {
    return (
      <AppLayout>
        <StatusBar backgroundColor={GREEN} barStyle="light-content" />

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
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
                <Icon name="arrow-left" size={21} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <View style={styles.headerIcon}>
                  <Icon
                    name="account-multiple-plus"
                    size={29}
                    color="#F4D47B"
                  />
                </View>

                <Text style={styles.headerTitle}>Create Your Profile</Text>

                <Text style={styles.headerSubtitle}>
                  Step 1 of 2 - Personal Details
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.mainContent}>
              <View style={styles.formCard}>
                <ErrorMessage />

                {/* FULL NAME */}

                <Text style={styles.label}>Full Name</Text>

                <View style={styles.inputContainer}>
                  <Icon
                    name="account-outline"
                    size={21}
                    color={GREEN}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#A0AAB0"
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>

                {/* COUNTRY */}

                <CountryPicker
                  value={country}
                  onChange={handleCountryChange}
                  placeholder="Select country"
                  style={styles.pickerContainer}
                  inputStyle={styles.pickerInput}
                  labels={{
                    countryLabel: 'Country',
                    countryPlaceholder: 'Select country',
                    searchPlaceholder: 'Search country...',
                  }}
                />

                {/* STATE */}

                <StatePicker
                  value={state}
                  onChange={handleStateChange}
                  countryCode={country?.isoCode}
                  placeholder={
                    country ? 'Select state' : 'Select country first'
                  }
                  style={styles.pickerContainer}
                  inputStyle={styles.pickerInput}
                  labels={{
                    stateLabel: 'State',
                    statePlaceholder: 'Select state',
                    searchPlaceholder: 'Search state...',
                  }}
                />

                {/* CITY */}

                <CityPicker
                  value={city}
                  onChange={handleCityChange}
                  countryCode={country?.isoCode}
                  stateCode={state?.isoCode}
                  placeholder={state ? 'Select city' : 'Select state first'}
                  style={styles.pickerContainer}
                  inputStyle={styles.pickerInput}
                  labels={{
                    cityLabel: 'City',
                    cityPlaceholder: 'Select city',
                    searchPlaceholder: 'Search city...',
                  }}
                />

                {/* PHONE NUMBER */}

                <Text style={styles.label}>Phone Number</Text>

                <View style={styles.phoneContainer}>
                  <View style={styles.phoneCodeBox}>
                    <Text style={styles.phoneCodeText}>{phoneCode}</Text>
                  </View>

                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor="#A0AAB0"
                    value={phone}
                    onChangeText={text => setPhone(text.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={15}
                    editable={!loading}
                  />
                </View>

                {/* SUBMIT */}

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleCreateProfile}
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
                          Continue to Verify
                        </Text>

                        <Icon name="arrow-right" size={19} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                  Your information is safe and secure.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppLayout>
    );
  }

  // --------------------------------
  // STEP 2: WHATSAPP OTP
  // --------------------------------

  return (
    <AppLayout>
      <StatusBar backgroundColor={GREEN} barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
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
              onPress={() => {
                setStep(1);
                setError('');
              }}
              disabled={otpVerifying}
            >
              <Icon name="arrow-left" size={21} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Icon name="whatsapp" size={30} color="#F4D47B" />
              </View>

              <Text style={styles.headerTitle}>Verify via WhatsApp</Text>

              <Text style={styles.headerSubtitle}>
                Step 2 of 2 - OTP Verification
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.mainContent}>
            <View style={styles.formCard}>
              <View style={styles.whatsappIcon}>
                <Icon name="whatsapp" size={34} color="#25D366" />
              </View>

              <Text style={styles.cardTitle}>WhatsApp OTP Verification</Text>

              <Text style={styles.cardSubtitle}>
                Your details have been submitted successfully. Please check your
                WhatsApp and enter the code to verify your number.
              </Text>

              <Text style={styles.phoneInfo}>
                {phoneCode} {phone}
              </Text>

              <ErrorMessage />

              {/* OTP INPUTS */}

              <View style={styles.otpRow}>
                {digits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={el => {
                      inputRefs.current[index] = el;
                    }}
                    style={[styles.otpBox, !!digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={value => handleDigitChange(value, index)}
                    onKeyPress={event => handleKeyPress(event, index)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                    editable={!otpVerifying}
                    textAlign="center"
                  />
                ))}
              </View>

              {/* VERIFY BUTTON */}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVerifyOtp}
                disabled={otpVerifying}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#00834A', '#006B3B', '#004E27']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}
                >
                  {otpVerifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Verify OTP</Text>

                      <Icon
                        name="check-circle-outline"
                        size={19}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* SKIP BUTTON */}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSkipOtp}
                disabled={skipLoading || otpVerifying}
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>
                  {skipLoading ? 'Processing...' : 'Skip for Now'}
                </Text>
              </TouchableOpacity>

              {/* RESEND TIMER */}

              <View style={styles.resendRow}>
                {secondsLeft > 0 ? (
                  <Text style={styles.timerText}>
                    Resend OTP in{' '}
                    <Text style={styles.timerBold}>{secondsLeft}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendWhatsAppOtp}
                    disabled={otpVerifying || resending}
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

// --------------------------------
// STYLES
// --------------------------------

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('3%'),
  },

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
    width: 40,
    height: 40,
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

  headerIcon: {
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
    marginTop: 1,
    textAlign: 'center',
  },

  mainContent: {
    paddingHorizontal: wp('5%'),
    marginTop: -hp('5.5%'),
    zIndex: 3,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
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

  label: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    color: '#2B4237',
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 12,
    paddingHorizontal: wp('3%'),
    marginBottom: hp('1.8%'),
  },

  inputIcon: {
    marginRight: wp('2%'),
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1F3329',
    paddingVertical: 10,
  },

  pickerContainer: {
    marginBottom: hp('1.8%'),
  },

  pickerInput: {
    minHeight: 50,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 12,
  },

  phoneContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.8%'),
    gap: 8,
  },

  phoneCodeBox: {
    paddingHorizontal: wp('4%'),
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 12,
  },

  phoneCodeText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: GREEN,
  },

  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: wp('3%'),
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1F3329',
  },

  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: hp('1%'),
    elevation: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  submitButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 10,
  },

  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  footerNote: {
    marginTop: 16,
    textAlign: 'center',
    color: '#8A9A91',
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
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

  whatsappIcon: {
    alignSelf: 'center',
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: '#E9F9EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: wp('4.6%'),
    fontFamily: 'Poppins-Bold',
    color: '#123F2A',
    textAlign: 'center',
    marginBottom: 8,
  },

  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#7A8C82',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },

  phoneInfo: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 20,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2.4%'),
  },

  otpBox: {
    width: wp('11.5%'),
    height: wp('13%'),
    maxWidth: 50,
    maxHeight: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DCE5E0',
    backgroundColor: '#F8FAF9',
    fontSize: wp('5%'),
    fontFamily: 'Poppins-Bold',
    color: '#123F2A',
    padding: 0,
  },

  otpBoxFilled: {
    borderColor: '#00834A',
    backgroundColor: '#EBF6F0',
  },

  skipButton: {
    marginTop: hp('1%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },

  skipButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: GREEN,
  },

  resendRow: {
    alignItems: 'center',
    marginTop: hp('0.5%'),
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
    color: GREEN,
  },
});

export default CreateProfileScreen;

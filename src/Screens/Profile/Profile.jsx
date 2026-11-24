import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getProfile } from '../../api/auth';
import { setUser } from '../../redux/slice/userSlice';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import BottomNav from '../../components/BottomNav/BottomNav';

// ─────────────────────────────────────────
// Info Row Component
// ─────────────────────────────────────────

const InfoRow = ({ icon, label, value, isVerified, onVerifyPress }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <MaterialCommunityIcons name={icon} size={20} color={Colors.primary} />
    </View>

    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || 'Not Available'}
      </Text>
    </View>

    {isVerified === false && (
      <TouchableOpacity
        style={styles.unverifiedBadge}
        onPress={onVerifyPress}
        accessibilityRole="button"
        accessibilityLabel="Verify WhatsApp number"
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={14}
          color="#DC2626"
        />
        <Text style={styles.unverifiedBadgeText}>Unverified</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─────────────────────────────────────────
// Profile Screen
// ─────────────────────────────────────────

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loginData, profile, role } = useSelector(state => state.user);

  const [refreshing, setRefreshing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        try {
          setRefreshing(true);
          const result = await getProfile();
          const fetchedUser = result?.data?.user || result?.user;

          if (isActive && result?.success && fetchedUser) {
            setImgError(false);
            dispatch(setUser(fetchedUser));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          if (isActive) {
            setRefreshing(false);
          }
        }
      };

      fetchProfile();

      return () => {
        isActive = false;
      };
    }, [dispatch]),
  );

  const handleTabPress = key => {
    if (key === 'Profile') return;
    navigation?.navigate(key);
  };

  // ─────────────────────────────────────
  // User Information
  // ─────────────────────────────────────

  const fullName = profile?.name || loginData?.Name || 'Member';
  const email = profile?.email || loginData?.Email || 'Not Available';
  const phone = profile?.phone || loginData?.Phone || 'Not Available';
  const userRole = profile?.role || role || loginData?.role || 'Member';
  const gender = profile?.gender || loginData?.gender || 'Not Available';
  const userId = profile?.userId || '';
  const profilePic = profile?.profilePic || loginData?.profilePic || '';
  const isSuspended = Boolean(profile?.isSuspended);
  const isWhatsAppVerified = profile?.isWatsappVerify === true;

  const currentUserData = profile || loginData || {};

  const handleCardPress = () => {
    navigation?.navigate('EditProfileScreen', { user: currentUserData });
  };

  const handleVerifyWhatsApp = () => {
    setShowVerifyModal(true);
  };

  const handleVerifyPress = () => {
    setShowVerifyModal(false);
    setShowOtpModal(true);
    setOtpDigits(Array(6).fill(''));
    setOtpError('');
  };

  const handleOtpChange = (value, index) => {
    setOtpError('');
    const clean = value.replace(/\D/g, '');

    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    if (clean.length > 1) {
      const next = Array(6).fill('');
      clean
        .slice(0, 6)
        .split('')
        .forEach((digit, idx) => {
          next[idx] = digit;
        });
      setOtpDigits(next);
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
  };

  const handleOtpVerify = async () => {
    setOtpError('');
    const otp = otpDigits.join('');

    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    setVerifyingOtp(true);

    try {
      // Call backend to verify WhatsApp OTP
      const userId = profile?._id || loginData?._id;
      if (!userId) {
        setOtpError('User ID not found');
        return;
      }

      const result = await fetch(
        `http://192.168.1.9:9004/api/auth/verify-whatsapp/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ otp }),
        },
      ).then(r => r.json());

      if (result.success) {
        setShowOtpModal(false);
        const updatedUser = result.data?.user || result.user;
        if (updatedUser) {
          dispatch(setUser(updatedUser));
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        }
        Alert.alert('Success', 'WhatsApp number verified successfully!');
      } else {
        setOtpError(result.message || 'OTP verification failed');
      }
    } catch (error) {
      setOtpError(error.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const formattedLastLogin = profile?.lastLogin
    ? new Date(profile.lastLogin).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not Available';

  const showAvatarImage = Boolean(profilePic) && !imgError;

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Profile"
          onBack={() => navigation && navigation.goBack()}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Clickable Profile Hero Card -> EditProfile */}
          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.82}
            onPress={handleCardPress}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <View style={styles.avatarWrapper}>
              {showAvatarImage ? (
                <Image
                  source={{ uri: profilePic }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <MaterialCommunityIcons
                    name="account"
                    size={42}
                    color={Colors.primary}
                  />
                </View>
              )}

              {/* <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isSuspended
                      ? Colors.error || '#DC2626'
                      : Colors.success || '#16A34A',
                  },
                ]}
              /> */}

              {/* <View style={styles.editBadge}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={12}
                  color={Colors.white}
                />
              </View> */}
            </View>

            <View style={styles.heroDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {fullName}
                </Text>
                {refreshing && (
                  <ActivityIndicator size="small" color={Colors.primary} />
                )}
              </View>

              {userId ? (
                <Text style={styles.heroSubtext}>@{userId}</Text>
              ) : null}

              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.roleBadgeText}>{userRole}</Text>
                </View>

                <View
                  style={[
                    styles.accountBadge,
                    isSuspended && styles.accountBadgeSuspended,
                  ]}
                >
                  <Text
                    style={[
                      styles.accountBadgeText,
                      isSuspended && styles.accountBadgeTextSuspended,
                    ]}
                  >
                    {isSuspended ? 'Suspended' : 'Active'}
                  </Text>
                </View>
              </View>

              <Text style={styles.tapHintText}>Tap card to edit profile</Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={Colors.textSecondary || Colors.textMuted}
            />
          </TouchableOpacity>

          {/* Personal Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
            </View>

            <InfoRow
              icon="account-outline"
              label="Full Name"
              value={fullName}
            />

            <View style={styles.rowDivider} />

            <InfoRow icon="email-outline" label="Email Address" value={email} />

            <View style={styles.rowDivider} />

            <InfoRow
              icon="phone-outline"
              label="Mobile Number"
              value={phone}
              isVerified={isWhatsAppVerified}
              onVerifyPress={handleVerifyWhatsApp}
            />

            <View style={styles.rowDivider} />

            <InfoRow icon="gender-male-female" label="Gender" value={gender} />
          </View>

          {/* Verify WhatsApp Modal */}
          <Modal
            visible={showVerifyModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowVerifyModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.verifyModalContent}>
                <TouchableOpacity
                  style={styles.verifyModalCloseButton}
                  onPress={() => setShowVerifyModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                <View style={styles.verifyIconCircle}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={40}
                    color="#DC2626"
                  />
                </View>

                <Text style={styles.verifyModalTitle}>
                  WhatsApp Verification Required
                </Text>

                <Text style={styles.verifyModalSubtitle}>
                  Your WhatsApp number hasn't been verified yet. Please verify
                  it to complete your registration.
                </Text>

                <View style={styles.verifyModalActions}>
                  <TouchableOpacity
                    style={styles.verifyModalButton}
                    onPress={handleVerifyPress}
                  >
                    <Text style={styles.verifyModalButtonText}>Verify Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.verifyModalCancelButton}
                    onPress={() => setShowVerifyModal(false)}
                  >
                    <Text style={styles.verifyModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* OTP Verification Modal */}
          <Modal
            visible={showOtpModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowOtpModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.otpModalContent}>
                <View style={styles.otpModalHeader}>
                  <Text style={styles.otpModalTitle}>Verify WhatsApp OTP</Text>
                  <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.otpModalSubtitle}>
                  Enter the 6-digit OTP sent to your WhatsApp number
                </Text>

                {otpError ? (
                  <View style={styles.otpErrorContainer}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={16}
                      color="#DC2626"
                    />
                    <Text style={styles.otpErrorText}>{otpError}</Text>
                  </View>
                ) : null}

                <View style={styles.otpInputRow}>
                  {otpDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      style={styles.otpInputBox}
                      value={digit}
                      onChangeText={value => handleOtpChange(value, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!verifyingOtp}
                      textAlign="center"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.otpSubmitButton,
                    verifyingOtp && styles.otpSubmitButtonDisabled,
                  ]}
                  onPress={handleOtpVerify}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.otpSubmitButtonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.otpCancelButton}
                  onPress={() => setShowOtpModal(false)}
                  disabled={verifyingOtp}
                >
                  <Text style={styles.otpCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>

        <BottomNav active="Profile" onPress={handleTabPress} />
      </View>
    </AppLayout>
  );
};

export default ProfileScreen;

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F1F6F3',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.8%'),
    paddingBottom: hp('3%'),
  },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: wp('4%'),
    marginBottom: hp('1.8%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  avatarWrapper: {
    position: 'relative',
    marginRight: wp('4%'),
  },

  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
  },

  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2.5,
    borderColor: Colors.white,
  },

  editBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroDetails: {
    flex: 1,
    marginRight: 6,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  heroName: {
    flex: 1,
    fontSize: FontSize.lg || FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
  },

  heroSubtext: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary || Colors.textMuted,
    marginTop: 2,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: hp('1%'),
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  roleBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },

  accountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  accountBadgeSuspended: {
    backgroundColor: '#FEE2E2',
  },

  accountBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#15803D',
  },

  accountBadgeTextSuspended: {
    color: '#B91C1C',
  },

  tapHintText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
    marginTop: hp('0.8%'),
  },

  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    marginBottom: hp('1.8%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hp('1.2%'),
    marginBottom: hp('0.6%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },

  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },

  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1.25%'),
    gap: wp('2%'),
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('1%'),
    flexShrink: 0,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary || Colors.textMuted,
  },

  infoValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginTop: 2,
  },

  rowDivider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: 38 + wp('3%'),
  },

  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    flexWrap: 'wrap',
  },

  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexShrink: 0,
  },

  unverifiedBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    color: '#DC2626',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('4%'),
  },

  verifyModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: wp('5%'),
    paddingTop: wp('6%'),
    alignItems: 'center',
    maxWidth: '85%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  verifyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  verifyModalCloseButton: {
    position: 'absolute',
    top: wp('3%'),
    right: wp('3%'),
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.border || '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  verifyModalTitle: {
    fontSize: FontSize.lg || FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
    textAlign: 'center',
    marginBottom: 10,
  },

  verifyModalSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary || Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  verifyModalActions: {
    width: '100%',
    gap: wp('2%'),
  },

  verifyModalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: hp('1.4%'),
    borderRadius: 12,
    alignItems: 'center',
  },

  verifyModalButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    paddingHorizontal: wp('3%'),
  },

  verifyModalCancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: hp('0.8%'),
    borderRadius: 12,
    alignItems: 'center',
  },

  verifyModalCancelText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary || Colors.textMuted,
  },

  otpModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: wp('5%'),
    minHeight: '15%',
    maxWidth: '100%',
  },

  otpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },

  otpModalTitle: {
    fontSize: FontSize.lg || FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
  },

  otpModalSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: hp('1.5%'),
    lineHeight: 20,
  },

  otpErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: wp('3%'),
    borderRadius: 10,
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },

  otpErrorText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#DC2626',
    flex: 1,
  },

  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },

  otpInputBox: {
    flex: 1,
    height: wp('12%'),
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg || '#F8FAF9',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
    textAlign: 'center',
  },

  otpSubmitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: hp('1.6%'),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp('1%'),
  },

  otpSubmitButtonDisabled: {
    opacity: 0.6,
  },

  otpSubmitButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },

  otpCancelButton: {
    paddingVertical: hp('1.4%'),
    alignItems: 'center',
  },

  otpCancelButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary || Colors.textMuted,
  },
});

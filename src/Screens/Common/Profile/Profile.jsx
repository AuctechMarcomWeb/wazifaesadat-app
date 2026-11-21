import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import { getProfile } from '../../../api/auth';
import { setUser } from '../../../redux/slice/userSlice';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import BottomNav from '../../../components/BottomNav/BottomNav';

// ─────────────────────────────────────────
// Info Row Component
// ─────────────────────────────────────────

const InfoRow = ({ icon, label, value }) => (
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

  const currentUserData = profile || loginData || {};

  const handleCardPress = () => {
    navigation?.navigate('EditProfileScreen', { user: currentUserData });
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

            <InfoRow icon="phone-outline" label="Mobile Number" value={phone} />

            <View style={styles.rowDivider} />

            <InfoRow icon="gender-male-female" label="Gender" value={gender} />
          </View>

     
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
    paddingVertical: hp('1.25%'),
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },

  infoContent: {
    flex: 1,
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
});

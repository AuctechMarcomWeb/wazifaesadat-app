import React from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BackHeader from '../../../components/BackHeader/BackHeader';
import AppLayout from '../../../components/AppLayout/AppLayout';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import Colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import BottomNav from '../../../components/BottomNav/BottomNav';
import { logout } from '../../../redux/slice/userSlice';

const SettingsScreen = ({ navigation, onLogout }) => {
  const dispatch = useDispatch();

  const { loginData, profile } = useSelector(state => state.user);

  const fullName = profile?.name || loginData?.Name || 'Member';
  const email = profile?.email || loginData?.Email || 'Not Available';

  // Bottom Navigation
  const handleTabPress = key => {
    if (key === 'SettingScreen') return;
    navigation?.navigate(key);
  };

  // Open Under Development Screen
  const openUnderDevelopment = title => {
    navigation.navigate('UnderDevelopmentScreen', {
      title: title,
      description: `${title} feature is currently under development. It will be available soon.`,
    });
  };

  // Logout Confirmation
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');

              // Clear Redux State
              dispatch(logout());

              // Optional callback
              onLogout?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
    );
  };

  // Reusable Setting Row
  const SettingRow = ({ icon, title, subtitle, onPress, danger = false }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.settingRow}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={danger ? Colors.danger : Colors.primary}
          />
        </View>

        <View style={styles.settingContent}>
          <Text
            style={[styles.settingTitle, danger && styles.dangerText]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {!!subtitle && (
            <Text style={styles.settingSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={25}
          color={danger ? Colors.danger : '#9AA6B2'}
        />
      </TouchableOpacity>
    );
  };

  // Section Heading
  const SectionTitle = ({ title }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Settings" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.profileCard}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons
                name="account-circle"
                size={wp('15%')}
                color={Colors.primary}
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {fullName}
              </Text>

              <Text style={styles.profileEmail} numberOfLines={1}>
                {email}
              </Text>

              <Text style={styles.profileStatus}>Member Account</Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={25}
              color="#9AA6B2"
            />
          </TouchableOpacity>

          {/* Account Settings */}
          {/* <SectionTitle title="ACCOUNT SETTINGS" /> */}

          <View style={styles.sectionCard}>
            <SettingRow
              icon="account-edit-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => navigation.navigate('EditProfileScreen')}
            />

            <View style={styles.divider} />

            <SettingRow
              icon="lock-outline"
              title="Change Password"
              subtitle="Change your account password"
              onPress={() => navigation.navigate('EditProfileScreen')}
            />
          </View>

          {/* Privacy & Security */}
          <SectionTitle title="PRIVACY & SECURITY" />

          <View style={styles.sectionCard}>
            <SettingRow
              icon="shield-lock-outline"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />

            <View style={styles.divider} />

            <SettingRow
              icon="file-document-outline"
              title="Terms & Conditions"
              subtitle="Read terms of service"
              onPress={() => navigation.navigate('TermsConditions')}
            />
          </View>

          {/* Support */}
          <SectionTitle title="SUPPORT" />

          <View style={styles.sectionCard}>
            <SettingRow
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get assistance and support"
              onPress={() => openUnderDevelopment('Help & Support')}
            />

            <View style={styles.divider} />

            <SettingRow
              icon="information-outline"
              title="About App"
              subtitle="Application information"
              onPress={() => navigation.navigate('AboutApp')}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <View style={styles.logoutIcon}>
              <MaterialCommunityIcons
                name="logout"
                size={23}
                color={Colors.danger}
              />
            </View>

            <Text style={styles.logoutText}>Logout</Text>

            <MaterialCommunityIcons
              name="chevron-right"
              size={25}
              color={Colors.danger}
            />
          </TouchableOpacity>

          {/* App Version */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>AWSM Member App</Text>

            <Text style={styles.version}>Version 1.0.0</Text>

            <Text style={styles.copyright}>Made with care for our members</Text>
          </View>
        </ScrollView>
      </View>

      <BottomNav active="SettingScreen" onPress={handleTabPress} />
    </AppLayout>
  );
};

export default SettingsScreen;

// Styles
const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F1F6F3',
  },

  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F1F6F3',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('5%'),
  },

  // Profile Card
  profileCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: wp('4%'),
    borderRadius: wp('4%'),
    marginBottom: hp('2.5%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  profileIcon: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('4%'),
    backgroundColor: '#E3F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInfo: {
    flex: 1,
    marginLeft: wp('3%'),
    marginRight: wp('2%'),
  },

  profileName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#064D32',
  },

  profileEmail: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: '#888888',
    marginTop: hp('0.4%'),
  },

  profileStatus: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: '#00834B',
    marginTop: hp('0.5%'),
  },

  // Section Heading
  sectionTitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: '#71869B',
    letterSpacing: 1.2,
    marginBottom: hp('1.2%'),
    marginLeft: wp('1%'),
    marginTop: hp('0.5%'),
  },

  // Section Card
  sectionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3.5%'),
    marginBottom: hp('2.2%'),
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.035,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  // Setting Row
  settingRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: hp('9.5%'),
    paddingVertical: hp('1.5%'),
  },

  settingIcon: {
    width: wp('11.5%'),
    height: wp('11.5%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#E3F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },

  settingContent: {
    flex: 1,
    marginRight: wp('2%'),
  },

  settingTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#064D32',
  },

  settingSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: '#898989',
    marginTop: hp('0.5%'),
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E9E7',
    marginLeft: wp('14.5%'),
  },

  // Logout
  logoutButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F8DCDC',
    borderRadius: wp('4%'),
    padding: wp('3.5%'),
    minHeight: hp('8.5%'),
    marginTop: hp('1.5%'),
  },

  logoutIcon: {
    width: wp('11.5%'),
    height: wp('11.5%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#FDEBEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },

  logoutText: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#E53945',
  },

  dangerIcon: {
    backgroundColor: '#FDEBEC',
  },

  dangerText: {
    color: '#E53945',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: hp('3%'),
    paddingBottom: hp('2%'),
  },

  footerTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#087A43',
  },

  version: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: '#888888',
    marginTop: hp('0.5%'),
  },

  copyright: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: '#999999',
    marginTop: hp('0.5%'),
  },
});

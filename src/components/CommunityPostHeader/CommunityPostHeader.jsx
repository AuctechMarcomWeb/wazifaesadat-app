import React, { useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';

const YEARS = [2026, 2025, 2024, 2023, 2022];

const TOP_PADDING =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 54;

const CommunityPostHeader = ({
  year = 2026,
  onYearChange,
  onMenuPress,
  onBellPress,
  onProfilePress,
}) => {
  const [yearOpen, setYearOpen] = useState(false);

  return (
    <LinearGradient
      colors={colors.gradients.logo}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Decorative Background Shapes */}
      <View style={styles.shapeOne} />
      <View style={styles.shapeTwo} />

      {/* Header Top Row */}
      <View style={styles.topRow}>
        {/* Menu */}
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.menuButton}
          activeOpacity={0.7}
        >
          <Icon name="menu" size={30} color={colors.white} />
        </TouchableOpacity>

        {/* Organization Logo */}
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/awsm-logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Profile */}
        <TouchableOpacity
          onPress={onProfilePress}
          style={styles.avatar}
          activeOpacity={0.8}
        >
          <Icon name="account" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: TOP_PADDING,
    paddingBottom: 34,
    paddingHorizontal: wp('4.5%'),
    overflow: 'hidden',
  },

  // Background Shapes
  shapeOne: {
    position: 'absolute',
    width: wp('70%'),
    height: wp('70%'),
    borderRadius: wp('35%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -wp('30%'),
    right: -wp('15%'),
  },

  shapeTwo: {
    position: 'absolute',
    width: wp('60%'),
    height: wp('60%'),
    borderRadius: wp('30%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -wp('35%'),
    left: -wp('20%'),
  },

  // Header Top Row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 58,
  },

  // Menu
  menuButton: {
    width: 42,
    height: 52,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  // Logo
  logoBox: {
    flex: 1,
    height: 54,
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  // Profile
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dashboard Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  subtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
    marginTop: -2,
  },

  // Year Button
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  yearLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginRight: 8,
  },

  yearValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginRight: 2,
  },

  // Year Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  yearList: {
    width: wp('60%'),
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 8,
  },

  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  yearItemActive: {
    backgroundColor: colors.primaryLight,
  },

  yearItemText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.SecondTitleColor,
  },

  yearItemTextActive: {
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
});

export default CommunityPostHeader;

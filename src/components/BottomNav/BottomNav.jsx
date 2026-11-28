import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import colors from '../../themes/colors';
import { FontFamily } from '../../themes/typography';

const TABS = [
  {
    key: 'CommunityPost',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
    params: {},
  },
  {
    key: 'ScholarshipScreen',
    label: 'Scholarship',
    icon: 'school-outline',
    activeIcon: 'school',
    params: {},
  },
  {
    key: 'DonationAppealsScreen',
    label: 'Donation & Appeals',
    shortLabel: 'Appeals',
    icon: 'hand-heart-outline',
    activeIcon: 'hand-heart',
    params: { contentType: 'Donation' },
  },
  {
    key: 'NotificationScreen',
    label: 'Notification',
    icon: 'bell-outline',
    activeIcon: 'bell',
    params: {},
  },
];

const BottomNav = ({ active = 'CommunityPost', onPress }) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 380;

  const handleTabPress = (tabKey, params = {}) => {
    onPress?.(tabKey);
    navigation.navigate(tabKey, params);
  };

  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = tab.key === active;

        const label = isSmallScreen ? tab.shortLabel || tab.label : tab.label;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabWrapper}
            activeOpacity={0.75}
            onPress={() => handleTabPress(tab.key, tab.params)}
          >
            <View style={[styles.tab, isActive && styles.tabActive]}>
              <Icon
                name={isActive ? tab.activeIcon : tab.icon}
                size={isSmallScreen ? 21 : 23}
                color={isActive ? colors.white : '#64748B'}
              />

              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isSmallScreen && styles.smallLabel,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    paddingTop: 7,
    paddingBottom: Platform.OS === 'ios' ? 22 : 7,
    borderTopWidth: 1,
    borderTopColor: '#E8EEE9',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },

  tabWrapper: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tab: {
    width: '96%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },

  tabActive: {
    backgroundColor: colors.primary,
  },

  label: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
    flexShrink: 1,
  },

  smallLabel: {
    fontSize: 9,
  },

  labelActive: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
  },
});

export default BottomNav;

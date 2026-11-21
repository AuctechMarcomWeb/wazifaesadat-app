import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import colors from '../../themes/colors';
import { FontFamily } from '../../themes/typography';

const TABS = [
  {
    key: 'CommunityPost',
    label: 'Home',
    icon: 'view-dashboard-outline',
    activeIcon: 'view-dashboard',
  },
  {
    key: 'ProfileScreen',
    label: 'Profile',
    icon: 'account-circle-outline',
    activeIcon: 'account-circle',
  },
  {
    key: 'SettingScreen',
    label: 'Settings',
    icon: 'cog-outline',
    activeIcon: 'cog',
  },
  {
    key: 'Posts',
    label: 'Posts',
    icon: 'apps',
    activeIcon: 'apps',
  },
];

const BottomNav = ({ active = 'CommunityPost', onPress }) => {
  const navigation = useNavigation();

  const handleTabPress = tabKey => {
    // Call parent onPress if provided
    if (onPress) {
      onPress(tabKey);
    }

    // Navigate to drawer screen
    if (tabKey === 'CommunityPost') {
      navigation.navigate('CommunityPost');
    } else if (tabKey === 'ProfileScreen') {
      navigation.navigate('ProfileScreen');
    } else if (tabKey === 'SettingScreen') {
      navigation.navigate('SettingScreen');
    } else if (tabKey === 'Posts') {
      navigation.navigate('Posts');
    } else if (tabKey === 'More') {
      // More navigation - open drawer
      navigation.openDrawer();
    }
  };

  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = tab.key === active;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabWrapper}
            activeOpacity={0.75}
            onPress={() => handleTabPress(tab.key)}
          >
            <View style={[styles.tab, isActive && styles.tabActive]}>
              <Icon
                name={isActive ? tab.activeIcon : tab.icon}
                size={23}
                color={isActive ? colors.white : '#64748B'}
              />

              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {tab.label}
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
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingTop: 9,
    paddingBottom: Platform.OS === 'ios' ? 22 : 9,
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
    alignItems: 'center',
    justifyContent: 'center',
  },

  tab: {
    width: '88%',
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 6,
  },

  tabActive: {
    backgroundColor: colors.primary,
  },

  label: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 3,
  },

  labelActive: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
  },
});

export default BottomNav;

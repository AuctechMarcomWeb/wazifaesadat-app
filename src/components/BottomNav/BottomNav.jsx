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
    icon: 'home-outline',
    activeIcon: 'home',
    params: {},
  },
  {
    key: 'ScholarshipScreen',
    label: 'Scholarship',
    icon: 'school-outline',
    activeIcon: 'school',
  },
  {
    key: 'DonationAppealsScreen',
    label: 'Donation & Appeals',
    icon: 'hand-heart-outline',
    activeIcon: 'hand-heart',
    params: { contentType: 'Donation' },
  },
  {
    key: 'NotificationScreen',
    label: 'Notification',
    icon: 'bell-outline',
    activeIcon: 'bell',
  },
];

const BottomNav = ({ active = 'CommunityPost', onPress }) => {
  const navigation = useNavigation();

  const handleTabPress = (tabKey, params = {}) => {
    if (onPress) {
      onPress(tabKey);
    }

    navigation.navigate(tabKey, params);
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
            onPress={() => handleTabPress(tab.key, tab.params)}
          >
            <View style={[styles.tab, isActive && styles.tabActive]}>
              <Icon
                name={isActive ? tab.activeIcon : tab.icon}
                size={23}
                color={isActive ? colors.white : '#64748B'}
              />

              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={2}
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
    width: '92%',
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
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
  },

  labelActive: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
  },
});

export default BottomNav;

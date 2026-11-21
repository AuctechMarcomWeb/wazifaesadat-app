import React, { useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

import { useSelector } from 'react-redux';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { getVisibleMenus } from '../../utils/permissionHelper';

import Colors from '../../themes/colors';

import { FontFamily, FontSize } from '../../themes/typography';

import AppLayout from '../AppLayout/AppLayout';

// ─────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────

const Sidebar = ({ navigation, role }) => {
  const {
    permissions,
    role: userRole,
    loginData,
    profile,
  } = useSelector(state => state.user);

  const [expandedMenu, setExpandedMenu] = useState(null);

  const currentRole = role || userRole;

  // Current Route

  const currentRoute =
    navigation?.getState?.()?.routes?.[navigation?.getState?.()?.index]?.name;

  // User Name

  const userName = profile?.FullName || loginData?.Name || 'Associate';

  // ─────────────────────────────────────
  // Visible Menus (from getVisibleMenus)
  // ─────────────────────────────────────

  const menus = getVisibleMenus(permissions, currentRole);

  // ─────────────────────────────────────
  // Menu Navigation
  // ─────────────────────────────────────

  const handleMenuPress = menu => {
    const hasSubItems = menu.subs && menu.subs.length > 0;

    if (hasSubItems) {
      setExpandedMenu(expandedMenu === menu.key ? null : menu.key);
    } else {
      // Use screenName if provided, otherwise use menu.key
      const screenName = menu.screenName || menu.key;
      navigation.navigate(screenName);

      setExpandedMenu(null);
    }
  };

  // ─────────────────────────────────────
  // Submenu Navigation
  // ─────────────────────────────────────

  const handleSubMenuPress = (parent, subItem) => {
    // Use screenName if provided, otherwise use parent with subScreen param
    const screenName = subItem.screenName || parent;
    const params = subItem.screenName ? {} : { subScreen: subItem.key };

    navigation.navigate(screenName, params);
    setExpandedMenu(null);
  };

  // ─────────────────────────────────────
  // Check Active Menu
  // ─────────────────────────────────────

  const isMenuActive = menu => {
    const screenName = menu.screenName || menu.key;
    return currentRoute === menu.key || currentRoute === screenName;
  };

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────

  return (
    <AppLayout>
      <View style={styles.mainContainer}>
        {/* Sidebar Header */}

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={require('../../assets/awsm-logo-transparent.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Menu Section */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MAIN MENU</Text>

            <View style={styles.sectionLine} />
          </View>

          {menus.map((menu, index) => {
            const isExpanded = expandedMenu === menu.key;

            const hasSubItems = menu.subs && menu.subs.length > 0;

            const isActive = isMenuActive(menu);

            // Get filtered submenus based on permissions
            const visibleSubs = hasSubItems 
              ? menu.subs.filter(sub => {
                  const subPermission = permissions?.find(p => p.module === sub.module);
                  return subPermission?.canView === true;
                })
              : [];

            const hasVisibleSubs = visibleSubs.length > 0;

            return (
              <View key={menu.key} style={styles.menuWrapper}>
                {/* Main Menu Item */}

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleMenuPress(menu)}
                  style={[
                    styles.menuItem,
                    isActive && styles.activeMenuItem,
                    isExpanded && styles.expandedMenuItem,
                  ]}
                >
                  {/* Menu Icon */}

                  <View
                    style={[
                      styles.menuIconContainer,
                      isActive && styles.activeMenuIconContainer,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={menu.icon || 'circle-outline'}
                      size={wp('5.5%')}
                      color={isActive ? Colors.white : Colors.primary}
                    />
                  </View>

                  {/* Menu Label */}

                  <Text
                    style={[styles.menuText, isActive && styles.activeMenuText]}
                    numberOfLines={1}
                  >
                    {menu.label || menu.key}
                  </Text>

                  {/* Expand Icon */}

                  {(hasVisibleSubs || hasSubItems) && (
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={wp('5.5%')}
                      color={isActive ? Colors.white : Colors.secondary}
                    />
                  )}

                  {!hasVisibleSubs && isActive && (
                    <View style={styles.activeDot} />
                  )}
                </TouchableOpacity>

                {/* Submenu */}

                {hasVisibleSubs && isExpanded && (
                  <View style={styles.subMenuContainer}>
                    {visibleSubs.map((subItem, subIndex) => (
                      <TouchableOpacity
                        key={subItem.key}
                        activeOpacity={0.7}
                        style={styles.subMenuItem}
                        onPress={() => handleSubMenuPress(menu.key, subItem)}
                      >
                        <View style={styles.subMenuIndicator} />

                        <MaterialCommunityIcons
                          name={subItem.icon || 'circle-small'}
                          size={wp('5%')}
                          color={Colors.primary}
                        />

                        <Text style={styles.subMenuText}>
                          {subItem.label || subItem.key}
                        </Text>

                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={wp('4.5%')}
                          color={Colors.placeHolderColor}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Show all submenus if no visible subs (permission issue) */}
                {menu.subs && menu.subs.length > 0 && isExpanded && visibleSubs.length === 0 && (
                  <View style={styles.subMenuContainer}>
                    {menu.subs.map((subItem, subIndex) => (
                      <TouchableOpacity
                        key={subItem.key}
                        activeOpacity={0.7}
                        style={styles.subMenuItem}
                        onPress={() => handleSubMenuPress(menu.key, subItem)}
                      >
                        <View style={styles.subMenuIndicator} />

                        <MaterialCommunityIcons
                          name={subItem.icon || 'circle-small'}
                          size={wp('5%')}
                          color={Colors.primary}
                        />

                        <Text style={styles.subMenuText}>
                          {subItem.label || subItem.key}
                        </Text>

                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={wp('4.5%')}
                          color={Colors.placeHolderColor}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {/* Empty State */}

          {menus.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="menu-open"
                size={wp('12%')}
                color={Colors.placeHolderColor}
              />

              <Text style={styles.emptyTitle}>No Menus Available</Text>

              <Text style={styles.emptySubtitle}>
                You don't have permission to access any menu.
              </Text>
            </View>
          )}

          {/* Bottom Information */}

          <View style={styles.bottomInfo}>
            <MaterialCommunityIcons
              name="shield-check"
              size={wp('5%')}
              color={Colors.primary}
            />
          </View>
        </ScrollView>
      </View>
    </AppLayout>
  );
};

export default Sidebar;

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  // Main Container

  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Header

  header: {
    backgroundColor: Colors.white,

    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('1.5%'),

    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },

  brandLogo: {
    width: wp('65%'),
    height: hp('7%'),
  },

  brandIcon: {
    width: wp('12%'),
    height: wp('12%'),

    borderRadius: wp('3%'),

    backgroundColor: Colors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  brandContent: {
    marginLeft: wp('3%'),
    flex: 1,
  },

  brandTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.primaryDark,
    letterSpacing: 1,
  },

  brandSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.secondary,
    marginTop: 1,
  },

  // User Card

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: wp('3%'),

    backgroundColor: Colors.cardColorLight,

    borderWidth: 1,
    borderColor: Colors.neutral.border,

    borderRadius: wp('3%'),
  },

  userAvatar: {
    width: wp('11%'),
    height: wp('11%'),

    borderRadius: wp('5.5%'),

    backgroundColor: Colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  userInfo: {
    flex: 1,
    marginLeft: wp('3%'),
  },

  userName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
  },

  userRole: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.secondary,
    marginTop: hp('0.3%'),
  },

  // ScrollView

  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    paddingHorizontal: wp('3.5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('3%'),
  },

  // Section Header

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: hp('1.3%'),
    paddingHorizontal: wp('2%'),
  },

  sectionTitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
    letterSpacing: 1,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: wp('3%'),
  },

  // Menu Wrapper

  menuWrapper: {
    marginBottom: hp('0.8%'),
  },

  // Menu Item

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: hp('7%'),

    paddingHorizontal: wp('3%'),

    borderRadius: wp('3%'),

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },

  activeMenuItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  expandedMenuItem: {
    borderColor: Colors.primaryLight,
  },

  // Menu Icon

  menuIconContainer: {
    width: wp('10.5%'),
    height: wp('10.5%'),

    borderRadius: wp('2.5%'),

    backgroundColor: Colors.primaryBg,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: wp('3%'),
  },

  activeMenuIconContainer: {
    backgroundColor: Colors.glass,
  },

  // Menu Text

  menuText: {
    flex: 1,

    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,

    color: Colors.TitleColor,
  },

  activeMenuText: {
    color: Colors.white,
  },

  activeDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: Colors.accent,
  },

  // Submenu

  subMenuContainer: {
    marginTop: hp('0.7%'),
    marginLeft: wp('7%'),

    paddingLeft: wp('3%'),

    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryLight,

    backgroundColor: Colors.backgroundSecondary,

    borderRadius: wp('2%'),
  },

  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: hp('5.8%'),

    paddingHorizontal: wp('2%'),

    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },

  subMenuIndicator: {
    width: wp('1.5%'),
    height: wp('1.5%'),

    borderRadius: wp('1%'),

    backgroundColor: Colors.primaryLight,

    marginRight: wp('2%'),
  },

  subMenuText: {
    flex: 1,

    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,

    color: Colors.textSecondary,

    marginLeft: wp('2%'),
  },

  // Empty State

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('7%'),
  },

  emptyTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginTop: hp('1%'),
  },

  emptySubtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.secondary,
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },

  // Bottom Information

  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingVertical: hp('2%'),
    marginTop: hp('1.5%'),

    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,

    gap: wp('2%'),
  },

  bottomInfoText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.secondary,
  },
});

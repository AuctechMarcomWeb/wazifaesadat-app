/**
 * Permission Helper Utility
 * Handles menu and feature access based on user permissions
 */

import { MENU_CONFIG, ROLE_MENUS, getModulesForMenu } from '../config/menuConfig';

/**
 * Get visible menus based on user permissions
 * @param {Array} userPermissions - Array of permission objects from API
 * @param {string} userRole - User's role
 * @returns {Array} Filtered menu items that user has access to
 */
/**
 * Get visible menus based on user permissions
 * @param {Array} userPermissions - Array of permission objects from API
 * @param {string} userRole - User's role
 * @returns {Array} Filtered menu items that user has access to
 */
export const getVisibleMenus = (userPermissions, userRole) => {
  console.log('🔍 getVisibleMenus called with:');
  console.log('   - Permissions:', userPermissions?.length, 'items');
  console.log('   - Role:', userRole);
  
  // SuperAdmin with empty permissions = show all menus
  if (userRole === 'SuperAdmin' && (!userPermissions || userPermissions.length === 0)) {
    console.log('👑 SuperAdmin with empty permissions - showing ALL menus');
    return Object.entries(MENU_CONFIG)
      .map(([menuKey, menuConfig]) => ({
        key: menuKey,
        ...menuConfig,
      }))
      .filter(menu => menu.label);
  }

  // Regular users: check permissions
  if (!userPermissions || userPermissions.length === 0) {
    console.log('❌ No permissions found - no menus shown');
    return [];
  }

  const visibleMenus = [];

  // Extract module names from permissions with canView access
  const accessibleModules = userPermissions
    .filter(perm => perm.canView === true)
    .map(perm => perm.module);

  console.log('✅ Accessible Modules (canView: true):', accessibleModules);

  // If no modules have canView: true, show empty menu
  if (accessibleModules.length === 0) {
    console.log('❌ NO MENUS - User has no canView permissions');
    return [];
  }

  // Iterate through MENU_CONFIG and check access
  Object.entries(MENU_CONFIG).forEach(([menuKey, menuConfig]) => {
    const menuModules = menuConfig.modules || [];

    // Check if user has access to any module in this menu
    const hasAccess = menuModules.some(module =>
      accessibleModules.includes(module),
    );

    if (hasAccess) {
      console.log('✅ Menu visible:', menuKey);
      visibleMenus.push({
        key: menuKey,
        ...menuConfig,
      });
    }
  });

  console.log('📋 Total visible menus:', visibleMenus.length);
  return visibleMenus;
};

/**
 * Get menus based on user role (fallback)
 * @param {string} role - User role
 * @returns {Array} Menu items for the role
 */
export const getMenusByRole = role => {
  console.log('🎯 Getting menus for role:', role);
  const menuKeys = ROLE_MENUS[role] || [];
  return menuKeys
    .map(key => ({
      key,
      ...MENU_CONFIG[key],
    }))
    .filter(menu => menu.label); // Remove undefined menus
};

/**
 * Check if user has access to a specific menu item
 * @param {string} menuKey - Menu key
 * @param {Array} userPermissions - User's permissions
 * @returns {boolean}
 */
export const hasMenuAccess = (menuKey, userPermissions) => {
  if (!userPermissions || userPermissions.length === 0) return false;

  const menuModules = getModulesForMenu(menuKey);
  if (menuModules.length === 0) return false;

  // Check if user has canView access to any module for this menu
  return menuModules.some(module =>
    userPermissions.some(
      perm => perm.module === module && perm.canView === true,
    ),
  );
};

/**
 * Check specific permission for a feature
 * @param {string} module - Module name
 * @param {string} action - Action type: 'canView', 'canCreate', 'canEdit', 'canDelete'
 * @param {Array} userPermissions - User's permissions
 * @returns {boolean}
 */
export const hasPermission = (module, action = 'canView', userPermissions) => {
  if (!userPermissions || userPermissions.length === 0) return false;

  const permission = userPermissions.find(perm => perm.module === module);
  return permission ? permission[action] === true : false;
};

/**
 * Get filtered submenu items based on permissions
 * @param {string} menuKey - Parent menu key
 * @param {Array} userPermissions - User's permissions
 * @returns {Array} Filtered submenu items
 */
export const getVisibleSubmenus = (menuKey, userPermissions) => {
  if (!userPermissions || userPermissions.length === 0) return [];

  const menuConfig = MENU_CONFIG[menuKey];
  if (!menuConfig || !menuConfig.subs) return [];

  return menuConfig.subs.filter(submenu =>
    hasPermission(submenu.module, 'canView', userPermissions),
  );
};

/**
 * Get all accessible modules for a user
 * @param {Array} userPermissions - User's permissions
 * @returns {Array} Array of module names
 */
export const getAccessibleModules = userPermissions => {
  if (!userPermissions || userPermissions.length === 0) return [];

  return userPermissions
    .filter(perm => perm.canView === true)
    .map(perm => perm.module);
};

/**
 * Check if user is admin or has elevated permissions
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isAdmin = role => {
  return ['SuperAdmin', 'Admin'].includes(role);
};

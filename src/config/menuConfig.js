export const MENU_CONFIG = {
  // Dashboard - primary module
  Dashboard: {
    label: 'Home',
    icon: 'home',
    modules: ['dashboard', 'dashboard_main'],
    screenName: 'CommunityPost',
  },

  // Community Feed - 7 Separate Items
  Post: {
    label: 'Post',
    icon: 'file-document',
    modules: ['community_post'],
    // screenName: 'CommunityPost',
    params: { contentType: 'Post' },
  },

  Blogs: {
    label: 'Blogs',
    icon: 'book-open-variant',
    modules: ['community_blog'],
    screenName: 'BlogsScreen',
    params: { contentType: 'Blogs' },
  },

  News: {
    label: 'News',
    icon: 'newspaper',
    modules: ['community_news'],
    // screenName: 'CommunityPost',
    params: { contentType: 'News' },
  },

  Events: {
    label: 'Events',
    icon: 'calendar-event',
    modules: ['community_event'],
    // screenName: 'CommunityPost',
    params: { contentType: 'Events' },
  },

 



  Appeal: {
    label: 'Appeal',
    icon: 'megaphone',
    modules: ['community_appeal'],
    screenName: 'AppealScreen',
    params: { contentType: 'Appeal' },
  },

    Donation: {
    label: 'Donation',
    icon: 'hand-heart',
    modules: ['community_donation'],
    screenName: 'DonationsScreen',
    params: { contentType: 'Donation' },
  },
  Scholarship: {
    label: 'Scholarship',
    icon: 'book-education',
    modules: ['scholarship'],
    screenName: 'ScholarshipScreen',
  },
   JobsCareer: {
    label: 'Jobs & Career',
    icon: 'briefcase-search',
    modules: ['community_job', 'community_career'],
    screenName: 'JobsCareerScreen',
    params: { contentType: 'JobsCareer' },
  },
};

/**
 * Role to menu mapping (based on typical org hierarchy)
 * Used as fallback when no backend permissions available
 */
/**
 * Role to menu mapping (based on typical org hierarchy)
 * Used as fallback when no backend permissions available
 */
export const ROLE_MENUS = {
  SuperAdmin: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  Admin: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  ExecutiveMember: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  OfficeBearer: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  'Office Bearers': [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  OfficeStaff: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  LocalSecretary: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  Membership: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
  WazifaUser: [
    'Dashboard',
    'Post',
    'Blogs',
    'News',
    'Events',
    'JobsCareer',
    'Donation',
    'Appeal',
    'Scholarship',
  ],
};

/**
 * Get visible menus for a role (fallback method)
 * @param {string} role - User role
 * @returns {Array} Array of menu objects with label, icon, modules
 */
export const getMenuForRole = role => {
  const menuKeys = ROLE_MENUS[role] || [];
  return menuKeys.map(key => ({
    name: key,
    ...MENU_CONFIG[key],
  }));
};

/**
 * Helper to get all permission modules for a menu item
 * @param {string} menuKey - Menu key
 * @returns {Array} Array of permission modules
 */
export const getModulesForMenu = menuKey => {
  return MENU_CONFIG[menuKey]?.modules || [];
};

/**
 * Helper to check if user has ANY permission for a menu
 * @param {string} menuKey - Menu key (e.g., 'Collection')
 * @param {Array} userPermissions - User's permission modules array
 * @returns {boolean}
 */
export const hasMenuAccess = (menuKey, userPermissions) => {
  if (!userPermissions || userPermissions.length === 0) return false;

  const menuModules = getModulesForMenu(menuKey);
  if (menuModules.length === 0) return false;

  // Check if user has any module for this menu
  return menuModules.some(module =>
    userPermissions.some(perm => perm.module === module),
  );
};

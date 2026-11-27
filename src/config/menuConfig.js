export const MENU_CONFIG = {
  // Dashboard - primary module
  Dashboard: {
    label: 'Home',
    icon: 'home',
    modules: ['dashboard', 'dashboard_main'],
    screenName: 'CommunityPost',
  },

  // Community Feed Items
  Post: {
    label: 'Post',
    icon: 'file-document',
    modules: ['community_post'],
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
    params: { contentType: 'News' },
  },

  Events: {
    label: 'Events',
    icon: 'calendar-event',
    modules: ['community_event'],
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

  OfficeBearers: {
    label: 'Office Bearers',
    icon: 'account-tie',
    modules: ['office_bearer'],
    screenName: 'OfficeBearerScreen',
  },

  Members: {
    label: 'Members',
    icon: 'account-group',
    children: [
      {
        key: 'UmoomiMember',
        label: 'Umoomi Member',
        modules: ['umoomi_member'],
        screenName: 'MembershipListScreen',
        params: {
          memberType: 'Ordinary Member',
          screenTitle: 'Umoomi Member (Ordinary)',
        },
      },
      {
        key: 'DawamiMember',
        label: 'Dawami Member',
        modules: ['dawami_member'],
        screenName: 'MembershipListScreen',
        params: {
          memberType: 'Dawami Member',
          screenTitle: 'Dawami Member',
        },
      },
      {
        key: 'LifeMember',
        label: 'Life Member',
        modules: ['life_member'],
        screenName: 'MembershipListScreen',
        params: {
          memberType: 'Life Member',
          screenTitle: 'Life Member',
        },
      },
    ],
  },

  Wazifadar: {
    label: 'Wazifadar',
    icon: 'account-school',
    modules: ['wazifadar'],
    screenName: 'WazifaApplicationsScreen',
  },

  Executive: {
    label: 'Executive',
    icon: 'account-star',
    children: [
      {
        key: 'MansabiMember',
        label: 'Mansabi Member',
        modules: ['mansabi_member'],
        screenName: 'ExecutiveMembersScreen',
        params: {
          memberType: 'Mansabi Member',
          screenTitle: 'Mansabi Member',
        },
      },
      {
        key: 'ElectedMember',
        label: 'Elected Member',
        modules: ['elected_member'],
        screenName: 'ExecutiveMembersScreen',
        params: {
          memberType: 'Elected Member',
          screenTitle: 'Elected Member',
        },
      },
      {
        key: 'MohsinAnjuman',
        label: 'Mohsin-e-Anjuman',
        modules: ['mohsin_e_anjuman'],
        screenName: 'MembershipListScreen',
        params: {
          memberType: 'Mohsine member',
          screenTitle: 'Mohsin-e-Anjuman',
        },
      },
      {
        key: 'SarparstAnjuman',
        label: 'Sarparst-e-Anjuman',
        modules: ['sarparst_e_anjuman'],
        screenName: 'MembershipListScreen',
        params: {
          memberType: 'Sarparast member',
          screenTitle: 'Sarparst-e-Anjuman',
        },
      },
    ],
  },
};

export const ROLE_MENUS = {
  SuperAdmin: Object.keys(MENU_CONFIG),
};

/**
 * Get visible menus for a role (fallback method)
 * @param {string} role - User role
 * @returns {Array} Array of menu objects with label, icon, modules
 */
export const getMenuForRole = role => {
  const menuKeys = ROLE_MENUS[role] || Object.keys(MENU_CONFIG);
  return menuKeys
    .filter(key => MENU_CONFIG[key])
    .map(key => ({
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
 * @param {string} menuKey - Menu key
 * @param {Array} userPermissions - User's permission modules array
 * @returns {boolean}
 */
export const hasMenuAccess = (menuKey, userPermissions) => {
  if (!userPermissions || userPermissions.length === 0) return true;

  const menuModules = getModulesForMenu(menuKey);
  if (menuModules.length === 0) return true;

  return menuModules.some(module =>
    userPermissions.some(perm => perm.module === module),
  );
};

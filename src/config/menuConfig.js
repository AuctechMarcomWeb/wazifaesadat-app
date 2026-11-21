/**
 * Menu Configuration mapped to backend permission modules (41 modules total)
 * Structure: menuKey -> backend permission module(s)
 */

export const MENU_CONFIG = {
  // Dashboard - primary module
  Dashboard: {
    label: 'Dashboard',
    icon: 'home',
    modules: ['dashboard', 'dashboard_main'],
  },

  // Master Register
  MasterRegister: {
    label: 'Master Register',
    icon: 'file-document',
    modules: ['master_register'],
  },

  // Communication (2 sub-items)
  Communication: {
    label: 'Communication',
    icon: 'email',
    modules: ['communication_letter', 'communication_messaging'],
    subs: [
      {
        key: 'LetterRecord',
        module: 'communication_letter',
        icon: 'email',
        screenName: 'LetterRecord',
      },
      {
        key: 'Messaging',
        module: 'communication_messaging',
        icon: 'message',
        screenName: 'Messaging',
      },
    ],
  },

  // Expenditure
  Expenditure: {
    label: 'Expenditure',
    icon: 'cash-minus',
    modules: ['expenditure_list'],
  },

  // Collection (8 sub-items: 7 in backend + Referral Link)
  Collection: {
    label: 'Collection',
    icon: 'cash-multiple',
    modules: [
      'collection', // ← Add parent module
      'collection_receive_payment',
      'collection_transaction',
      'collection_report',
      'collection_ledger_members',
      'collection_referral_link',
      'collection_payment_list',
      'collection_farde_hisaab_reports',
      'collection_farde_hisaab',
      'collection_income_expenditure_summary',
    ],
    subs: [
      {
        key: 'Payment',
        module: 'collection_receive_payment',
        icon: 'cash-plus',
        screenName: 'Payment',
      },
      {
        key: 'Transactions',
        module: 'collection_transaction',
        icon: 'swap-horizontal',
        screenName: 'Transactions',
      },
      {
        key: 'Reports',
        module: 'collection_report',
        icon: 'chart-line',
        screenName: 'Reports',
      },
      {
        key: 'LedgerMembers',
        module: 'collection_ledger_members',
        icon: 'book',
        screenName: 'LedgerMembers',
      },
      {
        key: 'ReferralLink',
        module: 'collection_referral_link',
        icon: 'link',
        screenName: 'ReferralLink',
      },
      {
        key: 'PaymentList',
        module: 'collection_payment_list',
        icon: 'list',
        screenName: 'PaymentList',
      },
      {
        key: 'FardeHisaabReports',
        module: 'collection_farde_hisaab_reports',
        icon: 'file-chart',
        screenName: 'FardeHisaab',
      },
      {
        key: 'IncomeExpenditureSummary',
        module: 'collection_income_expenditure_summary',
        icon: 'chart-box',
        screenName: 'IncomeExpenditure',
      },
    ],
  },

  // Income & Expenditure (part of Collection module)

  // Wazifedaar (5 sub-items)
  Wazifedaar: {
    label: 'Wazifedaar',
    icon: 'briefcase',
    modules: [
      'wazifedaar_apply_list',
      'wazifedaar_verify_list',
      'wazifedaar_transactions',
      'wazifedaar_ledger',
      'wazifedaar_due_report',
    ],
    subs: [
      {
        key: 'Applications',
        module: 'wazifedaar_apply_list',
        icon: 'file-document-outline',
        screenName: 'WazifedaarApplications',
      },
      {
        key: 'Verify',
        module: 'wazifedaar_verify_list',
        icon: 'check-circle',
        screenName: 'WazifedaarVerify',
      },
      {
        key: 'Transactions',
        module: 'wazifedaar_transactions',
        icon: 'swap-horizontal',
        screenName: 'WazifedaarTransactions',
      },
      {
        key: 'Ledger',
        module: 'wazifedaar_ledger',
        icon: 'book',
        screenName: 'WazifedaarLedger',
      },
      {
        key: 'Reports',
        module: 'wazifedaar_due_report',
        icon: 'chart-line',
        screenName: 'WazifedaarReports',
      },
    ],
  },
  // Wazifedaar (5 sub-items)
  Wazifedaar: {
    label: 'Wazifedaar',
    icon: 'briefcase',
    modules: [
      'wazifedaar_apply_list',
      'wazifedaar_verify_list',
      'wazifedaar_transactions',
      'wazifedaar_ledger',
      'wazifedaar_due_report',
    ],
    subs: [
      {
        key: 'Apply Wazifa ',
        module: 'wazifedaar_apply_list',
        icon: 'file-document-outline',
        screenName: 'WazifaApplicationsScreen',
      },
      {
        key: 'Verify Wazifa',
        module: 'wazifedaar_verify_list',
        icon: 'check-circle',
        screenName: 'VerifyWazifaListScreen',
      },
      {
        key: 'Recent Transactions',
        module: 'wazifedaar_transactions',
        icon: 'swap-horizontal',
        screenName: 'RecentTransactionsScreen',
      },
      {
        key: 'Ledger Of Wazifadar',
        module: 'wazifedaar_ledger',
        icon: 'book',
        screenName: 'LedgerOfWazifadarScreen',
      },
      {
        key: 'WazifaDueReport',
        module: 'wazifedaar_due_report',
        icon: 'chart-line',
        screenName: 'WazifaDueReportScreen',
      },
    ],
  },

  // Members (2 sub-items)
  Members: {
    label: 'Members',
    icon: 'account-multiple',
    modules: ['members_membership', 'members_list'],
    subs: [
      {
        key: 'Membership',
        module: 'members_membership',
        icon: 'card-account-details',
        screenName: 'MembershipScreen',
      },
      {
        key: 'List',
        module: 'members_list',
        icon: 'format-list-bulleted',
        screenName: 'MembershipListScreen',
      },
    ],
  },

  // Organisation (3 sub-items)
  Organisation: {
    label: 'Organisation',
    icon: 'domain',
    modules: [
      'org_office_bearer',
      'org_executive_members',
      'org_local_secretaries',
    ],
    subs: [
      {
        key: 'Office Bearers',
        module: 'org_office_bearer',
        icon: 'shield-account',
        screenName: 'OfficeBearerMasterScreen',
      },
      {
        key: 'Executive Members',
        module: 'org_executive_members',
        icon: 'account-tie',

        screenName: 'ExecutiveMembersScreen',
      },
      {
        key: 'Local Secretaries',
        module: 'org_local_secretaries',
        icon: 'office-building',
        screenName: 'LocalSecretariesScreen',
      },
    ],
  },

  // Masters (9 sub-items)
  Masters: {
    label: 'Masters',
    icon: 'cog',
    modules: [
      'master_designation',
      'master_tenure_year',
      'master_collected_by',
      'master_mode_of_payment',
      'master_bank',
      'master_fund_type',
      'master_scholarship_rate',
      'master_scholarship_date',
      'master_expense',
    ],
    subs: [
      {
        key: 'Designation',
        module: 'master_designation',
        icon: 'badge-account',
        screenName: 'DesignationScreen',
      },
      {
        key: 'Tenure Year',
        module: 'master_tenure_year',
        icon: 'calendar',
        screenName: 'TenureYearScreen',
      },
      {
        key: 'Collected By',
        module: 'master_collected_by',
        icon: 'account',
        screenName: 'CollectedByScreen',
      },
      {
        key: 'Mode of Payment',
        module: 'master_mode_of_payment',
        icon: 'credit-card',
        screenName: 'PaymentModeScreen',
      },
      {
        key: 'Bank',
        module: 'master_bank',
        icon: 'bank',
        screenName: 'BankScreen',
      },
      {
        key: 'Fund Type',
        module: 'master_fund_type',
        icon: 'wallet',
        screenName: 'FundTypeScreen',
      },
      {
        key: 'Scholarship Rate',
        module: 'master_scholarship_rate',
        icon: 'percent',
        screenName: 'RateOfScholarshipScreen',
      },
      {
        key: 'Scholarship Date',
        module: 'master_scholarship_date',
        icon: 'calendar-today',
        screenName: 'ScholarshipDateScreen',
      },
      {
        key: 'Expense',
        module: 'master_expense',
        icon: 'receipt',
        screenName: 'ExpenseScreen',
      },
    ],
  },

  // Admin-only menus (not in standard backend permissions but for SuperAdmin)
  UserManagement: {
    label: 'User Management',
    icon: 'account-cog',
    modules: ['user_management'],
    screenName: 'UserManagementScreen',
  },
  MenuAccessControl: {
    label: 'Menu Access Control',
    icon: 'security',
    modules: ['menu_access_control'],
    screenName: 'UserAccessManagementScreen',
  },
  ActivityLogs: {
    label: 'Activity Logs',
    icon: 'history',
    modules: ['activity_logs'],
    screenName: 'ActivityLogsScreen',
  },
};

/**
 * Role to menu mapping (based on typical org hierarchy)
 * Used as fallback when no backend permissions available
 */
export const ROLE_MENUS = {
  SuperAdmin: [
    'Dashboard',
    'MasterRegister',
    'Communication',
    'Expenditure',
    'Collection',
    'IncomeExpenditure',
    'Wazifedaar',
    'Members',
    'Organisation',
    'Masters',
    'UserManagement',
    'MenuAccessControl',
    'ActivityLogs',
  ],
  Admin: [
    'Dashboard',
    'MasterRegister',
    'Communication',
    'Expenditure',
    'Collection',
    'IncomeExpenditure',
    'Wazifedaar',
    'Members',
    'Organisation',
    'Masters',
  ],
  ExecutiveMember: ['Dashboard', 'Collection', 'Members', 'Organisation'],
  OfficeBearer: ['Dashboard', 'Collection', 'Wazifedaar', 'Members'],
  'Office Bearers': ['Dashboard', 'Collection', 'Wazifedaar', 'Members'],
  OfficeStaff: ['Dashboard', 'Communication', 'Collection', 'Members'],
  LocalSecretary: [
    'Dashboard',
    'Collection',
    'Members',
    'Wazifedaar',
    'Organisation',
  ],
  Membership: ['Dashboard', 'Members', 'Collection'],
  WazifaUser: ['Dashboard', 'Wazifedaar'],
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

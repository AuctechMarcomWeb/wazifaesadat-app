import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  SearchField,
  Dropdown,
  GreenButton,
  GrayButton,
  Badge,
} from '../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  getAllStaff,
  getStaffById,
  getStaffCredentials,
  toggleStaffLoginAccess,
  saveStaffPermissions,
  updateStaffDetails,
  resetStaffPassword,
  deleteStaff,
} from '../../../api/userAccess'; // Apne actual path ke hisaab se adjust karein

const ROLES = ['All', 'Admin', 'Office Bearers', 'OfficeStaff', 'SuperAdmin'];
const LOGIN_ACCESS_OPTIONS = ['All', 'Enabled', 'Disabled'];
const STATUS_OPTIONS = ['All', 'Active', 'Inactive'];
const PAGE_SIZE = 15;

const ALL_ACTIONS_META = [
  { key: 'canView', label: 'View', shortLabel: 'V' },
  { key: 'canCreate', label: 'Create', shortLabel: 'C' },
  { key: 'canEdit', label: 'Edit', shortLabel: 'E' },
  { key: 'canDelete', label: 'Delete', shortLabel: 'D' },
];

const DEFAULT_ACTIONS = ['canView', 'canCreate', 'canEdit', 'canDelete'];

/* ═══════════════════════════════════════════════════════
   CONSTANTS — MODULES (AWSM-ERP-ADMIN menus)
═══════════════════════════════════════════════════════ */
const MODULES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    items: [
      { key: 'dashboard_main', label: 'Main Dashboard', actions: ['canView'] },
    ],
  },
  {
    key: 'master_register',
    label: 'Master Register',
    items: [
      {
        key: 'master_register_view',
        label: 'View Master Register',
        actions: ['canView'],
      },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    items: [
      {
        key: 'communication_letter',
        label: 'Letter Record',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'communication_messaging',
        label: 'Messaging',
        actions: ['canView', 'canCreate'],
      },
    ],
  },
  {
    key: 'expenditure',
    label: 'Expenditure',
    items: [],
  },
  {
    key: 'collection',
    label: 'Collection',
    items: [
      {
        key: 'collection_receive_payment',
        label: 'Received Payment',
        actions: ['canView', 'canCreate'],
      },
      {
        key: 'collection_transaction',
        label: 'Transaction',
        actions: ['canView'],
      },
      {
        key: 'collection_report',
        label: 'Collection Report',
        actions: ['canView'],
      },
      {
        key: 'collection_ledger_members',
        label: 'Ledger of Members',
        actions: ['canView'],
      },
      {
        key: 'collection_referral_link',
        label: 'Referral Link',
        actions: ['canView'],
      },
      {
        key: 'collection_payment_list',
        label: 'Payment List',
        actions: ['canView'],
      },
      {
        key: 'collection_farde_hisaab_reports',
        label: 'Farde Hisaab Reports',
        actions: ['canView'],
      },
      {
        key: 'collection_farde_hisaab',
        label: 'Farde Hisaab',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'collection_farde_hisaab_income',
        label: 'Income & Expenditure (Farde Hisaab)',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'collection_income_expenditure',
        label: 'Income & Expenditure',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
    ],
  },
  {
    key: 'wazifedaar',
    label: 'Wazifedaar',
    items: [
      {
        key: 'wazifedaar_apply_list',
        label: 'Apply Wazifa List',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'wazifedaar_verify_list',
        label: 'Verify Wazifa List',
        actions: ['canView', 'canEdit'],
      },
      {
        key: 'wazifedaar_transactions',
        label: 'Recent Transactions',
        actions: ['canView'],
      },
      {
        key: 'wazifedaar_ledger',
        label: 'Ledger of Wazifedaar',
        actions: ['canView'],
      },
      {
        key: 'wazifedaar_due_report',
        label: 'Wazifa Due Report',
        actions: ['canView'],
      },
    ],
  },
  {
    key: 'members',
    label: 'Member List',
    items: [
      {
        key: 'members_membership',
        label: 'Membership',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'members_list',
        label: 'Members List',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
    ],
  },
  {
    key: 'organisation',
    label: 'Organisation Structure',
    items: [
      {
        key: 'org_office_bearer',
        label: 'Office Bearer',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'org_executive_members',
        label: 'Executive Members',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'org_local_secretaries',
        label: 'Local Secretaries',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    items: [
      {
        key: 'master_designation',
        label: 'Designation Master',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_tenure_year',
        label: 'Tenure Year Master',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_collected_by',
        label: 'Collected By',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_mode_of_payment',
        label: 'Mode of Payment',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_bank',
        label: 'Bank Master',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_fund_type',
        label: 'Fund Type Master',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_scholarship_rate',
        label: 'Rate of Scholarship',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_scholarship_date',
        label: 'Scholarship Date',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
      {
        key: 'master_expense',
        label: 'Expense Master',
        actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
      },
    ],
  },
];

const ALL_MODULE_KEYS = MODULES.flatMap(m => [
  m.key,
  ...(m.items || []).map(i => i.key),
]);

const getSubItemActions = key => {
  for (const mod of MODULES) {
    const found = (mod.items || []).find(item => item.key === key);
    if (found) {
      return Array.isArray(found.actions) && found.actions.length > 0
        ? found.actions
        : DEFAULT_ACTIONS;
    }
  }
  return DEFAULT_ACTIONS;
};

const emptyActionSet = () => ({
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
});

/* ── Debounce Hook ── */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const mapStaffItem = u => {
  const isLoginEnabled = !u.isSuspended;
  const formattedLastLogin = u.lastLogin
    ? new Date(u.lastLogin).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return {
    _id: u._id,
    id: u._id || u.userId,
    userId: u.userId || u._id || '-',
    fullName: u.name || '-',
    initial: (u.name || 'U').trim().charAt(0).toUpperCase(),
    role: u.role || 'Staff',
    contact: u.phone || '-',
    email: u.email || '-',
    isSuspended: Boolean(u.isSuspended),
    loginEnabled: isLoginEnabled,
    loginAccessText: isLoginEnabled ? 'Enabled' : 'Disabled',
    status: u.status || (!u.isSuspended ? 'Active' : 'Inactive'),
    lastLogin: formattedLastLogin,
  };
};

/* ── Reset Password Modal ── */
const ResetPasswordModal = ({ visible, user, onClose, onSuccess }) => {
  const [creds, setCreds] = useState({ userId: '', password: '' });
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !user?._id) return;
    let active = true;
    setNewPassword('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setCreds({ userId: user.userId || '', password: '' });
    setLoadingCreds(true);

    getStaffCredentials(user._id)
      .then(data => {
        if (!active) return;
        setCreds({
          userId: data?.userId || user.userId || '',
          password: data?.password || '',
        });
      })
      .catch(() => {
        if (!active) return;
        setCreds(prev => ({ ...prev, userId: user.userId || prev.userId }));
      })
      .finally(() => {
        if (active) setLoadingCreds(false);
      });

    return () => {
      active = false;
    };
  }, [visible, user]);

  const handleReset = async () => {
    if (!newPassword || newPassword.trim().length < 6) {
      Alert.alert(
        'Validation Error',
        'Password must be at least 6 characters long.',
      );
      return;
    }

    setSubmitting(true);

    try {
      await resetStaffPassword(user._id, newPassword.trim());

      Alert.alert(
        'Success',
        `Password for ${user.fullName} has been reset successfully.`,
      );

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      Alert.alert(
        'Error',
        err?.response?.data?.message ||
          'An error occurred while resetting the password.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centerModalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.filterTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                {user.fullName} ({user.role})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.credBox}>
            {loadingCreds ? (
              <View style={styles.rowCenter}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.credLoadingText}>
                  Loading credentials...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.credRow}>
                  <Text style={styles.labelKey}>Login User ID</Text>
                  <Text style={styles.credValueMono}>
                    {creds.userId || '-'}
                  </Text>
                </View>
                <View style={[styles.credRow, { marginBottom: 0 }]}>
                  <Text style={styles.labelKey}>Current Password</Text>
                  <View style={styles.rowCenter}>
                    <Text style={styles.credValueMono}>
                      {creds.password
                        ? showCurrentPw
                          ? creds.password
                          : '••••••••'
                        : 'Not set'}
                    </Text>
                    {!!creds.password && (
                      <TouchableOpacity
                        onPress={() => setShowCurrentPw(p => !p)}
                        style={{ marginLeft: 8 }}
                      >
                        <Icon
                          name={
                            showCurrentPw ? 'eye-off-outline' : 'eye-outline'
                          }
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>

          <Label text="New Password" />
          <View style={styles.passwordInputWrap}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min 6 chars)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showNewPw}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setShowNewPw(p => !p)}>
              <Icon
                name={showNewPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <GreenButton
              title={submitting ? 'Saving...' : 'Reset Password'}
              onPress={submitting ? null : handleReset}
              style={styles.applyBtn}
            />
            <GrayButton
              title="Cancel"
              onPress={onClose}
              style={styles.resetBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ── Edit User Modal ── */
const EditUserModal = ({ visible, user, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('OfficeStaff');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.fullName === '-' ? '' : user.fullName);
    setPhone(user.contact === '-' ? '' : user.contact);
    setEmail(user.email === '-' ? '' : user.email);
    setRole(user.role || 'OfficeStaff');
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }

    setSaving(true);

    try {
      await updateStaffDetails(user._id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
      });

      Alert.alert('Success', 'User details have been updated successfully.');

      onSaved && onSaved();
      onClose();
    } catch (err) {
      Alert.alert(
        'Error',
        err?.response?.data?.message ||
          'An error occurred while updating user details.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centerModalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.filterTitle}>Edit User Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Label text="Full Name" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#9CA3AF"
            style={[styles.textInputBox, styles.modalGap]}
          />

          <Label text="Contact No." />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            style={[styles.textInputBox, styles.modalGap]}
          />

          <Label text="Email Address" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.textInputBox, styles.modalGap]}
          />

          <Label text="Role" />
          <Dropdown
            value={role}
            options={ROLES.filter(r => r !== 'All')}
            onSelect={setRole}
            style={styles.modalGap}
          />

          <View style={styles.actionRow}>
            <GreenButton
              title={saving ? 'Updating...' : 'Update User'}
              onPress={saving ? null : handleSave}
              style={styles.applyBtn}
            />
            <GrayButton
              title="Cancel"
              onPress={onClose}
              style={styles.resetBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ── Mini Switch for Menu Permissions ── */
const ActionSwitch = ({ active, onPress, compact = false }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      compact ? styles.miniSwitchTrack : styles.switchTrack,
      { backgroundColor: active ? colors.primary : '#D1D5DB' },
    ]}
  >
    <View
      style={[
        compact ? styles.miniSwitchThumb : styles.switchThumb,
        active
          ? compact
            ? styles.miniSwitchThumbOn
            : styles.switchThumbOn
          : styles.switchThumbOff,
      ]}
    />
  </TouchableOpacity>
);

/* ── Tab 2: Menu Access Content ── */
const MenuAccessView = ({ staffList }) => {
  const [selectedStaffId, setSelectedStaffId] = useState(
    staffList[0]?._id || '',
  );
  const [permsByStaff, setPermsByStaff] = useState({});
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  useEffect(() => {
    if (!staffList.length) {
      setSelectedStaffId('');
      return;
    }
    const exists = staffList.some(s => s._id === selectedStaffId);
    if (!exists) {
      setSelectedStaffId(staffList[0]._id);
    }
  }, [staffList, selectedStaffId]);

  const selectedUser = useMemo(
    () => staffList.find(s => s._id === selectedStaffId) || staffList[0],
    [staffList, selectedStaffId],
  );

  const currentPerms = useMemo(
    () => permsByStaff[selectedStaffId] || {},
    [permsByStaff, selectedStaffId],
  );

  useEffect(() => {
    if (!selectedStaffId) return;
    let active = true;
    setLoadingPerms(true);

    getStaffById(selectedStaffId)
      .then(data => {
        if (!active) return;
        const map = {};
        const list = Array.isArray(data?.permissions) ? data.permissions : [];
        list.forEach(p => {
          if (p?.module) {
            map[p.module] = {
              canView: Boolean(p.canView),
              canCreate: Boolean(p.canCreate),
              canEdit: Boolean(p.canEdit),
              canDelete: Boolean(p.canDelete),
            };
          }
        });
        setPermsByStaff(prev => ({ ...prev, [selectedStaffId]: map }));
      })
      .catch(() => {
        if (!active) return;
        setPermsByStaff(prev => ({
          ...prev,
          [selectedStaffId]: prev[selectedStaffId] || {},
        }));
      })
      .finally(() => {
        if (active) setLoadingPerms(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStaffId]);

  const setModulePermissions = useCallback((staffId, updater) => {
    setPermsByStaff(prev => {
      const existing = prev[staffId] || {};
      const next = typeof updater === 'function' ? updater(existing) : updater;
      return { ...prev, [staffId]: next };
    });
  }, []);

  const toggleAction = (moduleKey, actionKey) => {
    setModulePermissions(selectedStaffId, prev => {
      const mod = prev[moduleKey] || emptyActionSet();
      return {
        ...prev,
        [moduleKey]: {
          ...mod,
          [actionKey]: !mod[actionKey],
        },
      };
    });
  };

  const toggleWholeModule = moduleKey => {
    setModulePermissions(selectedStaffId, prev => {
      const parentMod = MODULES.find(m => m.key === moduleKey);

      if (parentMod) {
        const parentPerm = prev[parentMod.key] || emptyActionSet();
        const parentAllOn = DEFAULT_ACTIONS.every(a => Boolean(parentPerm[a]));

        const subAllOn = (parentMod.items || []).every(sub => {
          const subPerm = prev[sub.key] || emptyActionSet();
          const relevantActions =
            Array.isArray(sub.actions) && sub.actions.length > 0
              ? sub.actions
              : DEFAULT_ACTIONS;
          return relevantActions.every(a => Boolean(subPerm[a]));
        });

        const nextVal = !(parentAllOn && subAllOn);
        const nextMap = {
          ...prev,
          [parentMod.key]: {
            canView: nextVal,
            canCreate: nextVal,
            canEdit: nextVal,
            canDelete: nextVal,
          },
        };

        (parentMod.items || []).forEach(sub => {
          const relevantActions =
            Array.isArray(sub.actions) && sub.actions.length > 0
              ? sub.actions
              : DEFAULT_ACTIONS;
          const existingSub = prev[sub.key] || emptyActionSet();
          const updatedSub = { ...existingSub };
          relevantActions.forEach(a => {
            updatedSub[a] = nextVal;
          });
          nextMap[sub.key] = updatedSub;
        });

        return nextMap;
      }

      const relevantActions = getSubItemActions(moduleKey);
      const current = prev[moduleKey] || emptyActionSet();
      const allOn = relevantActions.every(a => Boolean(current[a]));
      const nextSub = { ...current };
      relevantActions.forEach(a => {
        nextSub[a] = !allOn;
      });

      return {
        ...prev,
        [moduleKey]: nextSub,
      };
    });
  };

  const allFullySelected = useMemo(
    () =>
      ALL_MODULE_KEYS.every(key => {
        const mod = currentPerms[key];
        if (!mod) return false;
        const isParent = MODULES.some(m => m.key === key);
        const actionsToCheck = isParent
          ? DEFAULT_ACTIONS
          : getSubItemActions(key);
        return actionsToCheck.every(a => Boolean(mod[a]));
      }),
    [currentPerms],
  );

  const handleToggleSelectAll = () => {
    const nextVal = !allFullySelected;
    const nextMap = {};
    ALL_MODULE_KEYS.forEach(key => {
      const isParent = MODULES.some(m => m.key === key);
      const actionsToEnable = isParent
        ? DEFAULT_ACTIONS
        : getSubItemActions(key);
      const base = emptyActionSet();
      actionsToEnable.forEach(a => {
        base[a] = nextVal;
      });
      nextMap[key] = base;
    });
    setModulePermissions(selectedStaffId, nextMap);
  };

  const enabledModulesCount = useMemo(
    () =>
      ALL_MODULE_KEYS.filter(key => {
        const mod = currentPerms[key];
        return (
          mod && (mod.canView || mod.canCreate || mod.canEdit || mod.canDelete)
        );
      }).length,
    [currentPerms],
  );

  const handleSavePermissions = async () => {
    if (!selectedStaffId) return;

    setSavingPerms(true);

    try {
      const payload = ALL_MODULE_KEYS.map(moduleKey => {
        const mod = currentPerms[moduleKey] || emptyActionSet();

        return {
          module: moduleKey,
          canView: Boolean(mod.canView),
          canCreate: Boolean(mod.canCreate),
          canEdit: Boolean(mod.canEdit),
          canDelete: Boolean(mod.canDelete),
        };
      });

      await saveStaffPermissions(selectedStaffId, payload);

      Alert.alert(
        'Success',
        `Menu permissions for ${
          selectedUser?.fullName || 'User'
        } have been saved successfully.`,
      );
    } catch (err) {
      Alert.alert(
        'Error',
        err?.response?.data?.message ||
          'An error occurred while saving permissions.',
      );
    } finally {
      setSavingPerms(false);
    }
  };

  const progressPct = Math.round(
    (enabledModulesCount / Math.max(ALL_MODULE_KEYS.length, 1)) * 100,
  );

  if (!staffList.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="shield-off-outline" size={40} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No users available</Text>
        <Text style={styles.emptySubtitle}>
          Please load staff users first to assign menu permissions.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    >
      <View style={styles.menuControlCard}>
        <Label text="Select Staff User" />
        <Dropdown
          value={
            selectedUser
              ? `${selectedUser.fullName} (${selectedUser.role})`
              : 'Select User'
          }
          options={staffList.map(s => `${s.fullName} (${s.role})`)}
          onSelect={label => {
            const matched = staffList.find(
              s => `${s.fullName} (${s.role})` === label,
            );
            if (matched) setSelectedStaffId(matched._id);
          }}
          style={styles.modalGap}
        />

        <View style={styles.menuSummaryRow}>
          <View>
            <Text style={styles.labelKey}>Active Modules</Text>
            <Text style={styles.valTextBold}>
              {enabledModulesCount} / {ALL_MODULE_KEYS.length} ({progressPct}%)
            </Text>
          </View>
          <View style={styles.rowCenter}>
            <TouchableOpacity
              onPress={handleToggleSelectAll}
              style={styles.selectAllChip}
              activeOpacity={0.8}
            >
              <Text style={styles.selectAllText}>
                {allFullySelected ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        <GreenButton
          title={savingPerms ? 'Saving Permissions...' : 'Save Permissions'}
          onPress={savingPerms ? null : handleSavePermissions}
          style={{ marginTop: 12, height: 44 }}
        />
      </View>

      {loadingPerms ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptySubtitle}>Loading permissions...</Text>
        </View>
      ) : (
        MODULES.map(mod => {
          const modPerm = currentPerms[mod.key] || emptyActionSet();
          const allModOn = DEFAULT_ACTIONS.every(a => Boolean(modPerm[a]));

          return (
            <View key={mod.key} style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.valTextBold}>{mod.label}</Text>
                <ActionSwitch
                  active={allModOn}
                  onPress={() => toggleWholeModule(mod.key)}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.actionsGrid}>
                {ALL_ACTIONS_META.map(act => (
                  <View key={act.key} style={styles.actionItem}>
                    <Text style={styles.actionLabel}>{act.label}</Text>
                    <ActionSwitch
                      active={Boolean(modPerm[act.key])}
                      onPress={() => toggleAction(mod.key, act.key)}
                    />
                  </View>
                ))}
              </View>

              {Array.isArray(mod.items) && mod.items.length > 0 && (
                <View style={styles.subItemsWrap}>
                  {mod.items.map(sub => {
                    const subPerm = currentPerms[sub.key] || emptyActionSet();
                    const relevantActions =
                      Array.isArray(sub.actions) && sub.actions.length > 0
                        ? sub.actions
                        : DEFAULT_ACTIONS;
                    const allSubOn = relevantActions.every(a =>
                      Boolean(subPerm[a]),
                    );

                    return (
                      <View key={sub.key} style={styles.subItemCard}>
                        <View style={styles.subItemHeader}>
                          <Text style={styles.subItemTitle}>{sub.label}</Text>
                          <ActionSwitch
                            compact
                            active={allSubOn}
                            onPress={() => toggleWholeModule(sub.key)}
                          />
                        </View>
                        <View style={styles.subActionsRow}>
                          {ALL_ACTIONS_META.filter(a =>
                            relevantActions.includes(a.key),
                          ).map(a => (
                            <TouchableOpacity
                              key={a.key}
                              onPress={() => toggleAction(sub.key, a.key)}
                              style={[
                                styles.miniPill,
                                subPerm[a.key] && styles.miniPillActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.miniPillText,
                                  subPerm[a.key] && styles.miniPillTextActive,
                                ]}
                              >
                                {a.shortLabel}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

/* ── Main Screen ── */
const UserAccessManagementScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('access'); // 'access' | 'menu'
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [applied, setApplied] = useState({
    search: '',
    role: 'All',
    loginAccess: 'All',
    status: 'All',
  });

  const [draftRole, setDraftRole] = useState('All');
  const [draftLoginAccess, setDraftLoginAccess] = useState('All');
  const [draftStatus, setDraftStatus] = useState('All');

  const debouncedSearch = useDebounce(search, 500); // 500ms debounce

  useEffect(() => {
    setApplied(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const fetchStaffList = useCallback(
    async ({ targetPage = 1, mode = 'replace' } = {}) => {
      if (mode === 'replace' && !refreshing) {
        setLoading(true);
      } else if (mode === 'loadMore') {
        setLoadingMore(true);
      }

      try {
        const res = await getAllStaff({
          page: targetPage,
          limit: PAGE_SIZE,
          isPagination: true,
        });

        const rawItems = Array.isArray(res?.staff)
          ? res.staff
          : Array.isArray(res?.data?.staff)
          ? res.data.staff
          : Array.isArray(res)
          ? res
          : [];

        const mapped = rawItems.map(mapStaffItem);

        const pagination = res?.pagination || res?.data?.pagination;
        const computedHasMore =
          typeof pagination?.hasNextPage === 'boolean'
            ? pagination.hasNextPage
            : pagination?.totalPages
            ? targetPage < pagination.totalPages
            : rawItems.length === PAGE_SIZE;

        setPage(targetPage);
        setHasMore(computedHasMore);
        setStaffData(prev => {
          if (mode === 'loadMore') {
            const seen = new Set(prev.map(x => x._id));
            return [...prev, ...mapped.filter(x => !seen.has(x._id))];
          }
          return mapped;
        });
      } catch (err) {
        Alert.alert(
          'Error',
          err?.response?.data?.message || 'Something Went Wrong.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [refreshing],
  );

  useEffect(() => {
    fetchStaffList({ targetPage: 1, mode: 'replace' });
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaffList({ targetPage: 1, mode: 'refresh' });
  }, [fetchStaffList]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    fetchStaffList({ targetPage: page + 1, mode: 'loadMore' });
  }, [loading, refreshing, loadingMore, hasMore, page, fetchStaffList]);

  const openFilter = () => {
    setDraftRole(applied.role);
    setDraftLoginAccess(applied.loginAccess);
    setDraftStatus(applied.status);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      role: draftRole,
      loginAccess: draftLoginAccess,
      status: draftStatus,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftRole('All');
    setDraftLoginAccess('All');
    setDraftStatus('All');
    setSearch('');
    setApplied({
      search: '',
      role: 'All',
      loginAccess: 'All',
      status: 'All',
    });
    setFilterOpen(false);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (applied.role !== 'All') count += 1;
    if (applied.loginAccess !== 'All') count += 1;
    if (applied.status !== 'All') count += 1;
    return count;
  }, [applied]);

  const filteredData = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    return staffData.filter(item => {
      if (applied.role !== 'All' && item.role !== applied.role) return false;
      if (applied.status !== 'All' && item.status !== applied.status)
        return false;
      if (applied.loginAccess === 'Enabled' && !item.loginEnabled) return false;
      if (applied.loginAccess === 'Disabled' && item.loginEnabled) return false;

      if (
        q &&
        !item.fullName.toLowerCase().includes(q) &&
        !String(item.userId).toLowerCase().includes(q) &&
        !String(item.contact).toLowerCase().includes(q) &&
        !String(item.email).toLowerCase().includes(q) &&
        !String(item.role).toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [staffData, applied]);

  const stats = useMemo(() => {
    const total = staffData.length;
    const active = staffData.filter(u => u.status === 'Active').length;
    const inactive = staffData.filter(u => u.status !== 'Active').length;
    const loginEnabled = staffData.filter(u => u.loginEnabled).length;
    return { total, active, inactive, loginEnabled };
  }, [staffData]);

  const handleToggleLogin = async item => {
    if (!item?._id || togglingId === item._id) return;
    const nextLoginEnabled = !item.loginEnabled;
    const nextSuspended = !nextLoginEnabled;

    setTogglingId(item._id);
    try {
      await toggleStaffLoginAccess(item._id, {
        isSuspended: nextSuspended,
        suspendedReason: nextSuspended ? 'Login disabled by Admin' : '',
      });
      setStaffData(prev =>
        prev.map(u =>
          u._id === item._id
            ? {
                ...u,
                isSuspended: nextSuspended,
                loginEnabled: nextLoginEnabled,
                loginAccessText: nextLoginEnabled ? 'Enabled' : 'Disabled',
              }
            : u,
        ),
      );
    } catch (err) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Something went Wrong.',
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = item => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${item.fullName} (${item.userId})?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStaff(item._id);

              setStaffData(prev => prev.filter(u => u._id !== item._id));

              Alert.alert(
                'Success',
                `${item.fullName} has been deleted successfully.`,
              );
            } catch (err) {
              Alert.alert(
                'Error',
                err?.response?.data?.message ||
                  'An error occurred while deleting the user.',
              );
            }
          },
        },
      ],
    );
  };
  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.userInfoRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.initial}</Text>
          </View>
          <View>
            <Text style={styles.srNo}>{index + 1}</Text>
            <Text style={styles.valTextBold}>{item.fullName}</Text>
          </View>
        </View>
        <Badge text={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>User ID</Text>
          <Text style={styles.valText}>{item.userId}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Role</Text>
          <Text style={styles.valTextPrimary}>{item.role}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Contact No.</Text>
          <Text style={styles.valText}>{item.contact}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Login Access</Text>
          <View style={styles.loginToggleWrap}>
            <Text
              style={[
                styles.loginStatusLabel,
                { color: item.loginEnabled ? '#15803D' : '#DC2626' },
              ]}
            >
              {item.loginAccessText}
            </Text>
            <ActionSwitch
              compact
              active={item.loginEnabled}
              onPress={() => handleToggleLogin(item)}
            />
          </View>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Email Address</Text>
          <Text style={styles.valText}>{item.email}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Last Login</Text>
          <Text style={styles.valText}>{item.lastLogin}</Text>
        </View>
      </View>

      <View style={styles.cardActionsRow}>
        <TouchableOpacity
          style={styles.miniActionBtn}
          activeOpacity={0.8}
          onPress={() => setResetTarget(item)}
        >
          <Icon name="lock-reset" size={15} color={colors.primary} />
          <Text style={styles.miniActionText}>Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.miniActionBtn}
          activeOpacity={0.8}
          onPress={() => setEditTarget(item)}
        >
          <Icon name="pencil-outline" size={15} color="#2563EB" />
          <Text style={[styles.miniActionText, { color: '#2563EB' }]}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.miniActionBtnDanger}
          activeOpacity={0.8}
          onPress={() => handleDeleteUser(item)}
        >
          <Icon name="trash-can-outline" size={15} color="#DC2626" />
          <Text style={[styles.miniActionText, { color: '#DC2626' }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Loading more users...</Text>
        </View>
      );
    }
    if (!hasMore && filteredData.length > 0) {
      return (
        <Text style={styles.footerEndText}>
          All {filteredData.length} users loaded
        </Text>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="User Access Management"
          onBack={() => navigation && navigation.goBack()}
        />

        {/* Tabs Bar */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'access' && styles.tabBtnActive,
            ]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('access')}
          >
            <Icon
              name="account-key-outline"
              size={17}
              color={
                activeTab === 'access' ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'access' && styles.tabLabelActive,
              ]}
            >
              User Access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'menu' && styles.tabBtnActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('menu')}
          >
            <Icon
              name="shield-check-outline"
              size={17}
              color={
                activeTab === 'menu' ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'menu' && styles.tabLabelActive,
              ]}
            >
              Menu Access
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Body>
            {activeTab === 'menu' ? (
              <MenuAccessView staffList={staffData} />
            ) : loading && !refreshing ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.emptySubtitle}>Loading users...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.35}
                ListFooterComponent={renderFooter}
                ListHeaderComponent={
                  <View>
                    {/* Stats Grid */}
                    {/* <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={styles.statTitle}>Total Users</Text>
                        <Text style={styles.statVal}>{stats.total}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statTitle}>Active</Text>
                        <Text style={[styles.statVal, { color: '#15803D' }]}>
                          {stats.active}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statTitle}>Inactive</Text>
                        <Text style={[styles.statVal, { color: '#DC2626' }]}>
                          {stats.inactive}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statTitle}>Login Enabled</Text>
                        <Text style={[styles.statVal, { color: '#2563EB' }]}>
                          {stats.loginEnabled}
                        </Text>
                      </View>
                    </View> */}

                    {/* Search Field & Filter Icon Row */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search users..."
                          value={search}
                          onChangeText={setSearch}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.filterButton}
                        activeOpacity={0.8}
                        onPress={openFilter}
                      >
                        <Icon
                          name="filter-variant"
                          size={22}
                          color={colors.white}
                        />
                        {activeFilterCount > 0 && (
                          <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>
                              {activeFilterCount}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionHeading}>
                      All Users ({filteredData.length})
                    </Text>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="account-search-outline"
                      size={40}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyTitle}>No users found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or filters, or pull down to
                      refresh.
                    </Text>
                  </View>
                }
              />
            )}
          </Body>
        </View>

        {/* Filter Modal */}
        <Modal
          visible={filterOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterOpen(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setFilterOpen(false)}
          >
            <View
              style={styles.filterSheet}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={styles.filterTitle}>Filter Users Access</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Role" />
              <Dropdown
                value={draftRole}
                options={ROLES}
                onSelect={setDraftRole}
                style={styles.modalGap}
              />

              <Label text="Login Access" />
              <Dropdown
                value={draftLoginAccess}
                options={LOGIN_ACCESS_OPTIONS}
                onSelect={setDraftLoginAccess}
                style={styles.modalGap}
              />

              <Label text="Status" />
              <Dropdown
                value={draftStatus}
                options={STATUS_OPTIONS}
                onSelect={setDraftStatus}
                style={styles.modalGap}
              />

              <View style={styles.actionRow}>
                <GreenButton
                  title="Apply"
                  onPress={applyFilter}
                  style={styles.applyBtn}
                />
                <GrayButton
                  title="Reset"
                  onPress={handleReset}
                  style={styles.resetBtn}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Reset Password Modal */}
        <ResetPasswordModal
          visible={Boolean(resetTarget)}
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={() => fetchStaffList({ targetPage: 1, mode: 'refresh' })}
        />

        {/* Edit User Modal */}
        <EditUserModal
          visible={Boolean(editTarget)}
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchStaffList({ targetPage: 1, mode: 'refresh' })}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  body: {
    flex: 1,
    marginTop: 0,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statVal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  searchFlex: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  sectionHeading: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 8,
  },

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 24,
    paddingTop: 12,
  },
  card: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  srNo: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  labelKey: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  valTextBold: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  valTextPrimary: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  valText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
  },
  loginToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loginStatusLabel: {
    fontSize: FontSize.sm || 11,
    fontFamily: FontFamily.bold,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  miniActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  miniActionBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  miniActionText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  /* Menu Access Styles */
  menuControlCard: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  menuSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectAllChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  selectAllText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  actionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.TitleColor,
  },
  subItemsWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  subItemCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  subItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subItemTitle: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  miniPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  miniPillText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.textSecondary,
  },
  miniPillTextActive: {
    color: colors.primary,
  },

  /* Switches */
  switchTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  switchThumbOff: {
    alignSelf: 'flex-start',
  },
  miniSwitchTrack: {
    width: 34,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  miniSwitchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  miniSwitchThumbOn: {
    alignSelf: 'flex-end',
  },

  /* Footer & Empty */
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  footerEndText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#1F2937',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  /* Filter & Action Modals */
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  centerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: wp('4%'),
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  credBox: {
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  credValueMono: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  credLoadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    height: 44,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
  },
  textInputBox: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    backgroundColor: '#FAFAFA',
  },
  filterSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  modalGap: {
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  applyBtn: {
    flex: 1,
    marginRight: 8,
    height: 48,
  },
  resetBtn: {
    flex: 1,
    height: 48,
  },
});

export default UserAccessManagementScreen;

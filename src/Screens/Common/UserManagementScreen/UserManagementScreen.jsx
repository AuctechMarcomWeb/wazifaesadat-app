import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
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
  TextField,
} from '../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import {
  getUsersByRole,
  updateUser,
  suspendUser,
  activateUser,
} from '../../../api/userManagement';
import { useFocusEffect } from '@react-navigation/native';

const ROLES = ['Staff', 'Membership', 'Wazifa User'];
const STATUSES = ['All Status', 'Active', 'Suspended'];
const PAGE_LIMIT = 20;

const UserManagementScreen = ({ navigation }) => {
  const [activeRole, setActiveRole] = useState('Staff');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    userId: '',
    isSuspended: false,
  });
  const [editSaving, setEditSaving] = useState(false);

  const debounceRef = useRef(null);
  const isFetchingMoreRef = useRef(false);
  const showAddButton = activeRole === 'Staff';

  const fetchUsersPage = useCallback(
    async ({
      targetPage = 1,
      mode = 'replace', // 'replace' | 'append' | 'refresh'
      role = activeRole,
      searchQuery = appliedSearch,
      status = statusFilter,
    }) => {
      if (mode === 'append') {
        if (isFetchingMoreRef.current) return;
        isFetchingMoreRef.current = true;
        setLoadingMore(true);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await getUsersByRole(
          role,
          targetPage,
          PAGE_LIMIT,
          searchQuery.trim(),
          status,
        );

        const userData = Array.isArray(result?.users) ? result.users : [];
        const pages =
          Number(result?.totalPages) > 0 ? Number(result.totalPages) : 1;
        const totalCount =
          typeof result?.total === 'number' ? result.total : userData.length;

        setTotal(totalCount);
        setTotalPages(pages);
        setPage(targetPage);

        setUsers(prev => {
          if (mode !== 'append' || targetPage === 1) {
            return userData;
          }
          const seenIds = new Set(prev.map(u => String(u._id)));
          const uniqueIncoming = userData.filter(
            u => !seenIds.has(String(u._id)),
          );
          return [...prev, ...uniqueIncoming];
        });
      } catch (error) {
        Alert.alert(
          'Error',
          error?.response?.data?.message ||
            error.message ||
            'Failed to load users',
        );
        console.error('Load error:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingMoreRef.current = false;
      }
    },
    [activeRole, appliedSearch, statusFilter],
  );

  // Initial load & whenever role, debounced search, or status filter changes
  useFocusEffect(
    useCallback(() => {
      fetchUsersPage({
        targetPage: 1,
        mode: 'replace',
        role: activeRole,
        searchQuery: appliedSearch,
        status: statusFilter,
      });

      setPage(1);
      setTotalPages(1);
    }, [fetchUsersPage]),
  );
  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || isFetchingMoreRef.current) {
      return;
    }
    if (users.length === 0 || page >= totalPages) {
      return;
    }

    fetchUsersPage({
      targetPage: page + 1,
      mode: 'append',
    });
  };

  const handleRefresh = () => {
    fetchUsersPage({
      targetPage: 1,
      mode: 'refresh',
    });
  };

  const handleSearch = text => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedSearch(text);
    }, 400);
  };

  const handleStatusChange = val => {
    setStatusFilter(val);
  };

  const handleRoleChange = role => {
    if (role === activeRole) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setActiveRole(role);
    setSearch('');
    setAppliedSearch('');
  };

  const openEditModal = user => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      userId: user.userId || '',
      isSuspended: Boolean(user.isSuspended),
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    setEditSaving(true);
    try {
      await updateUser(selectedUser._id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        userId: editForm.userId.trim(),
        isSuspended: editForm.isSuspended,
      });
      Alert.alert('Success', 'User updated successfully');
      setEditModalOpen(false);
      fetchUsersPage({ targetPage: 1, mode: 'replace' });
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || error.message || 'Update failed',
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleSuspend = async (user, suspend) => {
    try {
      await (suspend ? suspendUser(user._id, true) : activateUser(user._id));
      Alert.alert(
        'Success',
        `User ${suspend ? 'suspended' : 'activated'} successfully`,
      );
      fetchUsersPage({ targetPage: 1, mode: 'replace' });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update user status');
    }
  };

  const renderItem = ({ item, index }) => {
    const isSuspended = Boolean(item.isSuspended);

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.srNo}>{index + 1}</Text>
          <Text style={styles.idText}>ID: {item.userId || '—'}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isSuspended ? '#FEE2E2' : '#D1FAE5' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isSuspended ? '#991B1B' : '#065F46' },
              ]}
            >
              {isSuspended ? 'Suspended' : 'Active'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Full Name</Text>
            <Text style={styles.valTextBold}>{item.name || '—'}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Role</Text>
            <Text style={styles.valTextPrimary}>{item.role || activeRole}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Contact No.</Text>
            <Text style={styles.valText}>{item.phone || '—'}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Last Login</Text>
            <Text style={styles.valText}>
              {item.lastLogin
                ? new Date(item.lastLogin).toLocaleDateString('en-IN')
                : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Email Address</Text>
            <Text style={styles.valText}>{item.email || '—'}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editActionBtn]}
            activeOpacity={0.8}
            onPress={() => openEditModal(item)}
          >
            <Icon
              name="pencil-outline"
              size={16}
              color="#047857"
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.actionBtnText, styles.editActionText]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              isSuspended ? styles.activateActionBtn : styles.suspendActionBtn,
            ]}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                'Confirm',
                `${isSuspended ? 'Activate' : 'Suspend'} this user?`,
                [
                  { text: 'Cancel' },
                  {
                    text: 'Yes',
                    onPress: () => handleToggleSuspend(item, !isSuspended),
                  },
                ],
              )
            }
          >
            <Icon
              name={isSuspended ? 'check-circle-outline' : 'lock-outline'}
              size={16}
              color={isSuspended ? '#047857' : '#DC2626'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: isSuspended ? '#047857' : '#DC2626' },
              ]}
            >
              {isSuspended ? 'Activate' : 'Suspend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerLoaderText}>Loading more users…</Text>
        </View>
      );
    }

    if (users.length > 0 && page >= totalPages) {
      // return (
      //   <Text style={styles.endOfListText}>
      //     Showing all {users.length} of {total} users
      //   </Text>
      // );
    }

    return null;
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="User Management"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <View style={styles.screenColumn}>
              {/* Top Role Tabs */}
              <View style={styles.roleTabsContainer}>
                {ROLES.map(role => {
                  const isActive = activeRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleTab, isActive && styles.roleTabActive]}
                      activeOpacity={0.8}
                      onPress={() => handleRoleChange(role)}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.roleTabText,
                          isActive && styles.roleTabTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* List / Loader */}
              <View style={styles.listWrapper}>
                {loading && users.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={users}
                    keyExtractor={item => String(item._id)}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={renderListFooter}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                      />
                    }
                    ListHeaderComponent={
                      <View style={styles.searchFilterContainer}>
                        <View style={styles.searchFlex}>
                          <SearchField
                            placeholder="Search by name, phone, email..."
                            value={search}
                            onChangeText={handleSearch}
                          />
                        </View>

                        <Dropdown
                          value={statusFilter}
                          options={STATUSES}
                          onSelect={handleStatusChange}
                          style={styles.statusFilter}
                        />
                      </View>
                    }
                    ListEmptyComponent={
                      !loading ? (
                        <View style={styles.emptyContainer}>
                          <Icon
                            name="account-search-outline"
                            size={40}
                            color="#9CA3AF"
                          />
                          <Text style={styles.emptyTitle}>No users found</Text>
                          <Text style={styles.emptySubtitle}>
                            Try adjusting your search or filters.
                          </Text>
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>

              {/* Bottom Bar: Add Button only on Staff tab + Total row */}
              {(showAddButton || (!loading && users.length > 0)) && (
                <View style={styles.bottomBar}>
                  {!loading && users.length > 0 && (
                    <View
                      style={[
                        styles.totalRow,
                        !showAddButton && styles.totalRowNoBtn,
                      ]}
                    ></View>
                  )}

                  {showAddButton && (
                    <GreenButton
                      title="+ Add Staff"
                      onPress={() =>
                        navigation.navigate('AddUserScreen', { role: 'Staff' })
                      }
                      style={styles.addButtonBar}
                    />
                  )}
                </View>
              )}
            </View>
          </Body>
        </View>

        {/* Edit Modal */}
        <Modal
          visible={editModalOpen && Boolean(selectedUser)}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditModalOpen(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Edit User</Text>
                <TouchableOpacity
                  onPress={() => setEditModalOpen(false)}
                  style={styles.modalCloseBtn}
                >
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <Label text="Full Name *" />
                <TextField
                  value={editForm.name}
                  onChangeText={text =>
                    setEditForm({ ...editForm, name: text })
                  }
                  editable={!editSaving}
                  style={styles.inputGap}
                />

                <Label text="Phone" />
                <TextField
                  value={editForm.phone}
                  onChangeText={text =>
                    setEditForm({
                      ...editForm,
                      phone: text.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!editSaving}
                  style={styles.inputGap}
                />

                <Label text="Email" />
                <TextField
                  value={editForm.email}
                  onChangeText={text =>
                    setEditForm({ ...editForm, email: text })
                  }
                  keyboardType="email-address"
                  editable={!editSaving}
                  style={styles.inputGap}
                />

                <Label text="User ID" />
                <TextField
                  value={editForm.userId}
                  onChangeText={text =>
                    setEditForm({ ...editForm, userId: text })
                  }
                  editable={!editSaving}
                  style={styles.inputGap}
                />

                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() =>
                    setEditForm({
                      ...editForm,
                      isSuspended: !editForm.isSuspended,
                    })
                  }
                >
                  <Icon
                    name={
                      editForm.isSuspended
                        ? 'checkbox-marked'
                        : 'checkbox-blank-outline'
                    }
                    size={20}
                    color={colors.primary}
                    style={styles.checkboxIcon}
                  />
                  <Text style={styles.checkboxLabel}>Suspend this user</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalFooter}>
                <GrayButton
                  title="Cancel"
                  onPress={() => setEditModalOpen(false)}
                  disabled={editSaving}
                  style={styles.footerBtn}
                />
                <GreenButton
                  title={editSaving ? 'Saving…' : 'Update'}
                  onPress={handleEditSave}
                  disabled={editSaving}
                  style={styles.footerBtn}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },
  body: {
    flex: 1,
    marginTop: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  screenColumn: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: wp('2%'),
    flexShrink: 0,
    marginTop: 25,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  roleTabActive: {
    borderBottomColor: colors.primary,
  },
  roleTabText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#6B7280',
  },
  roleTabTextActive: {
    color: colors.primary,
    fontFamily: FontFamily.bold,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 14,
    gap: 8,
  },
  searchFlex: {
    flex: 1,
  },
  statusFilter: {
    width: 118,
  },
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 20,
    paddingTop: 4,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerLoaderText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  endOfListText: {
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  srNo: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  idText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  editActionBtn: {
    backgroundColor: '#E6F7EE',
    borderColor: '#A7E8C5',
  },
  editActionText: {
    color: '#047857',
  },
  suspendActionBtn: {
    backgroundColor: '#FDECEC',
    borderColor: '#F8C4C4',
  },
  activateActionBtn: {
    backgroundColor: '#E6F7EE',
    borderColor: '#A7E8C5',
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  bottomBar: {
    paddingHorizontal: wp('4%'),
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexShrink: 0,
  },
  totalRow: {
    marginBottom: 8,
  },
  totalRowNoBtn: {
    marginBottom: 0,
  },
  totalText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  totalBold: {
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  addButtonBar: {
    height: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    maxHeight: '72%',
  },
  inputGap: {
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBtn: {
    flex: 1,
    height: 48,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  checkboxIcon: {
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
});

export default UserManagementScreen;

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
} from '../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';
import {
  getActivityLogs,
  getActivityLogsStats,
} from '../../../api/activityLogs';

const ROLES = [
  'SuperAdmin',
  'All Users',
  'Admin',
  'Office Bearers',
  'OfficeStaff',
];
const ACTIONS = [
  'All',
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'VIEW',
  'EXPORT',
];
const MODULES = ['All', 'User Management', 'Masters', 'Collection', 'Settings'];
const PAGE_SIZE = 20;

const getStatusColor = success => (success ? '#15803D' : '#DC2626');

const getActionColor = action => {
  const map = {
    LOGIN: '#0891B2',
    LOGOUT: '#6B7280',
    CREATE: '#2563EB',
    UPDATE: '#D97706',
    DELETE: '#DC2626',
    VIEW: '#7C3AED',
    EXPORT: '#DB2777',
  };
  return map[action] || '#6B7280';
};

const DetailRow = ({ label, value, valueStyle }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
  </View>
);

const ActivityLogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    unique: 0,
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const [applied, setApplied] = useState({
    userRole: 'SuperAdmin',
    action: 'All',
    module: 'All',
  });

  const [draftRole, setDraftRole] = useState('SuperAdmin');
  const [draftAction, setDraftAction] = useState('All');
  const [draftModule, setDraftModule] = useState('All');

  const [selectedLog, setSelectedLog] = useState(null);
  const debounceRef = useRef(null);
  const isMountedRef = useRef(true);
  const canLoadMoreRef = useRef(false);

  const hasMore = page < totalPages;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchLogsData = useCallback(
    async ({ targetPage = 1, mode = 'replace' } = {}) => {
      if (mode === 'replace') {
        canLoadMoreRef.current = false;
        setLoading(true);
      }
      if (mode === 'refresh') {
        canLoadMoreRef.current = false;
        setRefreshing(true);
      }
      if (mode === 'loadMore') {
        setLoadingMore(true);
      }

      try {
        const filters = {
          userRole: applied.userRole,
          action: applied.action,
          module: applied.module,
          search: debouncedSearch.trim(),
        };

        const promises = [getActivityLogs(targetPage, PAGE_SIZE, filters)];
        if (mode !== 'loadMore') {
          promises.push(getActivityLogsStats(filters));
        }

        const [logsResult, statsResult] = await Promise.all(promises);
        if (!isMountedRef.current) return;

        const incomingLogs = logsResult?.logs || [];

        setPage(targetPage);
        setTotal(logsResult?.totalLogs || 0);
        setTotalPages(logsResult?.totalPages || 1);

        setLogs(prev => {
          if (mode === 'loadMore') {
            const seen = new Set(prev.map(item => item._id || item.id));
            const uniqueNext = incomingLogs.filter(
              item => !seen.has(item._id || item.id),
            );
            return [...prev, ...uniqueNext];
          }
          return incomingLogs;
        });

        if (statsResult) {
          setStats({
            total: statsResult.total || 0,
            successful: statsResult.successful || 0,
            failed: statsResult.failed || 0,
            unique: statsResult.unique ?? statsResult.uniqueUsers ?? 0,
          });
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        Alert.alert(
          'Error',
          error?.response?.data?.message ||
            error.message ||
            'Failed to load activity logs',
        );
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [applied.userRole, applied.action, applied.module, debouncedSearch],
  );

  useFocusEffect(
    useCallback(() => {
      fetchLogsData({ targetPage: 1, mode: 'replace' });
    }, [fetchLogsData]),
  );

  const handleSearchChange = text => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 350);
  };

  const openFilter = () => {
    setDraftRole(applied.userRole);
    setDraftAction(applied.action);
    setDraftModule(applied.module);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied({
      userRole: draftRole,
      action: draftAction,
      module: draftModule,
    });
    setFilterOpen(false);
  };

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch('');
    setDebouncedSearch('');
    setDraftRole('SuperAdmin');
    setDraftAction('All');
    setDraftModule('All');
    setApplied({
      userRole: 'SuperAdmin',
      action: 'All',
      module: 'All',
    });
    setFilterOpen(false);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (applied.userRole !== 'SuperAdmin') count += 1;
    if (applied.action !== 'All') count += 1;
    if (applied.module !== 'All') count += 1;
    return count;
  }, [applied]);

  const handleLoadMore = useCallback(() => {
    if (!canLoadMoreRef.current) return;
    if (loading || refreshing || loadingMore || !hasMore) return;
    canLoadMoreRef.current = false;
    fetchLogsData({ targetPage: page + 1, mode: 'loadMore' });
  }, [loading, refreshing, loadingMore, hasMore, page, fetchLogsData]);

  const renderLogItem = ({ item, index }) => {
    const date = item.createdAt ? new Date(item.createdAt) : null;
    const timeStr =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—';
    const dateStr =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—';

    const actionColor = getActionColor(item.action);
    const statusColor = getStatusColor(item.success);

    return (
      <TouchableOpacity
        style={styles.logCard}
        onPress={() => setSelectedLog(item)}
        activeOpacity={0.75}
      >
        <View style={styles.logHeader}>
          <View style={styles.logLeft}>
            <View
              style={[styles.avatar, { backgroundColor: `${actionColor}18` }]}
            >
              <Text style={[styles.avatarText, { color: actionColor }]}>
                {(item.userName || 'U').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.srNo}>{index + 1}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {item.userName || '—'}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                {item.userRole || '—'}
              </Text>
            </View>
          </View>

          <View
            style={[styles.statusPill, { backgroundColor: `${statusColor}15` }]}
          >
            <Icon
              name={
                item.success ? 'check-circle-outline' : 'alert-circle-outline'
              }
              size={14}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.success ? 'Success' : 'Failed'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.logBody}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Action</Text>
            <View
              style={[
                styles.actionBadge,
                { backgroundColor: `${actionColor}16` },
              ]}
            >
              <Text style={[styles.actionBadgeText, { color: actionColor }]}>
                {item.action || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.metaColCenter}>
            <Text style={styles.metaLabel}>Module</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {item.module || '—'}
            </Text>
          </View>

          <View style={styles.metaColRight}>
            <Text style={styles.metaLabel}>Time</Text>
            <Text style={styles.metaValue}>{timeStr}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Icon name="calendar-blank-outline" size={13} color="#9CA3AF" />
            <Text style={styles.footerText}>{dateStr}</Text>
          </View>
          <View style={styles.detailsHint}>
            <Text style={styles.detailsHintText}>Details</Text>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.headerBlock}>
      {/* <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Success</Text>
          <Text style={[styles.statValue, { color: '#15803D' }]}>
            {stats.successful}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>
            {stats.failed}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Users</Text>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>
            {stats.unique}
          </Text>
        </View>
      </View> */}

      {/* Main Screen: Sirf Search + Filter Button */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchFlex}>
          <SearchField
            placeholder="Search user, IP..."
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.8}
          onPress={openFilter}
        >
          <Icon name="filter-variant" size={22} color={colors.white} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Activity Records ({total})</Text>
        <Text style={styles.pageIndicator}>
          Page {page} of {totalPages}
        </Text>
      </View>
    </View>
  );

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerLoaderText}>Loading more logs...</Text>
        </View>
      );
    }

    if (!hasMore && logs.length > 0) {
      return (
        <Text style={styles.endOfListText}>
          Showing {logs.length} of {total} logs
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
          title="Activity Logs"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading && logs.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading activity logs...</Text>
              </View>
            ) : (
              <FlatList
                data={logs}
                keyExtractor={(item, idx) => String(item._id || item.id || idx)}
                renderItem={renderLogItem}
                ListHeaderComponent={renderListHeader}
                ListFooterComponent={renderListFooter}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                onMomentumScrollBegin={() => {
                  canLoadMoreRef.current = true;
                }}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.35}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() =>
                      fetchLogsData({ targetPage: 1, mode: 'refresh' })
                    }
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="history" size={42} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>
                      No activity logs found
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting search or filters, or pull down to refresh.
                    </Text>
                  </View>
                }
              />
            )}
          </Body>
        </View>

        {/* Filter Modal: Saare Filters Yahan */}
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
                <Text style={styles.filterTitle}>Filter Activity Logs</Text>
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

              <Label text="Action" />
              <Dropdown
                value={draftAction}
                options={ACTIONS}
                onSelect={setDraftAction}
                style={styles.modalGap}
              />

              <Label text="Module" />
              <Dropdown
                value={draftModule}
                options={MODULES}
                onSelect={setDraftModule}
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

        {/* Detail Modal */}
        <Modal
          visible={Boolean(selectedLog)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedLog(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedLog(null)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Activity Details</Text>
                <TouchableOpacity
                  onPress={() => setSelectedLog(null)}
                  style={styles.closeBtn}
                >
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedLog && (
                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <DetailRow label="User" value={selectedLog.userName || '—'} />
                  <DetailRow label="Role" value={selectedLog.userRole || '—'} />
                  <DetailRow label="Action" value={selectedLog.action || '—'} />
                  <DetailRow label="Module" value={selectedLog.module || '—'} />
                  <DetailRow
                    label="Description"
                    value={selectedLog.description || '—'}
                  />
                  <DetailRow
                    label="Status"
                    value={selectedLog.success ? '✓ Success' : '✗ Failed'}
                    valueStyle={{
                      color: getStatusColor(selectedLog.success),
                      fontFamily: FontFamily.bold,
                    }}
                  />
                  <DetailRow
                    label="IP Address"
                    value={selectedLog.ipAddress || '—'}
                  />
                  <DetailRow
                    label="Device"
                    value={selectedLog.deviceType || 'Unknown'}
                  />
                  <DetailRow
                    label="Timestamp"
                    value={
                      selectedLog.createdAt
                        ? new Date(selectedLog.createdAt).toLocaleString(
                            'en-IN',
                          )
                        : '—'
                    }
                  />
                </ScrollView>
              )}
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
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerBlock: {
    marginBottom: 4,
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
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  statValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 14,
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
    position: 'relative',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  pageIndicator: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  logCard: {
    backgroundColor: colors.cardColorLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  logLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
  },
  srNo: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  userName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: colors.TitleColor,
  },
  userRole: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
  },
  logBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metaColCenter: {
    flex: 1.2,
    alignItems: 'center',
  },
  metaColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F7FAF8',
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  detailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsHintText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: colors.TitleColor,
    marginTop: 10,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  footerLoaderText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  endOfListText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    paddingTop: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
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
    marginTop: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: colors.TitleColor,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: colors.TitleColor,
  },
});

export default ActivityLogsScreen;

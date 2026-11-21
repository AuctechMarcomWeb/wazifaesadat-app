import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  SearchField,
  DateField,
  Dropdown,
  GreenButton,
  GrayButton,
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { createAxiosInstance } from '../../../../api/apiConfig';

const api = createAxiosInstance('');

const STATUS_OPTIONS = ['All Status', 'Pending', 'Approved', 'Rejected'];
const DISBURSED_OPTIONS = ['Pending', 'Disbursed', 'Returned', 'Resend'];

const WazifaDueReportScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dueReportData, setDueReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  // Debounce timer
  const searchTimerRef = React.useRef(null);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    status: '',
    disbursed: '',
    from: null,
    to: null,
  });

  const [draftSearch, setDraftSearch] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [draftDisbursed, setDraftDisbursed] = useState('');
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadDueReport(page + 1);
    }
  };
  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadDueReport(1, true);
  };

  const loadDueReport = async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      setError(null);

      const params = new URLSearchParams();
      params.append('page', pageNum);
      params.append('limit', pageSize);
      params.append('isPagination', true);

      if (applied.search?.trim()) {
        params.append('search', applied.search);
      }

      if (applied.status) {
        params.append('status', applied.status);
      }

      if (applied.disbursed) {
        params.append('disbursedStatus', applied.disbursed);
      }
      if (applied.from) {
        params.append('fromDate', applied.from.toISOString().split('T')[0]);
      }

      if (applied.to) {
        params.append('toDate', applied.to.toISOString().split('T')[0]);
      }
      const queryString = params.toString();
      const response = await api.get(
        `scholarshipForm/getWazifaReport?${queryString}`,
      );
      const data = response?.data?.data;

      if (response?.data?.statusCode === 200 && data) {
        const report = (data || []).map(item => ({
          ...item,
          _id: item._id,
          applicationNo: item.applicationNo || '-',
          wazifaNumber: item.wazifaNumber || '-',
          studentName: item.studentName || '-',
          fatherName: item.fatherName || '-',
          permanentAddress: item.permanentAddress || item.presentAddress || '-',
          contactNo: item.contactNo || item.mobileNumber || '-',
          year: item.presentClass || item.semester || '-',
          courseOfStudy:
            typeof item.courseOfStudy === 'object'
              ? item.courseOfStudy?.name
              : item.courseOfStudy || '-',
          totalAnnualFees: item.totalAnnualFees || 0,
          totalCredit: item.totalCredit || 0,
          totalDebit: item.totalDebit || 0,
          balance: item.balance || 0,
          remarks: item.remarks || '-',
        }));

        if (pageNum === 1) {
          setDueReportData(report);
        } else {
          setDueReportData(prev => [...prev, ...report]);
        }

        setPage(pageNum);
        setHasMore(report.length === pageSize);
      } else {
        setError('Failed to load report');
        if (pageNum === 1) {
          setDueReportData([]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching due report:', err);
      setError('Failed to load report');
      if (pageNum === 1) {
        setDueReportData([]);
      }
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadDueReport(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const formatCurrency = amount => {
    if (!amount || amount === 0) return 'Rs 0';
    return `Rs ${amount.toLocaleString('en-IN')}`;
  };

  // Debounced search
  const handleSearch = text => {
    setSearch(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setApplied(prev => ({
        ...prev,
        search: text.trim(),
      }));
    }, 500);
  };
  const openFilter = () => {
    setDraftSearch(applied.search);
    setDraftStatus(applied.status);
    setDraftDisbursed(applied.disbursed);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      search: draftSearch,
      status: draftStatus,
      disbursed: draftStatus === 'Approved' ? draftDisbursed : '',
      from: draftFrom,
      to: draftTo,
    }));
    setFilterOpen(false);
    setPage(1);
  };

  const handleReset = () => {
    setDraftSearch('');
    setDraftStatus('');
    setDraftDisbursed('');
    setDraftFrom(null);
    setDraftTo(null);

    setSearch('');

    setApplied({
      search: '',
      status: '',
      disbursed: '',
      from: null,
      to: null,
    });

    setDueReportData([]);
    setPage(1);
    setHasMore(true);
  };
  const hasActiveFilters = Boolean(
    applied.search?.trim() ||
      applied.status ||
      applied.disbursed ||
      applied.from ||
      applied.to,
  );
  const filteredData = useMemo(() => {
    // Filtering done backend via API
    return dueReportData;
  }, [dueReportData]);

  const renderItem = ({ item, index }) => {
    const balance = (item.totalDebit || 0) - (item.totalCredit || 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.srNo}>#{(page - 1) * 50 + index + 1}</Text>
          <Text style={styles.wazifaBadgeText}>
            {item.applicationNo || '-'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Name</Text>
            <Text style={styles.valTextBold}>{item.studentName || '-'}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Father's Name</Text>
            <Text style={styles.valText}>{item.fatherName || '-'}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Address</Text>
            <Text style={styles.valText} numberOfLines={2}>
              {item.permanentAddress || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Mobile No.</Text>
            <Text style={styles.valTextPrimary}>{item.contactNo || '-'}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Course</Text>
            <Text style={styles.valText}>{item.courseOfStudy || '-'}</Text>
          </View>
        </View>

        <View style={styles.amountBoxRow}>
          <View style={styles.amountItem}>
            <Text style={styles.labelKey}>T-AMT</Text>
            <Text style={styles.valAmt}>{formatCurrency(item.totalDebit)}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.labelKey}>Paid</Text>
            <Text style={[styles.valAmt, styles.amountPaid]}>
              {formatCurrency(item.totalCredit)}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.labelKey}>Balance</Text>
            <Text
              style={[
                styles.valAmt,
                balance > 0 ? styles.amountDue : styles.amountPaid,
              ]}
            >
              {formatCurrency(Math.max(balance, 0))}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Wazifa Due Report"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Icon name="alert-circle-outline" size={40} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
                <GreenButton
                  title="Retry"
                  onPress={() => {
                    setPage(1);
                    setHasMore(true);
                    loadDueReport(1);
                  }}
                  style={styles.retryBtn}
                />
              </View>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={item => item._id || Math.random().toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.2}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={styles.loadingMoreContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null
                }
                ListHeaderComponent={
                  <View>
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search name, Wazifa No, mobile..."
                          value={search}
                          onChangeText={handleSearch}
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
                        {hasActiveFilters && (
                          <View style={styles.filterBadgeDot} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="file-search-outline"
                      size={40}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyTitle}>No records found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or filter criteria.
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
                <Text style={styles.filterTitle}>Filter Report</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Status" />
         <Dropdown
  value={draftStatus || 'All Status'}
  options={STATUS_OPTIONS}
  onSelect={val => {
    setDraftStatus(val === 'All Status' ? '' : val);

    if (val !== 'Approved') {
      setDraftDisbursed('');
    }
  }}
  style={styles.modalGap}
/>

              {draftStatus === 'Approved' && (
                <>
                  <Label text="Disbursed Status" />
                  <Dropdown
                    value={draftDisbursed}
                    options={['', ...DISBURSED_OPTIONS]}
                    onSelect={setDraftDisbursed}
                    style={styles.modalGap}
                  />
                </>
              )}

              <View style={[shared.row, styles.modalDateRow]}>
                <View style={shared.colL}>
                  <Label text="From Date" />
                  <DateField
                    value={draftFrom}
                    onChange={setDraftFrom}
                    leftIcon="calendar-month-outline"
                    hideRightIcon
                  />
                </View>

                <View style={shared.col}>
                  <Label text="To Date" />
                  <DateField
                    value={draftTo}
                    onChange={setDraftTo}
                    leftIcon="calendar-month-outline"
                    hideRightIcon
                  />
                </View>
              </View>

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },

  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  screenDesc: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
    marginLeft: 4,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 25,
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

  filterBadgeDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },

  loadingMoreContainer: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 20,
    paddingTop: 8,
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
  srNo: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  wazifaBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    fontSize: 10,
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
  amountBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  valAmt: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 2,
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
  },

  // Filter Modal Styles
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
  modalDateRow: {
    marginBottom: 4,
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
  retryBtn: {
    marginTop: 16,
  },
});

export default WazifaDueReportScreen;

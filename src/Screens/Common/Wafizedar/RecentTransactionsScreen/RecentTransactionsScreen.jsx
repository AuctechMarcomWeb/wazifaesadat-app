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
  Dropdown,
  DateField,
  GreenButton,
  GrayButton,
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { createAxiosInstance } from '../../../../api/apiConfig';

const api = createAxiosInstance('');

const PAYMENT_MODES = [
  'All Modes',
  'Cash',
  'Cheque',
  'UPI',
  'Bank Transfer',
  'NEFT',
  'RTGS',
];

const DEFAULT_FROM = new Date(new Date().getFullYear(), 0, 1);
const DEFAULT_TO = new Date();

const RecentTransactionsScreen = ({ navigation }) => {
  const [searchMember, setSearchMember] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [wazifaModalOpen, setWazifaModalOpen] = useState(false);
  const [transactionsData, setTransactionsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  // Wazifa List for Modal
  const [wazifaList, setWazifaList] = useState([]);
  const [wazifaLoading, setWazifaLoading] = useState(false);
  const [wazifaSearch, setWazifaSearch] = useState('');

  // Applied Filters
  const [applied, setApplied] = useState({
    member: '',
    wazifaId: '',
    wazifaNo: '',
    wazifadarName: '',
    paymentMode: 'All Modes',
    from: DEFAULT_FROM,
    to: DEFAULT_TO,
  });

  // Draft Filters Inside Modal
  const [draftMember, setDraftMember] = useState('');
  const [draftWazifaId, setDraftWazifaId] = useState('');
  const [draftWazifaNo, setDraftWazifaNo] = useState('');
  const [draftWazifadarName, setDraftWazifadarName] = useState('');
  const [draftMode, setDraftMode] = useState('All Modes');
  const [draftFrom, setDraftFrom] = useState(DEFAULT_FROM);
  const [draftTo, setDraftTo] = useState(DEFAULT_TO);

  // Initial load on mount
  // Initial load + every filter/search change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadTransactions(page + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadTransactions(1, true);
  };

  // Debounce timer references
  const debounceTimerRef = React.useRef(null);
  const memberSearchTimerRef = React.useRef(null);

  const loadWazifaList = async (searchQuery = '') => {
    try {
      setWazifaLoading(true);

      let queryParams = 'page=1&limit=100&isPagination=false';

      if (searchQuery.trim()) {
        queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await api.get(`scholarshipForm?${queryParams}`);

      const data = response?.data?.data;

      if (response?.data?.statusCode === 200 && data) {
        const forms = Array.isArray(data) ? data : data?.forms || [];

        const wazifas = forms.map(item => ({
          _id: item._id,
          wazifaNumber: item.applicationNo || '-',
          wazifaName: item.studentName || '-',
          fullName: `${item.applicationNo || '-'} - ${item.studentName || '-'}`,
        }));

        setWazifaList(wazifas);
        console.log('Wazifa list loaded:', wazifas.length);
      } else {
        setWazifaList([]);
      }
    } catch (err) {
      console.error('Error fetching wazifa list:', err?.response?.data || err);
      setWazifaList([]);
    } finally {
      setWazifaLoading(false);
    }
  };

  // Debounced search - API call sirf ek bar after typing complete
  const handleWazifaSearch = text => {
    setWazifaSearch(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length > 0) {
      debounceTimerRef.current = setTimeout(() => {
        loadWazifaList(text);
      }, 500);
    } else {
      // Search clear hone par complete list API se reload hogi
      loadWazifaList('');
    }
  };
  // Debounced member search for main screen
  const handleMemberSearch = text => {
    setSearchMember(text);

    if (memberSearchTimerRef.current) {
      clearTimeout(memberSearchTimerRef.current);
    }

    if (text.trim().length > 0) {
      memberSearchTimerRef.current = setTimeout(() => {
        setApplied(prev => ({
          ...prev,
          member: text.trim(),
        }));
      }, 500);
    } else {
      // Clear karte hi API ko empty search ke saath call karne ke liye
      setApplied(prev => ({
        ...prev,
        member: '',
      }));
    }
  };

  const loadTransactions = async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      setError(null);

      // Build query params with applied filters
      const params = new URLSearchParams();
      params.append('page', pageNum);
      params.append('limit', pageSize);
      params.append('sortBy', 'recent');
      params.append('isPagination', true);
      params.append('paymentType', 'wazifaPayment');

      // Add search filter
      if (applied.member?.trim()) {
        params.append('search', applied.member);
      }

      // Add wazifa filter
      if (applied.wazifaNo?.trim()) {
        params.append('wazifaNumber', applied.wazifaNo);
      }

      // Add payment mode filter
      if (applied.paymentMode !== 'All Modes') {
        params.append('paymentMode', applied.paymentMode);
      }

      // Add date filters (only if different from defaults or if filters are applied)
      if (applied.from && applied.from !== DEFAULT_FROM) {
        params.append('fromDate', applied.from.toISOString().split('T')[0]);
      }
      if (applied.to && applied.to !== DEFAULT_TO) {
        params.append('toDate', applied.to.toISOString().split('T')[0]);
      }

      const queryString = params.toString();
      const response = await api.get(`payment-entry?${queryString}`);
      const data = response?.data?.data;

      if (response?.data?.statusCode === 200 && data) {
        const transactions = (data?.data || []).map(item => ({
          ...item,
          _id: item._id,
          transactionDate: item.date,
          wazifaNo: item.wazifaNumber || '-',
          wazifadarName: item.wazifaName || '-',
          address: item.address || '-',
          fundType:
            typeof item.fundType === 'object'
              ? item.fundType?.title
              : item.fundType || '-',
          collectedBy: item.collectedBy || '-',
          paymentMode: item.paymentMode || '-',
          creditAmount:
            item.paymentEntryType === 'credit' ? item.amount || 0 : 0,
          debitAmount: item.paymentEntryType === 'debit' ? item.amount || 0 : 0,
        }));

        if (pageNum === 1) {
          setTransactionsData(transactions);
        } else {
          setTransactionsData(prev => [...prev, ...transactions]);
        }

        setPage(pageNum);
        setHasMore(transactions.length === pageSize);
      } else {
        setError('Failed to load transactions');
        if (pageNum === 1) {
          setTransactionsData([]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
      setError('Failed to load transactions');
      if (pageNum === 1) {
        setTransactionsData([]);
      }
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const formatCurrency = amount => {
    if (!amount || amount === 0) return '0';
    return amount.toLocaleString('en-IN');
  };

  const formatDateDisplay = dateStr => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const openFilter = () => {
    setDraftMember(applied.member);
    setDraftWazifaId(applied.wazifaId);
    setDraftWazifaNo(applied.wazifaNo);
    setDraftWazifadarName(applied.wazifadarName);
    setDraftMode(applied.paymentMode);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      member: draftMember,
      wazifaId: draftWazifaId,
      wazifaNo: draftWazifaNo,
      wazifadarName: draftWazifadarName,
      paymentMode: draftMode,
      from: draftFrom,
      to: draftTo,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftMember('');
    setDraftWazifaId('');
    setDraftWazifaNo('');
    setDraftWazifadarName('');
    setDraftMode('All Modes');
    setDraftFrom(DEFAULT_FROM);
    setDraftTo(DEFAULT_TO);
    setSearchMember('');
    setApplied({
      member: '',
      wazifaId: '',
      wazifaNo: '',
      wazifadarName: '',
      paymentMode: 'All Modes',
      from: DEFAULT_FROM,
      to: DEFAULT_TO,
    });
    setPage(1);
    setHasMore(true);
  };

  const hasActiveFilters =
    applied.member?.trim() ||
    applied.wazifaNo?.trim() ||
    applied.paymentMode !== 'All Modes' ||
    (applied.from && applied.from !== DEFAULT_FROM) ||
    (applied.to && applied.to !== DEFAULT_TO);

  const handleWazifaSelect = wazifa => {
    setDraftWazifaId(wazifa._id);
    setDraftWazifaNo(wazifa.wazifaNumber);
    setDraftWazifadarName(wazifa.wazifaName);
    setWazifaSearch('');
    setWazifaList([]);
    setWazifaModalOpen(false);
  };

  const handleWazifaClear = () => {
    setDraftWazifaId('');
    setDraftWazifaNo('');
    setDraftWazifadarName('');
  };

  const filteredData = useMemo(() => {
    // Note: Filtering is now done backend via API with applied filters
    // This client-side filter is a fallback for additional refinement
    return transactionsData;
  }, [transactionsData]);

  const renderItem = ({ item, index }) => {
    const isCredit = (item.creditAmount || 0) > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.srNo}>{index + 1}</Text>
          <Text style={styles.dateText}>
            {formatDateDisplay(item.transactionDate)}
          </Text>
          <View
            style={[
              styles.modeBadge,
              isCredit ? styles.modeBadgeCredit : styles.modeBadgeDebit,
            ]}
          >
            <Text
              style={[
                styles.modeBadgeText,
                isCredit
                  ? styles.modeBadgeTextCredit
                  : styles.modeBadgeTextDebit,
              ]}
            >
              {item.paymentMode || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Wazifa / Member</Text>
            <Text style={styles.valTextBold}>
              {item.wazifaNo} - {item.wazifadarName || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Address</Text>
            <Text style={styles.valText}>{item.address || '-'}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Fund Type</Text>
            <Text style={styles.valTextPrimary}>{item.fundType || '-'}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Collected By</Text>
            <Text style={styles.valText}>{item.collectedBy || '-'}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.labelKey}>Amount</Text>
          <Text
            style={[
              styles.amountText,
              isCredit ? styles.amountCredit : styles.amountDebit,
            ]}
          >
            ₹ {formatCurrency(isCredit ? item.creditAmount : item.debitAmount)}{' '}
            {isCredit ? '(Credit)' : '(Debit)'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Recent Transactions"
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
                    loadTransactions(1);
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
                    {/* Search Fields & Filter Icon */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search member..."
                          value={searchMember}
                          onChangeText={handleMemberSearch}
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
                    <Icon name="receipt" size={40} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No transactions found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or date filters.
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
                <Text style={styles.filterTitle}>Filter Transactions</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* <Label text="Search Member" />
              <SearchField
                placeholder="Search member..."
                value={draftMember}
                onChangeText={setDraftMember}
                style={styles.modalGap}
              /> */}

              <Label text="Search Wazifa" />
              <View style={[styles.wazifaSearchContainer, styles.modalGap]}>
                <TouchableOpacity
                  style={styles.wazifaSearchInput}
                  onPress={() => {
                    setWazifaSearch('');
                    loadWazifaList('');
                    setWazifaModalOpen(true);
                  }}
                >
                  <Text
                    style={[
                      styles.wazifaSearchText,
                      !draftWazifaNo && { color: colors.textSecondary },
                    ]}
                  >
                    {draftWazifaNo
                      ? `${draftWazifaNo} - ${draftWazifadarName}`
                      : 'Select wazifa...'}
                  </Text>
                  <Icon name="magnify" size={18} color={colors.primary} />
                </TouchableOpacity>
                {draftWazifaNo ? (
                  <TouchableOpacity
                    style={styles.clearWazifaBtn}
                    onPress={handleWazifaClear}
                  >
                    <Icon name="close" size={16} color={colors.white} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <Label text="Payment Mode" />
              <Dropdown
                value={draftMode}
                options={PAYMENT_MODES}
                onSelect={setDraftMode}
                style={styles.modalGap}
              />

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
        {/* Wazifa Search Modal */}
        <Modal
          visible={wazifaModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setWazifaModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setWazifaModalOpen(false)}
          >
            <View
              style={styles.wazifaModalSheet}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={styles.filterTitle}>Search Wazifa</Text>
                <TouchableOpacity onPress={() => setWazifaModalOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <SearchField
                placeholder="Search by wazifa no or name..."
                value={wazifaSearch}
                onChangeText={handleWazifaSearch}
                style={styles.modalGap}
              />

              {wazifaLoading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={wazifaList}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.wazifaItem}
                      onPress={() => handleWazifaSelect(item)}
                    >
                      <Text style={styles.wazifaItemNo}>
                        {item.wazifaNumber}
                      </Text>
                      <Text style={styles.wazifaItemName}>
                        {item.wazifaName}
                      </Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled
                  nestedScrollEnabled
                  ListEmptyComponent={
                    wazifaSearch.length > 0 ? (
                      <View style={styles.emptyContainer}>
                        <Icon name="magnify" size={40} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>No wazifas found</Text>
                        <Text style={styles.emptySubtitle}>
                          Try searching with different keywords
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptyContainer}>
                        <Icon name="information" size={40} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>Start searching</Text>
                        <Text style={styles.emptySubtitle}>
                          Enter wazifa number or name
                        </Text>
                      </View>
                    )
                  }
                />
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
  dateText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modeBadgeCredit: {
    backgroundColor: '#DCFCE7',
  },
  modeBadgeDebit: {
    backgroundColor: '#FEF3C7',
  },
  modeBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
  },
  modeBadgeTextCredit: {
    color: '#15803D',
  },
  modeBadgeTextDebit: {
    color: '#B45309',
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: 8,
    marginTop: 4,
  },
  amountText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
  },
  amountCredit: {
    color: '#15803D',
  },
  amountDebit: {
    color: '#DC2626',
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

  // Wazifa Search Styles
  wazifaSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wazifaSearchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
  },
  wazifaSearchText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    flex: 1,
  },
  clearWazifaBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wazifaModalSheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: 'auto',
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 20,
  },
  wazifaItem: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wazifaItemNo: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginRight: 8,
    minWidth: 60,
  },
  wazifaItemName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    flex: 1,
  },
});

export default RecentTransactionsScreen;

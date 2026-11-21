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

const LedgerOfWazifadarScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [wazifaModalOpen, setWazifaModalOpen] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
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

  // Debounce timers
  const wazifaDebounceRef = React.useRef(null);
  const searchTimerRef = React.useRef(null);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    wazifaCode: '',
    paymentMode: 'All Modes',
    from: null,
    to: null,
  });
  // Draft Filters Inside Modal
  const [draftSearch, setDraftSearch] = useState('');
  const [draftWazifaCode, setDraftWazifaCode] = useState('');
  const [draftWazifaName, setDraftWazifaName] = useState('');
  const [draftMode, setDraftMode] = useState('All Modes');
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);

  useEffect(() => {
    // Initial load - no data until wazifa selected
  }, []);

  useEffect(() => {
    // Load ledger when filters change
    if (applied.wazifaCode) {
      setPage(1);
      setHasMore(true);
      loadLedger(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore && applied.wazifaCode) {
      loadLedger(page + 1);
    }
  };

  const handleRefresh = () => {
    if (applied.wazifaCode) {
      setPage(1);
      setHasMore(true);
      loadLedger(1, true);
    }
  };

  const loadWazifaList = async (query = '') => {
    try {
      setWazifaLoading(true);

      let queryParams = 'page=1&limit=20&isPagination=true';
      if (query.trim()) {
        queryParams += `&search=${encodeURIComponent(query)}`;
      }

      const response = await api.get(`scholarshipForm?${queryParams}`);
      const data = response?.data?.data;

      if (response?.data?.statusCode === 200 && data) {
        const wazifas = (data?.forms || []).map(item => ({
          _id: item._id,
          applicationNo: item.applicationNo || '-',
          wazifaNumber: item.wazifaNumber || '-',
          studentName: item.studentName || item.wazifaName || '-',
        }));

        setWazifaList(wazifas);
        console.log('✅ Wazifa list loaded:', wazifas.length);
      } else {
        setWazifaList([]);
      }
    } catch (err) {
      console.error('❌ Error fetching wazifa list:', err);
      setWazifaList([]);
    } finally {
      setWazifaLoading(false);
    }
  };

  // Debounced wazifa search
  const handleWazifaSearch = text => {
    setWazifaSearch(text);

    if (wazifaDebounceRef.current) {
      clearTimeout(wazifaDebounceRef.current);
    }

    if (text.length > 0) {
      wazifaDebounceRef.current = setTimeout(() => {
        loadWazifaList(text);
      }, 400);
    } else {
      setWazifaList([]);
    }
  };

  const loadLedger = async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      setError(null);

      // Build query params with applied filters (matching admin)
      const params = new URLSearchParams();
      params.append('page', pageNum);
      params.append('limit', pageSize);
      params.append('sortBy', 'recent');
      params.append('isPagination', true);
      params.append('paymentType', 'wazifaPayment');

      if (applied.search?.trim()) {
        params.append('search', applied.search);
      }

      if (applied.wazifaCode?.trim()) {
        params.append('wazifaNumber', applied.wazifaCode);
      }

      if (applied.paymentMode !== 'All Modes') {
        params.append('paymentMode', applied.paymentMode);
      }

      if (applied.from) {
        params.append('fromDate', applied.from.toISOString().split('T')[0]);
      }

      if (applied.to) {
        params.append('toDate', applied.to.toISOString().split('T')[0]);
      }

      const queryString = params.toString();
      const response = await api.get(`payment-entry?${queryString}`);
      const data = response?.data?.data;

      if (response?.data?.statusCode === 200 && data) {
        const ledger = (data?.data || []).map(item => ({
          ...item,
          _id: item._id,
          date: item.date,
          wazifaNumber: item.wazifaNumber || '-',
          wazifaName: item.wazifaName || '-',
          fundType:
            typeof item.fundType === 'object'
              ? item.fundType?.title
              : item.fundType || '-',
          paymentMode: item.paymentMode || '-',
          receiptNo: item.receiptNo || '-',
          regitorNo: item.regitorNo || '-',
          collectedBy: item.collectedBy || '-',
          creditAmount:
            item.paymentEntryType === 'credit' ? item.amount || 0 : 0,
          debitAmount: item.paymentEntryType === 'debit' ? item.amount || 0 : 0,
        }));

        if (pageNum === 1) {
          setLedgerData(ledger);
        } else {
          setLedgerData(prev => [...prev, ...ledger]);
        }

        setPage(pageNum);
        setHasMore(ledger.length === pageSize);
      } else {
        setError('Failed to load ledger');
        if (pageNum === 1) {
          setLedgerData([]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching ledger:', err);
      setError('Failed to load ledger');
      if (pageNum === 1) {
        setLedgerData([]);
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

  // Debounced member search
  const handleSearchQuery = text => {
    setSearchQuery(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (text.length > 0) {
      searchTimerRef.current = setTimeout(() => {
        setApplied(prev => ({ ...prev, search: text }));
      }, 500);
    } else {
      setApplied(prev => ({ ...prev, search: '' }));
    }
  };

  const openFilter = () => {
    setDraftSearch(applied.search);
    setDraftWazifaCode(applied.wazifaCode);
    setDraftMode(applied.paymentMode);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      search: draftSearch,
      wazifaCode: draftWazifaCode,
      paymentMode: draftMode,
      from: draftFrom,
      to: draftTo,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftSearch('');
    setDraftWazifaCode('');
    setDraftWazifaName('');
    setDraftMode('All Modes');
    setDraftFrom(null);
    setDraftTo(null);

    setSearchQuery('');
    setWazifaSearch('');

    setApplied({
      search: '',
      wazifaCode: '',
      paymentMode: 'All Modes',
      from: null,
      to: null,
    });

    setLedgerData([]);
    setPage(1);
    setHasMore(true);
  };

const hasActiveFilters = Boolean(
  applied.search?.trim() ||
  applied.wazifaCode?.trim() ||
  applied.paymentMode !== 'All Modes' ||
  applied.from ||
  applied.to
);
  const handleWazifaSelect = wazifa => {
    setDraftWazifaCode(wazifa.applicationNo);
    setDraftWazifaName(wazifa.studentName);
    setWazifaSearch('');
    setWazifaList([]);
    setWazifaModalOpen(false);
  };

  const handleWazifaClear = () => {
    setDraftWazifaCode('');
    setDraftWazifaName('');
  };

  const filteredData = useMemo(() => {
    // Filtering done backend via API
    return ledgerData;
  }, [ledgerData]);

  const renderItem = ({ item, index }) => {
    const hasCredit = (item.creditAmount || 0) > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.srNo}>{index + 1}</Text>
          <Text style={styles.dateText}>{formatDateDisplay(item.date)}</Text>
          <View
            style={[
              styles.modeBadge,
              hasCredit ? styles.modeBadgeCredit : styles.modeBadgeDebit,
            ]}
          >
            <Text
              style={[
                styles.modeBadgeText,
                hasCredit
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
            <Text style={styles.labelKey}>Wazifa</Text>
            <Text style={styles.valTextBold}>
              {item.wazifaNumber} - {item.wazifaName || '-'}
            </Text>
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

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Receipt No</Text>
            <Text style={styles.valText}>{item.receiptNo || '-'}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Reg No</Text>
            <Text style={styles.valText}>{item.regitorNo || '-'}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.labelKey}>Credit (Rs)</Text>
            <Text style={[styles.amountText, styles.amountCredit]}>
              ₹ {formatCurrency(item.creditAmount)}
            </Text>
          </View>
          <View style={styles.footerRightCol}>
            <Text style={styles.labelKey}>Debit (Rs)</Text>
            <Text style={[styles.amountText, styles.amountDebit]}>
              ₹ {formatCurrency(item.debitAmount)}
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
          title="Ledger of Wazifadar"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {!applied.wazifaCode ? (
              <View style={styles.centerContainer}>
                <Icon name="file-document-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Select a Wazifa</Text>
                <Text style={styles.emptySubtitle}>
                  Open filters and select a wazifa to view ledger details.
                </Text>
                <GreenButton
                  title="Open Filters"
                  onPress={openFilter}
                  style={styles.openFilterBtn}
                />
              </View>
            ) : loading ? (
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
                    loadLedger(1);
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
                          placeholder="Search..."
                          value={searchQuery}
                          onChangeText={handleSearchQuery}
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
                      name="file-document-outline"
                      size={40}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyTitle}>
                      No ledger entries found
                    </Text>
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
                <Text style={styles.filterTitle}>Filter Ledger</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

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
                      !draftWazifaCode && { color: colors.textSecondary },
                    ]}
                  >
                    {draftWazifaCode
                      ? `${draftWazifaCode} - ${draftWazifaName}`
                      : 'Select wazifa...'}
                  </Text>
                  <Icon name="magnify" size={18} color={colors.primary} />
                </TouchableOpacity>
                {draftWazifaCode ? (
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
                        {item.applicationNo}
                      </Text>
                      <Text style={styles.wazifaItemName}>
                        {item.studentName}
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
  footerRightCol: {
    alignItems: 'flex-end',
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
  openFilterBtn: {
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

export default LedgerOfWazifadarScreen;

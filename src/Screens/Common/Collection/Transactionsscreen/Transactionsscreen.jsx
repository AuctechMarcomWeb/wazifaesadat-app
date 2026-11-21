import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import {
  Body,
  Label,
  SearchField,
  Dropdown,
  DateField,
  GreenButton,
  GrayButton,
  Badge,
  formatRs,
  toDateObj,
  monthShort,
  startOfDay,
  shared,
} from '../../../../components/Formparts';
import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  fetchTransactions,
  getPaymentModes,
  getFundTypes,
} from '../../../../api/transactions';

const TransactionsScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [paymentModes, setPaymentModes] = useState(['All Modes']);
  const [fundTypes, setFundTypes] = useState(['All Fund Types']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Applied filters state used for filtering list
  const [applied, setApplied] = useState({
    search: '',
    mode: 'All Modes',
    fund: 'All Fund Types',
    from: null,
    to: null,
    page: 1,
    limit: 10,
  });

  // Modal open/close state
  const [filterOpen, setFilterOpen] = useState(false);

  // Draft filter states inside modal
  const [draftMode, setDraftMode] = useState('All Modes');
  const [draftFund, setDraftFund] = useState('All Fund Types');
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);

  // Load payment modes and fund types on mount
  useEffect(() => {
    loadFiltersData();
  }, []);

  // Load transactions when screen focuses
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Transactions screen focused - refreshing data');
      setTransactions([]);
      setHasMore(true);
      loadTransactions(1, false);
    }, [applied]),
  );

  const loadFiltersData = async () => {
    try {
      // Load payment modes
      const modesRes = await getPaymentModes();
      if (modesRes.success && modesRes.paymentModes) {
        const modesList = [
          'All Modes',
          ...modesRes.paymentModes.map(m => m.name),
        ];
        setPaymentModes(modesList);
        console.log('✅ Payment modes loaded:', modesList.length);
      }

      // Load fund types
      const fundRes = await getFundTypes();
      if (fundRes.success && fundRes.fundTypes) {
        const fundsList = [
          'All Fund Types',
          ...fundRes.fundTypes.map(f => f.title),
        ];
        setFundTypes(fundsList);
        console.log('✅ Fund types loaded:', fundsList.length);
      }
    } catch (error) {
      console.error('❌ Error loading filters:', error);
    }
  };

  const loadTransactions = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const filters = {
        page: pageNum,
        limit: pageSize,
        search: applied.search,
        paymentMode: applied.mode !== 'All Modes' ? applied.mode : undefined,
        fundType: applied.fund !== 'All Fund Types' ? applied.fund : undefined,
        fromDate: applied.from
          ? `${applied.from.getFullYear()}-${String(
              applied.from.getMonth() + 1,
            ).padStart(2, '0')}-${String(applied.from.getDate()).padStart(
              2,
              '0',
            )}`
          : undefined,
        toDate: applied.to
          ? `${applied.to.getFullYear()}-${String(
              applied.to.getMonth() + 1,
            ).padStart(2, '0')}-${String(applied.to.getDate()).padStart(2, '0')}`
          : undefined,
        sortBy: 'recent',
      };

      console.log('📋 Loading transactions with filters:', filters);

      const response = await fetchTransactions(filters);

      if (response.success) {
        if (pageNum === 1) {
          setTransactions(response.transactions);
        } else {
          setTransactions(prev => [...prev, ...response.transactions]);
        }
        
        // Check if there are more items
        setHasMore(response.transactions.length >= pageSize);
        console.log('✅ Transactions loaded:', response.transactions.length);
      } else {
        Alert.alert('Error', response.message || 'Failed to load transactions');
        if (pageNum === 1) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
      if (pageNum === 1) {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTransactions([]);
    setHasMore(true);
    loadTransactions(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = Math.floor(transactions.length / pageSize) + 1;
      loadTransactions(nextPage, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length, loadingMore, loading, hasMore, pageSize, applied]);

  const openFilter = () => {
    setDraftMode(applied.mode);
    setDraftFund(applied.fund);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      mode: draftMode,
      fund: draftFund,
      from: draftFrom,
      to: draftTo,
      page: 1, // Reset to first page when filters change
    }));
    setFilterOpen(false);
  };

  const resetFilter = () => {
    setDraftMode('All Modes');
    setDraftFund('All Fund Types');
    setDraftFrom(null);
    setDraftTo(null);
    setSearch('');
    setApplied({
      search: '',
      mode: 'All Modes',
      fund: 'All Fund Types',
      from: null,
      to: null,
      page: 1,
      limit: 10,
    });
    setFilterOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (applied.mode !== 'All Modes') count++;
    if (applied.fund !== 'All Fund Types') count++;
    if (applied.from) count++;
    if (applied.to) count++;
    if (applied.search) count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const data = transactions;

  const formatTransactionDate = (dateStr) => {
    try {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.rowContainer}>
        <TouchableOpacity
          style={[styles.row, isExpanded && styles.rowExpanded]}
          activeOpacity={0.8}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
        >
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{formatTransactionDate(item.date)}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.memberName}
            </Text>
            <Text style={styles.fund} numberOfLines={1}>
              {item.fundType}
            </Text>
            {isExpanded && (
              <Text style={styles.collectedByExpanded} numberOfLines={2}>
                📋 {item.collectedBy || 'N/A'}
              </Text>
            )}
            {!isExpanded && (
              <Text style={styles.collectedBy} numberOfLines={1}>
                📋 {item.collectedBy || 'N/A'}
              </Text>
            )}
          </View>

          <View style={styles.meta}>
            <View style={styles.amountSection}>
              <Text style={styles.amount}>{formatRs(item.amount)}</Text>
              <Badge text={item.paymentMode} />
            </View>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#6B7280"
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedLabel}>Collected By</Text>
            <Text style={styles.expandedCollectedBy}>
              {item.collectedBy || 'N/A'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Transactions"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={styles.loader}
                />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : (
              <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={shared.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                  />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                ListHeaderComponent={
                  <View style={styles.filters}>
                    <View style={styles.searchFilterRow}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search member..."
                          value={search}
                          onChangeText={text => {
                            setSearch(text);
                            setApplied(prev => ({
                              ...prev,
                              search: text,
                              page: 1,
                            }));
                            setTransactions([]);
                            setHasMore(true);
                          }}
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
                ListFooterComponent={
                  loadingMore && hasMore ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.footerText}>Loading more transactions...</Text>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={shared.empty}>
                    <Icon
                      name="swap-horizontal"
                      size={46}
                      color="#9CA3AF"
                    />
                    <Text style={shared.emptyText}>No transactions found</Text>
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

              <Label text="Payment Mode" />
              <Dropdown
                value={draftMode}
                options={paymentModes}
                onSelect={setDraftMode}
                style={styles.modalGap}
              />

              <View style={shared.row}>
                <View style={shared.colL}>
                  <Label text="From Date" />
                  <DateField value={draftFrom} onChange={setDraftFrom} />
                </View>

                <View style={shared.col}>
                  <Label text="To Date" />
                  <DateField value={draftTo} onChange={setDraftTo} />
                </View>
              </View>

              <Label text="Fund Type" />
              <Dropdown
                value={draftFund}
                options={fundTypes}
                onSelect={setDraftFund}
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
                  onPress={resetFilter}
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },

  loader: {
    marginBottom: 16,
  },

  loadingText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },

  filters: {
    marginTop: 15,
    marginBottom: 6,
  },

  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchFlex: {
    flex: 1,
    marginRight: 8,
  },

  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2E8B3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    position: 'relative',
  },

  filterBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E9EEEB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  rowContainer: {
    marginBottom: 8,
  },

  rowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },

  expandedContent: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E9EEEB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },

  expandedLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#4B5563',
    marginBottom: 6,
  },

  expandedCollectedBy: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
    lineHeight: 22,
  },

  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEEB',
  },

  expandedValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },

  dateBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEF3F0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },

  dateText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
    textAlign: 'center',
  },

  day: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#111827',
    lineHeight: 22,
  },

  month: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#374151',
  },

  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },

  name: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },

  fund: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  collectedBy: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    marginTop: 4,
  },

  collectedByExpanded: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#374151',
    marginTop: 6,
    lineHeight: 18,
  },

  meta: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },

  amountSection: {
    alignItems: 'flex-end',
  },

  expandIcon: {
    marginLeft: 8,
  },

  amount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 4,
  },

  // Footer loader
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  footerText: {
    marginLeft: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: colors.primary,
  },

  // Filter modal styles
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
    color: '#123B28',
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

  applyButton: {
    height: 48,
    marginTop: 14,
  },
});

export default TransactionsScreen;

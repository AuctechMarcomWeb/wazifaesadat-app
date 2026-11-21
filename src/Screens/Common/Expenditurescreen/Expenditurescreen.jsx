import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import BottomNav from '../../../components/BottomNav/BottomNav';
import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import { fetchExpenditures, getExpenses, getModeOfPayments } from '../../../api/expenditure';

// ---------------------------------------------------------------
// Dummy data — will be fetched from API
// ---------------------------------------------------------------
const NAV_TABS = [
  { key: 'Dashboard', label: 'Dashboard', icon: 'home-outline' },
  { key: 'Collection', label: 'Collection', icon: 'file-document-outline' },
  { key: 'Expenditure', label: 'Expenditure', icon: 'currency-inr' },
  { key: 'Wazifadar', label: 'Wazifadar', icon: 'account-group-outline' },
  { key: 'More', label: 'More', icon: 'dots-horizontal' },
];

const MODE_TONES = {
  Cash: { bg: '#DCEBFA', text: '#1D6FD6' },
  UPI: { bg: '#EBDDFB', text: '#7C3AED' },
  Cheque: { bg: '#D7EAFB', text: '#1D6FD6' },
};

const ICONS = {
  Wazifa: 'flash',
  Contingency: 'layers',
  'Stationary etc.': 'square-edit-outline',
  Commission: 'account-group',
  Postage: 'email',
};

const formatNumber = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------
// Dropdown Component for Filter Modal
// ---------------------------------------------------------------
const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  loading = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.filterSubtitle}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setDropdownOpen(!dropdownOpen)}
      >
        <Text style={styles.dropdownButtonText}>
          {value || 'Select...'}
        </Text>
        <Icon
          name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#4B5563"
        />
      </TouchableOpacity>

      {dropdownOpen && (
        <View style={styles.dropdownList}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.dropdownLoader}
            />
          ) : options.length === 0 ? (
            <Text style={styles.dropdownEmptyText}>No options</Text>
          ) : (
            options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  value === option && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  onChange(option);
                  setDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === option && styles.dropdownItemTextActive,
                  ]}
                >
                  {option}
                </Text>
                {value === option && (
                  <Icon
                    name="check"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------
// Screen
// ---------------------------------------------------------------
const ExpenditureScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('All');
  const [expenseType, setExpenseType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // API states
  const [data, setData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Filter data from API
  const [expenseTypes, setExpenseTypes] = useState(['All']);
  const [paymentModes, setPaymentModes] = useState(['All']);
  const [expenseIdMap, setExpenseIdMap] = useState({}); // Map expense name -> ID
  const [filterLoading, setFilterLoading] = useState(false);

  // Draft filter states for modal
  const [draftMode, setDraftMode] = useState('All');
  const [draftType, setDraftType] = useState('All');
  const [draftFromDate, setDraftFromDate] = useState('');
  const [draftToDate, setDraftToDate] = useState('');

  // Load filter options from API
  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterLoading(true);

      // Fetch expenses and payment modes in parallel
      const [expensesRes, modesRes] = await Promise.all([
        getExpenses(),
        getModeOfPayments(),
      ]);

      if (expensesRes.success) {
        const types = ['All'];
        const idMap = {};
        expensesRes.expenses.forEach(e => {
          types.push(e.title);
          idMap[e.title] = e._id;
        });
        setExpenseTypes(types);
        setExpenseIdMap(idMap);
        console.log('✅ Expense ID Map:', idMap);
      }

      if (modesRes.success) {
        const modes = ['All', ...modesRes.paymentModes.map(m => m.name)];
        setPaymentModes(modes);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setFilterLoading(false);
    }
  }, []);

  // Fetch expenditures function
  const loadExpenditures = useCallback(
    async (page = 1, shouldRefresh = false) => {
      try {
        if (shouldRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // Convert expense type name to ID
        const expenseId = expenseType === 'All' ? null : expenseIdMap[expenseType];

        const response = await fetchExpenditures({
          page,
          limit: pageSize,
          expense: expenseId,
          paymentMode: mode === 'All' ? null : mode,
          fromDate,
          toDate,
        });

        if (response.success) {
          if (page === 1) {
            setData(response.expenditures);
          } else {
            setData(prev => [...prev, ...response.expenditures]);
          }

          setTotalAmount(response.totalAmount);
          setCurrentPage(response.currentPage);
          setTotalPages(response.totalPages);
          
          // Check if there are more items
          setHasMore(page < response.totalPages);
        } else {
          Alert.alert('Error', response.message || 'Failed to load expenditures');
          if (page === 1) {
            setHasMore(false);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred while loading expenditures');
        if (page === 1) {
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [mode, expenseType, fromDate, toDate, expenseIdMap, pageSize],
  );

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
    loadExpenditures(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh when screen comes into focus (after adding new expenditure)
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Expenditure screen focused - refreshing data');
      setCurrentPage(1);
      loadExpenditures(1, true);
    }, [loadExpenditures])
  );

  // Trigger API call when filters change
  useEffect(() => {
    if (mode !== 'All' || expenseType !== 'All' || fromDate || toDate) {
      console.log('🔹 Filters changed, loading expenditures');
      loadExpenditures(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, expenseType, fromDate, toDate]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setCurrentPage(1);
    loadExpenditures(1, true);
  }, [loadExpenditures]);

  // Handle infinite scroll (load more)
  const onEndReached = useCallback(() => {
    if (currentPage < totalPages && !loading && !refreshing && !loadingMore && hasMore) {
      loadExpenditures(currentPage + 1, false);
    }
  }, [currentPage, totalPages, loading, refreshing, loadingMore, hasMore, loadExpenditures]);

  const handleTabPress = key => {
    if (key === 'Expenditure') return;
    navigation && navigation.navigate(key);
  };

  const openFilter = () => {
    setDraftMode(mode);
    setDraftType(expenseType);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setFilterOpen(true);
  };

  const applyFilter = useCallback(() => {
    console.log('🔹 Apply Filter called');
    console.log('  - draftMode:', draftMode);
    console.log('  - draftType:', draftType);
    console.log('  - draftFromDate:', draftFromDate);
    console.log('  - draftToDate:', draftToDate);

    setMode(draftMode);
    setExpenseType(draftType);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setFilterOpen(false);
    setCurrentPage(1);

    // Call loadExpenditures with new filter values directly
    setTimeout(() => {
      console.log('🔹 Loading expenditures after filters set');
    }, 100);
  }, [draftMode, draftType, draftFromDate, draftToDate]);

  const renderItem = ({ item }) => {
    const tone =
      MODE_TONES[item.paymentMode] || MODE_TONES.Cash;

    // Parse date for display
    const displayDate = item.date
      ? new Date(item.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      : 'N/A';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.row}
        onPress={() =>
          navigation && navigation.navigate('ExpenditureDetail', { item })
        }
      >
        <View style={styles.rowIcon}>
          <Icon
            name={ICONS[item.title] || 'cash'}
            size={24}
            color={colors.primary}
          />
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.dateRow}>
            <Icon name="calendar-month-outline" size={16} color="#4B5563" />
            <Text style={styles.dateText}>{displayDate}</Text>
          </View>
        </View>

        <View style={styles.rowMeta}>
          <Text style={styles.amount}>₹ {formatNumber(item.amount)}</Text>

          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.text }]}>
              {item.paymentMode}
            </Text>
          </View>
        </View>

        <Icon name="chevron-right" size={26} color="#111827" />
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Expenditure"
          onBack={() => navigation && navigation.goBack()}
          rightIcon="plus"
          rightVariant="solid"
          onRightPress={() =>
            navigation && navigation.navigate('AddExpenditure')
          }
        />

        <View style={styles.body}>
          {/* Search and Filter Row */}
          <View style={styles.searchFilterRow}>
            <View style={styles.searchBox}>
              <Icon name="magnify" size={22} color="#4B5563" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by paid to, bill no..."
                placeholderTextColor={colors.placeHolderColor}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              activeOpacity={0.8}
              onPress={openFilter}
            >
              <Icon name="filter-variant" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Loading indicator */}
          {loading && data.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading expenditures...</Text>
            </View>
          ) : (
            <>
              {/* Total Amount Section */}
              {/* <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  ₹ {formatNumber(totalAmount)}
                </Text>
              </View> */}

              {/* List */}
              <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                  />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Icon name="wallet-outline" size={46} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No expenditure found</Text>
                  </View>
                }
                ListFooterComponent={
                  loadingMore && hasMore ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.footerText}>Loading more...</Text>
                    </View>
                  ) : null
                }
              />
            </>
          )}
        </View>

        <BottomNav
          active="Expenditure"
          tabs={NAV_TABS}
          onPress={handleTabPress}
        />

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
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.filterTitle}>Filter Expenditure</Text>

                {/* Payment Mode Dropdown */}
                <FilterDropdown
                  label="Payment Mode"
                  options={paymentModes}
                  value={draftMode}
                  onChange={setDraftMode}
                  loading={filterLoading}
                />

                {/* Expense Type Dropdown */}
                <FilterDropdown
                  label="Expense Type"
                  options={expenseTypes}
                  value={draftType}
                  onChange={setDraftType}
                  loading={filterLoading}
                />

                {/* Date Filters */}
                <View style={styles.dateFilterRow}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.filterSubtitle}>From Date</Text>
                    <View style={styles.dateBox}>
                      <TextInput
                        style={styles.dateInput}
                        placeholder="dd/mm/yyyy"
                        placeholderTextColor="#9CA3AF"
                        value={draftFromDate}
                        onChangeText={setDraftFromDate}
                      />
                      <Icon
                        name="calendar-blank-outline"
                        size={18}
                        color="#4B5563"
                      />
                    </View>
                  </View>

                  <View style={styles.dateInputContainer}>
                    <Text style={styles.filterSubtitle}>To Date</Text>
                    <View style={styles.dateBox}>
                      <TextInput
                        style={styles.dateInput}
                        placeholder="dd/mm/yyyy"
                        placeholderTextColor="#9CA3AF"
                        value={draftToDate}
                        onChangeText={setDraftToDate}
                      />
                      <Icon
                        name="calendar-blank-outline"
                        size={18}
                        color="#4B5563"
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.applyButton, loading && styles.applyButtonDisabled]}
                  activeOpacity={0.85}
                  onPress={applyFilter}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.applyText}>Apply Filters</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
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

  // Center Loading
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },

  // Search & Filter Row
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('4.5%'),
    marginTop: 14,
  },

  searchBox: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: colors.SecondTitleColor,
    paddingVertical: 0,
  },

  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2E8B3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Total Section
  totalSection: {
    marginHorizontal: wp('4.5%'),
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F0F7F2',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B3E',
  },

  totalLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
  },

  totalAmount: {
    marginTop: 4,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: '#0F5132',
  },

  // List
  listContent: {
    paddingHorizontal: wp('3.5%'),
    paddingTop: 8,
    paddingBottom: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E9EEEB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
  },

  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F4E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rowInfo: {
    flex: 1,
    marginLeft: 12,
  },

  rowTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  dateText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#374151',
    marginLeft: 6,
  },

  rowMeta: {
    alignItems: 'center',
    marginRight: 6,
  },

  amount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: '#0F5132',
  },

  badge: {
    minWidth: 62,
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },

  badgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 50,
  },

  emptyText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 8,
  },

  // Footer loader
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  footerText: {
    marginLeft: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  // Filter modal
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
    maxHeight: '85%',
  },

  filterTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#123B28',
    marginBottom: 12,
  },

  filterSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#4B5563',
    marginBottom: 6,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE4DF',
    marginRight: 8,
    marginBottom: 8,
  },

  chipActive: {
    backgroundColor: '#2E8B3E',
    borderColor: '#2E8B3E',
  },

  chipText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },

  chipTextActive: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
  },

  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
  },

  dateInputContainer: {
    flex: 1,
    marginRight: 8,
  },

  dateBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  dateInput: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: colors.SecondTitleColor,
    paddingVertical: 0,
  },

  applyButton: {
    height: 48,
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: '#2E8B3E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  applyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },

  applyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  // Dropdown Styles
  dropdownContainer: {
    marginBottom: 16,
  },

  dropdownLoader: {
    paddingVertical: 12,
  },

  dropdownButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 10,
    paddingHorizontal: 12,
  },

  dropdownButtonText: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#1F2937',
  },

  dropdownList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  dropdownItemActive: {
    backgroundColor: '#E8F5E9',
  },

  dropdownItemText: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#1F2937',
  },

  dropdownItemTextActive: {
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },

  dropdownEmptyText: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
});

export default ExpenditureScreen;

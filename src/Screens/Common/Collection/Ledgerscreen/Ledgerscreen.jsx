import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  Label,
  Dropdown,
  DateField,
  GreenButton,
  GrayButton,
  shared,
} from '../../../../components/Formparts';

import { searchScholarshipForms, fetchWazifaLedger, getPaymentModes } from '../../../../api/collection';

// ---------------------------------------------------------------
// Options
// ---------------------------------------------------------------

const formatNumber = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const formatDateForAPI = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LedgerScreen = ({ navigation }) => {
  // API Data states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
  const [wazifaList, setWazifaList] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [wazifaLoading, setWazifaLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Filter states
  const [search, setSearch] = useState('');

  const [applied, setApplied] = useState({
    search: '',
    selectedWazifa: null,
    mode: 'All Modes',
    from: null,
    to: null,
  });

  // Modal states
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftWazifa, setDraftWazifa] = useState(null);
  const [draftMode, setDraftMode] = useState('All Modes');
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);
  const [wazifaSearch, setWazifaSearch] = useState('');

  // Load initial data
  useEffect(() => {
    loadWazifaList();
    loadPaymentModes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load ledger when wazifa is selected or filters change
  useEffect(() => {
    if (applied.selectedWazifa) {
      setPage(1);
      setHasMore(true);
      loadLedgerData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  // Load wazifa list - with debounce on search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (wazifaSearch || !wazifaList.length) {
        loadWazifaList();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [wazifaSearch, wazifaList.length]);

  const loadWazifaList = async () => {
    try {
      setWazifaLoading(true);
      const result = await searchScholarshipForms(wazifaSearch, { 
        limit: 50,
        isPagination: true,
        sortBy: 'recent'
      });
      if (result.success) {
        setWazifaList(result.forms || []);
      }
    } catch (error) {
      console.error('Error loading wazifa list:', error);
    } finally {
      setWazifaLoading(false);
    }
  };

  const loadPaymentModes = async () => {
    try {
      const result = await getPaymentModes();
      if (result.success) {
        const modeNames = result.paymentModes.map(m => m.title || m);
        setPaymentModes(modeNames);
      }
    } catch (error) {
      console.error('Error loading payment modes:', error);
    }
  };

  const loadLedgerData = async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const filters = {
        wazifaNumber: applied.selectedWazifa?.applicationNo || '',
        paymentMode: applied.mode !== 'All Modes' ? applied.mode : '',
        fromDate: applied.from ? formatDateForAPI(applied.from) : '',
        toDate: applied.to ? formatDateForAPI(applied.to) : '',
        search: applied.search,
        page: pageNum,
        limit: pageSize,
      };

      const result = await fetchWazifaLedger(filters);
      if (result.success) {
        const newData = result.ledger || [];
        
        if (pageNum === 1) {
          setLedgerData(newData);
        } else {
          setLedgerData(prev => [...prev, ...newData]);
        }
        
        setPage(pageNum);
        setHasMore(newData.length === pageSize);
      }
    } catch (error) {
      console.error('Error loading ledger data:', error);
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const openFilter = () => {
    setDraftWazifa(applied.selectedWazifa);
    setDraftMode(applied.mode);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      selectedWazifa: draftWazifa,
      mode: draftMode,
      from: draftFrom,
      to: draftTo,
    }));
    setFilterOpen(false);
  };

  const resetFilter = () => {
    setApplied({
      search: '',
      selectedWazifa: null,
      mode: 'All Modes',
      from: null,
      to: null,
    });
    setSearch('');
    setDraftWazifa(null);
    setDraftMode('All Modes');
    setDraftFrom(null);
    setDraftTo(null);
    setLedgerData([]);
    setPage(1);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadLedgerData(page + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadLedgerData(1, true);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (applied.from) count++;
    if (applied.to) count++;
    if (applied.mode !== 'All Modes') count++;
    if (applied.selectedWazifa) count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const data = useMemo(() => {
    const q = applied.search.trim().toLowerCase();

    return ledgerData.filter(item => {
      if (applied.mode !== 'All Modes' && item.paymentMode !== applied.mode) {
        return false;
      }
      if (
        q &&
        !item.wazifaName?.toLowerCase().includes(q) &&
        !item.wazifaNumber?.toLowerCase().includes(q) &&
        !item.collectedBy?.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [applied, ledgerData]);

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        // Handle ledger detail navigation if needed
      }}
    >
      <View style={styles.cardTop}>
        <View style={styles.avatarBox}>
          <Icon name="book-open-variant" size={22} color={colors.primary} />
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {index + 1}. {item.wazifaName || 'Unknown'}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.paymentEntryType === 'credit'
                      ? colors.successBg
                      : colors.warningBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.paymentEntryType === 'credit'
                        ? colors.success
                        : colors.warning,
                  },
                ]}
              >
                {item.paymentEntryType === 'credit' ? 'Credit' : 'Debit'}
              </Text>
            </View>
          </View>
          <Text style={styles.memberMeta}>
            Wazifa No: <Text style={styles.boldText}>{item.wazifaNumber || '-'}</Text> | {item.fundType?.title || item.fundType || '-'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.mobileRow}>
          <Icon name="calendar" size={14} color="#6B7280" />
          <Text style={styles.mobileText}>
            {new Date(item.date).toLocaleDateString('en-IN')}
          </Text>
        </View>

        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Amount:</Text>
          <Text style={[styles.balanceValue, { color: item.paymentEntryType === 'credit' ? colors.success : colors.danger }]}>
            ₹ {formatNumber(item.amount || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Wazifa Ledger"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <View style={styles.contentContainer}>
            {/* Search & Filter Row */}
            <View style={styles.searchFilterContainer}>
              <View style={styles.searchFlex}>
                <View style={styles.searchBox}>
                  <Icon name="magnify" size={22} color="#4B5563" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search wazifa..."
                    placeholderTextColor={colors.placeHolderColor}
                    value={search}
                    onChangeText={text => {
                      setSearch(text);
                      setApplied(prev => ({ ...prev, search: text }));
                    }}
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.8}
                onPress={openFilter}
              >
                <Icon name="filter-variant" size={22} color={colors.white} />
                {hasActiveFilters && (
                  <View style={styles.filterBadgeDot} />
                )}
              </TouchableOpacity>
            </View>

            {/* Loading or Empty State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading ledger...</Text>
              </View>
            )}

            {/* List */}
            {!loading && (
              <FlatList
                data={data}
                keyExtractor={item => item._id || item.id}
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
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Icon name="book-open-variant" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>
                      {applied.selectedWazifa ? 'No ledger records found' : 'Select a wazifa to view ledger'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {applied.selectedWazifa
                        ? 'Try searching with another keyword or filter'
                        : 'Select a wazifa from the filter above'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
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
                <Text style={styles.filterTitle}>Filter Wazifa Ledger</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setFilterOpen(false)}
                >
                  <Icon name="close" size={24} color={colors.TitleColor} />
                </TouchableOpacity>
              </View>

              <Label text="Wazifa" />
              <View style={styles.dropdownContainer}>
                <View style={styles.searchBox}>
                  <Icon name="magnify" size={18} color="#4B5563" />
                  <TextInput
                    style={styles.wazifaSearchInput}
                    placeholder="Search wazifa..."
                    placeholderTextColor={colors.placeHolderColor}
                    value={wazifaSearch}
                    onChangeText={setWazifaSearch}
                  />
                </View>

                {wazifaLoading && (
                  <View style={styles.dropdownLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}

                {!wazifaLoading && wazifaList.length > 0 && (
                  <FlatList
                    data={wazifaList}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => setDraftWazifa(item)}
                      >
                        <View
                          style={[
                            styles.dropdownCheckbox,
                            draftWazifa?._id === item._id && {
                              backgroundColor: colors.primary,
                            },
                          ]}
                        >
                          {draftWazifa?._id === item._id && (
                            <Icon name="check" size={14} color={colors.white} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dropdownItemText}>
                            {item.studentName}
                          </Text>
                          <Text style={styles.dropdownItemSubtext}>
                            {item.applicationNo}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    scrollEnabled
                    nestedScrollEnabled
                    style={styles.dropdownList}
                  />
                )}
              </View>

              <Label text="Payment Mode" style={styles.modalGap} />
              <Dropdown
                value={draftMode}
                options={['All Modes', ...paymentModes]}
                onSelect={setDraftMode}
                style={styles.modalGap}
              />

              <View style={[shared.row, styles.modalDateRow]}>
                <View style={shared.colL}>
                  <Label text="From Date" />
                  <DateField value={draftFrom} onChange={setDraftFrom} />
                </View>

                <View style={shared.col}>
                  <Label text="To Date" />
                  <DateField value={draftTo} onChange={setDraftTo} />
                </View>
              </View>

              <View style={styles.actionRow}>
                <GreenButton
                  title="Apply"
                  onPress={applyFilter}
                  style={styles.applyBtn}
                  disabled={!draftWazifa}
                />
                <GrayButton
                  title="Reset"
                  onPress={() => {
                    resetFilter();
                    setFilterOpen(false);
                  }}
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
    backgroundColor: colors.backgroundDark,
  },
  body: {
    flex: 1,
    marginTop: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: 14,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchFlex: {
    flex: 1,
    marginRight: 8,
  },
  searchBox: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 12,
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
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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

  filterBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  loadingMoreContainer: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  listContent: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    flex: 1,
    marginRight: 6,
  },
  memberMeta: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  boldText: {
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: 8,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginRight: 4,
  },
  balanceValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.success,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: '#1F2937',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
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
    color: colors.TitleColor,
  },
  modalDateRow: {
    marginBottom: 4,
  },
  modalGap: {
    marginBottom: 12,
  },

  dropdownContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    overflow: 'hidden',
  },

  wazifaSearchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: colors.SecondTitleColor,
    paddingVertical: 0,
  },

  dropdownLoading: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownList: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },

  dropdownCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  dropdownItemText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: colors.TitleColor,
  },

  dropdownItemSubtext: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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

  resetButton: {
    height: 48,
  },

  resetModalButton: {
    height: 48,
    flexDirection: 'row',
    backgroundColor: colors.danger || '#FF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },

  resetModalButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  applyButton: {
    height: 48,
    marginTop: 14,
  },
});

export default LedgerScreen;

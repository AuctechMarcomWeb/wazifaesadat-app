import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  TouchableOpacity,
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
  Badge,
  formatRs,
  toDateObj,
  shared,
} from '../../../../components/Formparts';

import { fetchPaymentsList } from '../../../../api/collection';

// ---------------------------------------------------------------
// Filters & Data
// ---------------------------------------------------------------
const STATUSES = ['All Status', 'paid', 'pending', 'failed'];
const GATEWAYS = ['All Gateways', 'payu', 'razorpay'];

const PaymentListScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Applied filters state
  const [applied, setApplied] = useState({
    search: '',
    status: 'All Status',
    gateway: 'All Gateways',
    from: null,
    to: null,
  });

  // Modal open/close state
  const [filterOpen, setFilterOpen] = useState(false);

  // Draft filter states inside modal
  const [draftStatus, setDraftStatus] = useState('All Status');
  const [draftGateway, setDraftGateway] = useState('All Gateways');
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);

  // Load payments on mount
  useEffect(() => {
    loadPayments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load payments whenever filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPayments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const loadPayments = async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters = {
        page: pageNum,
        limit: pageSize,
        isPagination: true,
        search: applied.search,
        paymentStatus: applied.status !== 'All Status' ? applied.status : '',
        paymentGateway:
          applied.gateway !== 'All Gateways' ? applied.gateway : '',
        fromDate: applied.from
          ? toDateObj(applied.from).toISOString().split('T')[0]
          : '',
        toDate: applied.to
          ? toDateObj(applied.to).toISOString().split('T')[0]
          : '',
      };

      const result = await fetchPaymentsList(filters);
      if (result.success) {
        const newData = result.payments || [];

        if (pageNum === 1) {
          setPayments(newData);
        } else {
          setPayments(prev => [...prev, ...newData]);
        }

        setPage(pageNum);
        setHasMore(newData.length === pageSize);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const openFilter = () => {
    setDraftStatus(applied.status);
    setDraftGateway(applied.gateway);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      status: draftStatus,
      gateway: draftGateway,
      from: draftFrom,
      to: draftTo,
    }));
    setFilterOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (applied.from) count++;
    if (applied.to) count++;
    if (applied.status !== 'All Status') count++;
    if (applied.gateway !== 'All Gateways') count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const resetFilter = () => {
    setApplied({
      search: '',
      status: 'All Status',
      gateway: 'All Gateways',
      from: null,
      to: null,
    });
    setSearch('');
    setDraftStatus('All Status');
    setDraftGateway('All Gateways');
    setDraftFrom(null);
    setDraftTo(null);
    setPayments([]);
    setPage(1);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadPayments(page + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadPayments(1, true);
  };

  const renderItem = ({ item, index }) => {
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      } catch {
        return 'N/A';
      }
    };

    return (
    <View style={styles.row}>
      <View style={styles.cardHeader}>
        <View style={styles.srBadge}>
          <Text style={styles.srText}>#{index + 1}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        <Badge text={item.paymentStatus} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Receipt No:</Text>
          <Text style={styles.fieldValBold}>{item.receiptNo}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Name & Email:</Text>
          <Text style={styles.fieldVal} numberOfLines={2}>
            {item.name} {'\n'}
            {item.email}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Phone:</Text>
          <Text style={styles.fieldVal}>{item.phone}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Fund Type:</Text>
          <Text style={styles.fundTypeTag}>
            {item.fundType?.title || 'N/A'}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Gateway / Mode:</Text>
          <Text style={styles.fieldVal}>
            {item.paymentGateway.toUpperCase()} / {item.paymentMode}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Contribute Type:</Text>
          <Text style={styles.fieldVal}>{item.contributeType}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amountLabel}>Amount Paid:</Text>
        <Text style={styles.amount}>{formatRs(item.amount)}</Text>
      </View>
    </View>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Payment List"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading && payments.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading payments...</Text>
              </View>
            ) : (
              <FlatList
                data={payments}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={shared.scroll}
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
                  <View style={styles.searchFilterContainer}>
                    <View style={styles.searchFlex}>
                      <SearchField
                        placeholder="Search name, phone, receipt..."
                        value={search}
                        onChangeText={text => {
                          setSearch(text);
                          setApplied(prev => ({ ...prev, search: text }));
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
                }
                ListEmptyComponent={
                  <View style={shared.empty}>
                    <Icon
                      name="credit-card-off-outline"
                      size={46}
                      color={colors.placeHolderColor}
                    />
                    <Text style={shared.emptyText}>No payments found</Text>
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
              <Text style={styles.filterTitle}>Filter Payments</Text>

              <Label text="Status" />
              <Dropdown
                value={draftStatus}
                options={STATUSES}
                onSelect={setDraftStatus}
                style={styles.modalGap}
              />

              <Label text="Gateway" />
              <Dropdown
                value={draftGateway}
                options={GATEWAYS}
                onSelect={setDraftGateway}
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },

  loadingText: {
    marginTop: 12,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
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

  row: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    paddingBottom: 8,
    marginBottom: 8,
  },

  srBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  srText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  date: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  cardBody: {
    gap: 6,
  },

  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  fieldLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
  },

  fieldVal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    flex: 1.5,
    textAlign: 'right',
  },

  fieldValBold: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    flex: 1.5,
    textAlign: 'right',
  },

  fundTypeTag: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'right',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: 8,
    marginTop: 8,
  },

  amountLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  amount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.success,
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

  filterTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 14,
  },

  modalDateRow: {
    marginBottom: 4,
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

export default PaymentListScreen;

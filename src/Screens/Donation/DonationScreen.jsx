import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import { Body, SearchField, Dropdown } from '../../components/Formparts';
import { getDonations } from '../../api/donation';

const STATUS_FILTERS = ['All Status', 'Success', 'Pending', 'Failed'];
const PAGE_LIMIT = 15;

const formatCurrency = amount => {
  const num = Number(amount);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatDate = dateVal => {
  if (!dateVal) return '—';
  const parsed = new Date(dateVal);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusStyle = status => {
  const normalized = String(status || '').toLowerCase();
  if (
    normalized === 'success' ||
    normalized === 'completed' ||
    normalized === 'paid'
  ) {
    return {
      bg: '#D1FAE5',
      text: '#065F46',
      label: status || 'Success',
    };
  }
  if (normalized === 'failed' || normalized === 'cancelled') {
    return {
      bg: '#FEE2E2',
      text: '#991B1B',
      label: status || 'Failed',
    };
  }
  return {
    bg: '#FEF3C7',
    text: '#92400E',
    label: status || 'Pending',
  };
};

const getDonationKey = (item, idx) =>
  String(item?._id || item?.id || item?.txnId || item?.transactionId || idx);

const extractDonationsPayload = response => {
  const root = response?.data || response || {};
  const list = Array.isArray(root?.donations)
    ? root.donations
    : Array.isArray(root?.payments)
    ? root.payments
    : Array.isArray(root?.items)
    ? root.items
    : Array.isArray(response?.data)
    ? response.data
    : [];

  const hasExplicitTotal =
    typeof root?.total === 'number' ||
    typeof response?.pagination?.total === 'number';

  const totalCount =
    typeof root?.total === 'number'
      ? root.total
      : typeof response?.pagination?.total === 'number'
      ? response.pagination.total
      : list.length;

  const totalPagesCount =
    Number(root?.totalPages ?? response?.pagination?.totalPages) || 1;

  return { list, totalCount, totalPagesCount, hasExplicitTotal };
};

const DonationsScreen = ({ navigation }) => {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const debounceRef = useRef(null);
  const isFetchingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const requestSeqRef = useRef(0);

  const fetchDonationsPage = useCallback(
    async ({
      targetPage = 1,
      mode = 'replace', // 'replace' | 'append' | 'refresh'
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

      const seq = ++requestSeqRef.current;

      try {
        const apiStatus = status === 'All Status' ? '' : status.toLowerCase();

        const response = await getDonations({
          page: targetPage,
          limit: PAGE_LIMIT,
          search: searchQuery.trim(),
          paymentStatus: apiStatus,
          sortBy: 'latest',
        });

        if (seq !== requestSeqRef.current) return;

        const { list, totalCount, totalPagesCount, hasExplicitTotal } =
          extractDonationsPayload(response);

        const nextTotalPages = Math.max(1, totalPagesCount);
        pageRef.current = targetPage;
        totalPagesRef.current = nextTotalPages;

        setTotalPages(nextTotalPages);
        setPage(targetPage);
        setErrorMsg('');

        setDonations(prev => {
          if (mode !== 'append' || targetPage === 1) {
            setTotal(totalCount);
            return list;
          }
          const seenIds = new Set(prev.map((d, idx) => getDonationKey(d, idx)));
          const uniqueIncoming = list.filter(
            (d, idx) => !seenIds.has(getDonationKey(d, idx)),
          );
          const merged = [...prev, ...uniqueIncoming];
          setTotal(
            hasExplicitTotal ? totalCount : Math.max(totalCount, merged.length),
          );
          return merged;
        });
      } catch (err) {
        if (seq !== requestSeqRef.current) return;

        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load donations';
        console.error('Fetch Donations Error:', message);
        setErrorMsg(message);
        if (mode === 'replace' && targetPage === 1) {
          setDonations([]);
          setTotal(0);
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
        if (mode === 'append') {
          isFetchingMoreRef.current = false;
        }
      }
    },
    [appliedSearch, statusFilter],
  );

  useEffect(() => {
    pageRef.current = 1;
    totalPagesRef.current = 1;
    setPage(1);
    setTotalPages(1);
    fetchDonationsPage({
      targetPage: 1,
      mode: 'replace',
      searchQuery: appliedSearch,
      status: statusFilter,
    });
  }, [appliedSearch, statusFilter, fetchDonationsPage]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearchChange = text => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedSearch(text);
    }, 400);
  };

  const handleStatusSelect = val => {
    setStatusFilter(val);
  };

  const handleRefresh = useCallback(() => {
    fetchDonationsPage({
      targetPage: 1,
      mode: 'refresh',
      searchQuery: appliedSearch,
      status: statusFilter,
    });
  }, [fetchDonationsPage, appliedSearch, statusFilter]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || isFetchingMoreRef.current) {
      return;
    }
    if (donations.length === 0 || pageRef.current >= totalPagesRef.current) {
      return;
    }

    fetchDonationsPage({
      targetPage: pageRef.current + 1,
      mode: 'append',
      searchQuery: appliedSearch,
      status: statusFilter,
    });
  }, [
    loading,
    loadingMore,
    refreshing,
    donations.length,
    fetchDonationsPage,
    appliedSearch,
    statusFilter,
  ]);

  const renderDonationCard = ({ item, index }) => {
    const statusInfo = getStatusStyle(item.paymentStatus || item.status);
    const donorName =
      item.donorName ||
      item.name ||
      item.user?.name ||
      item.createdBy?.name ||
      'Anonymous Donor';

    const donorPhone = item.phone || item.donorPhone || item.user?.phone || '';
    const donorEmail = item.email || item.donorEmail || item.user?.email || '';
    const fundType =
      item.fundType || item.purpose || item.category || 'General';
    const paymentMode =
      item.paymentMode || item.paymentGateway || item.method || 'Online';
    const refId =
      item.txnId || item.transactionId || item.receiptNo || item._id || '';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.srNo}>#{index + 1}</Text>
          <Text style={styles.refText} numberOfLines={1}>
            {refId ? `Ref: ${refId}` : 'Donation'}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
          >
            <Text style={[styles.statusText, { color: statusInfo.text }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountText}>
            {formatCurrency(item.amount ?? item.totalAmount)}
          </Text>
          <View style={styles.fundPill}>
            <Icon
              name="hand-heart-outline"
              size={13}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.fundPillText} numberOfLines={1}>
              {fundType}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Donor Name</Text>
            <Text style={styles.valTextBold} numberOfLines={1}>
              {donorName}
            </Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Date</Text>
            <Text style={styles.valText}>
              {formatDate(item.createdAt || item.paidAt || item.date)}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.labelKey}>Contact</Text>
            <Text style={styles.valText} numberOfLines={1}>
              {donorPhone || donorEmail || '—'}
            </Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.labelKey}>Payment Mode</Text>
            <Text style={styles.valTextPrimary} numberOfLines={1}>
              {paymentMode}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Loading more donations…</Text>
        </View>
      );
    }

    if (donations.length > 0 && page >= totalPages) {
      return (
        <Text style={styles.endText}>
          Showing all {donations.length} of {total} donations
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
          title="Donations"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <View style={styles.screenColumn}>
              {loading && donations.length === 0 ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : errorMsg && donations.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Icon name="alert-circle-outline" size={42} color="#DC2626" />
                  <Text style={styles.errorTitle}>
                    Unable to load donations
                  </Text>
                  <Text style={styles.errorSubtitle}>{errorMsg}</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    activeOpacity={0.85}
                    onPress={handleRefresh}
                  >
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={donations}
                  keyExtractor={getDonationKey}
                  renderItem={renderDonationCard}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.4}
                  ListFooterComponent={renderFooter}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      colors={[colors.primary]}
                    />
                  }
                  ListHeaderComponent={
                    <View style={styles.headerBlock}>
                      <View style={styles.searchFilterRow}>
                        <View style={styles.searchFlex}>
                          <SearchField
                            placeholder="Search name, phone, email, txn..."
                            value={search}
                            onChangeText={handleSearchChange}
                          />
                        </View>
                        <Dropdown
                          value={statusFilter}
                          options={STATUS_FILTERS}
                          onSelect={handleStatusSelect}
                          style={styles.statusDropdown}
                        />
                      </View>
                    </View>
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Icon
                        name="hand-coin-outline"
                        size={42}
                        color="#9CA3AF"
                      />
                      <Text style={styles.emptyTitle}>No donations found</Text>
                      <Text style={styles.emptySubtitle}>
                        Try changing your search or status filter.
                      </Text>
                    </View>
                  }
                />
              )}

              {!loading && donations.length > 0 && (
                <View style={styles.bottomBar}>
                  <Text style={styles.totalText}>
                    Loaded:{' '}
                    <Text style={styles.totalBold}>{donations.length}</Text> /
                    Total Donations:{' '}
                    <Text style={styles.totalBold}>{total}</Text>
                  </Text>
                </View>
              )}
            </View>
          </Body>
        </View>
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
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  screenColumn: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerBlock: {
    marginTop: 18,
    marginBottom: 12,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchFlex: {
    flex: 1,
  },
  statusDropdown: {
    width: 118,
  },
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 20,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
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
  refText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
    marginHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  amountText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  fundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#A7E8C5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '55%',
  },
  fundPillText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#047857',
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
    paddingRight: 8,
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
  footerLoader: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  endText: {
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
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
  errorTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#1F2937',
    marginTop: 10,
  },
  errorSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  bottomBar: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexShrink: 0,
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
});

export default DonationsScreen;

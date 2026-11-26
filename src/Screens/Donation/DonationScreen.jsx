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
import { useSelector } from 'react-redux';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import { Body } from '../../components/Formparts';
import { getDonations } from '../../api/donation';

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
      label: 'Paid',
    };
  }
  if (normalized === 'failed' || normalized === 'cancelled') {
    return {
      bg: '#FEE2E2',
      text: '#991B1B',
      label: 'Failed',
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
  const level1 = response?.data || response || {};
  const level2 = Array.isArray(level1?.data) ? level1 : level1?.data || {};

  const list = Array.isArray(level1?.data)
    ? level1.data
    : Array.isArray(level2?.data)
    ? level2.data
    : Array.isArray(level2?.donations)
    ? level2.donations
    : Array.isArray(level2?.payments)
    ? level2.payments
    : Array.isArray(level2?.items)
    ? level2.items
    : [];

  const meta = Array.isArray(level1?.data) ? level1 : level2;

  const hasExplicitTotal =
    typeof meta?.total === 'number' ||
    typeof response?.pagination?.total === 'number';

  const totalCount =
    typeof meta?.total === 'number'
      ? meta.total
      : typeof response?.pagination?.total === 'number'
      ? response.pagination.total
      : list.length;

  const totalPagesCount =
    Number(meta?.totalPages ?? response?.pagination?.totalPages) || 1;

  return { list, totalCount, totalPagesCount, hasExplicitTotal };
};

const DonationsScreen = ({ navigation }) => {
  const reduxUser = useSelector(
    state => state?.user?.user || state?.auth?.user,
  );
  const userPhone = reduxUser?.phone || reduxUser?.mobileNumber || '';
  const userEmail = reduxUser?.email || '';

  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isFetchingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const requestSeqRef = useRef(0);
  const hasFetchedOnceRef = useRef(false);

  const fetchDonationsPage = useCallback(
    async ({ targetPage = 1, mode = 'replace' }) => {
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
        const queryParams = {
          page: targetPage,
          limit: PAGE_LIMIT,
          sortBy: 'latest',
        };

        if (userPhone) queryParams.phone = userPhone;
        if (userEmail) queryParams.email = userEmail;

        const response = await getDonations(queryParams);
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
    [userPhone, userEmail],
  );

  useEffect(() => {
    if (!hasFetchedOnceRef.current) {
      hasFetchedOnceRef.current = true;
      fetchDonationsPage({ targetPage: 1, mode: 'replace' });
    }
  }, [fetchDonationsPage]);

  const handleRefresh = useCallback(() => {
    fetchDonationsPage({ targetPage: 1, mode: 'refresh' });
  }, [fetchDonationsPage]);

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
    });
  }, [loading, loadingMore, refreshing, donations.length, fetchDonationsPage]);

  const handleCardPress = donation => {
    navigation.navigate('DonationDetailsScreen', { donation });
  };

  const handleDonatePress = () => {
    navigation.navigate('DonationFormScreen');
  };

  const renderDonationCard = ({ item, index }) => {
    const statusInfo = getStatusStyle(item.paymentStatus || item.status);
    const donorName =
      item.name || item.payu?.firstname || item.user?.name || 'Anonymous Donor';

    const donorPhone = item.phone || item.user?.phone || '';
    const donorEmail = item.email || item.user?.email || '';
    const fundType =
      item.fundType?.title || item.fundType || item.contributeType || 'General';
    const paymentMode =
      item.payu?.mode ||
      item.gatewayResponse?.mode ||
      item.paymentMode ||
      item.paymentGateway ||
      'Online';
    const refId =
      item.receiptNo ||
      item.payu?.mihpayid ||
      item.transactionId ||
      item.orderId ||
      item._id ||
      '';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleCardPress(item)}
        style={styles.card}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.srNo}>{index + 1}</Text>
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
              {formatDate(item.paidAt || item.createdAt || item.date)}
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
      </TouchableOpacity>
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
          Loaded: {donations.length} / Total Donations: {total}
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
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Icon
                        name="hand-coin-outline"
                        size={42}
                        color="#9CA3AF"
                      />
                      <Text style={styles.emptyTitle}>No donations found</Text>
                      <Text style={styles.emptySubtitle}>
                        Tap Donate below to make your first contribution.
                      </Text>
                    </View>
                  }
                />
              )}

              {/* Full-Width Bottom Donate Button */}
              {!loading && (
                <View style={styles.bottomBar}>
                  <TouchableOpacity
                    style={styles.donateFullBtn}
                    activeOpacity={0.85}
                    onPress={handleDonatePress}
                  >
                    <Icon name="heart-plus" size={19} color={colors.white} />
                    <Text style={styles.donateFullBtnText}>Donate</Text>
                  </TouchableOpacity>
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
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 20,
    paddingTop: 37,
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
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexShrink: 0,
  },
  donateFullBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
  },
  donateFullBtnText: {
    color: colors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
  },
});

export default DonationsScreen;

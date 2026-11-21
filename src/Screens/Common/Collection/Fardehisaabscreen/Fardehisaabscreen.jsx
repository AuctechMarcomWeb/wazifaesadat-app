import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Badge,
  formatRs,
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { fetchCollectionReportData } from '../../../../api/collection';

// ---------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------
const STATUSES = ['All Status', 'Draft', 'Submitted'];
const PAGE_LIMIT = 20;

const DEFAULT_FROM = null;
const DEFAULT_TO = null;

const META_KEYS = new Set([
  '_id',
  'srNo',
  'collectedBy',
  'collectedByMemberId',
  'collectedByCity',
  'collectedByState',
  'date',
  'fromDate',
  'toDate',
  'status',
  'total',
  'transactions',
]);

const dmy = val => {
  if (!val) return '-';
  const datePart =
    val instanceof Date
      ? val.toISOString().split('T')[0]
      : String(val).split('T')[0];
  return datePart.split('-').reverse().join('/');
};

const normalizeDoc = (doc, idx, fallbackFrom, fallbackTo) => {
  // Handle occasional swapped collector / memberId fields in API docs
  const rawCollector = doc.collectedBy || 'Unknown';
  const rawCode = doc.collectedByMemberId || 'N/A';
  const looksLikeObjectId = str =>
    typeof str === 'string' && /^[a-f0-9]{24}$/i.test(str.trim());

  const collector =
    looksLikeObjectId(rawCollector) && !looksLikeObjectId(rawCode)
      ? rawCode
      : rawCollector;
  const code =
    looksLikeObjectId(rawCollector) && !looksLikeObjectId(rawCode)
      ? rawCollector
      : rawCode;

  const activeFunds = Object.entries(doc)
    .filter(
      ([key, val]) => !META_KEYS.has(key) && typeof val === 'number' && val > 0,
    )
    .map(([label, value]) => ({ label, value }));

  const computedTotal =
    typeof doc.total === 'number'
      ? doc.total
      : activeFunds.reduce((sum, f) => sum + f.value, 0);

  return {
    id: String(doc._id || `${doc.srNo || 'row'}-${idx}`),
    srNo: doc.srNo ?? idx + 1,
    from: doc.fromDate || doc.date || fallbackFrom,
    to: doc.toDate || doc.date || fallbackTo,
    collector,
    code,
    city: doc.collectedByCity || 'N/A',
    state: doc.collectedByState || 'N/A',
    activeFunds,
    amount: computedTotal,
    transactions: doc.transactions ?? activeFunds.length,
    status: doc.status || '',
  };
};

const FardeHisaabScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState([]);
  const [overallTotal, setOverallTotal] = useState(0);

  // Pagination & loading states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Applied filters state (no default dates)
  const [applied, setApplied] = useState({
    search: '',
    from: DEFAULT_FROM,
    to: DEFAULT_TO,
    status: 'All Status',
    selectedMember: 'All Members',
  });

  // Modal open/close state
  const [filterOpen, setFilterOpen] = useState(false);

  // Draft filter states inside modal
  const [draftFrom, setDraftFrom] = useState(DEFAULT_FROM);
  const [draftTo, setDraftTo] = useState(DEFAULT_TO);
  const [draftStatus, setDraftStatus] = useState('All Status');
  const [draftMember, setDraftMember] = useState('All Members');

  const fetchPage = useCallback(
    async ({
      targetPage = 1,
      isLoadMore = false,
      isPullRefresh = false,
    } = {}) => {
      if (isLoadMore && (loadingMore || loading || !hasMore)) return;

      if (isPullRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = {
          page: targetPage,
          limit: PAGE_LIMIT,
          collectedBy:
            applied.selectedMember !== 'All Members'
              ? applied.selectedMember
              : '',
          search: applied.search,
        };

        if (applied.from) {
          params.fromDate = applied.from.toISOString();
        }
        if (applied.to) {
          params.toDate = applied.to.toISOString();
        }

        const result = await fetchCollectionReportData(params);

        const payload = result?.data || result || {};
        const rawDocs = Array.isArray(payload.docs) ? payload.docs : [];

        const normalized = rawDocs.map((doc, idx) =>
          normalizeDoc(doc, idx, applied.from, applied.to),
        );

        if (typeof payload.overallTotal === 'number') {
          setOverallTotal(payload.overallTotal);
        } else if (targetPage === 1) {
          setOverallTotal(
            normalized.reduce((acc, item) => acc + (item.amount || 0), 0),
          );
        }

        if (targetPage === 1) {
          setReports(normalized);
        } else {
          setReports(prev => {
            const seen = new Set(prev.map(r => r.id));
            const uniqueNext = normalized.filter(r => !seen.has(r.id));
            return [...prev, ...uniqueNext];
          });
        }

        setPage(targetPage);

        const apiHasMore =
          typeof payload.hasMore === 'boolean'
            ? payload.hasMore
            : typeof payload.pagination?.hasMore === 'boolean'
            ? payload.pagination.hasMore
            : rawDocs.length >= PAGE_LIMIT;

        setHasMore(apiHasMore);
      } catch (error) {
        console.error('Error loading reports:', error);
        if (targetPage === 1) {
          setReports([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [applied, hasMore, loading, loadingMore],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPage({ targetPage: 1 });
  }, [applied]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore && data.length > 0) {
      fetchPage({ targetPage: page + 1, isLoadMore: true });
    }
  };

  const handleRefresh = () => {
    setHasMore(true);
    fetchPage({ targetPage: 1, isPullRefresh: true });
  };

  const openFilter = () => {
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setDraftStatus(applied.status);
    setDraftMember(applied.selectedMember);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      from: draftFrom,
      to: draftTo,
      status: draftStatus,
      selectedMember: draftMember,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    const defaultState = {
      search: '',
      from: DEFAULT_FROM,
      to: DEFAULT_TO,
      status: 'All Status',
      selectedMember: 'All Members',
    };
    setDraftFrom(DEFAULT_FROM);
    setDraftTo(DEFAULT_TO);
    setDraftStatus('All Status');
    setDraftMember('All Members');
    setSearch('');
    setApplied(defaultState);
  };

  const memberOptions = useMemo(() => {
    const unique = new Set(
      reports
        .filter(r => r.collector && r.collector !== 'Unknown')
        .map(r => `${r.collector} (${r.code})`),
    );
    return ['All Members', ...unique];
  }, [reports]);

  const data = useMemo(() => {
    const q = applied.search.trim().toLowerCase();

    return reports.filter(r => {
      if (
        applied.status !== 'All Status' &&
        r.status &&
        r.status !== applied.status
      ) {
        return false;
      }

      if (
        applied.selectedMember !== 'All Members' &&
        !applied.selectedMember
          .toLowerCase()
          .includes(r.collector.toLowerCase()) &&
        !applied.selectedMember.includes(r.code)
      ) {
        return false;
      }

      if (
        q &&
        !r.collector.toLowerCase().includes(q) &&
        !r.city.toLowerCase().includes(q) &&
        !r.code.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [reports, applied]);

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        navigation && navigation.navigate('FardeHisaabDetail', { report: item })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.srBadge}>
          <Text style={styles.srText}>{item.srNo ?? index + 1}</Text>
        </View>
        <Text style={styles.dateRangeText}>
          {dmy(item.from)} - {dmy(item.to)}
        </Text>
        {item.status ? <Badge text={item.status} /> : null}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Collected By:</Text>
          <Text style={styles.fieldValBold} numberOfLines={1}>
            {item.collector} <Text style={styles.codeText}>({item.code})</Text>
          </Text>
        </View>

        {item.activeFunds && item.activeFunds.length > 0 && (
          <View style={styles.fundsBox}>
            {item.activeFunds.map(fund => (
              <View key={fund.label} style={styles.fundRow}>
                <Text style={styles.fundLabel} numberOfLines={1}>
                  {fund.label}
                </Text>
                <Text style={styles.fundValue}>{formatRs(fund.value)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amountLabel}>Total:</Text>
        <Text style={styles.amount}>{formatRs(item.amount || 0)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderListHeader = () => (
    <View>
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchFlex}>
          <SearchField
            placeholder="Search collector, member id..."
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
          <Icon name="filter-variant" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }

    if (!hasMore && data.length > 0) {
      return <Text style={styles.endText}>All records loaded</Text>;
    }

    return null;
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Farde Hisaab"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <FlatList
              data={data}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderListHeader}
              ListFooterComponent={renderListFooter}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading reports...</Text>
                  </View>
                ) : (
                  <View style={shared.empty}>
                    <Icon
                      name="file-document-outline"
                      size={46}
                      color={colors.placeHolderColor}
                    />
                    <Text style={shared.emptyText}>No reports found</Text>
                  </View>
                )
              }
            />

            {/* Add button */}
            <View style={styles.bottom}>
              <GreenButton
                title="Add Farde Hisaab Report"
                icon="plus"
                onPress={() =>
                  navigation && navigation.navigate('AddFardeHisaab')
                }
                style={styles.addButton}
              />
            </View>
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
                <Text style={styles.filterTitle}>Filter Farde Hisaab</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

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

              <Label text="Status" />
              <Dropdown
                value={draftStatus}
                options={STATUSES}
                onSelect={setDraftStatus}
                style={styles.modalGap}
              />

              <Label text="Member / Collector" />
              <Dropdown
                value={draftMember}
                options={memberOptions}
                onSelect={setDraftMember}
                searchable
                placeholder="Select or Search Member..."
                style={styles.modalGap}
              />

              <View style={styles.actionRow}>
                <GreenButton
                  title="Apply"
                  onPress={applyFilter}
                  style={styles.apply}
                />
                <GrayButton
                  title="Reset"
                  onPress={handleReset}
                  style={styles.reset}
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
    paddingVertical: 50,
  },

  loadingText: {
    marginTop: 12,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  // Search & Filter Row
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 30,
    paddingHorizontal: wp('4%'),
  },

  searchFlex: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },

  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    flesmhrink: 0,
  },

  // Overall Summary Banner
  overallBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: wp('4%'),
    marginBottom: 10,
  },

  overallLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  overallSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 1,
  },

  overallAmount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  // Filters & Action Row
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    width: '100%',
    alignItems: 'center',
  },

  apply: {
    flex: 1,
    marginRight: 8,
    height: 48,
  },

  reset: {
    flex: 1,
    height: 48,
  },

  // Card
  listContent: {
    paddingBottom: 16,
  },

  card: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: wp('4%'),
    marginBottom: 10,
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

  dateRangeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  cardBody: {
    gap: 8,
  },

  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  fieldLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  fieldValBold: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    flesmhrink: 1,
    marginLeft: 8,
    textAlign: 'right',
  },

  codeText: {
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },

  fundsBox: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },

  fundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  fundLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },

  fundValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
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

  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },

  footerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  endText: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    paddingVertical: 12,
  },

  bottom: {
    paddingHorizontal: wp('4%'),
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: colors.white,
  },

  addButton: {
    height: 52,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    width: '100%',
    alignSelf: 'stretch',
    margin: 0,
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
});

export default FardeHisaabScreen;

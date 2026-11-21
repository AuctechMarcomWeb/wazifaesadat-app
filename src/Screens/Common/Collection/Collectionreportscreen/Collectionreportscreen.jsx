import React, { useState, useMemo, useEffect, useCallback } from 'react';
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

import { FontFamily, FontSize } from '../../../../themes/typography';
import colors from '../../../../themes/colors';
import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  Section,
  SearchField,
  Dropdown,
  DateField,
  GreenButton,
  GrayButton,
  PillTabs,
  formatNumber,
  shared,
} from '../../../../components/Formparts';
import { fetchCollectionReportData, getCollectors } from '../../../../api/collection';

// ---------------------------------------------------------------
// Tabs & Collectors
// ---------------------------------------------------------------
const TABS = ['Members', 'Income Exp.', 'Anonymous'];

const CollectionReportScreen = ({ navigation }) => {
  // API Data states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [collectorNames, setCollectorNames] = useState(['All Collected By']);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // UI states
  const [tab, setTab] = useState('Members');
  const [search, setSearch] = useState('');

  const [applied, setApplied] = useState({
    search: '',
    from: null,
    to: null,
    collector: 'All Collected By',
  });

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);
  const [draftCollector, setDraftCollector] = useState('All Collected By');

  // Load collectors and initial data
  useEffect(() => {
    loadCollectors();
    // Initial load with no filters
  }, []);

  // Reload report data when filters change
  useEffect(() => {
    setPage(1);
    setReportData(null);
    setHasMore(true);
    loadReportData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const loadCollectors = async () => {
    try {
      const result = await getCollectors();
      if (result.success) {
        const names = result.collectors.map(c => c.name);
        setCollectors(result.collectors);
        setCollectorNames(['All Collected By', ...names]);
      }
    } catch (error) {
      console.error('Error loading collectors:', error);
    }
  };

  const loadReportData = async (pageNum = 1, shouldRefresh = false) => {
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
        fromDate: applied.from ? formatDateForAPI(applied.from) : '',
        toDate: applied.to ? formatDateForAPI(applied.to) : '',
        collectedBy: applied.collector !== 'All Collected By' ? applied.collector : '',
        search: applied.search,
      };

      const result = await fetchCollectionReportData(filters);
      if (result.success) {
        if (pageNum === 1) {
          setReportData(result);
        } else {
          // Merge data for pagination
          setReportData(prev => {
            if (!prev) return result;
            return {
              ...result,
              members: [...(prev.members || []), ...(result.members || [])],
              docs: [...(prev.docs || []), ...(result.docs || [])],
              anonymousDonors: [...(prev.anonymousDonors || []), ...(result.anonymousDonors || [])],
            };
          });
        }
        
        // Check if more pages available
        const dataLength = (result.members || result.docs || result.anonymousDonors || []).length;
        setHasMore(dataLength >= pageSize);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      if (pageNum === 1) {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setReportData(null);
    setHasMore(true);
    loadReportData(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      loadReportData(page + 1, false);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (applied.from) count++;
    if (applied.to) count++;
    if (applied.collector !== 'All Collected By') count++;
    if (applied.search) count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const openFilter = () => {
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setDraftCollector(applied.collector);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      from: draftFrom,
      to: draftTo,
      collector: draftCollector,
    }));
    setFilterOpen(false);
  };

  const resetFilter = () => {
    setApplied({
      search: '',
      from: null,
      to: null,
      collector: 'All Collected By',
    });
    setSearch('');
  };

  const groups = useMemo(() => {
    if (!reportData) return [];

    const q = applied.search.trim().toLowerCase();

    if (tab === 'Members') {
      // Group members by type
      const grouped = {};
      (reportData.members || []).forEach(member => {
        const type = member.memberType || 'Other';
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(member);
      });

      return Object.entries(grouped)
        .map(([type, rows]) => ({
          title: type,
          rows: rows.filter(r => {
            const matchesSearch =
              !q ||
              (r.memberName && r.memberName.toLowerCase().includes(q)) ||
              (r.memberCode && r.memberCode.toLowerCase().includes(q));
            const matchesCollector =
              applied.collector === 'All Collected By' ||
              r.collectedBy === applied.collector;
            return matchesSearch && matchesCollector;
          }),
        }))
        .filter(g => g.rows.length > 0);
    } else if (tab === 'Income Exp.') {
      // Income & Expenditure summary
      return [
        {
          title: 'Income & Expenditure Summary',
          rows: (reportData.docs || []).filter(r => {
            const matchesSearch =
              !q || (r.collectedBy && r.collectedBy.toLowerCase().includes(q));
            const matchesCollector =
              applied.collector === 'All Collected By' ||
              r.collectedBy === applied.collector;
            return matchesSearch && matchesCollector;
          }),
        },
      ].filter(g => g.rows.length > 0);
    } else if (tab === 'Anonymous') {
      // Anonymous donors
      return [
        {
          title: 'Anonymous / Unregistered Donors',
          rows: (reportData.anonymousDonors || []).reduce((acc, donor) => {
            if (donor.data && Array.isArray(donor.data)) {
              return [
                ...acc,
                ...donor.data.filter(d => {
                  const matchesCollector =
                    applied.collector === 'All Collected By' ||
                    d.collectedBy === applied.collector;
                  return matchesCollector;
                }),
              ];
            }
            return acc;
          }, []),
        },
      ].filter(g => g.rows.length > 0);
    }

    return [];
  }, [reportData, applied, tab]);

  const grandTotal = useMemo(() => {
    return groups.reduce(
      (acc, g) =>
        acc + g.rows.reduce((sum, r) => sum + (r.amount || r.total || 0), 0),
      0,
    );
  }, [groups]);

  const flatListData = useMemo(() => {
    const items = [];
    groups.forEach((group, idx) => {
      items.push({ type: 'header', group, key: `header-${idx}` });
      group.rows.forEach((row, rowIdx) => {
        items.push({ type: 'card', group: group.title, row, rowIdx, key: `card-${idx}-${rowIdx}` });
      });
      const groupTotal = group.rows.reduce((s, r) => s + (r.amount || r.total || 0), 0);
      items.push({ type: 'total', group: group.title, total: groupTotal, key: `total-${idx}` });
    });
    if (groups.length > 0) {
      items.push({ type: 'grandtotal', total: grandTotal, key: 'grandtotal' });
    }
    return items;
  }, [groups, grandTotal]);

  const renderFlatListItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.group.title}</Text>
        </View>
      );
    }

    if (item.type === 'card') {
      const r = item.row;
      return (
        <View style={styles.cardItem}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIndex}>#{item.rowIdx + 1}</Text>
            <Text style={styles.cardAmount}>
              ₹ {formatNumber(r.amount || r.total || 0)}
            </Text>
          </View>

          {tab === 'Income Exp.' ? (
            <View style={styles.cardBody}>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Collected By:</Text>
                <Text style={styles.fieldValue}>{r.collectedBy}</Text>
              </View>
              {Object.entries(r).map(([key, value]) => {
                if (
                  key !== 'collectedBy' &&
                  key !== 'total' &&
                  key !== '_id' &&
                  key !== 'id' &&
                  key !== 'srNo' &&
                  key !== 'collectedByMemberId' &&
                  value > 0
                ) {
                  const fieldName = (reportData?.fundTypes || []).find(f => f.title === key)?.title || key;
                  return value > 0 ? (
                    <View key={key} style={styles.cardField}>
                      <Text style={styles.fieldLabel}>{fieldName}:</Text>
                      <Text style={styles.fieldValue}>₹ {formatNumber(value)}</Text>
                    </View>
                  ) : null;
                }
                return null;
              })}
            </View>
          ) : tab === 'Anonymous' ? (
            <View style={styles.cardBody}>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Donor Name:</Text>
                <Text style={styles.fieldValue}>{r.donorName || '-'}</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Collected By:</Text>
                <Text style={styles.fieldValue}>{r.collectedBy}</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Receipt No:</Text>
                <Text style={styles.fieldValue}>{r.receiptNo}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cardBody}>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Member No:</Text>
                <Text style={styles.fieldValue}>{r.memberCode || '-'}</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Name:</Text>
                <Text style={styles.fieldValue}>{r.memberName}</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Collected By:</Text>
                <Text style={styles.fieldValue}>{r.collectedBy}</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={styles.fieldLabel}>Fund Type:</Text>
                <Text style={styles.fieldValue}>{r.fundType || r.memberType}</Text>
              </View>
            </View>
          )}
        </View>
      );
    }

    if (item.type === 'total') {
      return (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL ({item.group})</Text>
          <Text style={styles.totalValue}>₹ {formatNumber(item.total)}</Text>
        </View>
      );
    }

    if (item.type === 'grandtotal') {
      return (
        <View style={styles.grandTotalCard}>
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalValue}>₹ {formatNumber(item.total)}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Collection Reports"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading && !reportData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading report...</Text>
              </View>
            ) : (
              <FlatList
                data={flatListData}
                keyExtractor={item => item.key}
                renderItem={renderFlatListItem}
                showsVerticalScrollIndicator={false}
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
                  <View>
                    <PillTabs tabs={TABS} active={tab} onChange={setTab} />

                    {/* Search & Filter Row */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search..."
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
                      <Text style={styles.footerText}>Loading more records...</Text>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  !loading ? (
                    <View style={shared.empty}>
                      <Icon name="chart-bar" size={46} color={colors.placeHolderColor} />
                      <Text style={shared.emptyText}>No records found</Text>
                    </View>
                  ) : null
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
                <Text style={styles.filterTitle}>Filter Collection Reports</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Collected By" />
              <Dropdown
                value={draftCollector}
                options={collectorNames}
                onSelect={setDraftCollector}
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
    backgroundColor: colors.white,
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

  resetButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.danger || '#FF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 8,
  },

  group: {
    marginBottom: 14,
  },

  cardItem: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    paddingBottom: 6,
  },

  cardIndex: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
    color: colors.secondary,
  },

  cardAmount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.success,
  },

  cardBody: {
    gap: 4,
  },

  cardField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },

  fieldLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  fieldValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.warningBg,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderTopWidth: 0,
  },

  totalLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  totalValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.success,
  },

  grandTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  grandTotalLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.primaryDark,
  },

  grandTotalValue: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

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

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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

  modalGap: {
    marginBottom: 12,
  },

  modalDateRow: {
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

  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },

  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});

export default CollectionReportScreen;

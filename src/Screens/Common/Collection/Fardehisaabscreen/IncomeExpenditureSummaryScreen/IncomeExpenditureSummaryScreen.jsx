import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../../themes/typography';

import AppLayout from '../../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../../components/BackHeader/BackHeader';
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
} from '../../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  fetchIncomeExpenditureStatements,
  deleteIncomeExpenditureStatement,
} from '../../../../../api/collection';

import IncomeExpenditureModal from './IncomeExpenditureModal';
import IncomeExpenditureViewModal from './IncomeExpenditureViewModal';

const STATUS_OPTIONS = ['All Status', 'Draft', 'Submitted', 'Approved'];
const PAGE_SIZE = 15;

const dmy = val => {
  if (!val) return '-';
  const datePart =
    val instanceof Date
      ? val.toISOString().split('T')[0]
      : String(val).split('T')[0];
  return datePart.split('-').reverse().join('/');
};

const toIsoDateOrEmpty = dateVal => {
  if (!dateVal) return '';
  if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
    return dateVal.toISOString().split('T')[0];
  }
  return String(dateVal).split('T')[0];
};

/* ── Statement Card (Matches FardeHisaabScreen Style) ── */
const StatementCard = ({
  item,
  index,
  onView,
  onEdit,
  onDelete,
  permissions,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.srBadge}>
          <Text style={styles.srText}>{index + 1}</Text>
        </View>
        <Text style={styles.dateRangeText}>
          {dmy(item.fromDate)} - {dmy(item.toDate)}
        </Text>
        {item.status ? <Badge text={item.status} /> : null}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Opening Balance:</Text>
          <Text style={styles.fieldValBold}>
            {formatRs(item.openingBalance || 0)}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Total Income:</Text>
          <Text style={[styles.fieldValBold, { color: colors.success }]}>
            {formatRs(item.totalIncome || 0)}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Total Expenditure:</Text>
          <Text style={[styles.fieldValBold, { color: '#DC2626' }]}>
            {formatRs(item.totalExpenditure || 0)}
          </Text>
        </View>

        <View style={styles.fundsBox}>
          <View style={styles.fundRow}>
            <Text style={styles.fundLabel}>Sent to Head Office</Text>
            <Text style={styles.fundValue}>
              {formatRs(item.sentToHeadOffice || 0)}
            </Text>
          </View>
          <View style={styles.fundRow}>
            <Text style={styles.fundLabel}>Deposited in Local Bank</Text>
            <Text style={styles.fundValue}>
              {formatRs(item.depositedInLocalBank || 0)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amountLabel}>Present Balance:</Text>
        <Text style={styles.amount}>{formatRs(item.presentBalance || 0)}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.75}
          onPress={() => onView(item)}
        >
          <Icon name="eye-outline" size={16} color={colors.primary} />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        {permissions?.canEdit && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => onEdit(item)}
          >
            <Icon name="pencil-outline" size={16} color="#2563EB" />
            <Text style={[styles.actionText, { color: '#2563EB' }]}>Edit</Text>
          </TouchableOpacity>
        )}

        {permissions?.canDelete && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => onDelete(item)}
          >
            <Icon name="trash-can-outline" size={16} color="#DC2626" />
            <Text style={[styles.actionText, { color: '#DC2626' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/* ── Main Screen ── */
const IncomeExpenditureSummaryScreen = ({
  navigation,
  permissions: propPermissions = null,
  onAddExpenditure = null,
}) => {
  const [search, setSearch] = useState('');
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Draft filter states inside modal
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);
  const [draftStatus, setDraftStatus] = useState('All Status');

  // Applied filters
  const [appliedFrom, setAppliedFrom] = useState(null);
  const [appliedTo, setAppliedTo] = useState(null);
  const [appliedStatus, setAppliedStatus] = useState('All Status');

  const [filterOpen, setFilterOpen] = useState(false);

  const [viewingStatement, setViewingStatement] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [editingStatement, setEditingStatement] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const permissions = propPermissions || {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  };

  const fetchStatements = useCallback(
    async ({ targetPage = 1, mode = 'replace' } = {}) => {
      if (mode === 'replace' && !refreshing) {
        setLoading(true);
      } else if (mode === 'loadMore') {
        setLoadingMore(true);
      }

      try {
        const fromStr = toIsoDateOrEmpty(appliedFrom);
        const toStr = toIsoDateOrEmpty(appliedTo);

        const filters = {
          page: targetPage,
          limit: PAGE_SIZE,
          isPagination: true,
          ...(fromStr && { fromDate: fromStr }),
          ...(toStr && { toDate: toStr }),
          ...(appliedStatus !== 'All Status' && { status: appliedStatus }),
        };

        const result = await fetchIncomeExpenditureStatements(filters);

        if (result.success) {
          setPage(targetPage);
          setHasMore(targetPage < (result.totalPages || 1));
          setStatements(prev => {
            if (mode === 'loadMore') {
              const seen = new Set(prev.map(x => x._id));
              return [
                ...prev,
                ...result.statements.filter(x => !seen.has(x._id)),
              ];
            }
            return result.statements || [];
          });
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch statements');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [appliedFrom, appliedTo, appliedStatus, refreshing],
  );

  useEffect(() => {
    fetchStatements({ targetPage: 1, mode: 'replace' });
  }, [appliedFrom, appliedTo, appliedStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatements({ targetPage: 1, mode: 'refresh' });
  };

  const handleLoadMore = () => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    fetchStatements({ targetPage: page + 1, mode: 'loadMore' });
  };

  const openFilter = () => {
    setDraftFrom(appliedFrom);
    setDraftTo(appliedTo);
    setDraftStatus(appliedStatus);
    setFilterOpen(true);
  };

  const handleApplyFilters = () => {
    if (draftFrom && draftTo && draftFrom > draftTo) {
      Alert.alert('Invalid dates', 'From date cannot be after To date');
      return;
    }
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setAppliedStatus(draftStatus);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftFrom(null);
    setDraftTo(null);
    setDraftStatus('All Status');
    setAppliedFrom(null);
    setAppliedTo(null);
    setAppliedStatus('All Status');
    setSearch('');
    setFilterOpen(false);
  };

  const handleViewStatement = statement => {
    setViewingStatement(statement);
    setIsViewModalOpen(true);
  };

  const handleEditStatement = statement => {
    setEditingStatement(statement);
    setIsCreateModalOpen(true);
  };

  const handleCreateStatement = () => {
    setEditingStatement(null);
    setIsCreateModalOpen(true);
  };

  const handleAddExpenditurePress = () => {
    if (typeof onAddExpenditure === 'function') {
      onAddExpenditure();
      return;
    }
    handleCreateStatement();
  };

  const handleDeleteStatement = async statement => {
    Alert.alert(
      'Delete Statement',
      'Are you sure you want to delete this statement?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (statement._id) {
                const result = await deleteIncomeExpenditureStatement(
                  statement._id,
                );
                if (result.success) {
                  Alert.alert('Success', 'Statement deleted successfully');
                  fetchStatements({ targetPage: 1, mode: 'replace' });
                } else {
                  Alert.alert(
                    'Error',
                    result.message || 'Failed to delete statement',
                  );
                }
              }
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || 'Failed to delete statement',
              );
            }
          },
        },
      ],
    );
  };

  const filteredStatements = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return statements;

    return statements.filter(item => {
      const statusMatch = String(item.status || '')
        .toLowerCase()
        .includes(q);
      const fromMatch = dmy(item.fromDate).toLowerCase().includes(q);
      const toMatch = dmy(item.toDate).toLowerCase().includes(q);
      const incomeMatch = String(item.totalIncome ?? '')
        .toLowerCase()
        .includes(q);
      const expMatch = String(item.totalExpenditure ?? '')
        .toLowerCase()
        .includes(q);
      const balMatch = String(item.presentBalance ?? '')
        .toLowerCase()
        .includes(q);
      return (
        statusMatch ||
        fromMatch ||
        toMatch ||
        incomeMatch ||
        expMatch ||
        balMatch
      );
    });
  }, [statements, search]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFrom) count += 1;
    if (appliedTo) count += 1;
    if (appliedStatus !== 'All Status') count += 1;
    return count;
  }, [appliedFrom, appliedTo, appliedStatus]);

  const renderStatementItem = ({ item, index }) => (
    <StatementCard
      item={item}
      index={index}
      onView={handleViewStatement}
      onEdit={handleEditStatement}
      onDelete={handleDeleteStatement}
      permissions={permissions}
    />
  );

  const renderListHeader = () => (
    <View>
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchFlex}>
          <SearchField
            placeholder="Search date, status, amount..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.8}
          onPress={openFilter}
        >
          <Icon name="filter-variant" size={22} color={colors.white} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
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

    if (!hasMore && filteredStatements.length > 0) {
      return <Text style={styles.endText}>All statements loaded</Text>;
    }

    return null;
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Income & Expenditure Summary"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <FlatList
              data={filteredStatements}
              keyExtractor={item => String(item._id)}
              renderItem={renderStatementItem}
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
                    <Text style={styles.loadingText}>
                      Loading statements...
                    </Text>
                  </View>
                ) : (
                  <View style={shared.empty}>
                    <Icon
                      name="file-document-outline"
                      size={46}
                      color={colors.placeHolderColor}
                    />
                    <Text style={shared.emptyText}>No statements found</Text>
                  </View>
                )
              }
            />

            <View style={styles.bottom}>
              <View style={styles.bottomRow}>
                <GreenButton
                  title="Add Expenditure"
                  icon="plus"
                  onPress={handleAddExpenditurePress}
                  style={styles.bottomBtn}
                />

                {permissions?.canCreate && (
                  <GreenButton
                    title="Add Statement"
                    icon="plus"
                    onPress={handleCreateStatement}
                    style={styles.bottomBtn}
                  />
                )}
              </View>
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
                <Text style={styles.filterTitle}>Filter Statements</Text>
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
                options={STATUS_OPTIONS}
                onSelect={setDraftStatus}
                style={styles.modalGap}
              />

              <View style={styles.actionRow}>
                <GreenButton
                  title="Apply"
                  onPress={handleApplyFilters}
                  style={styles.apply}
                />
                <GrayButton
                  title="Reset"
                  onPress={handleResetFilters}
                  style={styles.reset}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* View Statement Modal */}
        <IncomeExpenditureViewModal
          visible={isViewModalOpen}
          statementId={viewingStatement?._id}
          onClose={() => setIsViewModalOpen(false)}
        />

        {/* Create/Edit Modal */}
        <IncomeExpenditureModal
          visible={isCreateModalOpen}
          editingStatement={editingStatement}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingStatement(null);
          }}
          onSuccess={() => fetchStatements({ targetPage: 1, mode: 'refresh' })}
        />
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
    position: 'relative',
  },

  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  filterBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

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

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  actionText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
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

  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },

  bottomBtn: {
    flex: 1,
    height: 52,
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
});

export default IncomeExpenditureSummaryScreen;

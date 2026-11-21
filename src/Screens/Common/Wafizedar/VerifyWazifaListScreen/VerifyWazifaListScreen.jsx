import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { fetchVerifiedWazifaApplications } from '../../../../api/wazifa';

const DISBURSEMENT_STATUSES = [
  'All',
  'Pending',
  'Disbursed',
  'Returned',
  'Resend',
];
const FORM_TYPES = ['All', 'New', 'Renewal'];

const VerifyWazifaListScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    disbursementStatus: 'All',
    formType: 'All',
    from: null,
    to: null,
  });

  // Draft Filters inside Modal
  const [draftDisbursement, setDraftDisbursement] = useState('All');
  const [draftFormType, setDraftFormType] = useState('All');
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);

  // Load verified applications
  const loadApplications = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await fetchVerifiedWazifaApplications({
          page: pageNum,
          limit: pageSize,
          search: applied.search,
          disbursedStatus:
            applied.disbursementStatus !== 'All'
              ? applied.disbursementStatus
              : '',
          formType: applied.formType !== 'All' ? applied.formType : '',
          ...(applied.from && {
            fromDate: applied.from.toISOString(),
          }),
          ...(applied.to && {
            toDate: applied.to.toISOString(),
          }),
        });

        if (result.success) {
          const newData = result.applications || [];

          if (pageNum === 1) {
            setApplications(newData);
          } else {
            setApplications(prev => [...prev, ...newData]);
          }

          setPage(pageNum);
          setHasMore(newData.length === pageSize);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
        Alert.alert('Error', 'Failed to load verified applications');
      } finally {
        if (pageNum === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [applied, pageSize],
  );

  // Load applications on mount and whenever filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadApplications(1);
  }, [applied, loadApplications]);
  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadApplications(page + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadApplications(1, true);
  };

  const openFilter = () => {
    setDraftDisbursement(applied.disbursementStatus);
    setDraftFormType(applied.formType);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      disbursementStatus: draftDisbursement,
      formType: draftFormType,
      from: draftFrom,
      to: draftTo,
    }));
    setHasMore(true);
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftDisbursement('All');
    setDraftFormType('All');
    setDraftFrom(null);
    setDraftTo(null);
    setSearch('');

    setApplied({
      search: '',
      disbursementStatus: 'All',
      formType: 'All',
      from: null,
      to: null,
    });

    setPage(1);
    setHasMore(true);
  };

  const hasActiveFilters =
    applied.disbursementStatus !== 'All' || applied.formType !== 'All';

  const filteredData = useMemo(() => {
    return applications;
  }, [applications]);

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{(page - 1) * pageSize + index + 1}</Text>
        <Text style={styles.portalIdText}>Portal ID: {item.acountNo}</Text>
        <Badge text={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Student Name</Text>
          <Text style={styles.valTextBold}>{item.studentName}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Wazifa No.</Text>
          <Text style={styles.valTextPrimary}>{item.applicationNo}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Course</Text>
          <Text style={styles.valText}>{item.courseOfStudy}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Form Type</Text>
          <Text style={styles.valText}>{item.formType}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Institution</Text>
          <Text style={styles.valText}>{item.institutionName}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Annual Fees</Text>
          <Text style={styles.valFees}>
            Rs {Number(item.totalAnnualFees).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Applied On</Text>
          <Text style={styles.valText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Disbursed Status</Text>
          <Text
            style={[
              styles.disburseText,
              {
                color:
                  item.disbursedStatus === 'Disbursed' ? '#15803D' : '#D97706',
              },
            ]}
          >
            {item.disbursedStatus || 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Verify Wazifa List"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <FlatList
              data={filteredData}
              keyExtractor={item => item._id}
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
                  {/* Search Bar & Filter Icon */}
                  <View style={styles.searchFilterContainer}>
                    <View style={styles.searchFlex}>
                      <SearchField
                        placeholder="Search student, Portal ID..."
                        value={search}
                        onChangeText={text => {
                          setSearch(text);
                          setApplied(prev => ({ ...prev, search: text }));
                          setPage(1);
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
              ListEmptyComponent={
                loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>
                      Loading verified applications...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="file-search-outline"
                      size={40}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyTitle}>No records found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or filters.
                    </Text>
                  </View>
                )
              }
            />
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
                <Text style={styles.filterTitle}>Filter Wazifa List</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Disbursement Status" />
              <Dropdown
                value={draftDisbursement}
                options={DISBURSEMENT_STATUSES}
                onSelect={setDraftDisbursement}
                style={styles.modalGap}
              />

              <Label text="Form Type" />
              <Dropdown
                value={draftFormType}
                options={FORM_TYPES}
                onSelect={setDraftFormType}
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

  screenDesc: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 4,
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

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
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
  portalIdText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
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
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  valText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  valFees: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },
  disburseText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
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
});

export default VerifyWazifaListScreen;

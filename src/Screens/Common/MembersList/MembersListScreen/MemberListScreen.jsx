import React, { useState, useMemo, useEffect } from 'react';
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
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { fetchMembersList } from '../../../../api/member';
import { createAxiosInstance } from '../../../../api/apiConfig';

const api = createAxiosInstance('');

const MEMBER_TYPES = [
  'All Types',
  'Ordinary Member',
  'Life Member',
  'Dawami Member',
  'Sarparast Member',
  'Mohsine Member',
];

const MEMBER_STATUSES = [
  'All Status',
  'Active',
  'TimeBar',
  'Suspended',
  'Expired',
];
const CITIZENSHIP_LIST = ['All', 'Indian', 'Foreign'];
const PAYMENT_MODES = ['All Modes', 'Bank Transfer', 'UPI', 'Cash'];

const MembershipListScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [generatingAC, setGeneratingAC] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Debounce timer
  const searchTimerRef = React.useRef(null);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    memberType: 'All Types',
    status: 'All Status',
    citizenship: 'All',
    paymentMode: 'All Modes',
    from: null,
    to: null,
  });

  // Draft Filters in Modal
  const [draftSearch, setDraftSearch] = useState('');
  const [draftType, setDraftType] = useState('All Types');
  const [draftStatus, setDraftStatus] = useState('All Status');
  const [draftCitizenship, setDraftCitizenship] = useState('All');
  const [draftMode, setDraftMode] = useState('All Modes');
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadMembers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      applied.search ||
      applied.memberType !== 'All Types' ||
      applied.status !== 'All Status'
    ) {
      setPage(1);
      setHasMore(true);
      loadMembers(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const loadMembers = async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      setError(null);

      const response = await fetchMembersList({
        page: pageNum,
        limit: pageSize,
        isPagination: true,
        search: applied.search,
        memberType:
          applied.memberType !== 'All Types' ? applied.memberType : '',
        status: applied.status !== 'All Status' ? applied.status : '',
        citizenship: applied.citizenship !== 'All' ? applied.citizenship : '',
      });

      if (response.success) {
        const newData = response.members || [];

        if (pageNum === 1) {
          setMembersData(newData);
        } else {
          setMembersData(prev => [...prev, ...newData]);
        }

        setPage(pageNum);
        setHasMore(newData.length === pageSize);
      } else {
        setError(response.message || 'Failed to load members');
        if (pageNum === 1) {
          setMembersData([]);
        }
      }
    } catch (err) {
      console.error('❌ Error loading members:', err);
      setError('Failed to load members');
      if (pageNum === 1) {
        setMembersData([]);
      }
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadMembers(page + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadMembers(1, true);
  };

  const generateMissingAccountNumbers = async () => {
    try {
      setGeneratingAC(true);

      const response = await api.post(
        'membership/generate-missing-account-numbers',
        {},
      );

      if (response.status === 200 || response.data?.success) {
        // Reload members to show updated account numbers
        setPage(1);
        setHasMore(true);
        loadMembers(1);
        alert('Account numbers generated successfully!');
      }
    } catch (err) {
      console.error('❌ Error generating account numbers:', err);
      alert('Failed to generate account numbers');
    } finally {
      setGeneratingAC(false);
    }
  };

  // Debounced search
  const handleSearch = text => {
    setSearch(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (text.length > 0) {
      searchTimerRef.current = setTimeout(() => {
        setApplied(prev => ({ ...prev, search: text }));
        setPage(1);
      }, 500);
    } else {
      setApplied(prev => ({ ...prev, search: '' }));
      setPage(1);
    }
  };

  const openFilter = () => {
    setDraftSearch(applied.search);
    setDraftType(applied.memberType);
    setDraftStatus(applied.status);
    setDraftCitizenship(applied.citizenship);
    setDraftMode(applied.paymentMode);
    setDraftFrom(applied.from);
    setDraftTo(applied.to);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      search: draftSearch,
      memberType: draftType,
      status: draftStatus,
      citizenship: draftCitizenship,
      paymentMode: draftMode,
      from: draftFrom,
      to: draftTo,
    }));
    setFilterOpen(false);
    setPage(1);
  };

  const handleReset = () => {
    setDraftSearch('');
    setDraftType('All Types');
    setDraftStatus('All Status');
    setDraftCitizenship('All');
    setDraftMode('All Modes');
    setDraftFrom(null);
    setDraftTo(null);
    setSearch('');
    setApplied({
      search: '',
      memberType: 'All Types',
      status: 'All Status',
      citizenship: 'All',
      paymentMode: 'All Modes',
      from: null,
      to: null,
    });
    setMembersData([]);
    setPage(1);
    setHasMore(true);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (applied.search?.trim()) count++;
    if (applied.memberType !== 'All Types') count++;
    if (applied.status !== 'All Status') count++;
    if (applied.citizenship !== 'All') count++;
    if (applied.paymentMode !== 'All Modes') count++;
    if (applied.from) count++;
    if (applied.to) count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const filteredData = useMemo(() => {
    // Filtering done backend via API
    return membersData;
  }, [membersData]);

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{index + 1}</Text>
        <Text style={styles.idText}>
          ID: {item.uniqueId} (M-ID: {item.memberId})
        </Text>
        <Badge text={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Full Name</Text>
          <Text style={styles.valTextBold}>{item.fullName}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Member Type</Text>
          <Text style={styles.valTextPrimary}>{item.memberType}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>WMRN</Text>
          <Text style={styles.valText}>{item.acountNo}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Mobile No.</Text>
          <Text style={styles.valText}>{item.mobileNumber}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Address</Text>
          <Text style={styles.valText} numberOfLines={2}>
            {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Membership / Renew Date</Text>
          <Text style={styles.valText}>
            {item.membershipDate} / {item.renewDate}
          </Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Introduced By</Text>
          <Text style={styles.valText}>{item.introducedBy}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Membership List"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Icon name="alert-circle-outline" size={40} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
                <GreenButton
                  title="Retry"
                  onPress={loadMembers}
                  style={styles.retryBtn}
                />
              </View>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={(item, idx) => item._id || idx.toString()}
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
                    <Text style={styles.screenDesc}>
                      Manage membership list applications
                    </Text>

                    {/* Search Field & Filter Icon Row */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search member, ID, address..."
                          value={search}
                          onChangeText={handleSearch}
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
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="account-search-outline"
                      size={40}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyTitle}>No members found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or filters.
                    </Text>
                  </View>
                }
              />
            )}

            {/* Bottom Button Bar with Two Buttons */}
            <View style={styles.bottomBar}>
              <GreenButton
                title={generatingAC ? 'Generating...' : 'Generate A/C'}
                onPress={generateMissingAccountNumbers}
                disabled={generatingAC}
                style={styles.genButtonBar}
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
                <Text style={styles.filterTitle}>Filter Membership List</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

           

              <Label text="Member Type" />
              <Dropdown
                value={draftType}
                options={MEMBER_TYPES}
                onSelect={setDraftType}
                style={styles.modalGap}
              />

              <Label text="Status" />
              <Dropdown
                value={draftStatus}
                options={MEMBER_STATUSES}
                onSelect={setDraftStatus}
                style={styles.modalGap}
              />

              <View style={[shared.row, styles.modalDateRow]}>
                <View style={shared.colL}>
                  <Label text="Citizenship" />
                  <Dropdown
                    value={draftCitizenship}
                    options={CITIZENSHIP_LIST}
                    onSelect={setDraftCitizenship}
                  />
                </View>
                <View style={shared.col}>
                  <Label text="Payment Mode" />
                  <Dropdown
                    value={draftMode}
                    options={PAYMENT_MODES}
                    onSelect={setDraftMode}
                  />
                </View>
              </View>

              <View
                style={[
                  shared.row,
                  styles.modalDateRow,
                  styles.modalDateRowTop,
                ]}
              >
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
                {hasActiveFilters && (
                  <GrayButton
                    title="Reset"
                    onPress={handleReset}
                    style={styles.resetBtn}
                  />
                )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
  },

  screenDesc: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  idText: {
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
    fontSize: 12,
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

  // Bottom Button Bar Styles
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: 10,
  },
  exportButtonBar: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  exportButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },
  genButtonBar: {
    flex: 1.2,
    height: 48,
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
  modalGap: {
    marginBottom: 12,
  },
  modalDateRow: {
    marginBottom: 0,
  },
  modalDateRowTop: {
    marginTop: 12,
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
});

export default MembershipListScreen;

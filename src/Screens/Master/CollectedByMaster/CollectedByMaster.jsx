import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  SearchField,
  Dropdown,
  GreenButton,
  GrayButton,
} from '../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const MEMBER_TYPES = [
  'All Types',
  'Elected Member',
  'Life Member',
  'Ordinary Member',
];

const MEMBER_STATUSES = ['All Status', 'Active', 'Suspended', 'Expired'];
const SORT_OPTIONS = ['Recent', 'Oldest', 'Name (A-Z)'];

const CollectedByMasterScreen = ({ navigation }) => {
  const [collectedByList, setCollectedByList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const searchTimerRef = useRef(null);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    memberType: 'All Types',
    status: 'All Status',
    sortBy: 'Recent',
  });

  // Draft Filters in Modal
  const [draftSearch, setDraftSearch] = useState('');
  const [draftType, setDraftType] = useState('All Types');
  const [draftStatus, setDraftStatus] = useState('All Status');
  const [draftSort, setDraftSort] = useState('Recent');

  // Load initial data
  useEffect(() => {
    loadCollectedByList(1, 50, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if there's more data to load
  useEffect(() => {
    if (collectedByList.length > 0 && collectedByList.length < total) {
      setHasMore(true);
    } else if (collectedByList.length === 0 || collectedByList.length >= total) {
      setHasMore(false);
    }
  }, [collectedByList, total]);

  // Load when filters change
  useEffect(() => {
    setLoadingMore(false);
    setHasMore(true);

    loadCollectedByList(1, 50, applied.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const loadCollectedByList = useCallback(async (pageNum = 1, limit = 50, search = '') => {
    try {
      setLoading(true);
      // Mock API call - replace with actual API
      const mockData = [
        {
          id: '1',
          memberId: '1111',
          name: 'Head Office',
          memberType: '-',
          mobile: '-',
          age: '-',
          city: '-',
          state: '-',
          address: '-',
          status: 'Active',
        },
        {
          id: '2',
          memberId: '2222',
          name: 'Digital Drive',
          memberType: '-',
          mobile: '-',
          age: '-',
          city: '-',
          state: '-',
          address: '-',
          status: 'Active',
        },
        {
          id: '3',
          memberId: '0001',
          name: 'Haji Dr S Mohd. Abbas Zaidi',
          memberType: 'Elected Member',
          mobile: '9818244361',
          age: '-',
          city: 'New Delhi',
          state: 'New Delhi',
          address: 'Kothi No. 11, Noor Nagar Extension, Jamia Nagar, New Delhi -25',
          status: 'Active',
        },
        {
          id: '4',
          memberId: '0002',
          name: 'Sanaul Hasan Zaidi',
          memberType: 'Elected Member',
          mobile: '9650241333',
          age: '61 year',
          city: 'Aligarh',
          state: 'U.P',
          address: 'A 102, Ishaq Residency, Sir Syed Nagar, Aligarh 202002',
          status: 'Active',
        },
        {
          id: '5',
          memberId: '0003',
          name: 'Mirza Ali Abbas',
          memberType: 'Elected Member',
          mobile: '8318585254',
          age: '-',
          city: 'Gorakhpur',
          state: 'U.P',
          address:
            'S/o Late Mirza Ishrat Husain, Khadim Kada, Sheikhpura opp Panjatan Sports Geeta Press Gorakhpur, U.P-273005',
          status: 'Active',
        },
      ];

      if (pageNum === 1) {
        setCollectedByList(mockData);
      } else {
        setCollectedByList(prev => [...prev, ...mockData]);
      }
      setTotal(mockData.length);
      setPage(pageNum);
    } catch (error) {
      console.error('❌ Error loading collected by list:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore && collectedByList.length > 0) {
      setLoadingMore(true);
      loadCollectedByList(page + 1, 50, applied.search).finally(() => {
        setLoadingMore(false);
      });
    }
  }, [hasMore, loading, loadingMore, collectedByList.length, page, applied, loadCollectedByList]);

  const handleRefresh = useCallback(() => {
    setHasMore(true);
    loadCollectedByList(1, 50, applied.search);
  }, [applied, loadCollectedByList]);

  const handleSearchDebounce = text => {
    setSearch(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (text.length > 0) {
      searchTimerRef.current = setTimeout(() => {
        setApplied(prev => ({ ...prev, search: text }));
      }, 500);
    } else {
      setApplied(prev => ({ ...prev, search: '' }));
    }
  };

  const openFilter = () => {
    setDraftSearch(applied.search);
    setDraftType(applied.memberType);
    setDraftStatus(applied.status);
    setDraftSort(applied.sortBy);
    setTimeout(() => {
      setFilterOpen(true);
    }, 100);
  };

  const applyFilter = () => {
    setApplied({
      search: draftSearch,
      memberType: draftType,
      status: draftStatus,
      sortBy: draftSort,
    });
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftSearch('');
    setDraftType('All Types');
    setDraftStatus('All Status');
    setDraftSort('Recent');
    setSearch('');
    setApplied({
      search: '',
      memberType: 'All Types',
      status: 'All Status',
      sortBy: 'Recent',
    });
  };

  const hasActiveFilters =
    applied.search?.trim() ||
    applied.memberType !== 'All Types' ||
    applied.status !== 'All Status' ||
    applied.sortBy !== 'Recent';

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{(page - 1) * 50 + index + 1}</Text>
        <Text style={styles.idText}>ID: {item.memberId}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'Active' ? '#D1FAE5' : '#FEE2E2',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.status === 'Active' ? '#065F46' : '#991B1B' },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Name</Text>
          <Text style={styles.valTextBold}>{item.name}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Member Type</Text>
          <Text style={styles.valTextPrimary}>{item.memberType}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Mobile No.</Text>
          <Text style={styles.valText}>{item.mobile}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Age</Text>
          <Text style={styles.valText}>{item.age}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Location</Text>
          <Text style={styles.valText}>
            {item.city}, {item.state}
          </Text>
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
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Collected By Master"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading && collectedByList.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                <FlatList
                  data={collectedByList}
                  keyExtractor={item => item.id}
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
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      </View>
                    ) : null
                  }
                  ListHeaderComponent={
                    <View>
                      <View style={styles.searchFilterContainer}>
                        <View style={styles.searchFlex}>
                          <SearchField
                            placeholder="Search member name, ID..."
                            value={search}
                            onChangeText={handleSearchDebounce}
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
                      <Text style={styles.emptyTitle}>No records found</Text>
                      <Text style={styles.emptySubtitle}>
                        Try adjusting your search or filters.
                      </Text>
                    </View>
                  }
                />
              </>
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
          <View style={styles.overlay}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => setFilterOpen(false)}
            />
            <View
              style={styles.filterSheet}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={styles.filterTitle}>Filter Collected By</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Search" />
              <SearchField
                placeholder="Search by name..."
                value={draftSearch}
                onChangeText={setDraftSearch}
                style={styles.modalGap}
              />

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

              <Label text="Sort By" />
              <Dropdown
                value={draftSort}
                options={SORT_OPTIONS}
                onSelect={setDraftSort}
                style={styles.modalGap}
              />

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
          </View>
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
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 100,
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

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
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

  loadingMoreContainer: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
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

export default CollectedByMasterScreen;

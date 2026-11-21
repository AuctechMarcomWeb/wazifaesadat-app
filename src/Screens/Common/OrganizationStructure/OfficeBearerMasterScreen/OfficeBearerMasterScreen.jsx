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
import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  Body,
  GreenButton,
  GrayButton,
  Label,
  SearchField,
  Dropdown,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { useOfficeBearers } from '../../../../hooks/useOrganization';

const DESIGNATIONS = [
  'All Designations',
  'President',
  'Vice President',
  'General Secretary',
  'Joint Secretary',
  'Sec. Organization',
  'Sec. Media / Publicity',
  'Sec. Legal Cell',
  'Sec. Digital Media',
  'Sec. Counselling and Guidance',
  'Sec. Scholarship',
  'Editor Wazifa Monthly',
  'Internal Auditor',
  'Asst Secretary',
  'Asst. Secretary',
];

const TENURES = ['All Appointed Tenure', '2025-2026', '2024-2025', '2023-2024'];
const STATUSES = ['All Status', 'Active', 'Suspended', 'Expired'];
const SORT_OPTIONS = ['Recent', 'Oldest', 'Name (A-Z)'];

const OfficeBearerMasterScreen = ({ navigation }) => {
  const { bearers, loading, page, total, loadBearers, deleteBearer } =
    useOfficeBearers();

  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const searchTimerRef = useRef(null);

  // Filter states
  const [applied, setApplied] = useState({
    search: '',
    designation: 'All Designations',
    tenure: 'All Appointed Tenure',
    status: 'All Status',
    sortBy: 'Recent',
  });

  const [draftSearch, setDraftSearch] = useState('');
  const [draftDesignation, setDraftDesignation] = useState('All Designations');
  const [draftTenure, setDraftTenure] = useState('All Appointed Tenure');
  const [draftStatus, setDraftStatus] = useState('All Status');
  const [draftSort, setDraftSort] = useState('Recent');

  // Load initial data
  useEffect(() => {
    loadBearers(1, 50, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if there's more data to load
  useEffect(() => {
    if (bearers.length > 0 && bearers.length < total) {
      setHasMore(true);
    } else if (bearers.length === 0 || bearers.length >= total) {
      setHasMore(false);
    }
  }, [bearers, total]);

  // Load when filters change
  useEffect(() => {
    setLoadingMore(false);
    setHasMore(true);

    loadBearers(1, 50, applied.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore && bearers.length > 0) {
      setLoadingMore(true);
      loadBearers(page + 1, 50, applied.search).finally(() => {
        setLoadingMore(false);
      });
    }
  }, [
    hasMore,
    loading,
    loadingMore,
    bearers.length,
    page,
    applied,
    loadBearers,
  ]);

  const handleRefresh = useCallback(() => {
    setHasMore(true);
    loadBearers(1, 50, applied.search);
  }, [applied, loadBearers]);

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
    setDraftDesignation(applied.designation);
    setDraftTenure(applied.tenure);
    setDraftStatus(applied.status);
    setDraftSort(applied.sortBy);
    setTimeout(() => {
      setFilterOpen(true);
    }, 100);
  };

  const applyFilter = () => {
    setApplied({
      search: draftSearch,
      designation: draftDesignation,
      tenure: draftTenure,
      status: draftStatus,
      sortBy: draftSort,
    });
    setFilterOpen(false);
  };

  const resetFilter = () => {
    setDraftSearch('');
    setDraftDesignation('All Designations');
    setDraftTenure('All Appointed Tenure');
    setDraftStatus('All Status');
    setDraftSort('Recent');
    setSearch('');
    setApplied({
      search: '',
      designation: 'All Designations',
      tenure: 'All Appointed Tenure',
      status: 'All Status',
      sortBy: 'Recent',
    });
  };

  const hasActiveFilters =
    applied.search?.trim() ||
    applied.designation !== 'All Designations' ||
    applied.tenure !== 'All Appointed Tenure' ||
    applied.status !== 'All Status' ||
    applied.sortBy !== 'Recent';

  const handleDelete = bearer => {
    Alert.alert(
      'Delete Office Bearer',
      `Are you sure you want to delete ${bearer.name}?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            const result = await deleteBearer(bearer._id);
            if (result.success) {
              Alert.alert('Success', 'Deleted successfully');
              handleRefresh();
            } else {
              Alert.alert('Error', result.message || 'Failed to delete');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.srNo}>#{(page - 1) * 50 + index + 1}</Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate('AddOfficeBearerScreen', {
                bearer: item,
              })
            }
          >
            <Icon name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtnStyle]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="trash-can-outline" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Designation</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.designation || '-'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Tenure</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.tenure || '-'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Mobile</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.mobileNumber || item.mobile || '-'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Status</Text>
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
              {item.status || 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>City</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.city || '-'}
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
          title="Office Bearer Master"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                <FlatList
                  data={bearers}
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
                            placeholder="Search bearer..."
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
                        name="account-tie-outline"
                        size={40}
                        color="#9CA3AF"
                      />
                      <Text style={styles.emptyTitle}>
                        No office bearers found
                      </Text>
                      <Text style={styles.emptySubtitle}>
                        Try adjusting your search or filters.
                      </Text>
                    </View>
                  }
                />

                {/* Bottom Add Button */}
                <View style={styles.bottomBar}>
                  <GreenButton
                    title="+ Add Office Bearer"
                    onPress={() => navigation.navigate('AddOfficeBearerScreen')}
                    style={styles.addBtn}
                  />
                </View>
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
                <Text style={styles.filterTitle}>Filter Office Bearers</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Designation" />
              <Dropdown
                value={draftDesignation}
                options={DESIGNATIONS}
                onSelect={setDraftDesignation}
                style={styles.modalGap}
              />

              <Label text="Appointed Tenure" />
              <Dropdown
                value={draftTenure}
                options={TENURES}
                onSelect={setDraftTenure}
                style={styles.modalGap}
              />

              <Label text="Status" />
              <Dropdown
                value={draftStatus}
                options={STATUSES}
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
                    onPress={resetFilter}
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
    paddingHorizontal: 20,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 30,
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

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  cardInfo: {
    flex: 1,
    marginRight: 8,
  },

  srNo: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  nameText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    marginTop: 2,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },

  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },

  deleteBtnStyle: {
    backgroundColor: '#FEE2E2',
  },

  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  infoItem: {
    flex: 1,
    marginRight: 6,
  },

  label: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  value: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
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

  bottomBar: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  addBtn: {
    height: 48,
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

export default OfficeBearerMasterScreen;

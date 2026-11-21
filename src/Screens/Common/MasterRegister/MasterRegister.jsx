import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import DashboardHeader from '../../../components/DashboardHeader/DashboardHeader';
import BottomNav from '../../../components/BottomNav/BottomNav';
import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  SearchField,
  Dropdown,
  GreenButton,
  GrayButton,
  Badge,
} from '../../../components/Formparts';

// Import membership API functions
import { getMasterRegister, getMembersFiltered } from '../../../api/membership';

// ---------------------------------------------------------------
// Dummy data — fallback when API fails
// ---------------------------------------------------------------
const DEFAULT_TYPES = [
  'All Types',
  'Wazifadar',
  'Life Member',
  'Ordinary Member',
  'Dawami Member',
  'Sarparast Member',
  'Mohsine Member',
];

const TYPE_OPTIONS = [
  'All Types',
  'Wazifadar',
  'Life Member',
  'Ordinary Member',
  'Dawami Member',
  'Sarparast Member',
  'Mohsine Member',
];

const DEFAULT_MEMBERS = [];

const AVATAR_TONES = [
  { bg: '#DCE7FF', text: '#2563EB' },
  { bg: '#E8DDFB', text: '#6D28D9' },
  { bg: '#CDEFE6', text: '#0F8F6E' },
  { bg: '#FCEFC4', text: '#D9971A' },
  { bg: '#FBDDE3', text: '#D6336C' },
  { bg: '#DCE9FA', text: '#2F6FD0' },
];

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatDate = d =>
  d
    ? `${String(d.getDate()).padStart(2, '0')} ${
        MONTHS[d.getMonth()]
      } ${d.getFullYear()}`
    : '';

const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// ---------------------------------------------------------------
// Screen
// ---------------------------------------------------------------
const MasterRegister = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    type: 'All Types',
    fromDate: null,
    toDate: null,
  });

  // Draft Filters in Modal
  const [draftType, setDraftType] = useState('All Types');
  const [draftFromDate, setDraftFromDate] = useState(null);
  const [draftToDate, setDraftToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // API state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allMembers, setAllMembers] = useState(DEFAULT_MEMBERS);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10; // Load 10 items per page

  // Debounce timer for search
  const searchTimerRef = useRef(null);

  // Fetch master register data on mount or when filters change
  useEffect(() => {
    setPage(1);
    setAllMembers([]);
    setHasMore(true);
    fetchMasterRegisterWithFilters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const fetchMasterRegisterWithFilters = async pageNum => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Convert dates to YYYY-MM-DD format for API
      const formatDateForAPI = date => {
        if (!date) return null;
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return date;
      };

      // Call API with filters and pagination
      const response = await getMembersFiltered(
        applied.type,
        applied.fromDate ? formatDateForAPI(applied.fromDate) : null,
        applied.toDate ? formatDateForAPI(applied.toDate) : null,
        pageNum,
        pageSize,
      );

      if (response.success && response.memberships) {
        // Apply search filter on the results
        let filtered = response.memberships;
        const q = applied.search.trim().toLowerCase();
        if (q) {
          filtered = filtered.filter(m => {
            return m.name.toLowerCase().includes(q) || m.wmrn.includes(q);
          });
        }

        if (pageNum === 1) {
          setAllMembers(filtered);
          if (filtered.length > 0) {
            setSelectedId(filtered[0].id);
          }
        } else {
          setAllMembers(prev => [...prev, ...filtered]);
        }

        // Check if there are more items
        setHasMore(filtered.length >= pageSize);
        setPage(pageNum);
      } else {
        console.warn('Failed to fetch members:', response.message);
        if (pageNum === 1) {
          setAllMembers(DEFAULT_MEMBERS);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      if (pageNum === 1) {
        setAllMembers(DEFAULT_MEMBERS);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const openFilter = () => {
    setDraftType(applied.type);
    setDraftFromDate(applied.fromDate);
    setDraftToDate(applied.toDate);
    setFilterOpen(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setAllMembers([]);
    setHasMore(true);
    fetchMasterRegisterWithFilters(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      fetchMasterRegisterWithFilters(page + 1);
    }
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      type: draftType,
      fromDate: draftFromDate,
      toDate: draftToDate,
    }));
    setFilterOpen(false);
  };

  const handleSearchChange = text => {
    setSearch(text);

    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Set new timer - apply search after 500ms
    searchTimerRef.current = setTimeout(() => {
      setApplied(prev => ({ ...prev, search: text }));
    }, 500);
  };

  const handleReset = () => {
    setDraftType('All Types');
    setDraftFromDate(null);
    setDraftToDate(null);
    setSearch('');
    setApplied({
      search: '',
      type: 'All Types',
      fromDate: null,
      toDate: null,
    });
  };

  const handleFromDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowFromPicker(false);
    }
    if (selectedDate) {
      setDraftFromDate(startOfDay(selectedDate));
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowToPicker(false);
    }
    if (selectedDate) {
      setDraftToDate(startOfDay(selectedDate));
    }
  };

  // Only search filtering on UI side - type + date filters come from backend
  const data = useMemo(() => {
    let filtered = [...allMembers];

    // Search filtering only
    const q = applied.search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(m => {
        return m.name.toLowerCase().includes(q) || m.wmrn.includes(q);
      });
    }

    return filtered;
  }, [applied.search, allMembers]);

  const openMember = member => {
    setSelectedId(member.id);
    navigation && navigation.navigate('MemberProfile', { member });
  };

  const handleTabPress = key => {
    if (key === 'Members') return;
    navigation && navigation.navigate(key);
  };

  const renderItem = ({ item, index }) => {
    const tone = AVATAR_TONES[index % AVATAR_TONES.length];
    const selected = item.id === selectedId;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openMember(item)}
        style={[styles.row, selected && styles.rowSelected]}
      >
        <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
          <Text style={[styles.avatarText, { color: tone.text }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.wmrnLabel}>
            WMRN: <Text style={styles.wmrnLink}>{item.wmrn}</Text>
          </Text>
        </View>

        <View style={styles.rowMeta}>
          <Text style={styles.metaType}>{item.type}</Text>
          <Text style={styles.metaId}>ID: {item.id}</Text>
        </View>

        <Icon name="chevron-right" size={26} color="#374151" />
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        {/* Header with Overlay */}
        <View style={styles.headerOverlay}>
          <BackHeader navigation={navigation} title="Master Register" />
        </View>

        <View style={styles.body}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Members...</Text>
            </View>
          ) : (
            <Body>
              <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
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
                    {/* Search Field & Filter Icon Row */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search name, WMRN..."
                          value={search}
                          onChangeText={handleSearchChange}
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
                        {(applied.type !== 'All Types' ||
                          applied.fromDate ||
                          applied.toDate) && (
                          <View style={styles.filterBadgeDot} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                }
                ListFooterComponent={
                  loadingMore && hasMore ? (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadMoreText}>Loading more...</Text>
                    </View>
                  ) : null
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
            </Body>
          )}
        </View>

        <BottomNav active="Members" onPress={handleTabPress} />
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
              <Text style={styles.filterTitle}>Filter Members</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Label text="Member Type" />
            <Dropdown
              value={draftType}
              options={TYPE_OPTIONS}
              onSelect={setDraftType}
              style={styles.modalGap}
            />

            <Label text="Joined From" />
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFromPicker(true)}
            >
              <Icon name="calendar" size={16} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {draftFromDate ? formatDate(draftFromDate) : 'Select date'}
              </Text>
              {draftFromDate && (
                <TouchableOpacity
                  onPress={() => setDraftFromDate(null)}
                  style={styles.clearDateBtn}
                >
                  <Icon name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {showFromPicker && (
              <DateTimePicker
                value={draftFromDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleFromDateChange}
              />
            )}

            <Label text="Joined To" />
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowToPicker(true)}
            >
              <Icon name="calendar" size={16} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {draftToDate ? formatDate(draftToDate) : 'Select date'}
              </Text>
              {draftToDate && (
                <TouchableOpacity
                  onPress={() => setDraftToDate(null)}
                  style={styles.clearDateBtn}
                >
                  <Icon name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {showToPicker && (
              <DateTimePicker
                value={draftToDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleToDateChange}
              />
            )}

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
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },

  headerOverlay: {
    backgroundColor: colors.primary,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
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
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  // List
  listContent: {
    paddingHorizontal: wp('3.5%'),
    paddingTop: 8,
    paddingBottom: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#ECF0ED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 6,
  },

  rowSelected: {
    backgroundColor: '#E9F6EE',
    borderColor: '#D3EBDB',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.semiBold,
  },

  rowInfo: {
    flex: 1.5,
    marginLeft: 12,
  },

  name: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },

  wmrnLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    marginTop: 2,
  },

  wmrnLink: {
    color: '#1D4ED8',
    textDecorationLine: 'underline',
  },

  rowMeta: {
    flex: 1,
    marginRight: 4,
  },

  metaType: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#1F2937',
  },

  metaId: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
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

  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  loadMoreText: {
    marginLeft: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dateButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
  },
  clearDateBtn: {
    padding: 4,
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

export default MasterRegister;

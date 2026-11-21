import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

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
} from '../../../components/Formparts';

// Import API
import { getCommunicationsByType } from '../../../api/communication';

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------
const TABS = ['Inbound', 'Outbound', 'Draft'];
const DEFAULT_LETTERS = [];

const SEND_OPTIONS = ['All', 'Sent', 'Received'];

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
const LetterRecordScreen = ({ navigation }) => {
  const [tab, setTab] = useState('Inbound');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    send: 'All',
    fromDate: null,
    toDate: null,
  });

  // Draft Filters in Modal
  const [draftSend, setDraftSend] = useState('All');
  const [draftFromDate, setDraftFromDate] = useState(null);
  const [draftToDate, setDraftToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // API state
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState(DEFAULT_LETTERS);
  const [selectedId, setSelectedId] = useState(null);

  // Debounce timer for search
  const searchTimerRef = useRef(null);

  // Fetch communications on mount and when tab/filter changes
  useEffect(() => {
    fetchLetters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, applied]);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const tabType = tab.toLowerCase();
      // Convert send filter to API format ('All' -> null, 'Sent' -> 'sent', 'Received' -> 'received')
      const sendFilter =
        applied.send === 'All'
          ? null
          : applied.send.toLowerCase();
      
      const response = await getCommunicationsByType(tabType, sendFilter, 1, 100);

      if (response.success && response.communications) {
        setLetters(response.communications);
        if (response.communications.length > 0) {
          setSelectedId(response.communications[0].id);
        }
      } else {
        console.warn('Failed to fetch letters:', response.message);
        setLetters(DEFAULT_LETTERS);
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
      setLetters(DEFAULT_LETTERS);
    } finally {
      setLoading(false);
    }
  };

  const openFilter = () => {
    setDraftSend(applied.send);
    setDraftFromDate(applied.fromDate);
    setDraftToDate(applied.toDate);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      send: draftSend,
      fromDate: draftFromDate,
      toDate: draftToDate,
    }));
    setFilterOpen(false);
  };

  const handleSearchChange = text => {
    setSearch(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setApplied(prev => ({ ...prev, search: text }));
    }, 500);
  };

  const handleReset = () => {
    setDraftSend('All');
    setDraftFromDate(null);
    setDraftToDate(null);
    setSearch('');
    setApplied({
      search: '',
      send: 'All',
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

  // Filtering logic
  const data = useMemo(() => {
    let filtered = [...letters];

    // Filter by send type (sent/received)
    if (applied.send !== 'All') {
      // This would need backend filtering since we don't have send info in the response
      // For now, keep all since backend handles it
    }

    // Filter by date range
    if (applied.fromDate || applied.toDate) {
      filtered = filtered.filter(l => {
        const letterDate = startOfDay(new Date(l.createdAt));
        if (applied.fromDate && letterDate < startOfDay(applied.fromDate))
          return false;
        if (applied.toDate && letterDate > startOfDay(applied.toDate))
          return false;
        return true;
      });
    }

    // Filter by search
    const q = applied.search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(l => {
        return (
          l.from.toLowerCase().includes(q) ||
          l.to.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.recipients?.some(r => r.name?.toLowerCase().includes(q))
        );
      });
    }

    return filtered;
  }, [applied, letters]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      // onPress={() =>
      //   navigation && navigation.navigate('LetterDetail', { letter: item })
      // }
    >
      <View style={styles.cardIcon}>
        <Icon name="email-outline" size={24} color={colors.primary} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.fromTo}>
          <Text style={styles.fromToText}>{item.from}</Text>
          <Icon
            name="arrow-right"
            size={16}
            color="#374151"
            style={styles.arrow}
          />
          <Text style={styles.fromToText}>{item.to}</Text>
        </View>

        <View style={styles.dateRow}>
          <Icon name="calendar-month-outline" size={17} color="#6B7280" />
          <Text style={styles.dateText}>
            {formatDate(new Date(item.createdAt))}
          </Text>
        </View>

        <Text style={styles.taggedLabel}>Tagged:</Text>

        {item.recipients?.map(r => (
          <View key={r.memberId} style={styles.chip}>
            <Text style={styles.chipText}>
              {r.name} ({r.memberType})
            </Text>
          </View>
        ))}

        <Text style={styles.note}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Letter Record"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading letters...</Text>
            </View>
          ) : (
            <Body>
              <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                  <View>
                    {/* Tabs */}
                    <View style={styles.tabs}>
                      {TABS.map(t => {
                        const active = t === tab;

                        return (
                          <TouchableOpacity
                            key={t}
                            style={[styles.tab, active && styles.tabActive]}
                            activeOpacity={0.85}
                            onPress={() => setTab(t)}
                          >
                            <Text
                              style={[
                                styles.tabText,
                                active && styles.tabTextActive,
                              ]}
                            >
                              {t}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Search & Filter Row */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search letters..."
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
                        {(applied.send !== 'All' ||
                          applied.fromDate ||
                          applied.toDate) && (
                          <View style={styles.filterBadgeDot} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="email-off-outline" size={40} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No letters found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or filters.
                    </Text>
                  </View>
                }
              />
            </Body>
          )}
        </View>

        <BottomNav active="Communication" onPress={() => {}} />
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
              <Text style={styles.filterTitle}>Filter Letters</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Label text="Send" />
            <Dropdown
              value={draftSend}
              options={SEND_OPTIONS}
              onSelect={setDraftSend}
              style={styles.modalGap}
            />

            {/* <Label text="From Date" />
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

            <Label text="To Date" />
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
            )} */}

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

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: wp('3.5%'),
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E8EEEA',
    borderRadius: 14,
    marginTop: 25,
    padding: 4,
  },

  tab: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: '#3B9B47',
  },

  tabText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },

  tabTextActive: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
    marginHorizontal: wp('3.5%'),
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

  card: {
    flexDirection: 'row',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#ECF0ED',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E1F3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardBody: {
    flex: 1,
    marginLeft: 12,
  },

  fromTo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  fromToText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },

  arrow: {
    marginHorizontal: 8,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  dateText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    marginLeft: 6,
  },

  taggedLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },

  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#DDF1E4',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
  },

  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#2E7D32',
  },

  note: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
    marginTop: 6,
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

  // Modal
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

export default LetterRecordScreen;

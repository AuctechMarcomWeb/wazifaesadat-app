import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

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
  Badge,
} from '../../../components/Formparts';

// Master Types with sample data
const MASTER_TYPES = [
  {
    id: 'banks',
    label: 'Banks',
    icon: 'bank-outline',
    color: '#2563EB',
    status: 'Active',
    createdAt: '2026-10-17',
  },
  {
    id: 'designations',
    label: 'Designations',
    icon: 'briefcase-outline',
    color: '#6D28D9',
    status: 'Active',
    createdAt: '2026-10-15',
  },
  {
    id: 'paymentModes',
    label: 'Payment Modes',
    icon: 'wallet-outline',
    color: '#D97706',
    status: 'Active',
    createdAt: '2026-10-13',
  },
  {
    id: 'fundTypes',
    label: 'Fund Types',
    icon: 'gift-outline',
    color: '#059669',
    status: 'Active',
    createdAt: '2026-10-10',
  },
  {
    id: 'tenureYears',
    label: 'Tenure Years',
    icon: 'calendar-outline',
    color: '#0891B2',
    status: 'Active',
    createdAt: '2026-10-08',
  },
  {
    id: 'scholarshipDates',
    label: 'Scholarship Dates',
    icon: 'calendar-check-outline',
    color: '#7C3AED',
    status: 'Active',
    createdAt: '2026-10-05',
  },
  {
    id: 'rateScholarship',
    label: 'Scholarship Rates',
    icon: 'percent',
    color: '#DC2626',
    status: 'Active',
    createdAt: '2026-10-01',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: 'cash-outline',
    color: '#15803D',
    status: 'Active',
    createdAt: '2026-09-28',
  },
];

const STATUS_OPTIONS = ['All Status', 'Active', 'Suspended', 'Expired'];

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

const MasterList = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    status: 'All Status',
    fromDate: null,
    toDate: null,
  });

  // Draft Filters in Modal
  const [draftStatus, setDraftStatus] = useState('All Status');
  const [draftFromDate, setDraftFromDate] = useState(null);
  const [draftToDate, setDraftToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const openFilter = () => {
    setDraftStatus(applied.status);
    setDraftFromDate(applied.fromDate);
    setDraftToDate(applied.toDate);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      status: draftStatus,
      fromDate: draftFromDate,
      toDate: draftToDate,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftStatus('All Status');
    setDraftFromDate(null);
    setDraftToDate(null);
    setSearch('');
    setApplied({
      search: '',
      status: 'All Status',
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

  // Real-time filter combining search, status, and date range
  const filteredMasters = useMemo(() => {
    const q = applied.search.trim().toLowerCase();

    return MASTER_TYPES.filter(item => {
      // Filter by status
      if (applied.status !== 'All Status' && item.status !== applied.status) {
        return false;
      }

      // Filter by date range
      const itemDate = startOfDay(new Date(item.createdAt));
      if (applied.fromDate && itemDate < applied.fromDate) {
        return false;
      }
      if (applied.toDate && itemDate > applied.toDate) {
        return false;
      }

      // Filter by search text
      if (
        q &&
        !item.label.toLowerCase().includes(q) &&
        !item.id.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [applied]);

  const navigateToMaster = masterType => {
    // Navigate based on master type
    const navigationMap = {
      banks: 'Bank',
      designations: 'Designation',
      paymentModes: 'PaymentMode',
      fundTypes: 'FundType',
      tenureYears: 'TenureYear',
      scholarshipDates: 'ScholarshipDateMasterScreen',
      rateScholarship: 'RateOfScholarshipMasterScreen',
      expenses: 'ExpenseMasterScreen',
    };

    const screen = navigationMap[masterType.id];
    if (screen && navigation) {
      navigation.navigate(screen);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>#{index + 1}</Text>
        <Text style={styles.idText}>{item.id}</Text>
        <Badge text={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Master Type</Text>
          <Text style={styles.valTextBold}>{item.label}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Created Date</Text>
          <Text style={styles.valTextPrimary}>{item.createdAt}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.8}
        onPress={() => navigateToMaster(item)}
      >
        <Icon
          name="arrow-right"
          size={16}
          color={colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text style={styles.actionBtnText}>View & Manage</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Master List"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <FlatList
              data={filteredMasters}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <View>
                  {/* Search Field & Filter Icon Row */}
                  <View style={styles.searchFilterContainer}>
                    <View style={styles.searchFlex}>
                      <SearchField
                        placeholder="Search master type..."
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
                      <Icon
                        name="filter-variant"
                        size={22}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="folder-search-outline" size={40} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No masters found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your search or filters.
                  </Text>
                </View>
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
                <Text style={styles.filterTitle}>Filter Masters</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Status" />
              <Dropdown
                value={draftStatus}
                options={STATUS_OPTIONS}
                onSelect={setDraftStatus}
                style={styles.modalGap}
              />

              <Label text="Created From" />
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

              <Label text="Created To" />
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
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  idText: {
    fontSize: FontSize.xs,
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
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  valText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  actionBtnText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
    color: colors.primary,
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

export default MasterList;

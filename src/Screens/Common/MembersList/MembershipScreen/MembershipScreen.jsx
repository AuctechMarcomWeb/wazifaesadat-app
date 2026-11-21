import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
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
  GreenButton,
  GrayButton,
  Badge,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import {
  fetchMembersList,
  fetchMembershipDashboard,
} from '../../../../api/member';

const MEMBER_TYPES = [
  'All Types',
  'Ordinary Member',
  'Life Member',
  'Dawami Member',
  'Sarparast Member',
  'Mohsine member',
];

const MEMBER_STATUSES = [
  'All Status',
  'Active',
  'TimeBar',
  'Suspended',
  'Expired',
];

const MembershipScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [statsCards, setStatsCards] = useState([]);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    memberType: 'All Types',
    status: 'All Status',
  });

  // Draft Filters in Modal
  const [draftType, setDraftType] = useState('All Types');
  const [draftStatus, setDraftStatus] = useState('All Status');

  // Debounce timer
  const debounceTimer = useRef(null);

  // Fetch dashboard stats
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch members when applied filters change
  useEffect(() => {
    fetchMembers();
  }, [applied, fetchMembers]);

  const fetchStats = async () => {
    try {
      const result = await fetchMembershipDashboard();
      if (result.success && result.stats) {
        const stats = result.stats;
        const cards = [
          {
            title: 'Ordinary Member',
            total: stats['Ordinary Member']?.total || 0,
            active: stats['Ordinary Member']?.active || 0,
            suspended: stats['Ordinary Member']?.suspended || 0,
            expired: stats['Ordinary Member']?.expired || 0,
          },
          {
            title: 'Life Member',
            total: stats['Life Member']?.total || 0,
            active: stats['Life Member']?.active || 0,
            suspended: stats['Life Member']?.suspended || 0,
            expired: stats['Life Member']?.expired || 0,
          },
          {
            title: 'Dawami Member',
            total: stats['Dawami Member']?.total || 0,
            active: stats['Dawami Member']?.active || 0,
            suspended: stats['Dawami Member']?.suspended || 0,
            expired: stats['Dawami Member']?.expired || 0,
          },
          {
            title: 'Sarparast Member',
            total: stats['Sarparast Member']?.total || 0,
            active: stats['Sarparast Member']?.active || 0,
            suspended: stats['Sarparast Member']?.suspended || 0,
            expired: stats['Sarparast Member']?.expired || 0,
          },
          {
            title: 'Mohsine member',
            total: stats['Mohsine member']?.total || 0,
            active: stats['Mohsine member']?.active || 0,
            suspended: stats['Mohsine member']?.suspended || 0,
            expired: stats['Mohsine member']?.expired || 0,
          },
        ];
        setStatsCards(cards);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        search: applied.search || '',
        memberType:
          applied.memberType !== 'All Types' ? applied.memberType : '',
        status: applied.status !== 'All Status' ? applied.status : '',
        page: 1,
        limit: 50,
        isPagination: true,
      };

      const result = await fetchMembersList(filters);

      if (result.success) {
        setMembers(result.members);
        if (result.members.length === 0) {
          setError('No members found');
        }
      } else {
        setError(result.message || 'Failed to fetch members');
        setMembers([]);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error fetching members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  const handleSearchChange = text => {
    setSearch(text);

    // Debounce search (400ms)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setApplied(prev => ({
        ...prev,
        search: text,
      }));
    }, 400);
  };

  const openFilter = () => {
    setDraftType(applied.memberType);
    setDraftStatus(applied.status);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      memberType: draftType,
      status: draftStatus,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftType('All Types');
    setDraftStatus('All Status');
    setSearch('');
    setApplied({
      search: '',
      memberType: 'All Types',
      status: 'All Status',
    });
  };

  const handleRetry = () => {
    const hasFilters =
      applied.search ||
      applied.memberType !== 'All Types' ||
      applied.status !== 'All Status';
    if (hasFilters) {
      fetchMembers();
    }
  };

  const renderMemberItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{index + 1}</Text>
        <Text style={styles.uniqueIdText}>ID: {item.memberId}</Text>
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
          <Text style={styles.labelKey}>Introduced By</Text>
          <Text style={styles.valText}>{item.introducedBy}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Membership Date</Text>
          <Text style={styles.valText}>
            {item.membershipDate && item.membershipDate !== '-'
              ? new Date(item.membershipDate).toLocaleDateString('en-IN')
              : '-'}
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
          title="Membership"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <FlatList
              data={members}
              keyExtractor={item => item._id}
              renderItem={renderMemberItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <View>
                  {/* Horizontal Stats / Category Cards */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.statsScroll}
                    contentContainerStyle={styles.statsContent}
                  >
                    {statsCards.map((stat, idx) => (
                      <View key={idx} style={styles.statCard}>
                        <Text style={styles.statCardTitle}>{stat.title}</Text>
                        <View style={styles.statRowMain}>
                          <Text style={styles.statTotalLabel}>Total</Text>
                          <Text style={styles.statTotalVal}>{stat.total}</Text>
                        </View>
                        <View style={styles.statSubRow}>
                          <Text style={styles.statSubText}>
                            Active: {stat.active}
                          </Text>
                          <Text style={styles.statSubText}>
                            Susp: {stat.suspended}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Search Field & Filter Icon Row */}
                  <View style={styles.searchFilterContainer}>
                    <View style={styles.searchFlex}>
                      <SearchField
                        placeholder="Search member name, ID..."
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
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionHeading}>Recent Memberships</Text>
                </View>
              }
              ListEmptyComponent={
                loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="large"
                      color={colors.primary}
                      style={styles.loadingSpinner}
                    />
                    <Text style={styles.emptyTitle}>Loading members...</Text>
                  </View>
                ) : error ? (
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="alert-circle-outline"
                      size={40}
                      color="#ef4444"
                    />
                    <Text style={styles.emptyTitle}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleRetry}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
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
                )
              }
            />

            {/* Bottom Button Bar */}
            <View style={styles.bottomBar}>
              <GreenButton
                title="+ New Member"
                icon="account-plus-outline"
                onPress={() =>
                  navigation.navigate('AddMembershipApplicationScreen')
                }
                style={styles.newMemberButtonBar}
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
                <Text style={styles.filterTitle}>Filter Members</Text>
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

  // Bottom Button Bar Styles
  bottomBar: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  newMemberButtonBar: {
    height: 48,
    width: '100%',
  },

  // Stats Horizontal Scroll
  statsScroll: {
    maxHeight: 90,
    marginTop: 10,
    marginBottom: 12,
  },
  statsContent: {
    gap: 8,
  },
  statCard: {
    marginTop: 15,
    width: 140,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  statCardTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  statRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTotalLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  statTotalVal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  statSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statSubText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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

  sectionHeading: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 10,
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
  uniqueIdText: {
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
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingSpinner: {
    marginBottom: 16,
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
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.white,
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

export default MembershipScreen;

import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';

import { Body, PillTabs } from '../../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

// --------------------------------------------------
// TABS
// --------------------------------------------------

const TABS = ['Posts', 'Blogs', 'Jobs', 'Appeals'];

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];

// --------------------------------------------------
// DUMMY APPEALS DATA
// --------------------------------------------------

const INITIAL_APPEALS = [
  {
    id: '1',
    name: 'Abbas Zaidi',
    memberId: '0027',
    category: 'Medical Assistance',
    city: 'Lucknow',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    description:
      'Financial assistance required for medical treatment and hospital expenses.',
    target: 150000,
    collected: 60000,
    donors: 24,
    date: '05 Nov 2026',
    status: 'Approved',
    urgent: true,
  },
  {
    id: '2',
    name: 'Ali Raza',
    memberId: '0035',
    category: 'Education Support',
    city: 'Aligarh',
    image: 'https://randomuser.me/api/portraits/men/45.jpg',
    description:
      'Financial support required for higher education and college fees.',
    target: 75000,
    collected: 45000,
    donors: 18,
    date: '04 Nov 2026',
    status: 'Pending',
    urgent: false,
  },
  {
    id: '3',
    name: 'Sana Fatima',
    memberId: '0042',
    category: 'Marriage Assistance',
    city: 'Gorakhpur',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    description:
      'Requesting financial assistance for marriage-related expenses.',
    target: 200000,
    collected: 20000,
    donors: 8,
    date: '03 Nov 2026',
    status: 'Pending',
    urgent: false,
  },
  {
    id: '4',
    name: 'Mohammad Hasan',
    memberId: '0051',
    category: 'Emergency Support',
    city: 'Delhi',
    image: 'https://randomuser.me/api/portraits/men/68.jpg',
    description:
      'Emergency financial support requested for family requirements.',
    target: 100000,
    collected: 100000,
    donors: 35,
    date: '02 Nov 2026',
    status: 'Completed',
    urgent: true,
  },
  {
    id: '5',
    name: 'Fatima Zahra',
    memberId: '0063',
    category: 'Medical Assistance',
    city: 'Kanpur',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    description: 'Medical treatment assistance requested for a family member.',
    target: 50000,
    collected: 10000,
    donors: 5,
    date: '01 Nov 2026',
    status: 'Rejected',
    urgent: false,
  },
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const formatRs = amount => `₹ ${Number(amount || 0).toLocaleString('en-IN')}`;

const getProgress = item =>
  item.target > 0 ? Math.min((item.collected / item.target) * 100, 100) : 0;

// --------------------------------------------------
// MAIN SCREEN
// --------------------------------------------------

const AppealsScreen = ({ navigation, onTabChange }) => {
  const [activeTab, setActiveTab] = useState('Appeals');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [appeals, setAppeals] = useState(INITIAL_APPEALS);

  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const [donationVisible, setDonationVisible] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');

  // --------------------------------------------------
  // TAB CHANGE
  // --------------------------------------------------

  const handleTabChange = tab => {
    setActiveTab(tab);
    if (tab === 'Posts') navigation && navigation.navigate('PostsScreen');
    if (tab === 'Blogs') navigation && navigation.navigate('BlogsScreen');
    if (tab === 'Jobs') navigation && navigation.navigate('JobsScreen');

    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // --------------------------------------------------
  // SUMMARY CALCULATION
  // --------------------------------------------------

  const summary = useMemo(() => {
    const activeAppeals = appeals.filter(item => item.status !== 'Rejected');

    const totalRequired = activeAppeals.reduce(
      (sum, item) => sum + item.target,
      0,
    );

    const totalCollected = activeAppeals.reduce(
      (sum, item) => sum + item.collected,
      0,
    );

    return {
      total: appeals.length,
      pending: appeals.filter(item => item.status === 'Pending').length,
      required: totalRequired,
      collected: totalCollected,
      remaining: Math.max(totalRequired - totalCollected, 0),
    };
  }, [appeals]);

  // --------------------------------------------------
  // SEARCH AND FILTER
  // --------------------------------------------------

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appeals.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.memberId.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === 'All' || item.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [appeals, search, activeFilter]);

  // --------------------------------------------------
  // APPROVE APPEAL
  // --------------------------------------------------

  const handleApprove = item => {
    Alert.alert(
      'Approve Appeal',
      `Are you sure you want to approve ${item.name}'s donation appeal?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: () => {
            setAppeals(prev =>
              prev.map(appeal =>
                appeal.id === item.id
                  ? { ...appeal, status: 'Approved' }
                  : appeal,
              ),
            );

            setDetailsVisible(false);

            Alert.alert('Success', 'Appeal approved successfully.');
          },
        },
      ],
    );
  };

  // --------------------------------------------------
  // REJECT APPEAL
  // --------------------------------------------------

  const handleReject = item => {
    Alert.alert(
      'Reject Appeal',
      `Are you sure you want to reject ${item.name}'s appeal?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setAppeals(prev =>
              prev.map(appeal =>
                appeal.id === item.id
                  ? { ...appeal, status: 'Rejected' }
                  : appeal,
              ),
            );

            setDetailsVisible(false);

            Alert.alert('Success', 'Appeal rejected successfully.');
          },
        },
      ],
    );
  };

  // --------------------------------------------------
  // OPEN DONATION MODAL
  // --------------------------------------------------

  const openDonation = item => {
    setSelectedAppeal(item);
    setDonationAmount('');
    setDonationVisible(true);
  };

  // --------------------------------------------------
  // SAVE DONATION
  // --------------------------------------------------

  const handleDonation = () => {
    const amount = Number(donationAmount);

    if (!amount || amount <= 0) {
      Alert.alert('Validation', 'Please enter a valid donation amount.');
      return;
    }

    if (!selectedAppeal) return;

    const remaining = selectedAppeal.target - selectedAppeal.collected;

    if (amount > remaining) {
      Alert.alert(
        'Invalid Amount',
        `Remaining donation amount is ${formatRs(remaining)}.`,
      );
      return;
    }

    setAppeals(prev =>
      prev.map(item =>
        item.id === selectedAppeal.id
          ? {
              ...item,
              collected: item.collected + amount,
              donors: item.donors + 1,
              status:
                item.collected + amount >= item.target
                  ? 'Completed'
                  : item.status,
            }
          : item,
      ),
    );

    setDonationVisible(false);
    setDonationAmount('');
    setSelectedAppeal(null);

    Alert.alert('Success', 'Donation amount recorded successfully.');
  };

  // --------------------------------------------------
  // VIEW DETAILS
  // --------------------------------------------------

  const handleDetails = item => {
    setSelectedAppeal(item);
    setDetailsVisible(true);
  };

  // --------------------------------------------------
  // STATUS BADGE
  // --------------------------------------------------

  const getStatusStyle = status => {
    switch (status) {
      case 'Approved':
        return {
          backgroundColor: '#DCFCE7',
          color: '#15803D',
        };

      case 'Pending':
        return {
          backgroundColor: '#FEF3C7',
          color: '#B45309',
        };

      case 'Rejected':
        return {
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
        };

      case 'Completed':
        return {
          backgroundColor: '#DBEAFE',
          color: '#1D4ED8',
        };

      default:
        return {
          backgroundColor: '#F3F4F6',
          color: '#374151',
        };
    }
  };

  // --------------------------------------------------
  // APPEAL CARD
  // --------------------------------------------------

  const renderAppeal = ({ item }) => {
    const progress = getProgress(item);
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.appealCard}>
        {/* CARD HEADER */}

        <View style={styles.cardHeader}>
          <Image source={{ uri: item.image }} style={styles.profileImage} />

          <View style={styles.profileInfo}>
            <Text style={styles.appealName}>{item.name}</Text>

            <Text style={styles.memberId}>
              ID: {item.memberId} • {item.city}
            </Text>

            <Text style={styles.appealCategory}>{item.category}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* URGENT LABEL */}

        {item.urgent && (
          <View style={styles.urgentBadge}>
            <Icon name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.urgentText}>Urgent Request</Text>
          </View>
        )}

        {/* AMOUNT SECTION */}

        <View style={styles.amountContainer}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Required</Text>
            <Text style={styles.targetAmount}>{formatRs(item.target)}</Text>
          </View>

          <View style={styles.amountDivider} />

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Collected</Text>
            <Text style={styles.collectedAmount}>
              {formatRs(item.collected)}
            </Text>
          </View>

          <View style={styles.amountDivider} />

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text style={styles.remainingAmount}>
              {formatRs(Math.max(item.target - item.collected, 0))}
            </Text>
          </View>
        </View>

        {/* PROGRESS */}

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Donation Progress</Text>

          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        {/* FOOTER INFO */}

        <View style={styles.footerInfo}>
          <View style={styles.footerItem}>
            <Icon
              name="account-group-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.footerText}>{item.donors} Donors</Text>
          </View>

          <View style={styles.footerItem}>
            <Icon
              name="calendar-month-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.footerText}>{item.date}</Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleDetails(item)}
            activeOpacity={0.8}
          >
            <Icon name="eye-outline" size={17} color={colors.primary} />
            <Text style={styles.viewButtonText}>Details</Text>
          </TouchableOpacity>

          {item.status === 'Pending' ? (
            <>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject(item)}
                activeOpacity={0.8}
              >
                <Icon name="close" size={17} color="#DC2626" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(item)}
                activeOpacity={0.8}
              >
                <Icon name="check" size={17} color="#FFFFFF" />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </>
          ) : item.status === 'Approved' ? (
            <TouchableOpacity
              style={styles.donateButton}
              onPress={() => openDonation(item)}
              activeOpacity={0.8}
            >
              <Icon name="hand-heart" size={17} color="#FFFFFF" />
              <Text style={styles.donateText}>Record Donation</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedInfo}>
              <Text style={styles.completedText}>
                {item.status === 'Completed'
                  ? 'Target Achieved'
                  : 'Request Rejected'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // --------------------------------------------------
  // SCREEN UI
  // --------------------------------------------------

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Community Appeals"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {/* TABS */}

            <View style={styles.tabContainer}>
              <PillTabs
                tabs={TABS}
                active={activeTab}
                onChange={handleTabChange}
              />
            </View>

            {/* SUMMARY */}

            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Icon name="hand-heart" size={21} color="#15803D" />
                </View>

                <Text style={styles.summaryLabel}>Total Appeals</Text>

                <Text style={styles.summaryValue}>{summary.total}</Text>

                <Text style={styles.summarySub}>
                  {summary.pending} Pending requests
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Icon name="wallet-outline" size={21} color="#2563EB" />
                </View>

                <Text style={styles.summaryLabel}>Total Required</Text>

                <Text style={styles.summaryValue}>
                  {formatRs(summary.required)}
                </Text>

                <Text style={styles.summarySub}>Active appeals</Text>
              </View>
            </View>

            {/* COLLECTION SUMMARY */}

            <View style={styles.collectionCard}>
              <View style={styles.collectionItem}>
                <Text style={styles.collectionLabel}>Total Collected</Text>

                <Text style={styles.collectionValue}>
                  {formatRs(summary.collected)}
                </Text>
              </View>

              <View style={styles.collectionDivider} />

              <View style={styles.collectionItem}>
                <Text style={styles.collectionLabel}>Remaining Amount</Text>

                <Text style={styles.remainingValue}>
                  {formatRs(summary.remaining)}
                </Text>
              </View>
            </View>

            {/* SEARCH */}

            <View style={styles.searchContainer}>
              <Icon name="magnify" size={21} color="#6B7280" />

              <TextInput
                style={styles.searchInput}
                placeholder="Search name, ID, category..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
              />

              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close-circle" size={19} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* FILTERS */}

            <View style={styles.filterHeader}>
              <Text style={styles.sectionTitle}>Donation Requests</Text>

              <Text style={styles.resultCount}>
                {filteredData.length} Results
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {FILTERS.map(filter => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterChip,
                    activeFilter === filter && styles.activeFilterChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === filter && styles.activeFilterText,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* APPEALS LIST */}

            <FlatList
              data={filteredData}
              keyExtractor={item => item.id}
              renderItem={renderAppeal}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="folder-open-outline" size={45} color="#9CA3AF" />

                  <Text style={styles.emptyTitle}>No Appeals Found</Text>

                  <Text style={styles.emptyText}>
                    No donation requests match your search.
                  </Text>
                </View>
              }
            />
          </Body>
        </View>

        {/* ------------------------------------------ */}
        {/* APPEAL DETAILS MODAL */}
        {/* ------------------------------------------ */}

        <Modal
          visible={detailsVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Appeal Details</Text>

                <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                  <Icon name="close-circle" size={25} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedAppeal && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailProfile}>
                    <Image
                      source={{ uri: selectedAppeal.image }}
                      style={styles.detailImage}
                    />

                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailName}>
                        {selectedAppeal.name}
                      </Text>

                      <Text style={styles.memberId}>
                        Member ID: {selectedAppeal.memberId}
                      </Text>

                      <Text style={styles.appealCategory}>
                        {selectedAppeal.category}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailSectionTitle}>
                    Appeal Description
                  </Text>

                  <Text style={styles.descriptionText}>
                    {selectedAppeal.description}
                  </Text>

                  <View style={styles.detailAmountCard}>
                    <Text style={styles.detailSectionTitle}>
                      Donation Details
                    </Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Required Amount</Text>
                      <Text style={styles.detailValue}>
                        {formatRs(selectedAppeal.target)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Collected Amount</Text>
                      <Text style={styles.collectedAmount}>
                        {formatRs(selectedAppeal.collected)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Remaining Amount</Text>
                      <Text style={styles.remainingAmount}>
                        {formatRs(
                          selectedAppeal.target - selectedAppeal.collected,
                        )}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Donors</Text>
                      <Text style={styles.detailValue}>
                        {selectedAppeal.donors}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Submitted On</Text>
                      <Text style={styles.detailValue}>
                        {selectedAppeal.date}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={styles.detailValue}>
                        {selectedAppeal.status}
                      </Text>
                    </View>
                  </View>

                  {selectedAppeal.status === 'Pending' && (
                    <View style={styles.modalActionRow}>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(selectedAppeal)}
                      >
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprove(selectedAppeal)}
                      >
                        <Text style={styles.approveText}>Approve Appeal</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedAppeal.status === 'Approved' && (
                    <TouchableOpacity
                      style={styles.donateButton}
                      onPress={() => {
                        setDetailsVisible(false);
                        openDonation(selectedAppeal);
                      }}
                    >
                      <Icon name="hand-heart" size={19} color="#FFFFFF" />
                      <Text style={styles.donateText}>Record Donation</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* ------------------------------------------ */}
        {/* RECORD DONATION MODAL */}
        {/* ------------------------------------------ */}

        <Modal
          visible={donationVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDonationVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.donationModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Record Donation</Text>

                <TouchableOpacity onPress={() => setDonationVisible(false)}>
                  <Icon name="close-circle" size={25} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedAppeal && (
                <>
                  <Text style={styles.donationPerson}>
                    Beneficiary: {selectedAppeal.name}
                  </Text>

                  <Text style={styles.donationRemaining}>
                    Remaining:{' '}
                    {formatRs(selectedAppeal.target - selectedAppeal.collected)}
                  </Text>

                  <Text style={styles.inputLabel}>Donation Amount (₹)</Text>

                  <View style={styles.amountInputBox}>
                    <Icon
                      name="currency-inr"
                      size={21}
                      color={colors.primary}
                    />

                    <TextInput
                      style={styles.amountInput}
                      placeholder="Enter amount"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={donationAmount}
                      onChangeText={setDonationAmount}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveDonationButton}
                    onPress={handleDonation}
                  >
                    <Icon
                      name="check-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />

                    <Text style={styles.donateText}>Save Donation</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setDonationVisible(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </AppLayout>
  );
};

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  body: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },

  tabContainer: {
    paddingHorizontal: wp('4%'),
    marginTop: 14,
    marginBottom: 6,
  },

  // SUMMARY

  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    gap: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E1F3E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  summaryValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 3,
  },

  summarySub: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 3,
  },

  // COLLECTION

  collectionCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    marginHorizontal: wp('4%'),
    marginTop: 10,
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  collectionItem: {
    flex: 1,
  },

  collectionDivider: {
    width: 1,
    backgroundColor: '#D1E7D8',
    marginHorizontal: 10,
  },

  collectionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: FontFamily.medium,
  },

  collectionValue: {
    fontSize: FontSize.md,
    color: '#15803D',
    fontFamily: FontFamily.bold,
    marginTop: 4,
  },

  remainingValue: {
    fontSize: FontSize.md,
    color: '#D97706',
    fontFamily: FontFamily.bold,
    marginTop: 4,
  },

  // SEARCH

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 11,
    marginHorizontal: wp('4%'),
    marginTop: 14,
    paddingHorizontal: 12,
    height: 46,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
  },

  // FILTER

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    marginTop: 16,
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  resultCount: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  filterScroll: {
    maxHeight: 38,
    marginBottom: 10,
  },

  filterContent: {
    paddingHorizontal: wp('4%'),
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
  },

  activeFilterText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },

  // APPEAL CARD

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 25,
  },

  appealCard: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileImage: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 11,
  },

  appealName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  memberId: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 3,
  },

  appealCategory: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.primary,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },

  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },

  urgentText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },

  // AMOUNT

  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 8,
    marginTop: 13,
  },

  amountBox: {
    flex: 1,
    alignItems: 'center',
  },

  amountDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },

  amountLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: FontFamily.medium,
  },

  targetAmount: {
    fontSize: 12,
    color: colors.TitleColor,
    fontFamily: FontFamily.bold,
    marginTop: 5,
  },

  collectedAmount: {
    fontSize: 12,
    color: '#15803D',
    fontFamily: FontFamily.bold,
  },

  remainingAmount: {
    fontSize: 12,
    color: '#D97706',
    fontFamily: FontFamily.bold,
  },

  // PROGRESS

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 13,
    marginBottom: 7,
  },

  progressLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.TitleColor,
  },

  progressPercent: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  progressBarBg: {
    height: 7,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 5,
  },

  // FOOTER

  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  footerText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: FontFamily.medium,
  },

  // ACTIONS

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: 11,
    marginTop: 11,
  },

  viewButton: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5EE',
    borderRadius: 8,
    gap: 5,
  },

  viewButtonText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  approveButton: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 5,
  },

  approveText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  rejectButton: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FEECEC',
  },

  rejectText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: FontFamily.bold,
  },

  donateButton: {
    flex: 1,
    minHeight: 38,
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },

  donateText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  completedInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },

  // EMPTY

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 45,
  },

  emptyTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 10,
  },

  emptyText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 5,
  },

  // MODALS

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  detailsModal: {
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },

  donationModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  detailProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  detailImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 13,
    backgroundColor: '#E5E7EB',
  },

  detailName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  detailSectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 10,
  },

  descriptionText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 17,
  },

  detailAmountCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 13,
    marginBottom: 15,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },

  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: FontFamily.medium,
  },

  detailValue: {
    fontSize: 12,
    color: colors.TitleColor,
    fontFamily: FontFamily.bold,
  },

  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  // DONATION INPUT

  donationPerson: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 7,
  },

  donationRemaining: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#D97706',
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 8,
  },

  amountInputBox: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  amountInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.TitleColor,
  },

  saveDonationButton: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 5,
  },

  cancelText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.textSecondary,
  },
});

export default AppealsScreen;

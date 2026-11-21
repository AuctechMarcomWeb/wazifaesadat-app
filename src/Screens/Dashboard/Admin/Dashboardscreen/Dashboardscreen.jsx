import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import DashboardHeader from '../../../../components/DashboardHeader/DashboardHeader';
import BottomNav from '../../../../components/BottomNav/BottomNav';

// Import dashboard API functions
import {
  getAdminDashboard,
  getDashboardMembers,
  getDashboardScholarships,
  getDashboardFundSummary,
  getDashboardCollection,
  getDashboardDisbursedStatus,
  getSuperAdminDashboard,
} from '../../../../api/dashboard';

// ---------------------------------------------------------------
// Default/Fallback data
// ---------------------------------------------------------------
const DEFAULT_MEMBERS = [
  {
    label: 'Total Members',
    value: 0,
    icon: 'account-group-outline',
    tone: 'green',
  },
  {
    label: 'Ordinary Member',
    value: 0,
    icon: 'account-multiple-outline',
    tone: 'blue',
  },
  { label: 'Life Member', value: 0, icon: 'account-outline', tone: 'green' },
  {
    label: 'Dawami Member',
    value: 0,
    icon: 'account-multiple-outline',
    tone: 'orange',
  },
  { label: 'Sarparast Member', value: 0, icon: 'star-outline', tone: 'purple' },
  { label: 'Mohsine Member', value: 0, icon: 'account-outline', tone: 'red' },
];

const DEFAULT_COLLECTION = {
  total: 0,
  items: [
    {
      label: 'Corpus Fund',
      value: 0,
      icon: 'gift-outline',
      tone: 'purple',
    },
    { label: 'Reserve Fund', value: 0, icon: 'bank-outline', tone: 'blue' },
    {
      label: 'Membership\n& Donation',
      value: 0,
      icon: 'account-multiple-outline',
      tone: 'orange',
    },
    {
      label: 'Other',
      value: 0,
      icon: 'dots-horizontal-circle-outline',
      tone: 'gray',
    },
  ],
};

const DEFAULT_WAZIFADAR = [
  {
    label: 'Total\nApplications',
    value: 0,
    icon: 'file-document-edit-outline',
    tone: 'blue',
  },
  {
    label: 'Pending',
    value: 0,
    icon: 'clock-outline',
    tone: 'purple',
  },
  { label: 'Disbursed', value: 0, icon: 'wallet-outline', tone: 'green' },
  { label: 'Approved', value: 0, icon: 'checkbox-marked-outline', tone: 'cyan' },
  { label: 'Rejected', value: 0, icon: 'close-circle-outline', tone: 'orange' },
  { label: 'Returned', value: 0, icon: 'restore', tone: 'red' },
  { label: 'Resend', value: 0, icon: 'send-outline', tone: 'sky' },
];

const DEFAULT_SCHOLARSHIP = [
  { label: 'Total Approved', value: 0, tone: 'purple' },
  { label: 'Total Disbursed', value: 0, tone: 'green' },
  { label: 'Total Pending', value: 0, tone: 'orange' },
];

const TRANSACTIONS = [
  {
    id: '1',
    date: '20 Aug 2026',
    name: '–',
    type: 'Wazifa',
    amount: 500,
    mode: 'UPI',
  },
  {
    id: '2',
    date: '20 Aug 2026',
    name: 'Anonymous',
    type: 'Wazifa',
    amount: 1500,
    mode: 'UPI',
  },
  {
    id: '3',
    date: '20 Aug 2026',
    name: 'Mr. Mohammad Ali Shamsi',
    type: 'Wazifa',
    amount: 500,
    mode: 'Cash',
  },
];

// ---------------------------------------------------------------
// Tones
// ---------------------------------------------------------------
const TONES = {
  green: {
    bg: '#E6F6EC',
    border: '#CBEBD6',
    text: '#15803D',
    iconBg: '#D3F0DE',
  },
  blue: {
    bg: '#E8EEFF',
    border: '#CFDAFB',
    text: '#2342B8',
    iconBg: '#D6E0FD',
  },
  orange: {
    bg: '#FFF0E0',
    border: '#FADFC0',
    text: '#D2690A',
    iconBg: '#FCE1C4',
  },
  purple: {
    bg: '#F0EAFF',
    border: '#DDD2F8',
    text: '#6D28D9',
    iconBg: '#E3DAFA',
  },
  red: { bg: '#FFE9EA', border: '#F8CDD0', text: '#C81E2D', iconBg: '#FAD3D6' },
  cyan: {
    bg: '#E3F6FA',
    border: '#C5E8F0',
    text: '#0E7C95',
    iconBg: '#CBEBF2',
  },
  sky: { bg: '#E6F1FF', border: '#CADEF8', text: '#1D6FD6', iconBg: '#D1E3FA' },
  gray: {
    bg: '#F1F3F5',
    border: '#E0E4E8',
    text: '#374151',
    iconBg: '#E3E7EB',
  },
};

const formatNumber = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const formatRs = n => `Rs ${formatNumber(n)}`;

// ---------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------
const SectionCard = ({ icon, title, subtitle, children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <LinearGradient colors={colors.gradients.green} style={styles.cardIcon}>
        <Icon name={icon} size={22} color={colors.white} />
      </LinearGradient>

      <View style={styles.cardHeaderText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </View>

    {children}
  </View>
);

const MemberTile = ({ item }) => {
  const t = TONES[item.tone];

  return (
    <View
      style={[
        styles.memberTile,
        { backgroundColor: t.bg, borderColor: t.border },
      ]}
    >
      <View style={[styles.memberIcon, { backgroundColor: t.iconBg }]}>
        <Icon name={item.icon} size={20} color={t.text} />
      </View>

      <View style={styles.memberText}>
        <Text
          style={[styles.memberLabel, { color: t.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {item.label}
        </Text>
        <Text style={[styles.memberValue, { color: t.text }]} numberOfLines={1}>
          {formatNumber(item.value)}
        </Text>
      </View>
    </View>
  );
};

const FundTile = ({ item }) => {
  const t = TONES[item.tone];

  return (
    <View
      style={[
        styles.fundTile,
        { backgroundColor: t.bg, borderColor: t.border },
      ]}
    >
      <Icon name={item.icon} size={24} color={t.text} />

      <View style={styles.fundText}>
        <Text style={styles.fundLabel} numberOfLines={2}>
          {item.label}
        </Text>
        <Text
          style={[styles.fundValue, { color: t.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatRs(item.value)}
        </Text>
      </View>
    </View>
  );
};

const WazifaTile = ({ item }) => {
  const t = TONES[item.tone];

  return (
    <View
      style={[
        styles.wazifaTile,
        { backgroundColor: t.bg, borderColor: t.border },
      ]}
    >
      <Icon name={item.icon} size={22} color={t.text} />
      <Text
        style={[styles.wazifaLabel, { color: t.text }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {item.label}
      </Text>
      <Text style={[styles.wazifaValue, { color: t.text }]} numberOfLines={1}>
        {formatNumber(item.value)}
      </Text>
    </View>
  );
};

const AmountTile = ({ item }) => {
  const t = TONES[item.tone];

  return (
    <View
      style={[
        styles.amountTile,
        { backgroundColor: t.bg, borderColor: t.border },
      ]}
    >
      <Text
        style={[styles.amountLabel, { color: t.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {item.label}
      </Text>
      <Text style={[styles.amountValue, { color: t.text }]} numberOfLines={1}>
        {formatRs(item.value)}
      </Text>
    </View>
  );
};

const ModeBadge = ({ mode }) => {
  const isCash = mode === 'Cash';

  return (
    <View style={[styles.badge, isCash ? styles.badgeCash : styles.badgeUpi]}>
      <Text
        style={[styles.badgeText, { color: isCash ? '#0E7490' : '#15803D' }]}
      >
        {mode}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------
// Screen
// ---------------------------------------------------------------
const DashboardScreen = ({ navigation }) => {
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [wazifadar, setWazifadar] = useState(DEFAULT_WAZIFADAR);
  const [scholarship, setScholarship] = useState(DEFAULT_SCHOLARSHIP);

  // Fetch dashboard data on component mount and when year changes
  useEffect(() => {
    fetchDashboardData();
  }, [year]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get the main dashboard data
      const response = await getAdminDashboard(year);

      if (response.success && response.data) {
        setDashboardData(response.data);

        // Parse members data
        if (response.data.members) {
          const memberTypeStats = response.data.members.memberTypeStats || [];
          const totalMembers = response.data.members.total;

          const parsedMembers = [
            {
              label: 'Total Members',
              value: totalMembers?.totalMembers || 0,
              icon: 'account-group-outline',
              tone: 'green',
            },
            {
              label: 'Ordinary Member',
              value: memberTypeStats.find(m => m.memberType === 'Ordinary Member')
                ?.totalMembers || 0,
              icon: 'account-multiple-outline',
              tone: 'blue',
            },
            {
              label: 'Life Member',
              value: memberTypeStats.find(m => m.memberType === 'Life Member')
                ?.totalMembers || 0,
              icon: 'account-outline',
              tone: 'green',
            },
            {
              label: 'Dawami Member',
              value: memberTypeStats.find(m => m.memberType === 'Dawami Member')
                ?.totalMembers || 0,
              icon: 'account-multiple-outline',
              tone: 'orange',
            },
            {
              label: 'Sarparast Member',
              value: memberTypeStats.find(m => m.memberType === 'Sarparast Member')
                ?.totalMembers || 0,
              icon: 'star-outline',
              tone: 'purple',
            },
            {
              label: 'Mohsine Member',
              value: memberTypeStats.find(m => m.memberType === 'Mohsine member')
                ?.totalMembers || 0,
              icon: 'account-outline',
              tone: 'red',
            },
          ];

          setMembers(parsedMembers);
        }

        // Parse collection/fund data
        if (response.data.fundSummary) {
          const fund = response.data.fundSummary;
          setCollection({
            total: fund.totalCollection1 || 0,
            items: [
              {
                label: 'Corpus Fund',
                value: fund.corpusFund || 0,
                icon: 'gift-outline',
                tone: 'purple',
              },
              {
                label: 'Reserve Fund',
                value: fund.reserveFund || 0,
                icon: 'bank-outline',
                tone: 'blue',
              },
              {
                label: 'Membership\n& Donation',
                value: fund.membershipDonation || 0,
                icon: 'account-multiple-outline',
                tone: 'orange',
              },
              {
                label: 'Other',
                value: fund.others || 0,
                icon: 'dots-horizontal-circle-outline',
                tone: 'gray',
              },
            ],
          });
        }

        // Parse wazifadar/scholarship data
        if (response.data.scholarships) {
          const schol = response.data.scholarships;
          const disbursed = response.data.disbursedStatus;

          setWazifadar([
            {
              label: 'Total\nApplications',
              value: schol.totalScholarships || 0,
              icon: 'file-document-edit-outline',
              tone: 'blue',
            },
            {
              label: 'Pending',
              value: schol.pendingScholarships || 0,
              icon: 'clock-outline',
              tone: 'purple',
            },
            {
              label: 'Disbursed',
              value: disbursed?.disbursed || 0,
              icon: 'wallet-outline',
              tone: 'green',
            },
            {
              label: 'Approved',
              value: schol.approvedScholarships || 0,
              icon: 'checkbox-marked-outline',
              tone: 'cyan',
            },
            {
              label: 'Rejected',
              value: schol.rejectedScholarships || 0,
              icon: 'close-circle-outline',
              tone: 'orange',
            },
            {
              label: 'Returned',
              value: disbursed?.returned || 0,
              icon: 'restore',
              tone: 'red',
            },
            {
              label: 'Resend',
              value: disbursed?.resend || 0,
              icon: 'send-outline',
              tone: 'sky',
            },
          ]);

          setScholarship([
            { label: 'Total Approved', value: schol.totalApprovedAmount || 0, tone: 'purple' },
            { label: 'Total Disbursed', value: schol.totalDisbursedAmount || 0, tone: 'green' },
            { label: 'Total Pending', value: schol.totalPendingAmount || 0, tone: 'orange' },
          ]);
        }
      } else {
        console.warn('Dashboard data not found:', response.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = key => {
    if (key === 'Dashboard') return;
    navigation?.navigate(key);
  };

  return (
    <View style={styles.container}>
      <DashboardHeader
        year={year}
        onYearChange={setYear}
        onMenuPress={() =>
          navigation && navigation.openDrawer && navigation.openDrawer()
        }
        onBellPress={() => navigation && navigation.navigate('Notifications')}
        onProfilePress={() =>
          navigation && navigation.navigate('ProfileScreen')
        }
      />

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Dashboard...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Member Overview */}
            <SectionCard
              icon="account-group-outline"
              title="Member Overview"
              subtitle="All registered member types and their current status"
            >
              <View style={styles.memberGrid}>
                {members.map(item => (
                  <MemberTile key={item.label} item={item} />
                ))}
              </View>
            </SectionCard>

            {/* Collection Overview */}
            <SectionCard
              icon="cash-multiple"
              title="Collection Overview"
              subtitle="Fund balances and collection breakdown"
            >
              <View style={styles.collectionRow}>
                <LinearGradient
                  colors={['#E3F6EA', '#BFE8CF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.totalCard}
                >
                  <View style={styles.totalIcon}>
                    <Icon name="currency-inr" size={30} color={colors.white} />
                  </View>

                  <View style={styles.totalText}>
                    <Text style={styles.totalLabel}>Total Collection</Text>
                    <Text
                      style={styles.totalValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {formatRs(collection.total)}
                    </Text>
                  </View>
                </LinearGradient>

                <View style={styles.fundGrid}>
                  {collection.items.map(item => (
                    <FundTile key={item.label} item={item} />
                  ))}
                </View>
              </View>
            </SectionCard>

            {/* Wazifadar Overview */}
            <SectionCard
              icon="school-outline"
              title="Wazifadar Overview"
              subtitle="Scholarship applications and disbursement status"
            >
              <View style={styles.wazifaRow}>
                {wazifadar.map(item => (
                  <WazifaTile key={item.label} item={item} />
                ))}
              </View>
            </SectionCard>

            {/* Scholarship Amounts */}
            <SectionCard
              icon="currency-inr"
              title="Scholarship Amounts"
              subtitle="Financial breakdown — current year"
            >
              <View style={styles.amountRow}>
                {scholarship.map(item => (
                  <AmountTile key={item.label} item={item} />
                ))}
              </View>
            </SectionCard>

            {/* Recent Transactions */}
            <View style={styles.card}>
              <View style={styles.txHeader}>
                <View style={styles.txTitleRow}>
                  <Icon name="swap-horizontal" size={26} color={colors.primary} />
                  <Text style={styles.txTitle}>Recent Transactions</Text>
                </View>

                <TouchableOpacity
                  style={styles.viewAll}
                  onPress={() =>
                    navigation && navigation.navigate('Transactions')
                  }
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Icon name="arrow-right" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {TRANSACTIONS.map(tx => (
                <View key={tx.id} style={styles.txRow}>
                  <Icon name="calendar-month-outline" size={20} color="#4B5563" />

                  <Text style={styles.txDate}>{tx.date}</Text>

                  <View style={styles.txNameBox}>
                    <Text style={styles.txName} numberOfLines={1}>
                      {tx.name}
                    </Text>
                    <Text style={styles.txType}>{tx.type}</Text>
                  </View>

                  <Text style={styles.txAmount}>{formatRs(tx.amount)}</Text>

                  <ModeBadge mode={tx.mode} />
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <BottomNav active="Dashboard" onPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary2,
  },

  body: {
    flex: 1,
    marginTop: -22,
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
  },

  loadingText: {
    marginTop: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },

  scrollContent: {
    padding: wp('3.5%'),
    paddingBottom: 24,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    elevation: 3,
    shadowColor: '#174D34',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  cardTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  cardSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: colors.textMuted,
    marginTop: -1,
  },

  // Member grid (3 x 2)
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  memberTile: {
    width: '32%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
  },

  memberIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  memberText: {
    flex: 1,
    marginLeft: 7,
  },

  memberLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
  },

  memberValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    lineHeight: 28,
  },

  // Collection
  collectionRow: {
    flexDirection: 'row',
  },

  totalCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  totalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  totalText: {
    alignItems: 'center',
    width: '100%',
  },

  totalLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },

  totalValue: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: colors.primary2,
  },

  fundGrid: {
    flex: 1.2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  fundTile: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    minHeight: 78,
    justifyContent: 'space-between',
  },

  fundText: {
    marginTop: 4,
  },

  fundLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#374151',
  },

  fundValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
  },

  // Wazifadar
  wazifaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  wazifaTile: {
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 96,
  },

  wazifaLabel: {
    fontSize: 9,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
    marginVertical: 4,
  },

  wazifaValue: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },

  // Scholarship amounts
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  amountTile: {
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  amountLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },

  amountValue: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },

  // Transactions
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  txTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  txTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginLeft: 8,
  },

  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewAllText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
    marginRight: 3,
  },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9EEEB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: '#FBFCFB',
  },

  txDate: {
    width: 84,
    marginLeft: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },

  txNameBox: {
    flex: 1,
    marginHorizontal: 6,
  },

  txName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#1F2937',
  },

  txType: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: colors.textMuted,
    marginTop: -1,
  },

  txAmount: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginRight: 8,
  },

  badge: {
    minWidth: 52,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  badgeUpi: {
    backgroundColor: '#DDF3E4',
  },

  badgeCash: {
    backgroundColor: '#DCEFF7',
  },

  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
  },
});

export default DashboardScreen;

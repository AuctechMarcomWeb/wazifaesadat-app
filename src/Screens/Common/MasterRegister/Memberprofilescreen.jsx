import React from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { widthPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';

const TOP_PADDING =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 54;

// ---------------------------------------------------------------
// Dummy data — pass a real member via route.params.member
// ---------------------------------------------------------------
const DEFAULT_MEMBER = {
  name: 'Ali Raza',
  type: 'Wazifadar',
  wmrn: '202610174685',
  email: 'shoabrazaaliraza@gmail.com',
  contact: '9076544225',
  photo: null, // e.g. 'https://...'
  address: '390/17 rustam nagar saadatganj',
  state: '',
  city: '',
  citizenship: '',
  postalCode: '226003',
  relationType: 'Wazifadar',
  memberId: '001527',
  fatherName: 'azeem iqbal',
  membershipDate: '17 Oct 2026',
  status: 'Pending',
};

const show = v => (v && String(v).trim() ? v : '-');

const getInitials = (fullName) => {
  if (!fullName) return '?';
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const MemberProfileScreen = ({ navigation, route }) => {
  const m = {
    ...DEFAULT_MEMBER,
    ...((route && route.params && route.params.member) || {}),
  };

  const initials = getInitials(m.name);

  const infoLeft = [
    {
      icon: 'map-marker-outline',
      label: 'Address',
      value: show(m.address === DEFAULT_MEMBER.address ? '' : m.address),
    },
    { icon: 'office-building-outline', label: 'City', value: show(m.city) },
    {
      icon: 'card-bulleted-outline',
      label: 'Postal Code',
      value: show(m.postalCode === '226003' ? '' : m.postalCode),
    },
  ];

  const infoRight = [
    { icon: 'bank-outline', label: 'State', value: show(m.state) },
    {
      icon: 'account-outline',
      label: 'Citizenship',
      value: show(m.citizenship),
    },
    {
      icon: 'account-group-outline',
      label: 'Relation Type',
      value: show(m.relationType),
      bold: true,
    },
  ];

  const relationRows = [
    { label: 'Member ID / Wazifa No.', value: show(m.memberId) },
    { label: 'Full Name', value: show(m.name) },
    { label: 'Father Name', value: show(m.fatherName) },
    { label: 'Relation Type', value: show(m.relationType) },
    { label: 'Membership Date', value: show(m.membershipDate) },
    { label: 'Mobile', value: show(m.contact) },
    { label: 'Email', value: show(m.email) },
    { label: 'Address', value: show(m.address) },
    { label: 'Postal Code', value: show(m.postalCode) },
  ];

  const isPending = String(m.status).toLowerCase() === 'pending';

  const renderInfo = item => (
    <View key={item.label} style={styles.infoItem}>
      <Icon name={item.icon} size={24} color="#374151" />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{item.label}</Text>
        <Text style={[styles.infoValue, item.bold && styles.infoValueBold]}>
          {item.value}
        </Text>
      </View>
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Master Register" />

        <View style={styles.body}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.photoRing}>
                {m.photo ? (
                  <Image source={{ uri: m.photo }} style={styles.photo} />
                ) : (
                  <View style={styles.photoFallback}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>
                )}
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {m.name}
                  </Text>

                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{m.type}</Text>
                  </View>
                </View>

                <Text style={styles.contactLine}>
                  <Text style={styles.contactLabel}>WMRN: </Text>
                  <Text style={styles.wmrnLink}>{m.wmrn}</Text>
                </Text>

                <Text style={styles.contactLine} numberOfLines={1}>
                  <Text style={styles.contactLabel}>Email: </Text>
                  {m.email}
                </Text>

                <Text style={styles.contactLine}>
                  <Text style={styles.contactLabel}>Contact: </Text>
                  {m.contact}
                </Text>
              </View>
            </View>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>{infoLeft.map(renderInfo)}</View>
              <View style={styles.infoDivider} />
              <View style={styles.infoColumn}>{infoRight.map(renderInfo)}</View>
            </View>

            {/* Member Relation */}
            <View style={styles.relationBox}>
              <View style={styles.relationHeader}>
                <Text style={styles.relationTitle}>Member Relation</Text>
              </View>

              <View style={styles.table}>
                {relationRows.map((row, index) => (
                  <View
                    key={row.label}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 && styles.tableRowAlt,
                    ]}
                  >
                    <Text style={styles.tableLabel}>{row.label}</Text>
                    <Text style={styles.tableValue}>{row.value}</Text>
                  </View>
                ))}

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Status</Text>

                  <View style={styles.tableValueBox}>
                    <View
                      style={[
                        styles.statusBadge,
                        isPending ? styles.statusPending : styles.statusActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: isPending ? '#B7791F' : '#15803D' },
                        ]}
                      >
                        {m.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },

  shapeOne: {
    position: 'absolute',
    width: wp('70%'),
    height: wp('70%'),
    borderRadius: wp('35%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -wp('35%'),
    right: -wp('15%'),
  },

  backButton: {
    paddingRight: 14,
  },

  headerTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  // Body
  body: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  scrollContent: {
    padding: wp('3.5%'),
    paddingBottom: 30,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F6EE',
    borderWidth: 1,
    borderColor: '#D3EBDB',
    borderRadius: 18,
    padding: 14,
  },

  photoRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: '#3FA564',
    padding: 3,
    backgroundColor: colors.white,
  },

  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },

  photoFallback: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: '#EEF2EF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  initialsText: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    color: '#3FA564',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  profileName: {
    flex: 1,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginRight: 6,
  },

  typeBadge: {
    backgroundColor: '#CFEFD9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  typeBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#2E8B3E',
  },

  contactLine: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#111827',
    marginTop: 3,
  },

  contactLabel: {
    fontFamily: FontFamily.regular,
    color: '#4B5563',
  },

  wmrnLink: {
    color: '#1D4ED8',
    textDecorationLine: 'underline',
    fontFamily: FontFamily.medium,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#ECF0ED',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },

  infoColumn: {
    flex: 1,
  },

  infoDivider: {
    width: 1,
    backgroundColor: '#E5EAE7',
    marginHorizontal: 8,
    marginVertical: 6,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
  },

  infoLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },

  infoValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    marginTop: 1,
  },

  infoValueBold: {
    fontFamily: FontFamily.bold,
    color: '#111827',
    fontSize: FontSize.base,
  },

  // Member relation
  relationBox: {
    marginTop: 14,
  },

  relationHeader: {
    backgroundColor: '#2E7D32',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  relationTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  table: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E5EAE7',
    backgroundColor: colors.white,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EF',
  },

  tableRowAlt: {
    backgroundColor: '#F8FAF9',
  },

  tableLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
  },

  tableValue: {
    flex: 1.15,
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },

  tableValueBox: {
    flex: 1.15,
    alignItems: 'flex-start',
  },

  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },

  statusPending: {
    backgroundColor: '#FCEBB6',
  },

  statusActive: {
    backgroundColor: '#D5F0DD',
  },

  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
});

export default MemberProfileScreen;

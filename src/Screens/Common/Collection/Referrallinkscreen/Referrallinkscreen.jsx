import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Share,
  StyleSheet,
  ActivityIndicator,
  Clipboard,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';

import { Body, SearchField, shared } from '../../../../components/Formparts';

import {
  getReferralLinkPeople,
  buildReferralUrl,
} from '../../../../api/collection';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const ReferralLinkScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedFund, setSelectedFund] = useState('corpus');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'qr'
  const qrRef = useRef(null);

  // Load people on mount
  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const result = await getReferralLinkPeople({
        isPagination: false,
        limit: 100,
      });
      if (result.success) {
        setPeople(result.people || []);
      }
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter(
      p =>
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.designation && p.designation.toLowerCase().includes(q)),
    );
  }, [search, people]);

  const handleOpenQRModal = (person, fund) => {
    setSelectedPerson(person);
    setSelectedFund(fund);
    setViewMode('qr');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPerson(null);
  };

  const handleDownloadQR = () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(() => {
        Alert.alert('Success', 'QR Code saved to gallery successfully!');
      });
    }
  };

  const handleCopyLink = () => {
    if (selectedPerson) {
      const url = buildReferralUrl(selectedPerson, selectedFund);
      Clipboard.setString(url);
      Alert.alert('Success', 'Referral link copied to clipboard!');
    }
  };

  const handleShareAll = async () => {
    if (selectedPerson) {
      const url = buildReferralUrl(selectedPerson, selectedFund);
      const fundLabel =
        selectedFund === 'corpus' ? 'Corpus Fund' : 'Membership Fee & Donation';

      try {
        await Share.share({
          message: `Join via ${selectedPerson.name}'s referral link for ${fundLabel}:\n${url}`,
          title: `${selectedPerson.name} - Referral Link`,
        });
      } catch (e) {
        console.error('Share error:', e);
      }
    }
  };

  const renderItem = ({ item }) => {
    const initials = item.name
      ? item.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'RF';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.info}>
            <View style={styles.nameRoleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text style={styles.designationText} numberOfLines={1}>
              {item.designation || 'Member'} • {item.city || 'India'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.buttonRowContainer}>
          <TouchableOpacity
            style={styles.qrActionBtn}
            activeOpacity={0.8}
            onPress={() => handleOpenQRModal(item, 'corpus')}
          >
            <Icon name="qrcode-scan" size={15} color={colors.primary} />
            <Text style={styles.qrActionText}>Corpus Fund</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.qrActionBtn, styles.qrActionBtnOutline]}
            activeOpacity={0.8}
            onPress={() => handleOpenQRModal(item, 'membership')}
          >
            <Icon name="qrcode" size={15} color="#2563EB" />
            <Text style={[styles.qrActionText, { color: '#2563EB' }]}>
              Membership Fee & Donation
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title={viewMode === 'list' ? 'Referral Link' : 'QR Code & Sharing'}
          onBack={() => {
            if (viewMode === 'qr') {
              handleBackToList();
            } else {
              navigation && navigation.goBack();
            }
          }}
        />

        {viewMode === 'list' ? (
          // LIST VIEW
          <View style={styles.body}>
            <Body>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Loading referral links...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={data}
                  keyExtractor={item => item._id || item.id}
                  renderItem={renderItem}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.listContainer}
                  ListHeaderComponent={
                    <View style={styles.headerWrap}>
                      <Text style={styles.screenSubtitle}>
                        Generate & share referral QR codes and links for members
                      </Text>
                      <SearchField
                        placeholder="Search by name, city, or role..."
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchBox}
                      />
                    </View>
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Icon
                        name="link-off"
                        size={46}
                        color={colors.placeHolderColor}
                      />
                      <Text style={styles.emptyText}>
                        {people.length === 0
                          ? 'No referral links available'
                          : 'No results found'}
                      </Text>
                    </View>
                  }
                />
              )}
            </Body>
          </View>
        ) : (
          // QR VIEW (Greenish Linear Gradient Background)
          <LinearGradient
            colors={[colors.primary, '#065F46', '#044E38']}
            style={styles.qrBodyContainer}
          >
            {selectedPerson && (
              <View style={styles.qrContentWrapper}>
                {/* Fund Switcher Tabs */}

                {/* QR Card */}
                <View style={styles.qrCardMain}>
                  <View style={styles.qrProfileBadge}>
                    <Text style={styles.qrProfileName}>
                      {selectedPerson.name}
                    </Text>
                    <Text style={styles.qrProfileSub}>
                      {selectedPerson.designation || 'Member'} •{' '}
                      {selectedPerson.city || 'India'}
                    </Text>
                  </View>

                  <View style={styles.qrImageBox}>
                    {buildReferralUrl(selectedPerson, selectedFund) && (
                      <QRCode
                        getRef={ref => {
                          qrRef.current = ref;
                        }}
                        value={buildReferralUrl(selectedPerson, selectedFund)}
                        size={210}
                        color="#111827"
                        backgroundColor="#FFFFFF"
                        quietZone={12}
                      />
                    )}
                  </View>

                  <Text style={styles.qrInstructions}>
                    Scan QR code to contribute directly via referral
                  </Text>
                </View>

                {/* Bottom Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.8}
                    onPress={handleDownloadQR}
                  >
                    <View style={styles.actionIconCircle}>
                      <Icon name="download" size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.actionBtnText}>Download</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.8}
                    onPress={handleShareAll}
                  >
                    <View style={styles.actionIconCircle}>
                      <Icon
                        name="share-variant"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.8}
                    onPress={handleCopyLink}
                  >
                    <View style={styles.actionIconCircle}>
                      <Icon
                        name="content-copy"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.actionBtnText}>Copy Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  body: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  listContainer: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 24,
    paddingTop: 8,
  },
  headerWrap: {
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 6,
  },
  searchBox: {
    marginBottom: 14,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: colors.placeHolderColor,
    marginTop: 10,
  },

  // Modern Card Styles
  card: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  designationText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginVertical: 12,
  },
  buttonRowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  qrActionBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  qrActionBtnOutline: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  qrActionText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginLeft: 5,
  },

  // QR View Styles (Greenish Gradient Background)
  qrBodyContainer: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  qrContentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 16,
  },
  fundTab: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    gap: 6,
  },
  fundTabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fundTabText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.white,
  },
  fundTabTextActive: {
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  qrCardMain: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  qrProfileBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrProfileName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    textAlign: 'center',
  },
  qrProfileSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  qrImageBox: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInstructions: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 10,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
  },
});

export default ReferralLinkScreen;

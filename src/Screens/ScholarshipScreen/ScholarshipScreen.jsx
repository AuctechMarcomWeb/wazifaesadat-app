import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';

import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import { Body } from '../../components/Formparts';

import { getScholarshipDates } from '../../api/scholarship';

const THEME = {
  screenBg: '#F7FAF3',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF6E8',
  border: '#E2ECE0',
  textPrimary: colors.TitleColor || '#153A24',
  textSecondary: colors.textSecondary || '#5C6F63',
  accent: colors.primary || '#2E7D32',
  accentSoft: '#E5F2E7',
  ctaBg: '#1F6E3A',
  ctaText: '#FFFFFF',
  deadlineText: '#C62828',
  deadlineBg: '#FDECEC',
};

const ScholarshipScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const openLink = async url => {
    if (!url) {
      Alert.alert('Information', 'Download link is not available.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Error', 'Unable to open download link.');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open download link.');
    }
  };

  // Single API call returning Junior & Senior scholarship dates together
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getScholarshipDates(true);
      const list = Array.isArray(result)
        ? result
        : result?.scholarshipDates || result?.data || [];

      setData(list);
    } catch (error) {
      console.log('Scholarship Error:', error?.message || error);

      Alert.alert(
        'Error',
        error?.message || 'Failed to load scholarship dates',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Scholarship Status
  const getScholarshipStatus = item => {
    if (!item.startDate || !item.endDate) {
      return 'Unavailable';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (today > endDate) {
      return 'Closed';
    }

    if (today < startDate) {
      return 'Upcoming';
    }

    return 'Ongoing';
  };

  // Date Format
  const formatDate = dateString => {
    if (!dateString) return 'N/A';

    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Search Filter
  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data;

    return data.filter(item => {
      const searchableText = `${item.category || ''} ${
        item.remarks || ''
      }`.toLowerCase();

      return searchableText.includes(query);
    });
  }, [data, search]);

  // Status Badge
  const renderStatusBadge = status => {
    let badgeStyle = styles.ongoingBadge;
    let textStyle = styles.ongoingText;
    let dotColor = '#15803D';

    if (status === 'Closed') {
      badgeStyle = styles.closedBadge;
      textStyle = styles.closedText;
      dotColor = '#DC2626';
    } else if (status === 'Upcoming') {
      badgeStyle = styles.upcomingBadge;
      textStyle = styles.upcomingText;
      dotColor = '#B45309';
    } else if (status === 'Unavailable') {
      badgeStyle = styles.unavailableBadge;
      textStyle = styles.unavailableText;
      dotColor = '#6B7280';
    }

    return (
      <View style={[styles.statusBadge, badgeStyle]}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.statusText, textStyle]}>{status}</Text>
      </View>
    );
  };

  // Scholarship Card
  const renderItem = ({ item }) => {
    const status = getScholarshipStatus(item);
    const downloadUrl =
      item.downloadFormUrl || item.downloadUrl || item.formDownloadUrl;

    return (
      <View style={styles.card}>
        {/* Top Row: Category Icon + Status Pill */}
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Icon
              name={
                item.category?.toLowerCase().includes('graduate')
                  ? 'bank'
                  : 'school'
              }
              size={24}
              color={THEME.accent}
            />
          </View>

          {renderStatusBadge(status)}
        </View>

        {/* Scholarship Category */}
        <Text style={styles.cardTitle}>{item.category || 'Scholarship'}</Text>

        {/* Description */}
        <Text style={styles.cardDescription}>
          {item.remarks || 'Scholarship registration details'}
        </Text>

        {/* Registration Dates */}
        <View style={styles.dateBox}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Form Open</Text>
            <Text style={styles.openDate}>{formatDate(item.startDate)}</Text>
          </View>

          <View style={styles.dateDivider} />

          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Last Date</Text>
            <Text style={styles.deadlineDate}>{formatDate(item.endDate)}</Text>
          </View>
        </View>

        {/* Download Form */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.downloadButton}
          onPress={() => openLink(downloadUrl)}
        >
          <Icon name="file-download-outline" size={20} color={THEME.ctaText} />
          <Text style={styles.downloadButtonText}>Download Form</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Scholarship Registration"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {loading && data.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={THEME.accent} />
                <Text style={styles.loadingText}>Loading scholarships...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={(item, index) => String(item._id || index)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={loadData}
                    colors={[THEME.accent]}
                    tintColor={THEME.accent}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <Icon
                        name="school-outline"
                        size={36}
                        color={THEME.accent}
                      />
                    </View>

                    <Text style={styles.emptyTitle}>No Scholarship Found</Text>

                    <Text style={styles.emptySubtitle}>
                      No scholarship registration available right now.
                    </Text>
                  </View>
                }
              />
            )}
          </Body>
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.screenBg,
  },

  body: {
    flex: 1,
    backgroundColor: THEME.screenBg,
    overflow: 'hidden',
  },

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 38,
    paddingBottom: 28,
  },

  // Card
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#122B1B',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: THEME.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },

  // Card Content
  cardTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: 6,
  },

  cardDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },

  ongoingBadge: {
    backgroundColor: '#DCFCE7',
  },

  ongoingText: {
    color: '#15803D',
  },

  closedBadge: {
    backgroundColor: '#FEE2E2',
  },

  closedText: {
    color: '#DC2626',
  },

  upcomingBadge: {
    backgroundColor: '#FEF3C7',
  },

  upcomingText: {
    color: '#B45309',
  },

  unavailableBadge: {
    backgroundColor: '#F3F4F6',
  },

  unavailableText: {
    color: '#6B7280',
  },

  // Dates
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.screenBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },

  dateItem: {
    flex: 1,
    alignItems: 'center',
  },

  dateLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },

  openDate: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: THEME.accent,
  },

  dateDivider: {
    width: 1,
    height: 28,
    backgroundColor: THEME.border,
    marginHorizontal: 8,
  },

  deadlineDate: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: THEME.deadlineText,
  },

  // Download Button
  downloadButton: {
    height: 48,
    width: '100%',
    backgroundColor: THEME.ctaBg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  downloadButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: THEME.ctaText,
  },

  // Loading
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: THEME.textSecondary,
    marginTop: 10,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },

  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: THEME.textPrimary,
  },

  emptySubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: THEME.textSecondary,
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ScholarshipScreen;

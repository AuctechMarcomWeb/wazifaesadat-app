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
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';

import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import { Body } from '../../components/Formparts';

import { getScholarshipDatesByCategory } from '../../api/scholarship';

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
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open download link.');
    }
  };
  // Fetch Junior and Senior scholarship dates
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [juniorResult, seniorResult] = await Promise.all([
        getScholarshipDatesByCategory('Junior', true),
        getScholarshipDatesByCategory('Senior', true),
      ]);

      const juniorList = juniorResult?.scholarshipDates || [];
      const seniorList = seniorResult?.scholarshipDates || [];

      const combinedData = [...juniorList, ...seniorList];

      setData(combinedData);
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
      month: 'long',
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

    if (status === 'Closed') {
      badgeStyle = styles.closedBadge;
      textStyle = styles.closedText;
    } else if (status === 'Upcoming') {
      badgeStyle = styles.upcomingBadge;
      textStyle = styles.upcomingText;
    } else if (status === 'Unavailable') {
      badgeStyle = styles.unavailableBadge;
      textStyle = styles.unavailableText;
    }

    return (
      <View style={[styles.statusBadge, badgeStyle]}>
        <View style={[styles.statusDot, textStyle]} />
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
        {/* Scholarship Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Icon
              name={
                item.category?.toLowerCase().includes('graduate')
                  ? 'bank'
                  : 'school'
              }
              size={29}
              color={colors.white}
            />
          </View>
        </View>

        {/* Scholarship Category */}
        <Text style={styles.cardTitle}>{item.category || 'Scholarship'}</Text>

        {/* Status Badge */}
        {renderStatusBadge(status)}

        {/* Description */}
        <Text style={styles.cardDescription}>
          {item.remarks || 'Scholarship registration details'}
        </Text>

        {/* Registration Dates */}
        <View style={styles.dateSection}>
          <View style={styles.dateRow}>
            <Text style={styles.openLabel}>Form Open:</Text>
            <Text style={styles.openDate}>{formatDate(item.startDate)}</Text>
          </View>

          <View style={styles.dateDivider} />

          <View style={styles.dateRow}>
            <Text style={styles.deadlineLabel}>Last Date:</Text>
            <Text style={styles.deadlineDate}>{formatDate(item.endDate)}</Text>
          </View>
        </View>

        {/* Download Form - Always Visible */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.downloadButton}
          onPress={() => openLink(downloadUrl)}
        >
          <Text style={styles.downloadButtonText}>Download Form</Text>

          <Icon name="download" size={19} color={colors.white} />
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
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
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
                    colors={[colors.primary]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="school-outline"
                      size={45}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.emptyTitle}>No Scholarship Found</Text>

                    <Text style={styles.emptySubtitle}>
                      No scholarship registration available.
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
    backgroundColor: '#F1F6F3',
  },

  body: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 50,
    paddingBottom: 25,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 23,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },

  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card Content
  cardTitle: {
    fontSize: 19,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    textAlign: 'center',
    marginBottom: 10,
  },

  cardDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },

  // Status Badge
  statusBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 15,
    gap: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
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
    backgroundColor: '#E5E7EB',
  },

  unavailableText: {
    color: '#6B7280',
  },

  // Dates
  dateSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },

  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },

  openLabel: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  openDate: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: colors.primary,
  },

  dateDivider: {
    width: 1,
    height: 17,
    backgroundColor: colors.neutral.border,
    marginHorizontal: 3,
  },

  deadlineLabel: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#DC3545',
  },

  deadlineDate: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#DC3545',
  },

  // Download Button
  downloadButton: {
    height: 51,
    width: '100%',
    backgroundColor: '#E6A817',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  downloadButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
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
    color: colors.textSecondary,
    marginTop: 10,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 55,
  },

  emptyTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ScholarshipScreen;

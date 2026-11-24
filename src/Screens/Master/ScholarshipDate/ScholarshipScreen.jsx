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

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';

import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';

import { Body, SearchField, Dropdown } from '../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  getScholarshipDates,
  getScholarshipDatesByCategory,
} from '../../api/scholarship';

import { useFocusEffect } from '@react-navigation/native';

const CATEGORIES = ['All', 'Junior', 'Senior', 'Graduate'];

const ScholarshipScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Fetch Scholarship Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      let result;

      if (category === 'All') {
        result = await getScholarshipDates(1, 50, search, true);
      } else {
        result = await getScholarshipDatesByCategory(category, true);
      }

      const rawList = Array.isArray(result?.scholarshipDates)
        ? result.scholarshipDates
        : Array.isArray(result?.data)
        ? result.data
        : [];

      setData(
        rawList.map(item => ({
          ...item,
          name: item.category || '',
        })),
      );
    } catch (error) {
      console.log('Scholarship Error:', error?.message || error);

      Alert.alert(
        'Error',
        error?.message || 'Failed to load scholarship dates',
      );
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Search Filter
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter(item => {
      if (
        q &&
        !`${item.category || ''} ${item.remarks || ''}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [data, search]);

  // Date Format
  const formatDate = dateString => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Check if deadline has passed
  const isDeadlinePassed = dateString => {
    if (!dateString) return false;

    const endDate = new Date(dateString);
    const today = new Date();

    // Set time to 00:00:00 for accurate date comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return today > endDate;
  };

  // Open External URL
  const openLink = async url => {
    if (!url) {
      Alert.alert('Information', 'This link is not available.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  // Registration Card
  const renderItem = ({ item, index }) => {
    const registrationUrl =
      item.registrationUrl || item.registrationLink || item.registerLink;

    const downloadUrl =
      item.downloadFormUrl || item.downloadUrl || item.formDownloadUrl;

    // Check if deadline has passed
    const deadlinePassed = isDeadlinePassed(item.endDate);

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
        <Text style={styles.cardTitle}>
          {item.category || 'Scholarship Form'}
        </Text>

        {/* Description */}
        <Text style={styles.cardDescription}>
          {item.remarks || 'Apply for scholarship registration'}
        </Text>

        {/* Closed Badge - If deadline passed */}
        {deadlinePassed && (
          <View style={styles.closedBadgeContainer}>
            <View style={styles.closedBadge}>
              <Icon
                name="lock"
                size={14}
                color="#DC3545"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.closedBadgeText}>Registration Closed</Text>
            </View>
          </View>
        )}

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

        {/* Register Button - Hidden if deadline passed */}
        {!deadlinePassed && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.registerButton}
            onPress={() => openLink(registrationUrl)}
          >
            <Text style={styles.registerButtonText}>Register Now</Text>

            <Icon name="open-in-new" size={18} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Download Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.downloadButton,
            deadlinePassed && styles.downloadButtonClosed,
          ]}
          onPress={() => openLink(downloadUrl)}
        >
          <Text
            style={[
              styles.downloadButtonText,
              deadlinePassed && styles.downloadButtonTextClosed,
            ]}
          >
            Download Form
          </Text>

          <Icon
            name="download"
            size={19}
            color={deadlinePassed ? '#999' : colors.white}
          />
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
            {/* Loading */}
            {loading && data.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />

                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={(item, index) =>
                  String(item._id || item.id || index)
                }
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
    marginTop: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },

  // Cards
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 50,
    paddingBottom: 25,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 23,
    paddingHorizontal: 10,
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
    marginBottom: 9,
  },

  cardDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 17,
  },

  // Closed Badge
  closedBadgeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },

  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },

  closedBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#DC3545',
  },

  // Dates
  dateSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
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

  // Register Button
  registerButton: {
    height: 51,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 10,
  },

  registerButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
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

  downloadButtonClosed: {
    backgroundColor: '#E8E8E8',
  },

  downloadButtonTextClosed: {
    color: '#999',
  },

  // Loading
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

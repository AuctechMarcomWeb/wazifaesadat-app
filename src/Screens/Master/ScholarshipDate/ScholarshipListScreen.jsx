import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';

import {
  Body,
  SearchField,
  Dropdown,
  GreenButton,
  Badge,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  getScholarshipDates,
  getScholarshipDatesByCategory,
  deleteScholarshipDate,
} from '../../../api/scholarship';

import { useFocusEffect } from '@react-navigation/native';

const CATEGORIES = ['All', 'Junior', 'Senior', 'Graduate'];

const ScholarshipListScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Load Scholarship Dates using the new API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      let result;
      
      if (category === 'All') {
        // Get all scholarships
        result = await getScholarshipDates(1, 50, search, true);
      } else {
        // Get by category
        result = await getScholarshipDatesByCategory(category, true);
      }

      console.log('Scholarship Data Response:', result);

      // Handle API response
      const rawList = Array.isArray(result?.scholarshipDates)
        ? result.scholarshipDates
        : Array.isArray(result?.data)
        ? result.data
        : [];

      // Map API fields
      const mapped = rawList.map(item => ({
        ...item,
        name: item.category || '',
        status: item.isActive ? 'Active' : 'Inactive',
      }));

      setData(mapped);
    } catch (error) {
      console.error('Error loading scholarship dates:', error?.message || error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to load scholarship dates',
      );
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  // Refresh whenever screen gets focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Delete Scholarship Date
  const handleDelete = item => {
    Alert.alert('Delete', `Delete "${item.category || item.name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const id = item._id || item.id;

            if (!id) {
              Alert.alert('Error', 'Scholarship Date ID not found.');
              return;
            }

            const result = await deleteScholarshipDate(id);

            const isSuccess =
              result?.success === true ||
              result?.statusCode === 200 ||
              result?.data?.success === true;

            if (isSuccess) {
              Alert.alert('Success', 'Deleted successfully.');
              await loadData();
            } else {
              Alert.alert('Error', result?.message || 'Delete failed');
            }
          } catch (error) {
            console.error('Delete Error:', error?.message || error);
            Alert.alert('Error', error?.message || 'Failed to delete');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  // Search and Category Filtering
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter(item => {
      if (q && !`${item.category || ''} ${item.remarks || ''}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data, search]);

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render Scholarship Card
  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.srNo}>#{index + 1}</Text>
          <Text style={styles.categoryText}>{item.category || 'N/A'}</Text>
        </View>
        <Badge text={item.isActive ? 'Active' : 'Inactive'} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.labelKey}>Start Date</Text>
          <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.labelKey}>End Date</Text>
          <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
        </View>
      </View>

      {item.remarks && (
        <View style={styles.remarksSection}>
          <Text style={styles.labelKey}>Remarks</Text>
          <Text style={styles.remarksText} numberOfLines={2}>
            {item.remarks}
          </Text>
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.editBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('AddScholarshipDateScreen', {
              scholarshipDateData: item,
            })
          }
        >
          <Icon
            name="pencil-outline"
            size={16}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          activeOpacity={0.8}
          onPress={() => handleDelete(item)}
        >
          <Icon
            name="trash-can-outline"
            size={16}
            color="#DC2626"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Scholarship Dates"
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
                keyExtractor={item => String(item._id || item.id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={loadData}
                  />
                }
                ListHeaderComponent={
                  <View style={styles.filterSection}>
                    <SearchField
                      placeholder="Search category, remarks..."
                      value={search}
                      onChangeText={setSearch}
                      style={styles.searchField}
                    />

                    <Dropdown
                      value={category}
                      options={CATEGORIES}
                      onSelect={setCategory}
                      style={styles.categoryDropdown}
                    />
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="calendar-blank" size={40} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>
                      No scholarship dates found
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search filters
                    </Text>
                  </View>
                }
              />
            )}

            {/* Add Button */}
            <View style={styles.bottomBar}>
              <GreenButton
                title="+ Add Scholarship Date"
                onPress={() => navigation.navigate('AddScholarshipDateScreen')}
                style={styles.addButton}
              />
            </View>
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

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  filterSection: {
    paddingHorizontal: wp('4%'),
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },

  searchField: {
    marginBottom: 0,
  },

  categoryDropdown: {
    marginBottom: 0,
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
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  srNo: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  categoryText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },

  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },

  infoItem: {
    flex: 1,
  },

  labelKey: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  dateValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },

  remarksSection: {
    marginBottom: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },

  remarksText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    lineHeight: 18,
  },

  actionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },

  editBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  deleteBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },

  bottomBar: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  addButton: {
    height: 48,
    width: '100%',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },

  emptySubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ScholarshipListScreen;

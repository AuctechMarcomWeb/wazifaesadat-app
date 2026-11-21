import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
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
  Label,
  SearchField,
  Dropdown,
  GreenButton,
  GrayButton,
  Badge,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  getScholarshipDates,
  deleteScholarshipDate,
} from '../../../api/masters';

import { useFocusEffect } from '@react-navigation/native';

const STATUS_OPTIONS = ['All Status', 'Active', 'Inactive'];

const ScholarshipDateMasterScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    status: 'Active',
  });

  // Draft Filters in Modal
  const [draftStatus, setDraftStatus] = useState('Active');

  // Load Scholarship Dates
  const loadData = useCallback(async (searchTerm = '', status = 'Active') => {
    try {
      setLoading(true);

      const result = await getScholarshipDates(1, 50, searchTerm);

      console.log('Scholarship Dates API Response:', result);

      // Handle API helper response and raw API response
      const payload = result?.data?.data || result?.data || result;

      const rawList = Array.isArray(payload?.scholarshipDates)
        ? payload.scholarshipDates
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(result?.scholarshipDates)
        ? result.scholarshipDates
        : [];

      // Map API fields
      const mapped = rawList.map(item => ({
        ...item,
        name: item.category || '',
        status: item.isActive ? 'Active' : 'Inactive',
      }));

      setData(mapped);
    } catch (error) {
      console.error('Scholarship Dates Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to load scholarship dates',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh whenever screen gets focus
  useFocusEffect(
    useCallback(() => {
      loadData(applied.search, applied.status);
    }, [loadData, applied.search, applied.status]),
  );

  // Open Filter
  const openFilter = () => {
    setDraftStatus(applied.status);
    setFilterOpen(true);
  };

  // Apply Filter
  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      status: draftStatus,
    }));

    setFilterOpen(false);
  };

  // Reset Filter
  const handleReset = () => {
    setDraftStatus('Active');
    setSearch('');

    setApplied({
      search: '',
      status: 'Active',
    });

    setFilterOpen(false);
  };

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
              result?.data?.success === true ||
              result?.data?.statusCode === 200;

            if (isSuccess) {
              Alert.alert('Success', 'Scholarship Date deleted successfully.');

              await loadData(applied.search, applied.status);
            } else {
              Alert.alert(
                'Error',
                result?.message || result?.data?.message || 'Delete failed',
              );
            }
          } catch (error) {
            console.error(
              'Delete Scholarship Date Error:',
              error?.response?.data || error,
            );

            Alert.alert(
              'Error',
              error?.response?.data?.message ||
                error?.message ||
                'Failed to delete scholarship date.',
            );
          }
        },
        style: 'destructive',
      },
    ]);
  };

  // Search and Status Filtering
  const filteredData = useMemo(() => {
    const q = applied.search.trim().toLowerCase();

    return data.filter(item => {
      if (applied.status !== 'All Status' && item.status !== applied.status) {
        return false;
      }

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
  }, [data, applied]);

  // Render Scholarship Date Card
  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{index + 1}</Text>

        <Badge text={item.isActive ? 'Active' : 'Inactive'} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Category</Text>

          <Text style={styles.valTextBold}>{item.category || '-'}</Text>
        </View>

        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Remarks</Text>

          <Text style={styles.valText}>{item.remarks || '-'}</Text>
        </View>
      </View>

      <View style={[styles.infoGrid, { marginTop: 12 }]}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Start Date</Text>

          <Text style={styles.valTextPrimary}>
            {item.startDate
              ? item.startDate.split('T')[0].split('-').reverse().join('/')
              : '-'}
          </Text>
        </View>

        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>End Date</Text>

          <Text style={styles.valTextPrimary}>
            {item.endDate
              ? item.endDate.split('T')[0].split('-').reverse().join('/')
              : '-'}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionBtn}
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

          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          activeOpacity={0.8}
          onPress={() => handleDelete(item)}
        >
          <Icon
            name="trash-can-outline"
            size={16}
            color="#DC2626"
            style={{ marginRight: 6 }}
          />

          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>
            Delete
          </Text>
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
                    onRefresh={() => loadData(applied.search, applied.status)}
                  />
                }
                ListHeaderComponent={
                  <View>
                    {/* Search Field & Filter Icon Row */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search scholarship date..."
                          value={search}
                          onChangeText={text => {
                            setSearch(text);

                            setApplied(prev => ({
                              ...prev,
                              search: text,
                            }));
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
                    <Icon name="calendar-clock" size={40} color="#9CA3AF" />

                    <Text style={styles.emptyTitle}>
                      No scholarship dates found
                    </Text>

                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or filters.
                    </Text>
                  </View>
                }
              />
            )}

            {/* Bottom Button Bar */}
            <View style={styles.bottomBar}>
              <GreenButton
                title="+ Add Scholarship Date"
                onPress={() => navigation.navigate('AddScholarshipDateScreen')}
                style={styles.addButtonBar}
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
                <Text style={styles.filterTitle}>Filter Scholarship Dates</Text>

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

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
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

  actionContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  actionBtn: {
    flex: 1,
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

  deleteBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },

  actionBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  bottomBar: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  addButtonBar: {
    height: 48,
    width: '100%',
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

export default ScholarshipDateMasterScreen;

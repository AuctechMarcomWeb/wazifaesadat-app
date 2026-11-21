import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

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
} from '../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import {
  getScholarshipRates,
  deleteScholarshipRate,
} from '../../../api/masters';

const RateOfScholarshipMasterScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter states
  const [applied, setApplied] = useState({
    search: '',
    isActive: true,
  });
  const [draftIsActive, setDraftIsActive] = useState(true);

  // Load scholarship rates with filters
  const loadData = useCallback(
    async (pageNum = 1, searchTerm = '', isActive = true) => {
      try {
        setLoading(true);
        const result = await getScholarshipRates(
          pageNum,
          50,
          searchTerm.trim(),
        );

        const list = Array.isArray(result?.data?.data)
          ? result.data.data
          : Array.isArray(result?.data)
          ? result.data
          : [];

        const filtered = list.filter(item => item.isActive === isActive);
        setData(filtered);
        setTotal(result?.data?.total || result?.total || filtered.length);
        setPage(result?.data?.currentPage || pageNum);
      } catch (error) {
        Alert.alert(
          'Error',
          error.message || 'Failed to load scholarship rates',
        );
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounce search so API doesn't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(prev => (prev.search === search ? prev : { ...prev, search }));
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Single effect when applied filters change
  useEffect(() => {
    loadData(1, applied.search, applied.isActive);
  }, [applied, loadData]);

  // Refresh when returning to this screen after add/edit
  useFocusEffect(
    useCallback(() => {
      loadData(1, applied.search, applied.isActive);
    }, [applied.search, applied.isActive, loadData]),
  );

  // Handle search
  const handleSearch = text => {
    setSearch(text);
  };

  const openFilter = () => {
    setDraftIsActive(applied.isActive);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      isActive: draftIsActive,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    setSearch('');
    setDraftIsActive(true);
    setApplied({
      search: '',
      isActive: true,
    });
    setFilterOpen(false);
  };

  // Handle delete
  const handleDelete = item => {
    Alert.alert('Delete', `Delete "${item.name}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const result = await deleteScholarshipRate(item.id || item._id);
            if (result?.success || result?.statusCode === 200) {
              Alert.alert('Success', 'Deleted');
              loadData(1, applied.search, applied.isActive);
            } else {
              Alert.alert('Error', result?.message || 'Delete failed');
            }
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{(page - 1) * 50 + index + 1}</Text>
        <Text style={styles.nameText}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.isActive ? '#065F46' : '#991B1B' },
            ]}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Monthly:{' '}
          <Text style={styles.metaBold}>₹{item.ratePerMonth ?? 0}</Text>
        </Text>
        <Text style={styles.metaText}>
          Yearly:{' '}
          <Text style={styles.metaBold}>₹{item.amountPerYear ?? 0}</Text>
        </Text>
        {item.courseType ? (
          <Text style={styles.metaTag}>{item.courseType}</Text>
        ) : null}
      </View>

      <View style={styles.divider} />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('AddRateOfScholarshipScreen', {
              scholarshipRateData: item,
            })
          }
        >
          <Icon
            name="pencil-outline"
            size={16}
            color="#047857"
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
          <Text style={[styles.actionBtnText, styles.deleteBtnText]}>
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
          title="Scholarship Rates"
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
                data={data}
                keyExtractor={item => String(item.id || item._id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={() =>
                      loadData(1, applied.search, applied.isActive)
                    }
                  />
                }
                ListHeaderComponent={
                  <View>
                    {/* Search & Filter */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search scholarship rate..."
                          value={search}
                          onChangeText={handleSearch}
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
                    <Icon name="briefcase-outline" size={40} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>
                      No scholarship rates found
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  loading && data.length > 0 ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : null
                }
              />
            )}

            {/* Bottom Add Button */}
            <View style={styles.bottomBar}>
              <GreenButton
                title="+ Add Scholarship Rate"
                onPress={() =>
                  navigation.navigate('AddRateOfScholarshipScreen')
                }
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
                <Text style={styles.filterTitle}>Filter Scholarship Rates</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Status" />
              <Dropdown
                value={draftIsActive ? 'Active' : 'Inactive'}
                options={['Active', 'Inactive']}
                onSelect={val => setDraftIsActive(val === 'Active')}
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
    marginTop: 25,
    marginBottom: 14,
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
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  srNo: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  nameText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    flex: 1,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
  },
  metaBold: {
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  metaTag: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
    backgroundColor: '#E6F7EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F7EE',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#A7E8C5',
  },
  deleteBtn: {
    backgroundColor: '#FDECEC',
    borderColor: '#F8C4C4',
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#047857',
  },
  deleteBtnText: {
    color: '#DC2626',
  },
  bottomBar: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButtonBar: {
    height: 48,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 8,
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

export default RateOfScholarshipMasterScreen;

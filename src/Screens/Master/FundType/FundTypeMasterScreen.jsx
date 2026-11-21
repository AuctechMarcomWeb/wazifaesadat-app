import React, { useState, useCallback } from 'react';
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

import { getFundTypes, deleteFundType } from '../../../api/masters';

const FundTypeMasterScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const [applied, setApplied] = useState({
    search: '',
    isActive: true,
  });

  const [draftIsActive, setDraftIsActive] = useState(true);

  // Load Fund Types
  const loadFundTypes = useCallback(
    async (pageNum = 1, searchTerm = '', isActive = true) => {
      try {
        setLoading(true);

        const result = await getFundTypes(pageNum, 50, searchTerm);

        console.log('Fund Types API Response:', result);

        // API helper may return the unwrapped data object
        const rawList = Array.isArray(result?.fundTypes)
          ? result.fundTypes
          : Array.isArray(result?.data?.fundTypes)
          ? result.data.fundTypes
          : Array.isArray(result?.data)
          ? result.data
          : [];

        // Filter Active / Inactive
        const filtered = rawList.filter(item => item.isActive === isActive);

        setData(filtered);

        setTotal(
          result?.totalFundTypes ??
            result?.total ??
            result?.data?.totalFundTypes ??
            0,
        );

        setPage(pageNum);
      } catch (error) {
        console.error('Load Fund Types Error:', error?.response?.data || error);

        Alert.alert(
          'Error',
          error?.response?.data?.message ||
            error?.message ||
            'Failed to load fund types',
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Refresh whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFundTypes(1, applied.search, applied.isActive);
    }, [loadFundTypes, applied.search, applied.isActive]),
  );

  // Search
  const handleSearch = text => {
    setSearch(text);

    setApplied(prev => ({
      ...prev,
      search: text,
    }));
  };

  // Open Filter
  const openFilter = () => {
    setDraftIsActive(applied.isActive);
    setFilterOpen(true);
  };

  // Apply Filter
  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      isActive: draftIsActive,
    }));

    setFilterOpen(false);
  };

  // Reset Filter
  const handleReset = () => {
    setSearch('');
    setDraftIsActive(true);

    setApplied({
      search: '',
      isActive: true,
    });

    setFilterOpen(false);
  };

  // Delete Fund Type
  const handleDelete = item => {
    Alert.alert('Delete', `Delete "${item.title || item.name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const id = item._id || item.id;

            if (!id) {
              Alert.alert('Error', 'Fund Type ID not found.');
              return;
            }

            const result = await deleteFundType(id);

            const isSuccess =
              result?.success === true ||
              result?.statusCode === 200 ||
              result?.data?.success === true ||
              result?.data?.statusCode === 200;

            if (isSuccess) {
              Alert.alert('Success', 'Fund Type deleted successfully.');

              loadFundTypes(1, applied.search, applied.isActive);
            } else {
              Alert.alert(
                'Error',
                result?.message || result?.data?.message || 'Delete failed.',
              );
            }
          } catch (error) {
            console.error(
              'Delete Fund Type Error:',
              error?.response?.data || error,
            );

            Alert.alert(
              'Error',
              error?.response?.data?.message ||
                error?.message ||
                'Failed to delete fund type.',
            );
          }
        },
      },
    ]);
  };

  // Render Fund Type Card
  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{(page - 1) * 50 + index + 1}</Text>

        {/* API field is title, not name */}
        <Text style={styles.nameText}>{item.title || item.name || '-'}</Text>

        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2',
          }}
        >
          <Text
            style={{
              fontSize: FontSize.sm,
              fontFamily: FontFamily.semiBold,
              color: item.isActive ? '#065F46' : '#991B1B',
            }}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('AddFundTypeScreen', {
              fundTypeData: item,
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
          title="Fund Types"
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
                keyExtractor={item => String(item._id || item.id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={() =>
                      loadFundTypes(1, applied.search, applied.isActive)
                    }
                  />
                }
                ListHeaderComponent={
                  <View>
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search fund type..."
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
                    <Icon name="folder-outline" size={40} color="#9CA3AF" />

                    <Text style={styles.emptyTitle}>No fund types found</Text>
                  </View>
                }
                ListFooterComponent={
                  loading && data.length > 0 ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : null
                }
              />
            )}

            <View style={styles.bottomBar}>
              <GreenButton
                title="+ Add Fund Type"
                onPress={() => navigation.navigate('AddFundTypeScreen')}
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
                <Text style={styles.filterTitle}>Filter Fund Types</Text>

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
    marginBottom: 8,
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

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
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

export default FundTypeMasterScreen;

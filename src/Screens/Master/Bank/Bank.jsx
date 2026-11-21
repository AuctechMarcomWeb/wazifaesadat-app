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
  shared,
} from '../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { getBanks, deleteBank } from '../../../api/masters';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_OPTIONS = ['All Status', 'Active', 'Suspended', 'Expired'];

const BankMasterScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Applied Filters
  const [applied, setApplied] = useState({
    search: '',
    status: 'Active',
  });

  // Draft Filters in Modal
  const [draftStatus, setDraftStatus] = useState('Active');

  // Load banks on mount and when filters change
  useEffect(() => {
    loadBanks();
  }, [applied]);

  const loadBanks = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getBanks(1, 50, applied.search, undefined);

      const rawList = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.banks)
        ? result.banks
        : Array.isArray(result?.data?.banks)
        ? result.data.banks
        : [];

      // Status filter
      const filtered = rawList.filter(item => {
        if (applied.status === 'All Status') return true;

        if (applied.status === 'Active') {
          return item.isActive === true;
        }

        if (applied.status === 'Inactive') {
          return item.isActive === false;
        }

        return item.status === applied.status;
      });

      setData(filtered);
      setPage(1);
    } catch (error) {
      console.error('Bank Load Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error.message ||
          'Failed to load banks',
      );
    } finally {
      setLoading(false);
    }
  }, [applied.search, applied.status]);

  useFocusEffect(
    useCallback(() => {
      loadBanks();
    }, [loadBanks]),
  );
  const openFilter = () => {
    setDraftStatus(applied.status);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      status: draftStatus,
    }));
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftStatus('Active');
    setSearch('');
    setApplied({
      search: '',
      status: 'Active',
    });
  };

  const handleDelete = item => {
    Alert.alert('Delete', `Delete "${item.name}"?`, [
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
              Alert.alert('Error', 'Bank ID not found.');
              return;
            }

            const result = await deleteBank(id);

            const isSuccess =
              result?.success === true ||
              result?.statusCode === 200 ||
              result?.statusCode === 201 ||
              result?.data?.success === true;

            if (isSuccess) {
              Alert.alert('Success', 'Bank deleted successfully!');

              loadBanks();
            } else {
              Alert.alert('Error', result?.message || 'Failed to delete bank.');
            }
          } catch (error) {
            console.error('Bank Delete Error:', error?.response?.data || error);

            Alert.alert(
              'Error',
              error?.response?.data?.message ||
                error.message ||
                'Failed to delete bank.',
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{(page - 1) * 50 + index + 1}</Text>
        <Text style={styles.idText}>A/C: {item.accountNumber}</Text>
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

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Bank Name</Text>
          <Text style={styles.valTextBold}>{item.name}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>IFSC Number</Text>
          <Text style={styles.valTextPrimary}>{item.ifsc}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Branch Address</Text>
          <Text style={styles.valText} numberOfLines={2}>
            {item.branchAddress}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('AddBankScreen', { bankData: item })
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
          title="Bank Master"
          onBack={() => navigation && navigation.goBack()}
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
                keyExtractor={item => item._id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={loadBanks} />
                }
                ListHeaderComponent={
                  <View>
                    {/* Search Field & Filter Icon Row */}
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search bank name, IFSC..."
                          value={search}
                          onChangeText={text => {
                            setSearch(text);
                            setApplied(prev => ({ ...prev, search: text }));
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
                    <Icon name="bank-outline" size={40} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No banks found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting your search or filters.
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

            {/* Bottom Button Bar for Adding New Bank */}
            <View style={styles.bottomBar}>
              <GreenButton
                title="+ Add Bank"
                onPress={() => navigation.navigate('AddBankScreen')}
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
                <Text style={styles.filterTitle}>Filter Banks</Text>
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
  idText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
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
    marginTop: 8,
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

export default BankMasterScreen;

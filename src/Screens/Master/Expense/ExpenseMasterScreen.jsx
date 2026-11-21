import React, { useState, useCallback, useEffect } from 'react';
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

import { getExpenses, deleteExpense } from '../../../api/masters';

const STATUS_OPTIONS = ['Active', 'Suspended', 'Expired'];

const getExpenseStatus = item => {
  if (item?.status) {
    return item.status;
  }

  return item?.isActive === false ? 'Inactive' : 'Active';
};

// Extract expense list from different API response structures
const extractExpenseList = response => {
  let current = response;

  for (let i = 0; i < 6; i++) {
    if (!current || typeof current !== 'object') {
      break;
    }

    if (Array.isArray(current)) {
      return current;
    }

    if (Array.isArray(current.expenses)) {
      return current.expenses;
    }

    if (Array.isArray(current.expences)) {
      return current.expences;
    }

    current = current.data;
  }

  return [];
};

const extractPayload = response => {
  let current = response;

  for (let i = 0; i < 6; i++) {
    if (!current || typeof current !== 'object') {
      break;
    }

    if (current.currentPage != null || current.totalPages != null) {
      return current;
    }

    current = current.data;
  }

  return {};
};

const ExpenseMasterScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [applied, setApplied] = useState({
    search: '',
    status: 'Active',
  });

  const [draftStatus, setDraftStatus] = useState('Active');

  // Fetch Expenses
  const loadExpenses = useCallback(
    async (pageNum = 1, searchTerm = '', statusFilter = 'Active') => {
      try {
        setLoading(true);

        const result = await getExpenses(pageNum, 50, searchTerm.trim());

        console.log('Expenses API Response:', result);

        const rawList = extractExpenseList(result);
        const payload = extractPayload(result);

        console.log('Expenses List:', rawList);

        // Filter using status field from AddExpenseScreen
        const filtered = rawList.filter(item => {
          return getExpenseStatus(item) === statusFilter;
        });

        setData(filtered);
        setPage(payload?.currentPage || pageNum);
      } catch (error) {
        console.error('Expenses API Error:', error?.response?.data || error);

        Alert.alert(
          'Error',
          error?.response?.data?.message ||
            error?.message ||
            'Failed to load expenses',
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(prev => (prev.search === search ? prev : { ...prev, search }));
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch only when screen is focused or filters change
  useFocusEffect(
    useCallback(() => {
      loadExpenses(1, applied.search, applied.status);
    }, [applied.search, applied.status, loadExpenses]),
  );

  const handleSearch = text => {
    setSearch(text);
  };

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
    setSearch('');
    setDraftStatus('Active');

    setApplied({
      search: '',
      status: 'Active',
    });

    setFilterOpen(false);
  };

  // Delete Expense
  const handleDelete = item => {
    const label = item.title || item.name || 'Expense';
    const expenseId = item._id || item.id;

    if (!expenseId) {
      Alert.alert('Error', 'Expense ID not found.');
      return;
    }

    Alert.alert('Delete', `Delete "${label}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(expenseId);

            Alert.alert('Success', 'Expense deleted successfully.');

            loadExpenses(1, applied.search, applied.status);
          } catch (error) {
            console.error(
              'Delete Expense Error:',
              error?.response?.data || error,
            );

            Alert.alert(
              'Error',
              error?.response?.data?.message ||
                error?.message ||
                'Failed to delete expense.',
            );
          }
        },
      },
    ]);
  };

  // Render Expense Card
  const renderItem = ({ item, index }) => {
    const status = getExpenseStatus(item);
    const isActive = status === 'Active';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.srNo}>{(page - 1) * 50 + index + 1}</Text>

          <Text style={styles.nameText}>{item.title || item.name || '-'}</Text>

          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              backgroundColor: isActive
                ? '#D1FAE5'
                : status === 'Suspended'
                ? '#FEF3C7'
                : '#FEE2E2',
            }}
          >
            <Text
              style={{
                fontSize: FontSize.sm,
                fontFamily: FontFamily.semiBold,
                color: isActive
                  ? '#065F46'
                  : status === 'Suspended'
                  ? '#92400E'
                  : '#991B1B',
              }}
            >
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('AddExpenseScreen', {
                expenseData: item,
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
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Expenses"
          onBack={() => navigation?.goBack()}
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
                keyExtractor={(item, index) =>
                  String(item._id || item.id || index)
                }
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={() =>
                      loadExpenses(1, applied.search, applied.status)
                    }
                  />
                }
                ListHeaderComponent={
                  <View>
                    <View style={styles.searchFilterContainer}>
                      <View style={styles.searchFlex}>
                        <SearchField
                          placeholder="Search expense..."
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
                    <Icon name="cash-remove" size={40} color="#9CA3AF" />

                    <Text style={styles.emptyTitle}>No expenses found</Text>
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
                title="+ Add Expense"
                onPress={() => navigation.navigate('AddExpenseScreen')}
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
                <Text style={styles.filterTitle}>Filter Expenses</Text>

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

export default ExpenseMasterScreen;

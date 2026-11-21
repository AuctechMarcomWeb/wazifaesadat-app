import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../../themes/typography';

import AppLayout from '../../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  SearchField,
  Dropdown,
  GreenButton,
  GrayButton,
  Badge,
} from '../../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  fetchWazifaApplications,
  fetchSessions,
  deleteWazifaApplication,
  updateWazifaStatus,
} from '../../../../../api/wazifa';
import UpdateStatusModal from './UpdateStatusModal';

const STATUSES = [
  'All Status',
  'Pending',
  'Shortlisted',
  'Approved',
  'Rejected',
];
const FORM_TYPES = ['All Types', 'New', 'Renewal'];

const WazifaApplicationsScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Update Status Modal State
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedApplicationData, setSelectedApplicationData] = useState(null);

  const [applied, setApplied] = useState({
    search: '',
    status: 'All Status',
    formType: 'All Types',
    courseType: 'All',
    session: 'All Sessions',
  });

  const [draftStatus, setDraftStatus] = useState('All Status');
  const [draftFormType, setDraftFormType] = useState('All Types');
  const [draftCourseType, setDraftCourseType] = useState('All');
  const [draftSession, setDraftSession] = useState('All Sessions');

  // Map to store session name -> _id mapping
  const sessionMap = useMemo(() => {
    const map = { 'All Sessions': 'All Sessions' };
    sessions.forEach(s => {
      map[s.name] = s._id;
    });
    return map;
  }, [sessions]);

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const result = await fetchSessions();
        if (result.success && result.sessions) {
          setSessions(result.sessions);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };
    loadSessions();
  }, []);

  // Load applications
  const loadApplications = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await fetchWazifaApplications({
          page: pageNum,
          limit: pageSize,
          search: applied.search,
          status: applied.status !== 'All Status' ? applied.status : '',
          formType: applied.formType !== 'All Types' ? applied.formType : '',
          courseType: applied.courseType !== 'All' ? applied.courseType : '',
          session: applied.session !== 'All Sessions' ? applied.session : '',
        });

        if (result.success) {
          const newData = result.applications || [];

          if (pageNum === 1) {
            setApplications(newData);
          } else {
            setApplications(prev => [...prev, ...newData]);
          }

          setPage(pageNum);
          setHasMore(newData.length === pageSize);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
        Alert.alert('Error', 'Failed to load applications');
      } finally {
        if (pageNum === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [applied, pageSize],
  );

  // Load applications when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadApplications(1);
  }, [applied, loadApplications]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadApplications(page + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadApplications(1, true);
  };

  const openFilter = () => {
    setDraftStatus(applied.status);
    setDraftFormType(applied.formType);
    setDraftCourseType(applied.courseType);
    setDraftSession(applied.session);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setApplied(prev => ({
      ...prev,
      status: draftStatus,
      formType: draftFormType,
      courseType: draftCourseType,
      session:
        draftSession === 'All Sessions'
          ? 'All Sessions'
          : sessionMap[draftSession],
    }));
    setHasMore(true);
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraftStatus('All Status');
    setDraftFormType('All Types');
    setDraftCourseType('All');
    setDraftSession('All Sessions');
    setSearch('');
    setApplied({
      search: '',
      status: 'All Status',
      formType: 'All Types',
      courseType: 'All',
      session: 'All Sessions',
    });
    setPage(1);
    setHasMore(true);
  };

  const hasActiveFilters =
    applied.status !== 'All Status' ||
    applied.formType !== 'All Types' ||
    applied.courseType !== 'All' ||
    applied.session !== 'All Sessions';

  const handleDelete = async id => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this application?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const result = await deleteWazifaApplication(id);
              if (result.success) {
                Alert.alert('Success', 'Application deleted successfully');
                setPage(1);
                setHasMore(true);
                loadApplications(1);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete application');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const handleUpdateStatus = item => {
    setSelectedApplicationId(item._id);
    setSelectedApplicationData(item);
    setUpdateStatusModalOpen(true);
  };

  const filteredData = useMemo(() => {
    return applications;
  }, [applications]);

  const renderItem = ({ item, index }) => (
    <View style={styles.appCard}>
      <View style={styles.cardTopRow}>
        <Text style={styles.srNo}>{(page - 1) * pageSize + index + 1}</Text>
        <Text style={styles.portalIdText}>Portal ID: {item.acountNo}</Text>
        <Badge text={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Student Name</Text>
          <Text style={styles.valTextBold}>{item.studentName}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Wazifa No.</Text>
          <Text style={styles.valTextPrimary}>{item.applicationNo}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Course / Level</Text>
          <Text style={styles.valText}>
            {item.courseOfStudy} ({item.courseType})
          </Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Form Type</Text>
          <Text style={styles.valText}>{item.formType}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Institution</Text>
          <Text style={styles.valText}>{item.institutionName}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Annual Fees</Text>
          <Text style={styles.valFees}>
            Rs {Number(item.totalAnnualFees).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.labelKey}>Session</Text>
          <Text style={styles.valText}>{item.sessionName}</Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.labelKey}>Applied On</Text>
          <Text style={styles.valText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsRow}>
        {/* Update Status Button */}
        <TouchableOpacity
          style={styles.updateStatusBtn}
          activeOpacity={0.8}
          onPress={() => handleUpdateStatus(item)}
        >
          <Icon
            name="pencil-outline"
            size={14}
            color={colors.primary}
            style={styles.actionBtnIcon}
          />
          <Text style={styles.updateStatusBtnText}>Update Status</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteBtnSmall}
          activeOpacity={0.8}
          onPress={() => handleDelete(item._id)}
        >
          <Icon
            name="trash-can-outline"
            size={14}
            color="#DC2626"
            style={styles.actionBtnIcon}
          />
          <Text style={styles.deleteSmallBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Wazifa Applications"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <FlatList
              data={filteredData}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.2}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              ListHeaderComponent={
                <View>
                  {/* Search Field & Filter Icon Row */}
                  <View style={styles.searchFilterContainer}>
                    <View style={styles.searchFlex}>
                      <SearchField
                        placeholder="Search student, Portal ID, Wazifa No..."
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
                      {hasActiveFilters && (
                        <View style={styles.filterBadgeDot} />
                      )}
                    </TouchableOpacity>
                  </View>

          
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="file-search-outline" size={40} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No applications found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your search or filters.
                  </Text>
                </View>
              }
            />
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
                <Text style={styles.filterTitle}>Filter Applications</Text>
                <TouchableOpacity onPress={() => setFilterOpen(false)}>
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Label text="Status" />
              <Dropdown
                value={draftStatus}
                options={STATUSES}
                onSelect={setDraftStatus}
                style={styles.modalGap}
              />

              <Label text="Form Type" />
              <Dropdown
                value={draftFormType}
                options={FORM_TYPES}
                onSelect={setDraftFormType}
                style={styles.modalGap}
              />

              <Label text="Session" />
              <Dropdown
                value={draftSession}
                options={[
                  'All Sessions',
                  ...sessions.map(s => s.name || s._id),
                ]}
                onSelect={setDraftSession}
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

        {/* Update Status Modal */}
        <UpdateStatusModal
          visible={updateStatusModalOpen}
          onClose={() => {
            setUpdateStatusModalOpen(false);
            setSelectedApplicationId(null);
            setSelectedApplicationData(null);
          }}
          applicationId={selectedApplicationId}
          applicationData={selectedApplicationData}
          onSuccess={() => {
            setUpdateStatusModalOpen(false);
            setSelectedApplicationId(null);
            setSelectedApplicationData(null);
            setPage(1);
            setHasMore(true);
            loadApplications(1);
          }}
        />
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
    marginTop: 15,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
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

  filterBadgeDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },

  loadingMoreContainer: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 2,
  },
  statVal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 2,
  },
  statLbl: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 20,
  },
  appCard: {
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
  portalIdText: {
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
    fontSize: 10,
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
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  valText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  valFees: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },
updateStatusBtn: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primaryLight,
  borderRadius: 8,
  paddingVertical: 13,
  marginTop: 8,
  borderWidth: 1,
  borderColor: '#C6F6D5',
},

updateStatusBtnText: {
  fontSize: FontSize.sm,
  fontFamily: FontFamily.bold,
  color: colors.primary,
},

actionButtonsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginTop: 8,
},

actionBtnIcon: {
  marginRight: 6,
},

deleteBtnSmall: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FEF2F2',
  borderRadius: 8,
  paddingVertical: 13,
  marginTop: 8,
  borderWidth: 1,
  borderColor: '#FECACA',
},

deleteSmallBtnText: {
  fontSize: FontSize.sm,
  fontFamily: FontFamily.bold,
  color: '#DC2626',
},

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteIcon: {
    marginRight: 6,
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
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

  bottom: {
    paddingHorizontal: wp('4%'),
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  addButton: {
    height: 50,
  },

  // Filter Modal Styles
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
    marginTop: 14,
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

export default WazifaApplicationsScreen;

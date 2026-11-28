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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';

import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  TextField,
  SearchField,
  GreenButton,
  GrayButton,
  formatDate as formatSlashDate,
  shared,
} from '../../components/Formparts';

import {
  getScholarshipDates,
  wazifaLogin,
  getMyScholarshipForm,
} from '../../api/scholarship';

const THEME = {
  screenBg: '#F7FAF3',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF6E8',
  border: '#E2ECE0',
  textPrimary: colors.TitleColor,
  textSecondary: colors.textSecondary,
  accent: colors.primary,
  accentSoft: '#E5F2E7',
  ctaBg: colors.primary,
  ctaText: '#FFFFFF',
  deadlineText: '#C62828',
  deadlineBg: '#FDECEC',
};

const ScholarshipScreen = ({ navigation }) => {
  // ================================================================
  // STATES
  // ================================================================

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Login Bottom Sheet Modal
  const [loginModal, setLoginModal] = useState(false);
  const [contactNo, setContactNo] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ================================================================
  // LOAD SCHOLARSHIP DATES
  // ================================================================

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getScholarshipDates(1, 50, '', true);

      const list = Array.isArray(result)
        ? result
        : result?.scholarshipDates || result?.data || [];

      setData(list);
    } catch (error) {
      console.log('Scholarship Error:', error?.response?.data || error.message);

      Alert.alert('Error', 'Failed to load scholarship dates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // ================================================================
  // SCHOLARSHIP STATUS
  // ================================================================

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

    if (today > endDate) return 'Closed';
    if (today < startDate) return 'Upcoming';

    return 'Ongoing';
  };

  // ================================================================
  // DATE FORMAT
  // ================================================================

  const formatDate = dateString => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // ================================================================
  // SEARCH
  // ================================================================

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data;

    return data.filter(item => {
      const searchableText = `
        ${item.category || ''}
        ${item.remarks || ''}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [data, search]);

  // ================================================================
  // OPEN / CLOSE LOGIN MODAL
  // ================================================================

  const openLoginModal = useCallback(() => {
    setContactNo('');
    setDateOfBirth(null);
    setShowDobPicker(false);
    setLoginModal(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    if (loginLoading) return;
    setShowDobPicker(false);
    setLoginModal(false);
  }, [loginLoading]);

  // ================================================================
  // DOB DATE PICKER HANDLER
  // ================================================================

  const handleDobChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
      if (event?.type === 'dismissed' || !selectedDate) return;
    }

    if (selectedDate) {
      const today = new Date();
      if (selectedDate > today) {
        Alert.alert(
          'Invalid Date of Birth',
          'Date of Birth future mein nahi ho sakti.',
        );
        return;
      }
      setDateOfBirth(selectedDate);
    }
  };

  // ================================================================
  // WAZIFA LOGIN + MY FORM API
  // ================================================================

  const handleLogin = async () => {
    try {
      if (!/^\d{10}$/.test(contactNo.trim())) {
        Alert.alert(
          'Invalid Contact Number',
          'Please enter a valid 10 digit mobile number.',
        );
        return;
      }

      if (!dateOfBirth || isNaN(dateOfBirth.getTime())) {
        Alert.alert(
          'Date of Birth Required',
          'Please select your Date of Birth.',
        );
        return;
      }

      const today = new Date();
      if (dateOfBirth > today) {
        Alert.alert(
          'Invalid Date of Birth',
          'Date of Birth future mein nahi ho sakti.',
        );
        return;
      }

      const dobISO = new Date(
        Date.UTC(
          dateOfBirth.getFullYear(),
          dateOfBirth.getMonth(),
          dateOfBirth.getDate(),
        ),
      ).toISOString();

      setLoginLoading(true);

      // STEP 1: LOGIN API
      const loginResponse = await wazifaLogin({
        contactNo: contactNo.trim(),
        dateOfBirth: dobISO,
      });

      if (!loginResponse?.success || !loginResponse?.data?.authToken) {
        throw new Error(loginResponse?.message || 'Login failed.');
      }

      const token = loginResponse.data.authToken;

      // STEP 2: FETCH MY SCHOLARSHIP FORM
      console.log('Fetching form with token and accountNo:', {
        token: token.substring(0, 20) + '...',
        accountNo: loginResponse.data.user.acountNo,
      });
      
      const formResponse = await getMyScholarshipForm(
        token,
        loginResponse.data.user.acountNo,
      );

      console.log('Form Response:', formResponse);

      if (!formResponse?.success || !formResponse?.data) {
        throw new Error(formResponse?.message || 'Scholarship form not found.');
      }

      // STEP 3: CLOSE MODAL & NAVIGATE TO FORM SCREEN
      setShowDobPicker(false);
      setLoginModal(false);

      navigation.navigate('ScholarshipFormView', {
        data: formResponse.data,
        authToken: token,
      });
    } catch (error) {
      console.log(
        'Wazifa Login Error:',
        error?.response?.data || error.message,
      );

      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ||
          error.message ||
          'Something went wrong.',
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ================================================================
  // STATUS BADGE
  // ================================================================

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

  // ================================================================
  // SCHOLARSHIP CARD
  // ================================================================

  const renderItem = ({ item }) => {
    const status = getScholarshipStatus(item);

    return (
      <View style={styles.card}>
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

        <Text style={styles.cardTitle}>{item.category || 'Scholarship'}</Text>

        <Text style={styles.cardDescription}>
          {item.remarks || 'Scholarship registration details'}
        </Text>

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

        {/* DOWNLOAD FORM - OPEN LOGIN BOTTOM SHEET */}
        <GreenButton
          title="Download Form"
          icon="file-download-outline"
          onPress={openLoginModal}
          style={styles.downloadButton}
        />
      </View>
    );
  };

  // ================================================================
  // LOGIN BOTTOM SHEET MODAL
  // ================================================================

  const renderLoginModal = () => (
    <Modal
      visible={loginModal}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeLoginModal}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={closeLoginModal}
        />

        <View style={styles.bottomSheetCard}>
          <View style={styles.sheetHandle} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIcon}>
              <Icon
                name="file-document-outline"
                size={26}
                color={colors.primary}
              />
            </View>

            <TouchableOpacity
              onPress={closeLoginModal}
              disabled={loginLoading}
              style={styles.closeButton}
            >
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>Download Scholarship Form</Text>

          <Text style={styles.modalSubtitle}>
            Please enter your registered mobile number and select your date of
            birth to access your scholarship form.
          </Text>

          {/* Contact Number */}
          <Label text="Contact Number" required />

          <TextField
            icon="phone-outline"
            placeholder="Enter 10 digit mobile number"
            keyboardType="number-pad"
            maxLength={10}
            value={contactNo}
            onChangeText={value => setContactNo(value.replace(/\D/g, ''))}
            editable={!loginLoading}
            style={styles.modalField}
          />

          {/* Date of Birth Picker Field */}
          <Label text="Date of Birth" required />

          <TouchableOpacity
            style={styles.dobField}
            activeOpacity={0.8}
            disabled={loginLoading}
            onPress={() => setShowDobPicker(true)}
          >
            <Icon
              name="calendar-outline"
              size={20}
              color="#4B5563"
              style={styles.dobFieldIcon}
            />

            <Text
              style={[
                styles.dobFieldText,
                !dateOfBirth && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {dateOfBirth ? formatSlashDate(dateOfBirth) : 'dd/mm/yyyy'}
            </Text>

            <Icon name="calendar-month-outline" size={20} color="#111827" />
          </TouchableOpacity>

          {/* Information */}
          <View style={styles.infoBox}>
            <Icon name="information-outline" size={18} color={colors.primary} />

            <Text style={styles.infoText}>
              Enter the same mobile number and date of birth used while
              registering your Wazifa application.
            </Text>
          </View>

          {/* Submit Button */}
          {loginLoading ? (
            <View style={[styles.loginButton, styles.disabledButton]}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.loginButtonText}>Please Wait...</Text>
            </View>
          ) : (
            <GreenButton
              title="Login & Download Form"
              onPress={handleLogin}
              style={styles.loginButton}
            />
          )}

          <GrayButton
            title="Cancel"
            onPress={closeLoginModal}
            disabled={loginLoading}
            style={styles.cancelButton}
          />

          <Text style={styles.secureText}>
            <Icon
              name="shield-check-outline"
              size={14}
              color={colors.success}
            />{' '}
            Secure Wazifa Authentication
          </Text>
        </View>

        {/* Android Date Picker */}
        {showDobPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dateOfBirth || new Date(2002, 0, 1)}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDobChange}
          />
        )}

        {/* iOS Date Picker Sheet */}
        {showDobPicker && Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            onRequestClose={() => setShowDobPicker(false)}
          >
            <View style={styles.iosOverlay}>
              <View style={styles.iosSheet}>
                <TouchableOpacity
                  style={styles.iosDone}
                  onPress={() => setShowDobPicker(false)}
                >
                  <Text style={styles.iosDoneText}>Done</Text>
                </TouchableOpacity>

                <DateTimePicker
                  value={dateOfBirth || new Date(2002, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleDobChange}
                />
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );

  // ================================================================
  // MAIN RENDER
  // ================================================================

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Scholarship Registration"
          onBack={() => navigation.goBack()}
        />

        <Body style={styles.body}>
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
                  refreshing={refreshing}
                  onRefresh={() => loadData(true)}
                  colors={[THEME.accent]}
                  tintColor={THEME.accent}
                />
              }
              ListHeaderComponent={
                <View style={styles.searchWrap}>
                  <SearchField
                    placeholder="Search scholarship..."
                    value={search}
                    onChangeText={setSearch}
                  />

                  {search.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearSearchBtn}
                      onPress={() => setSearch('')}
                    >
                      <Icon
                        name="close-circle"
                        size={20}
                        color={colors.secondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              }
              ListEmptyComponent={
                <View style={[shared.empty, styles.emptyContainer]}>
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

        {/* LOGIN BOTTOM SHEET */}
        {renderLoginModal()}
      </View>
    </AppLayout>
  );
};

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.screenBg,
  },

  body: {
    flex: 1,
    marginTop: 0,
    backgroundColor: THEME.screenBg,
    overflow: 'hidden',
  },

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },

  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },

  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },

  // Scholarship Card

  card: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#122B1B',
    shadowOffset: { width: 0, height: 3 },
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

  // Status

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
    borderRadius: 12,
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

  // Bottom Sheet Modal

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  bottomSheetCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
    elevation: 14,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  modalIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButton: {
    padding: 7,
    backgroundColor: colors.backgroundDark,
    borderRadius: 20,
  },

  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: colors.TitleColor,
    marginBottom: 6,
  },

  modalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },

  modalField: {
    marginBottom: 16,
  },

  dobField: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#D5DDD8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  dobFieldIcon: {
    marginRight: 8,
  },

  dobFieldText: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },

  placeholderText: {
    color: '#6B7280',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryBg,
    borderRadius: 10,
    padding: 11,
    gap: 8,
    marginBottom: 18,
  },

  infoText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  loginButton: {
    height: 48,
    borderRadius: 12,
  },

  disabledButton: {
    opacity: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    gap: 10,
  },

  loginButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: colors.white,
  },

  cancelButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
  },

  secureText: {
    textAlign: 'center',
    marginTop: 14,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: colors.success,
  },

  // iOS Date Picker

  iosOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  iosSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },

  iosDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  iosDoneText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
});

export default ScholarshipScreen;

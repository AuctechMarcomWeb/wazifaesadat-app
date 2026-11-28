import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  Linking,
  useWindowDimensions,
  Clipboard,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { shareNewsEvent } from '../../api/AllTabsApi';
import { initiateAppealDonation } from '../../api/Appeals';
import { BASE_URL } from '../../api/apiConfig';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';
import AppLayout from '../../components/AppLayout/AppLayout';
import PayUCheckout from '../../components/Payments/PayUCheckout';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const getShareUrl = appealId => {
  if (!appealId) return '';
  const segment = 'appeals';
  return `${BASE_URL}/${segment}/${appealId}`;
};

const getAppealImage = item => {
  if (typeof item?.image === 'string' && item.image) return item.image;
  if (Array.isArray(item?.images) && item.images.length > 0) {
    const first = item.images[0];
    return typeof first === 'string' ? first : first?.url || first?.uri || null;
  }
  return null;
};

const getPayNowNumber = item => {
  const candidates = [
    item?.payNowNumber,
    item?.paymentNumber,
    item?.upiNumber,
    item?.upiId,
    item?.upi,
    item?.phoneNumber,
    item?.contactNumber,
    item?.mobile,
    item?.mobileNumber,
    item?.whatsappNumber,
  ];
  const found = candidates.find(
    val => typeof val === 'string' || typeof val === 'number',
  );
  return found ? String(found).trim() : '';
};

const formatAmount = amount => {
  const num = Number(amount || 0);
  if (!num) return '₹0';
  if (num >= 1000000) return '₹' + (num / 1000000).toFixed(1) + 'M';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + 'K';
  return '₹' + num.toLocaleString('en-IN');
};

const AppealDetails = ({ route, navigation }) => {
  const { width: screenWidth } = useWindowDimensions();
  const { appealId, appeal: initialAppeal } = route?.params || {};
  const [appeal, setAppeal] = useState(initialAppeal);
  const [loading, setLoading] = useState(!initialAppeal);
  const [isSharing, setIsSharing] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [donationAmountInput, setDonationAmountInput] = useState('');

  useEffect(() => {
    if (initialAppeal) {
      setAppeal(initialAppeal);
    }
    if (!initialAppeal && appealId) {
      setLoading(false);
    }
  }, [appealId, initialAppeal]);

  const payNowNumber = getPayNowNumber(appeal);

  const { openPayment: openPayuCheckout } = PayUCheckout({
    backendUrl: BASE_URL,
    onSuccess: event => {
      console.log('✅ [PayU] Appeal Payment Success:', event);
      setIsPaymentProcessing(false);
      Alert.alert('Success', 'Payment completed successfully!', [
        { text: 'OK', onPress: () => navigation?.goBack() },
      ]);
    },
    onFailure: event => {
      console.log('❌ [PayU] Appeal Payment Failure:', event);
      setIsPaymentProcessing(false);
      Alert.alert(
        'Payment Failed',
        'Payment was unsuccessful. Please try again.',
        [{ text: 'OK', onPress: () => {} }],
      );
    },
    onCancel: () => {
      console.log('⚠️ [PayU] Appeal Payment Cancelled');
      setIsPaymentProcessing(false);
      Alert.alert('Cancelled', 'Payment was cancelled by user.', [
        { text: 'OK', onPress: () => {} },
      ]);
    },
    onError: error => {
      console.log('⚠️ [PayU] Appeal Payment Error:', error);
      setIsPaymentProcessing(false);
      Alert.alert('Error', 'Unable to process payment. Please try again.', [
        { text: 'OK', onPress: () => {} },
      ]);
    },
  });

  const handleShare = async () => {
    const id = appeal?._id || appeal?.id || appealId;
    if (!appeal || !id || isSharing) return;

    setIsSharing(true);

    try {
      const shareUrl = getShareUrl(id);
      const message = [appeal?.title, shareUrl].filter(Boolean).join('\n\n');

      const result = await Share.share({
        message: message || shareUrl,
        url: shareUrl,
        title: appeal?.title || 'Share Appeal',
      });

      if (result?.action !== Share.sharedAction) return;

      const payload = {
        shareUrl,
        platform: 'native_share',
        title: appeal?.title || '',
        type: 'appeal',
      };

      await shareNewsEvent(id, payload);
    } catch (err) {
      console.error('Share Error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDonate = () => {
    if (appeal?.donateLink) {
      Linking.openURL(appeal.donateLink).catch(err =>
        console.error('Donate Link Error:', err),
      );
    }
  };

  const handleCopyPayNumber = () => {
    if (!payNowNumber) return;
    Clipboard.setString(payNowNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCallPayNumber = () => {
    if (!payNowNumber) return;
    const cleanNum = payNowNumber.replace(/[^+\d]/g, '');
    Linking.openURL(`tel:${cleanNum}`).catch(err =>
      console.error('Call Number Error:', err),
    );
  };

  const handleOpenAmountModal = () => {
    if (isPaymentProcessing) return;
    setDonationAmountInput('');
    setAmountModalVisible(true);
  };

  const handleConfirmDonationAmount = async () => {
    const numericAmount = Number(donationAmountInput);
    if (
      !donationAmountInput.trim() ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const targetAppealId = appeal?._id || appeal?.id || appealId;
    if (!targetAppealId) {
      Alert.alert('Error', 'Appeal ID not found');
      return;
    }

    setAmountModalVisible(false);
    setIsPaymentProcessing(true);

    try {
      const payload = {
        amount: numericAmount,
        donorName: 'Anonymous Donor',
        donorEmail: 'donor@wazifaesadat.org',
        donorPhone: '9999999999',
      };

      console.log('💳 [PayU] Calling initiateAppealDonation:', {
        appealId: targetAppealId,
        payload,
      });

      const res = await initiateAppealDonation(targetAppealId, payload);
      console.log('💳 [PayU] initiateAppealDonation response:', res);

      if (res?.success && res?.data?.paymentData) {
        const pData = res.data.paymentData;
        const payuParams = {
          ...pData,
          key: pData.key,
          transactionId: pData.transactionId || pData.txnid,
          amount: pData.amount,
          productInfo: pData.productInfo || pData.productinfo,
          firstName: pData.firstName || pData.firstname,
          email: pData.email,
          phone: pData.phone || '',
          android_surl: pData.android_surl || pData.surl || '',
          android_furl: pData.android_furl || pData.furl || '',
          ios_surl: pData.ios_surl || pData.surl || '',
          ios_furl: pData.ios_furl || pData.furl || '',
        };

        console.log('💳 [PayU] Opening checkout with params:', payuParams);
        openPayuCheckout(payuParams);
      } else {
        setIsPaymentProcessing(false);
        Alert.alert(
          'Error',
          res?.message || 'Could not initiate PayU donation.',
        );
      }
    } catch (err) {
      console.error('❌ [PayU] Exception:', err);
      setIsPaymentProcessing(false);
      Alert.alert('Error', err?.message || 'Payment initiation failed.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader title="Appeal Details" navigation={navigation} />
          <View style={styles.centerContent}>
            <ActivityIndicator
              size="large"
              color={colors.primary || '#167A43'}
            />
          </View>
        </View>
      </AppLayout>
    );
  }

  if (!appeal) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader title="Appeal Details" navigation={navigation} />
          <View style={styles.centerContent}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.textSecondary || '#737373'}
            />
            <Text style={styles.errorText}>Appeal not found</Text>
          </View>
        </View>
      </AppLayout>
    );
  }

  const raised = Number(appeal?.raisedAmount ?? appeal?.amountRaised ?? 0);
  const target = Number(appeal?.targetAmount ?? 0);
  const progress = target > 0 ? Math.min((raised / target) * 100, 100) : 0;
  const donorsCount = Number(appeal?.donorCount ?? appeal?.donorsCount ?? 0);
  const imageUri = getAppealImage(appeal);
  const status = (appeal?.status || '').toLowerCase();

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader title="Appeal Details" navigation={navigation} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={[styles.appealImage, { width: screenWidth }]}
              resizeMode="cover"
            />
          )}

          <View
            style={[styles.headerCard, !imageUri && styles.headerCardNoImg]}
          >
            <View style={styles.titleSection}>
              <View style={styles.titleWrap}>
                {!!appeal?.category && (
                  <Text style={styles.category}>{appeal.category}</Text>
                )}
                <Text style={styles.appealTitle}>{appeal?.title}</Text>
              </View>
            </View>

            {!!appeal?.status && (
              <View
                style={[
                  styles.statusBadge,
                  status === 'active' && styles.activeStatus,
                  status === 'completed' && styles.completedStatus,
                  (status === 'paused' || status === 'closed') &&
                    styles.pausedStatus,
                ]}
              >
                <Ionicons
                  name={
                    status === 'active'
                      ? 'checkmark-circle'
                      : status === 'completed'
                      ? 'checkmark-done'
                      : 'pause-circle'
                  }
                  size={15}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.statusText}>
                  {appeal.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {target > 0 && (
            <View style={styles.progressCard}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>

              <View style={styles.progressStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Raised</Text>
                  <Text style={styles.statValue}>{formatAmount(raised)}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Target</Text>
                  <Text style={styles.statValue}>{formatAmount(target)}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Donors</Text>
                  <Text style={styles.statValue}>{donorsCount}</Text>
                </View>
              </View>

              <Text style={styles.progressPercentage}>
                {progress.toFixed(1)}% funded
              </Text>
            </View>
          )}

          {!!payNowNumber && (
            <View style={styles.payNowCard}>
              <View style={styles.payNowHeader}>
                <View style={styles.payNowTitleRow}>
                  <MaterialCommunityIcons
                    name="cellphone-check"
                    size={18}
                    color={colors.primary || '#167A43'}
                  />
                  <Text style={styles.payNowLabel}>Pay Now Number</Text>
                </View>

                {copiedNumber && (
                  <Text style={styles.copiedBadgeText}>Copied</Text>
                )}
              </View>

              <View style={styles.payNowBody}>
                <Text style={styles.payNowNumberText} selectable>
                  {payNowNumber}
                </Text>

                <View style={styles.payNowActions}>
                  <TouchableOpacity
                    style={styles.payActionBtn}
                    onPress={handleCopyPayNumber}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={copiedNumber ? 'checkmark' : 'copy-outline'}
                      size={17}
                      color={colors.primary || '#167A43'}
                    />
                    <Text style={styles.payActionText}>
                      {copiedNumber ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.payActionBtn}
                    onPress={handleCallPayNumber}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="call-outline"
                      size={17}
                      color={colors.primary || '#167A43'}
                    />
                    <Text style={styles.payActionText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {!!appeal?.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Appeal</Text>
              <Text style={styles.description}>{appeal.description}</Text>
            </View>
          )}

          {!!appeal?.story && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Story</Text>
              <Text style={styles.story}>{appeal.story}</Text>
            </View>
          )}

          {!!appeal?.howItHelps && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How Your Donation Helps</Text>
              <Text style={styles.helpText}>{appeal.howItHelps}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.payNowBtn,
              isPaymentProcessing && styles.buttonDisabled,
            ]}
            onPress={handleOpenAmountModal}
            activeOpacity={0.85}
            disabled={isPaymentProcessing}
          >
            {isPaymentProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="flash"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.payNowBtnText}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>

          {!!appeal?.donateLink && (
            <TouchableOpacity
              style={styles.donateBtn}
              onPress={handleDonate}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="heart" size={20} color="#FFFFFF" />
              <Text style={styles.donateBtnText}>Donate Now</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <Modal
          visible={amountModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAmountModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Donation Amount</Text>
                <TouchableOpacity
                  onPress={() => setAmountModalVisible(false)}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Enter amount to donate (₹)
              </Text>

              <View style={styles.modalInputWrap}>
                <Text style={styles.modalRupee}>₹</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={donationAmountInput}
                  onChangeText={setDonationAmountInput}
                  autoFocus
                />
              </View>

              <View style={styles.quickChipRow}>
                {QUICK_AMOUNTS.map(amt => {
                  const active = Number(donationAmountInput) === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        styles.quickChip,
                        active && styles.quickChipActive,
                      ]}
                      onPress={() => setDonationAmountInput(String(amt))}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.quickChipText,
                          active && styles.quickChipTextActive,
                        ]}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAmountModalVisible(false)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalProceedBtn}
                  onPress={handleConfirmDonationAmount}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalProceedText}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary || '#737373',
    marginTop: 12,
  },
  appealImage: {
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  headerCard: {
    backgroundColor: colors.white || '#FFFFFF',
    padding: 16,
    marginHorizontal: 14,
    marginTop: -28,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  headerCardNoImg: {
    marginTop: 14,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  appealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text || '#121212',
    lineHeight: 24,
    marginBottom: 2,
  },
  category: {
    fontSize: 11.5,
    color: colors.primary || '#167A43',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingBtn: {
    opacity: 0.65,
  },
  progressCard: {
    backgroundColor: colors.white || '#FFFFFF',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary || '#167A43',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11.5,
    color: colors.textSecondary || '#737373',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text || '#121212',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  progressPercentage: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary || '#167A43',
    textAlign: 'center',
  },
  payNowCard: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  payNowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  payNowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payNowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text || '#121212',
  },
  copiedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary || '#167A43',
  },
  payNowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  payNowNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text || '#121212',
    letterSpacing: 0.4,
  },
  payNowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  payActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary || '#167A43',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeStatus: {
    backgroundColor: '#E8F5E9',
  },
  completedStatus: {
    backgroundColor: '#E3F2FD',
  },
  pausedStatus: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text || '#121212',
    letterSpacing: 0.3,
  },
  section: {
    backgroundColor: colors.white || '#FFFFFF',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    padding: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text || '#121212',
    marginBottom: 8,
  },
  description: {
    fontSize: 13.5,
    color: colors.textSecondary || '#4B5563',
    lineHeight: 20,
  },
  story: {
    fontSize: 13.5,
    color: colors.textSecondary || '#4B5563',
    lineHeight: 21,
  },
  helpText: {
    fontSize: 13.5,
    color: colors.textSecondary || '#4B5563',
    lineHeight: 20,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#167A43',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#167A43',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  donateBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  shareFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white || '#FFFFFF',
    marginHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: colors.primary || '#167A43',
    gap: 8,
  },
  shareFullBtnText: {
    color: colors.primary || '#167A43',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text || '#121212',
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary || '#6B7280',
    marginTop: 6,
    marginBottom: 12,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  modalRupee: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text || '#121212',
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text || '#121212',
  },
  quickChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickChipActive: {
    borderColor: colors.primary || '#167A43',
    backgroundColor: '#F0FDF4',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary || '#6B7280',
  },
  quickChipTextActive: {
    color: colors.primary || '#167A43',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary || '#4B5563',
  },
  modalProceedBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.primary || '#167A43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProceedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AppealDetails;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import BackHeader from '../../../components/BackHeader/BackHeader';
import AppLayout from '../../../components/AppLayout/AppLayout';
import { updateExpenditure, deleteExpenditure } from '../../../api/expenditure';
import { TextField, Label } from '../../../components/Formparts';

const ICONS = {
  Wazifa: 'flash',
  Contingency: 'layers',
  'Stationary etc.': 'square-edit-outline',
  Commission: 'account-group',
  Postage: 'email',
  Other: 'wallet-outline',
};

const MODE_TONES = {
  Cash: { bg: '#DCEBFA', text: '#1D6FD6', icon: 'cash' },
  UPI: { bg: '#EBDDFB', text: '#7C3AED', icon: 'contactless-payment' },
  Cheque: { bg: '#D7EAFB', text: '#1D6FD6', icon: 'credit-card' },
  RTGS: { bg: '#DCE7F3', text: '#1D6FD6', icon: 'bank-transfer' },
};

const formatNumber = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const formatDate = dateString => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DetailRow = ({ label, value, icon = null, isBold = false, isGreen = false }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelContainer}>
      {icon && <Icon name={icon} size={18} color="#4B5563" style={styles.detailIcon} />}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[
      styles.detailValue,
      isBold && styles.detailValueBold,
      isGreen && styles.detailValueGreen,
    ]}>
      {value}
    </Text>
  </View>
);

const ExpenditureDetail = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit form states
  const [editAmount, setEditAmount] = useState(item?.amount?.toString() || '');
  const [editPaymentMode, setEditPaymentMode] = useState(item?.paymentMode || '');
  const [editPaidTo, setEditPaidTo] = useState(item?.paidTo || '');
  const [editTransactionId, setEditTransactionId] = useState(item?.transactionId || '');
  const [editBillNo, setEditBillNo] = useState(item?.billNo || '');
  const [editDescription, setEditDescription] = useState(item?.description || '');
  const [editRemarks, setEditRemarks] = useState(item?.remarks || '');

  if (!item) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader
            navigation={navigation}
            title="Expenditure Detail"
            onBack={() => navigation && navigation.goBack()}
          />
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>No data available</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation && navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppLayout>
    );
  }

  const tone = MODE_TONES[item.paymentMode] || MODE_TONES.Cash;
  const displayDate = item.date
    ? new Date(item.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : 'N/A';

  const handleImagePress = () => {
    if (item.billImage) {
      Linking.openURL(item.billImage).catch(() => {
        Alert.alert('Error', 'Could not open the bill image');
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expenditure',
      'Are you sure you want to delete this expenditure? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            await performDelete();
          },
          style: 'destructive',
        },
      ],
    );
  };

  const performDelete = async () => {
    try {
      setIsDeleting(true);
      setIsLoading(true);

      // Use the correct ID - item has both 'id' and '_id' properties
      const expenditureId = item._id || item.id;

      console.log('🗑️ Deleting expenditure:', expenditureId);

      const response = await deleteExpenditure(expenditureId);

      if (response.success) {
        Alert.alert(
          'Success',
          'Expenditure deleted successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to delete expenditure');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while deleting the expenditure');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const performUpdate = async () => {
    try {
      if (!editAmount || !editPaymentMode || !editPaidTo) {
        Alert.alert('Error', 'Amount, Payment Mode, and Paid To are required');
        return;
      }

      setIsUpdating(true);
      setIsLoading(true);

      // Use the correct ID - item has both 'id' and '_id' properties
      const expenditureId = item._id || item.id;

      // The expense field should be from the original item data
      // Check if we have expenseInfo with _id, or use the expense property
      const expenseTypeId = item.expenseInfo?._id || item.expense;

      const updateData = {
        expense: expenseTypeId,  // This should be the expense TYPE ID, not the expenditure ID
        amount: parseInt(editAmount),
        paymentMode: editPaymentMode,
        paidTo: editPaidTo,
        date: item.date,
        transactionId: editTransactionId,
        billNo: editBillNo,
        description: editDescription,
        remarks: editRemarks,
        billImage: item.billImage,
      };

      console.log('📝 Updating expenditure:', expenditureId);
      console.log('💰 Expense Type ID:', expenseTypeId);
      console.log('📊 Update data:', updateData);

      const response = await updateExpenditure(expenditureId, updateData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Expenditure updated successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                setEditModalOpen(false);
                navigation.goBack();
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update expenditure');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the expenditure');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Expenditure Detail"
          onBack={() => navigation && navigation.goBack()}
        />

        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>
              {isDeleting ? 'Deleting...' : 'Updating...'}
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={[styles.headerIcon, { backgroundColor: tone.bg }]}>
                <Icon
                  name={ICONS[item.expenseTitle] || 'cash'}
                  size={32}
                  color={tone.text}
                />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.expenseTitle}>{item.expenseTitle}</Text>
                <Text style={styles.expenseDate}>{displayDate}</Text>
              </View>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>₹ {formatNumber(item.amount)}</Text>
            </View>
          </View>

          {/* Payment Mode Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.modeBadge, { backgroundColor: tone.bg }]}>
              <Icon
                name={tone.icon || 'cash'}
                size={16}
                color={tone.text}
                style={styles.modeIcon}
              />
              <Text style={[styles.modeBadgeText, { color: tone.text }]}>
                {item.paymentMode}
              </Text>
            </View>
          </View>

          {/* Payment Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.sectionContent}>
              <DetailRow
                label="Paid To"
                value={item.paidTo || 'N/A'}
                icon="account-circle-outline"
              />
              <DetailRow
                label="Transaction ID"
                value={item.transactionId || 'N/A'}
                icon="identifier"
                isBold
              />
              <DetailRow
                label="Bill Number"
                value={item.billNo || 'N/A'}
                icon="file-document-outline"
              />
            </View>
          </View>

          {/* Description Section */}
          {item.description && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>
            </View>
          )}

          {/* Remarks Section */}
          {item.remarks && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Remarks</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{item.remarks}</Text>
              </View>
            </View>
          )}

          {/* Bill Image Section */}
          {item.billImage && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Bill Image</Text>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleImagePress}
                activeOpacity={0.8}
              >
                {imageLoading && !imageError && (
                  <View style={styles.imageLoader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}
                {!imageError && (
                  <Image
                    source={{ uri: item.billImage }}
                    style={styles.billImage}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                )}
                {imageError && (
                  <View style={styles.imageErrorContainer}>
                    <Icon name="image-off-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.imageErrorText}>Could not load image</Text>
                  </View>
                )}
                <View style={styles.imageOverlay}>
                  <Icon name="eye-outline" size={24} color={colors.white} />
                  <Text style={styles.imageOverlayText}>View Full Image</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Metadata Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.sectionContent}>
              <DetailRow
                label="Expense ID"
                value={item._id || 'N/A'}
                icon="identifier"
              />
              <DetailRow
                label="Expense Type"
                value={item.expenseInfo?.title || 'N/A'}
                icon="tag-outline"
              />
              <DetailRow
                label="Created On"
                value={formatDate(item.createdAt)}
                icon="calendar-clock-outline"
              />
              <DetailRow
                label="Last Updated"
                value={formatDate(item.updatedAt)}
                icon="update"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              activeOpacity={0.8}
              onPress={handleEdit}
              disabled={isDeleting}
            >
              <Icon name="pencil-outline" size={18} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.deleteButton,
                isDeleting && styles.deleteButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Icon name="trash-can-outline" size={18} color="#DC2626" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
        </ScrollView>

        {/* Edit Modal */}
        <Modal
          visible={editModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditModalOpen(false)}
          >
            <View
              style={styles.editModalContent}
              onStartShouldSetResponder={() => true}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Expenditure</Text>
                  <TouchableOpacity
                    onPress={() => setEditModalOpen(false)}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={24} color="#1F2937" />
                  </TouchableOpacity>
                </View>

                {/* Amount */}
                <View style={styles.formGroup}>
                  <Label text="Amount" required />
                  <TextField
                    icon="currency-inr"
                    placeholder="Enter amount"
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="decimal-pad"
                    editable={!isUpdating}
                  />
                </View>

                {/* Payment Mode */}
                <View style={styles.formGroup}>
                  <Label text="Payment Mode" required />
                  <View style={[styles.field, styles.readOnlyField]}>
                    <Icon name="credit-card" size={20} color="#4B5563" style={styles.fieldIcon} />
                    <Text style={[styles.fieldText, styles.readOnlyText]}>
                      {editPaymentMode}
                    </Text>
                  </View>
                </View>

                {/* Paid To */}
                <View style={styles.formGroup}>
                  <Label text="Paid To" required />
                  <TextField
                    icon="account-circle-outline"
                    placeholder="Enter paid to"
                    value={editPaidTo}
                    onChangeText={setEditPaidTo}
                    editable={!isUpdating}
                  />
                </View>

                {/* Transaction ID */}
                <View style={styles.formGroup}>
                  <Label text="Transaction ID" />
                  <TextField
                    icon="identifier"
                    placeholder="Enter transaction ID"
                    value={editTransactionId}
                    onChangeText={setEditTransactionId}
                    editable={!isUpdating}
                  />
                </View>

                {/* Bill No */}
                <View style={styles.formGroup}>
                  <Label text="Bill Number" />
                  <TextField
                    icon="file-document-outline"
                    placeholder="Enter bill number"
                    value={editBillNo}
                    onChangeText={setEditBillNo}
                    editable={!isUpdating}
                  />
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Label text="Description" />
                  <TextField
                    icon="text-box-outline"
                    placeholder="Enter description"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={3}
                    editable={!isUpdating}
                  />
                </View>

                {/* Remarks */}
                <View style={styles.formGroup}>
                  <Label text="Remarks" />
                  <TextField
                    icon="message-text-outline"
                    placeholder="Enter remarks"
                    value={editRemarks}
                    onChangeText={setEditRemarks}
                    multiline
                    numberOfLines={3}
                    editable={!isUpdating}
                  />
                </View>

                {/* Buttons */}
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalOpen(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.saveButton,
                      isUpdating && styles.saveButtonDisabled,
                    ]}
                    onPress={performUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSpacer} />
              </ScrollView>
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
    backgroundColor: colors.white,
  },

  scrollContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 14,
    paddingBottom: 20,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: '#6B7280',
    marginBottom: 20,
  },

  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },

  backButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
  },

  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  loaderText: {
    marginTop: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },

  // Header Card
  headerCard: {
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E9EEEB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  expenseTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  expenseDate: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  amountContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9EEEB',
  },

  amountLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
    marginBottom: 4,
  },

  amountValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: '#0F5132',
  },

  // Badge
  badgeContainer: {
    marginBottom: 14,
  },

  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  modeIcon: {
    marginRight: 6,
  },

  modeBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },

  // Sections
  sectionContainer: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: '#123B28',
    marginBottom: 10,
  },

  sectionContent: {
    backgroundColor: '#F7FAF8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    overflow: 'hidden',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEEB',
  },

  detailLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailIcon: {
    marginRight: 8,
  },

  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
    flex: 1,
  },

  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
    textAlign: 'right',
  },

  detailValueBold: {
    fontFamily: FontFamily.semiBold,
    color: '#0F5132',
  },

  detailValueGreen: {
    color: '#0F5132',
    fontFamily: FontFamily.semiBold,
  },

  // Description Box
  descriptionBox: {
    backgroundColor: '#F7FAF8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    padding: 12,
  },

  descriptionText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#374151',
    lineHeight: 20,
  },

  // Image
  imageContainer: {
    backgroundColor: '#F7FAF8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    overflow: 'hidden',
    height: 200,
  },

  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    zIndex: 10,
  },

  billImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  imageErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },

  imageErrorText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageOverlayText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
  },

  // Actions
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  actionButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  editButton: {
    backgroundColor: '#E3F4E9',
    borderWidth: 1,
    borderColor: colors.primary,
  },

  editButtonText: {
    marginLeft: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },

  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
  },

  deleteButtonDisabled: {
    opacity: 0.6,
  },

  deleteButtonText: {
    marginLeft: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#DC2626',
  },

  spacer: {
    height: 20,
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  editModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '90%',
    paddingTop: 0,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEEB',
  },

  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#123B28',
  },

  closeButton: {
    padding: 8,
  },

  formGroup: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
  },

  field: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#D5DDD8',
    borderRadius: 10,
    paddingHorizontal: 12,
  },

  readOnlyField: {
    backgroundColor: '#F0F0F0',
  },

  fieldIcon: {
    marginRight: 8,
  },

  fieldText: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },

  readOnlyText: {
    color: '#6B7280',
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  cancelButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#1F2937',
  },

  saveButton: {
    backgroundColor: colors.primary,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
  },

  modalSpacer: {
    height: 20,
  },
});

export default ExpenditureDetail;

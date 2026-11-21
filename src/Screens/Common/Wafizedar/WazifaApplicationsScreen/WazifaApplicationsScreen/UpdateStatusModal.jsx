import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';

import {
  Dropdown,
  GreenButton,
  GrayButton,
} from '../../../../../components/Formparts';
import colors from '../../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../../themes/typography';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { updateWazifaStatus } from '../../../../../api/wazifa';

const STATUSES = ['Pending', 'Shortlisted', 'Approved', 'Rejected'];
const DISBURSED_STATUSES = ['Pending', 'Disbursed', 'Returned', 'Resend'];

const UpdateStatusModal = ({
  visible,
  onClose,
  applicationId,
  applicationData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('Pending');
  const [disbursedStatus, setDisbursedStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');
  const [statusChanged, setStatusChanged] = useState(false);
  const [disbursedStatusChanged, setDisbursedStatusChanged] = useState(false);

  // Load current status when modal opens
  useEffect(() => {
    if (visible && applicationData) {
      setStatus(applicationData.status || 'Pending');
      setDisbursedStatus(applicationData.disbursedStatus || 'Pending');
      setRemarks('');
      setStatusChanged(false);
      setDisbursedStatusChanged(false);
    }
  }, [visible, applicationData]);

  const handleStatusChange = newStatus => {
    setStatus(newStatus);
    if (newStatus !== (applicationData?.status || 'Pending')) {
      setStatusChanged(true);
    }
  };

  const handleDisbursedStatusChange = newStatus => {
    setDisbursedStatus(newStatus);
    if (newStatus !== (applicationData?.disbursedStatus || 'Pending')) {
      setDisbursedStatusChanged(true);
    }
  };

  const handleSave = async () => {
    // Validation - check if either status or disbursed status changed
    if (!statusChanged && !disbursedStatusChanged) {
      Alert.alert(
        'No Changes',
        'Please change at least one field before saving',
      );
      return;
    }

    setSaving(true);
    try {
      // API Call 1: Update Status (if status changed)
      if (statusChanged) {
        const statusPayload = {
          status: status,
          remarks: remarks.trim(),
        };

        console.log('📤 API 1: Updating wazifa status...', statusPayload);
        const statusResult = await updateWazifaStatus(
          applicationId,
          statusPayload,
        );

        if (!statusResult.success) {
          Alert.alert(
            'Error',
            statusResult.message || 'Failed to update status',
          );
          setSaving(false);
          return;
        }
        console.log('✅ API 1 Success: Status updated');
      }

      // API Call 2: Update Disbursed Status (only if it changed AND Status is Approved)
      if (disbursedStatusChanged && status === 'Approved') {
        const disbursedPayload = {
          disburseStatus: disbursedStatus,
        };

        console.log('📤 API 2: Updating disbursed status...', disbursedPayload);
        const disbursedResult = await updateWazifaStatus(
          applicationId,
          disbursedPayload,
        );

        if (!disbursedResult.success) {
          Alert.alert(
            'Error',
            disbursedResult.message || 'Failed to update disbursed status',
          );
          setSaving(false);
          return;
        }
        console.log('✅ API 2 Success: Disbursed status updated');
      }

      // Both APIs succeeded
      Alert.alert('Success ✅', 'Status updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess && onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Error updating status:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update status. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Status</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              style={{ padding: 8 }}
            >
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Student Info Card */}
            {applicationData && (
              <View style={styles.infoCard}>
                <Text style={styles.studentNameBold}>
                  {applicationData.studentName}
                </Text>
                <Text style={styles.infoText}>
                  {applicationData.contactNo} · {applicationData.email}
                </Text>
                <Text style={styles.infoText}>
                  Wazifa No: {applicationData.applicationNo}
                </Text>
                {applicationData.disbursedAmount && (
                  <Text style={styles.infoText}>
                    Disbursed Amount: Rs {applicationData.disbursedAmount}
                  </Text>
                )}
              </View>
            )}

            {/* Status Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status *</Text>
              <Dropdown
                value={status}
                options={STATUSES}
                onSelect={handleStatusChange}
              />
              <Text style={styles.helpText}>
                Current: {applicationData?.status || 'N/A'}
              </Text>
            </View>

            {/* Disbursed Status Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Disbursement Status</Text>
              <TouchableOpacity
                disabled={status !== 'Approved'}
                activeOpacity={status === 'Approved' ? 0.8 : 1}
                style={[status !== 'Approved' && styles.disabledContainer]}
              >
                <Dropdown
                  value={disbursedStatus}
                  options={DISBURSED_STATUSES}
                  onSelect={
                    status === 'Approved'
                      ? handleDisbursedStatusChange
                      : () => {}
                  }
                  pointerEvents={status !== 'Approved' ? 'none' : 'auto'}
                />
              </TouchableOpacity>
              {status !== 'Approved' && (
                <View style={styles.warningBox}>
                  <Icon
                    name="information-outline"
                    size={14}
                    color="#D97706"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.warningText}>
                    Only available when Status is "Approved"
                  </Text>
                </View>
              )}
              <Text style={styles.helpText}>
                Current: {applicationData?.disbursedStatus || 'N/A'}
              </Text>
            </View>

            {/* Remarks */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Enter remarks (optional)"
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={4}
                editable={!saving}
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <GrayButton
              title="Cancel"
              onPress={onClose}
              disabled={saving}
              style={styles.cancelBtn}
            />
            <GreenButton
              title={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              disabled={saving}
              style={styles.saveBtn}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoCard: {
    backgroundColor: '#F9F9F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  studentNameBold: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 4,
  },
  infoText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 8,
  },
  disabledContainer: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  warningText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#92400E',
    flex: 1,
  },
  helpText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
  },
  textarea: {
    backgroundColor: '#F9F9F8',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    backgroundColor: '#F9F9F8',
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1,
  },
});

export default UpdateStatusModal;

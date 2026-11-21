import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  TextField,
  Dropdown,
  GreenButton,
  GrayButton,
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { useLocalSecretaries } from '../../../../hooks/useOrganization';

const STATUS_OPTIONS = ['Active', 'Inactive'];

const AddLocalSecretaryScreen = ({ navigation, route }) => {
  const { secretary } = route?.params || {};
  const isEdit = !!secretary;

  const { createSecretary, updateSecretary, loading } = useLocalSecretaries();

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    memberId: '',
    area: '',
    region: '',
    mobileNumber: '',
    email: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && secretary) {
      setFormData({
        name: secretary.name || '',
        position: secretary.position || '',
        memberId: secretary.memberId || '',
        area: secretary.area || '',
        region: secretary.region || '',
        mobileNumber: secretary.mobileNumber || secretary.phone || '',
        email: secretary.email || '',
        status: secretary.status || 'Active',
      });
    }
  }, [secretary, isEdit]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.position?.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!formData.memberId?.trim()) {
      newErrors.memberId = 'Member ID is required';
    }

    if (
      formData.mobileNumber &&
      !/^[0-9]{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))
    ) {
      newErrors.mobileNumber = 'Invalid mobile number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let result;

      if (isEdit) {
        result = await updateSecretary(secretary._id, formData);
      } else {
        result = await createSecretary(formData);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          isEdit
            ? 'Local Secretary updated successfully'
            : 'Local Secretary created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEdit && secretary) {
      setFormData({
        name: secretary.name || '',
        position: secretary.position || '',
        memberId: secretary.memberId || '',
        area: secretary.area || '',
        region: secretary.region || '',
        mobileNumber: secretary.mobileNumber || secretary.phone || '',
        email: secretary.email || '',
        status: secretary.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        position: '',
        memberId: '',
        area: '',
        region: '',
        mobileNumber: '',
        email: '',
        status: 'Active',
      });
    }
    setErrors({});
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title={isEdit ? 'Edit Local Secretary' : 'Add Local Secretary'}
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Body>
                {/* Form Title */}
                <View style={styles.formHeader}>
                  <Icon
                    name={isEdit ? 'pencil' : 'plus-circle'}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.formTitle}>
                    {isEdit
                      ? 'Update Secretary Details'
                      : 'Enter Secretary Details'}
                  </Text>
                </View>

                {/* Name Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Full Name *" />
                  <TextField
                    placeholder="Enter full name"
                    value={formData.name}
                    onChangeText={text => {
                      setFormData({ ...formData, name: text });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    icon="account"
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                {/* Position Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Position *" />
                  <TextField
                    placeholder="e.g., Senior Secretary, Regional Head"
                    value={formData.position}
                    onChangeText={text => {
                      setFormData({ ...formData, position: text });
                      if (errors.position)
                        setErrors({ ...errors, position: '' });
                    }}
                    icon="briefcase"
                  />
                  {errors.position && (
                    <Text style={styles.errorText}>{errors.position}</Text>
                  )}
                </View>

                {/* Member ID Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Member ID *" />
                  <TextField
                    placeholder="e.g., M123456"
                    value={formData.memberId}
                    onChangeText={text => {
                      setFormData({ ...formData, memberId: text });
                      if (errors.memberId)
                        setErrors({ ...errors, memberId: '' });
                    }}
                    icon="identifier"
                  />
                  {errors.memberId && (
                    <Text style={styles.errorText}>{errors.memberId}</Text>
                  )}
                </View>

                {/* Area / Region Row */}
                <View style={shared.row}>
                  <View style={shared.colL}>
                    <Label text="Area" />
                    <TextField
                      placeholder="Area name"
                      value={formData.area}
                      onChangeText={text =>
                        setFormData({ ...formData, area: text })
                      }
                      icon="map-marker"
                    />
                  </View>
                  <View style={shared.col}>
                    <Label text="Region" />
                    <TextField
                      placeholder="Region name"
                      value={formData.region}
                      onChangeText={text =>
                        setFormData({ ...formData, region: text })
                      }
                      icon="map"
                    />
                  </View>
                </View>

                {/* Mobile Number Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Mobile Number" />
                  <TextField
                    placeholder="10-digit mobile number"
                    value={formData.mobileNumber}
                    onChangeText={text => {
                      setFormData({ ...formData, mobileNumber: text });
                      if (errors.mobileNumber)
                        setErrors({ ...errors, mobileNumber: '' });
                    }}
                    icon="phone"
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  {errors.mobileNumber && (
                    <Text style={styles.errorText}>{errors.mobileNumber}</Text>
                  )}
                </View>

                {/* Email Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Email" />
                  <TextField
                    placeholder="email@example.com"
                    value={formData.email}
                    onChangeText={text => {
                      setFormData({ ...formData, email: text });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    icon="email"
                    keyboardType="email-address"
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Status Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Status" />
                  <Dropdown
                    value={formData.status}
                    options={STATUS_OPTIONS}
                    onSelect={value =>
                      setFormData({ ...formData, status: value })
                    }
                  />
                </View>

                {/* Required Fields Notice */}
                <View style={styles.noticeBox}>
                  <Icon name="information" size={16} color="#2563EB" />
                  <Text style={styles.noticeText}>
                    Fields marked with * are required
                  </Text>
                </View>
              </Body>
            </ScrollView>

            {/* Action Buttons Footer */}
            <View style={shared.footer}>
              <GrayButton
                title="Reset"
                onPress={handleReset}
                disabled={submitting}
                style={styles.resetBtn}
              />
              <GreenButton
                title={submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                onPress={handleSubmit}
                disabled={submitting}
                style={styles.submitBtn}
              />
            </View>
          </KeyboardAvoidingView>

          {/* Loading Overlay */}
          {submitting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                {isEdit ? 'Updating...' : 'Creating...'}
              </Text>
            </View>
          )}
        </View>
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

  scrollContent: {
        marginTop: 25,
    paddingHorizontal: wp('4%'),
    paddingTop: 14,
    paddingBottom: 24,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral?.border || '#E5E7EB',
  },

  formTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginLeft: 10,
  },

  fieldGroup: {
    marginBottom: 12,
  },

  errorText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#DC2626',
    marginTop: 4,
  },

  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 10,
  },

  noticeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#1E40AF',
    marginLeft: 8,
  },

  resetBtn: {
    flex: 1,
    marginRight: 10,
  },

  submitBtn: {
    flex: 1.6,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    zIndex: 99,
  },

  loadingText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.primary,
    marginTop: 12,
  },
});

export default AddLocalSecretaryScreen;

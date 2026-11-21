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

import { useExecutiveMembers } from '../../../../hooks/useOrganization';

const MEMBER_TYPES = ['Elected Member', 'Nominated Member', 'Life Member'];
const STATUS_OPTIONS = ['Active', 'Suspended', 'Expired'];

const AddExecutiveMembersScreen = ({ navigation, route }) => {
  // Get member from route params if editing
  const { member } = route?.params || {};
  const isEdit = !!member;

  const { createMember, updateMember, loading } = useExecutiveMembers();

  const [formData, setFormData] = useState({
    name: '',
    memberType: 'Elected Member',
    mobileNumber: '',
    age: '',
    city: '',
    state: '',
    address: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with member data if editing
  useEffect(() => {
    if (isEdit && member) {
      setFormData({
        name: member.name || '',
        memberType: member.memberType || 'Elected Member',
        mobileNumber: member.mobile || member.mobileNumber || '',
        age: member.age || '',
        city: member.city || '',
        state: member.state || '',
        address: member.address || '',
        status: member.status || 'Active',
      });
    }
  }, [member, isEdit]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobileNumber?.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let result;

      const submitData = {
        name: formData.name,
        memberType: formData.memberType,
        mobile: formData.mobileNumber,
        age: formData.age || '-',
        city: formData.city,
        state: formData.state,
        address: formData.address,
        status: formData.status,
      };

      if (isEdit) {
        result = await updateMember(member._id || member.id, submitData);
      } else {
        result = await createMember(submitData);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          isEdit
            ? 'Executive Member updated successfully'
            : 'Executive Member created successfully',
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

  // Handle reset
  const handleReset = () => {
    if (isEdit && member) {
      setFormData({
        name: member.name || '',
        memberType: member.memberType || 'Elected Member',
        mobileNumber: member.mobile || member.mobileNumber || '',
        age: member.age || '',
        city: member.city || '',
        state: member.state || '',
        address: member.address || '',
        status: member.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        memberType: 'Elected Member',
        mobileNumber: '',
        age: '',
        city: '',
        state: '',
        address: '',
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
          title={isEdit ? 'Edit Executive Member' : 'Add Executive Member'}
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
                {/* Form Header */}
                <View style={styles.formHeader}>
                  <Icon
                    name={isEdit ? 'pencil' : 'plus-circle'}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.formTitle}>
                    {isEdit ? 'Update Member Details' : 'Enter Member Details'}
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

                {/* Member Type Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Member Type *" />
                  <Dropdown
                    value={formData.memberType}
                    options={MEMBER_TYPES}
                    onSelect={value =>
                      setFormData({ ...formData, memberType: value })
                    }
                  />
                </View>

                {/* Mobile Number Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Mobile Number *" />
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

                {/* Age Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Age" />
                  <TextField
                    placeholder="e.g., 45 year or -"
                    value={formData.age}
                    onChangeText={text =>
                      setFormData({ ...formData, age: text })
                    }
                    icon="numeric"
                    keyboardType="default"
                  />
                </View>

                {/* City & State Row */}
                <View style={shared.row}>
                  <View style={shared.colL}>
                    <Label text="City *" />
                    <TextField
                      placeholder="Enter city"
                      value={formData.city}
                      onChangeText={text => {
                        setFormData({ ...formData, city: text });
                        if (errors.city) setErrors({ ...errors, city: '' });
                      }}
                      icon="map-marker"
                    />
                    {errors.city && (
                      <Text style={styles.errorText}>{errors.city}</Text>
                    )}
                  </View>
                  <View style={shared.col}>
                    <Label text="State *" />
                    <TextField
                      placeholder="Enter state"
                      value={formData.state}
                      onChangeText={text => {
                        setFormData({ ...formData, state: text });
                        if (errors.state) setErrors({ ...errors, state: '' });
                      }}
                      icon="map"
                    />
                    {errors.state && (
                      <Text style={styles.errorText}>{errors.state}</Text>
                    )}
                  </View>
                </View>

                {/* Address Field */}
                <View style={styles.fieldGroup}>
                  <Label text="Address" />
                  <TextField
                    placeholder="Enter full address"
                    value={formData.address}
                    onChangeText={text =>
                      setFormData({ ...formData, address: text })
                    }
                    icon="home"
                    multiline
                    numberOfLines={3}
                    style={styles.addressInput}
                  />
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
                title={
                  submitting
                    ? 'Saving...'
                    : isEdit
                    ? 'Update Member'
                    : 'Add Member'
                }
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
    paddingHorizontal: wp('4%'),
    paddingTop: 14,
    paddingBottom: 24,
      marginTop: 25,
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
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: '#DC2626',
    marginTop: 4,
  },

  addressInput: {
    height: 75,
    textAlignVertical: 'top',
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
    fontSize: FontSize.xs,
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

export default AddExecutiveMembersScreen;

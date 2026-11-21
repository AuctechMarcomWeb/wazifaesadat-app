import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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

import { useOfficeBearers } from '../../../../hooks/useOrganization';

const DESIGNATIONS = [
  'President',
  'Vice President',
  'General Secretary',
  'Joint Secretary',
  'Sec. Organization',
  'Sec. Media / Publicity',
  'Sec. Legal Cell',
  'Sec. Digital Media',
  'Sec. Counselling and Guidance',
  'Sec. Scholarship',
  'Editor Wazifa Monthly',
  'Internal Auditor',
  'Asst Secretary',
  'Asst. Secretary',
];

const TENURES = ['2025-2026', '2024-2025', '2026-2027'];
const STATUS_OPTIONS = ['Active', 'Suspended', 'Expired'];

const AddOfficeBearerScreen = ({ navigation, route }) => {
  // Get bearer from route params if editing
  const { bearer } = route?.params || {};
  const isEdit = !!bearer;

  const { createBearer, updateBearer } = useOfficeBearers();

  const [form, setForm] = useState({
    name: '',
    designation: 'President',
    tenure: '2025-2026',
    city: '',
    mobile: '',
    landline: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with bearer data if editing
  useEffect(() => {
    if (isEdit && bearer) {
      setForm({
        name: bearer.name || '',
        designation: bearer.designation || 'President',
        tenure: bearer.tenure || '2025-2026',
        city: bearer.city || '',
        mobile: bearer.mobile || '',
        landline: bearer.landline || '',
        status: bearer.status || 'Active',
      });
    }
  }, [bearer, isEdit]);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(form.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let result;

      if (isEdit) {
        result = await updateBearer(bearer._id || bearer.id, form);
      } else {
        result = await createBearer(form);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          isEdit
            ? 'Office Bearer updated successfully!'
            : 'Office Bearer added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation && navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEdit && bearer) {
      setForm({
        name: bearer.name || '',
        designation: bearer.designation || 'President',
        tenure: bearer.tenure || '2025-2026',
        city: bearer.city || '',
        mobile: bearer.mobile || '',
        landline: bearer.landline || '',
        status: bearer.status || 'Active',
      });
    } else {
      setForm({
        name: '',
        designation: 'President',
        tenure: '2025-2026',
        city: '',
        mobile: '',
        landline: '',
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
          title={isEdit ? 'Edit Office Bearer' : 'Add Office Bearer'}
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
                {/* Name */}
                <Label text="Name *" />
                <TextField
                  placeholder="Enter name"
                  value={form.name}
                  onChangeText={t => updateField('name', t)}
                  style={styles.mb}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                {/* Designation */}
                <Label text="Designation *" />
                <Dropdown
                  value={form.designation}
                  options={DESIGNATIONS}
                  onSelect={val => updateField('designation', val)}
                  style={styles.mb}
                />

                {/* Appointed Tenure */}
                <Label text="Appointed Tenure *" />
                <Dropdown
                  value={form.tenure}
                  options={TENURES}
                  onSelect={val => updateField('tenure', val)}
                  style={styles.mb}
                />

                {/* City & Status Row */}
                <View style={[shared.row, styles.gapRow]}>
                  <View style={shared.colL}>
                    <Label text="City" />
                    <TextField
                      placeholder="Enter city"
                      value={form.city}
                      onChangeText={t => updateField('city', t)}
                    />
                  </View>
                  <View style={shared.col}>
                    <Label text="Status" />
                    <Dropdown
                      value={form.status}
                      options={STATUS_OPTIONS}
                      onSelect={val => updateField('status', val)}
                    />
                  </View>
                </View>

                {/* Mobile Number & Landline Number Row */}
                <View style={[shared.row, styles.gapRow]}>
                  <View style={shared.colL}>
                    <Label text="Mobile Number *" />
                    <TextField
                      placeholder="10-digit mobile"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={form.mobile}
                      onChangeText={t => updateField('mobile', t)}
                    />
                    {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
                  </View>
                  <View style={shared.col}>
                    <Label text="Landline Number" />
                    <TextField
                      placeholder="Enter landline no"
                      keyboardType="phone-pad"
                      value={form.landline}
                      onChangeText={t => updateField('landline', t)}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <View style={styles.btnContainer}>
                  <GreenButton
                    title={submitting ? 'Saving...' : isEdit ? 'Update Bearer' : 'Save Office Bearer'}
                    icon="check"
                    onPress={handleSave}
                    disabled={submitting}
                    style={styles.submitBtn}
                  />
                  <GrayButton
                    title="Reset"
                    onPress={handleReset}
                    style={styles.submitBtn}
                  />
                </View>

                {submitting && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}
              </Body>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
    paddingTop: 16,
    marginTop: 26,
    paddingBottom: 30,
  },
  gapRow: {
    marginBottom: 12,
  },
  mb: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: '#DC2626',
    marginTop: 4,
  },
  btnContainer: {
    marginTop: 20,
    gap: 10,
  },
  submitBtn: {
    height: 50,
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
  },
});

export default AddOfficeBearerScreen;

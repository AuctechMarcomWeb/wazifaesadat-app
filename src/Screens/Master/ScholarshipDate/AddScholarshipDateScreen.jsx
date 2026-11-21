import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import colors from '../../../themes/colors';
import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';

import {
  Body,
  Label,
  TextField,
  DateField,
  Dropdown,
  GreenButton,
  GrayButton,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  createScholarshipDate,
  updateScholarshipDate,
} from '../../../api/masters';

const STATUS_OPTIONS = ['Active', 'Inactive'];
const CATEGORY_OPTIONS = ['Junior', 'Senior'];
const INITIAL_FORM = {
  category: '',
  startDate: '',
  endDate: '',
  remarks: '',
  isActive: true,
};

// Convert API date to local Date object
const toDateObject = value => {
  if (!value) return null;

  const datePart = String(value).split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
};

// Convert Date object to YYYY-MM-DD
const toAPIDate = date => {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const AddScholarshipDateScreen = ({ navigation, route }) => {
  const scholarshipDateData = route?.params?.scholarshipDateData || null;

  const isEdit = !!scholarshipDateData;

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);

  // Add / Edit form initialization
  useEffect(() => {
    if (isEdit && scholarshipDateData) {
      // EDIT: Existing data auto-fill
      setForm({
        category: scholarshipDateData.category || '',

        startDate: scholarshipDateData.startDate
          ? String(scholarshipDateData.startDate).split('T')[0]
          : '',

        endDate: scholarshipDateData.endDate
          ? String(scholarshipDateData.endDate).split('T')[0]
          : '',

        remarks: scholarshipDateData.remarks || '',

        isActive: scholarshipDateData.isActive !== false,
      });
    } else {
      // ADD: Always keep fields blank
      setForm({ ...INITIAL_FORM });
    }
  }, [isEdit, scholarshipDateData]);

  // Update form fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: key === 'isActive' ? value === 'Active' : value,
    }));
  };

  // Save / Update Scholarship Date
  const handleSave = async () => {
    if (loading) return;

    if (!form.category.trim()) {
      Alert.alert('Validation Error', 'Please enter Scholarship Category.');
      return;
    }

    if (!form.startDate) {
      Alert.alert('Validation Error', 'Please select Start Date.');
      return;
    }

    if (!form.endDate) {
      Alert.alert('Validation Error', 'Please select End Date.');
      return;
    }

    const start = toDateObject(form.startDate);
    const end = toDateObject(form.endDate);

    if (!start || !end) {
      Alert.alert('Validation Error', 'Please select valid dates.');
      return;
    }

    if (end < start) {
      Alert.alert(
        'Validation Error',
        'End Date cannot be earlier than Start Date.',
      );
      return;
    }

    const payload = {
      category: form.category.trim(),
      startDate: `${form.startDate}T00:00:00.000Z`,
      endDate: `${form.endDate}T00:00:00.000Z`,
      remarks: form.remarks.trim(),
      isActive: form.isActive,
    };

    setLoading(true);

    try {
      let result;

      if (isEdit) {
        const id = scholarshipDateData?._id || scholarshipDateData?.id;

        if (!id) {
          throw new Error('Scholarship Date ID not found.');
        }

        result = await updateScholarshipDate(id, payload);
      } else {
        result = await createScholarshipDate(payload);
      }

      const isSuccess =
        result?.success === true ||
        result?.statusCode === 200 ||
        result?.statusCode === 201 ||
        result?.data?.success === true ||
        result?.data?.statusCode === 200 ||
        result?.data?.statusCode === 201;

      if (!isSuccess) {
        Alert.alert(
          'Error',
          result?.message ||
            result?.data?.message ||
            'Something went wrong. Please try again.',
        );
        return;
      }

      Alert.alert(
        'Success',
        isEdit
          ? 'Scholarship Date updated successfully!'
          : 'Scholarship Date added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error(
        'Scholarship Date Save Error:',
        error?.response?.data || error,
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save Scholarship Date. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title={isEdit ? 'Edit Scholarship Date' : 'Add Scholarship Date'}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Body>
                {/* Scholarship Category */}
                {/* Scholarship Category */}
                <Label text="Category *" />

                <Dropdown
                  value={form.category}
                  options={CATEGORY_OPTIONS}
                  onSelect={val => updateField('category', val)}
                  style={styles.mb}
                  enabled={!loading}
                />
                {/* Start Date */}
                <Label text="Start Date *" />

                <DateField
                  value={toDateObject(form.startDate)}
                  onChange={date => {
                    const formattedDate = toAPIDate(date);

                    if (formattedDate) {
                      updateField('startDate', formattedDate);
                    }
                  }}
                  placeholder="Select Start Date"
                  style={styles.mb}
                />

                {/* End Date */}
                <Label text="End Date *" />

                <DateField
                  value={toDateObject(form.endDate)}
                  onChange={date => {
                    const formattedDate = toAPIDate(date);

                    if (formattedDate) {
                      updateField('endDate', formattedDate);
                    }
                  }}
                  placeholder="Select End Date"
                  style={styles.mb}
                />

                {/* Remarks */}
                <Label text="Remarks" />

                <TextField
                  placeholder="Enter remarks"
                  value={form.remarks}
                  onChangeText={val => updateField('remarks', val)}
                  style={styles.mb}
                  editable={!loading}
                />

                {/* Status */}
                <Label text="Status" />

                <Dropdown
                  value={form.isActive ? 'Active' : 'Inactive'}
                  options={STATUS_OPTIONS}
                  onSelect={val => updateField('isActive', val)}
                  style={styles.mb}
                  enabled={!loading}
                />

                {/* Action Buttons */}
                <View style={[styles.btnRow, { marginTop: 20 }]}>
                  <GrayButton
                    title="Cancel"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelBtn}
                    disabled={loading}
                  />

                  <GreenButton
                    title={
                      loading
                        ? 'Saving...'
                        : isEdit
                        ? 'Update Scholarship Date'
                        : 'Save Scholarship Date'
                    }
                    icon="check"
                    onPress={handleSave}
                    style={styles.saveBtn}
                    disabled={loading}
                  />

                  {loading && (
                    <ActivityIndicator
                      size="small"
                      color={colors.appGreen}
                      style={styles.loader}
                    />
                  )}
                </View>
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
    paddingTop: 16,
    paddingBottom: 30,
    marginTop: 25,
  },

  mb: {
    marginBottom: 12,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    height: 50,
  },

  saveBtn: {
    flex: 1,
    height: 50,
  },

  loader: {
    position: 'absolute',
    right: wp('5%'),
  },
});

export default AddScholarshipDateScreen;

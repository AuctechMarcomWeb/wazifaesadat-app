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
  Dropdown,
  GreenButton,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { createDesignation, updateDesignation } from '../../../api/masters';

const STATUS_OPTIONS = ['Active', 'Inactive'];

const INITIAL_FORM = {
  name: '',
  isActive: true,
};

const AddDesignationScreen = ({ navigation, route }) => {
  const designationData = route?.params?.designationData;
  const isEdit = !!designationData;

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  // Add = Empty Form, Edit = Auto-filled Form
  useEffect(() => {
    if (designationData) {
      setForm({
        name: designationData.name || '',
        isActive: designationData.isActive !== false,
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
  }, [designationData]);

  // Update Form Fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save / Update Designation
  const handleSave = async () => {
    const name = form.name.trim();

    if (!name) {
      Alert.alert('Validation Error', 'Please enter Designation name.');
      return;
    }

    const payload = {
      name,
      isActive: form.isActive,
    };

    setLoading(true);

    try {
      let result;

      if (isEdit) {
        const id = designationData?._id || designationData?.id;

        if (!id) {
          throw new Error('Designation ID not found.');
        }

        result = await updateDesignation(id, payload);
      } else {
        result = await createDesignation(payload);
      }

      // API Response Check
      if (
        result?.success === true ||
        result?.statusCode === 200 ||
        result?.statusCode === 201 ||
        result?.data?.success === true
      ) {
        Alert.alert(
          'Success',
          isEdit
            ? 'Designation updated successfully!'
            : 'Designation added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert(
          'Error',
          result?.message ||
            result?.data?.message ||
            'Something went wrong. Please try again.',
        );
      }
    } catch (error) {
      console.error('Designation Save Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save designation. Please try again.',
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
          title={isEdit ? 'Edit Designation' : 'Add Designation'}
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
                {/* Designation Name */}
                <Label text="Designation Name *" />

                <TextField
                  placeholder="e.g. President, General Secretary"
                  value={form.name}
                  onChangeText={value => updateField('name', value)}
                  style={styles.mb}
                  icon="briefcase"
                  editable={!loading}
                />

                {/* Status */}
                <Label text="Status" />

                <Dropdown
                  value={form.isActive ? 'Active' : 'Inactive'}
                  options={STATUS_OPTIONS}
                  onSelect={value =>
                    updateField('isActive', value === 'Active')
                  }
                  style={styles.mb}
                />

                {/* Submit Button */}
                <View style={styles.btnContainer}>
                  <GreenButton
                    title={loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.submitBtn}
                  />
                </View>

                {/* Loading Overlay */}
                {loading && (
                  <View style={styles.loadingContainer}>
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
    marginBottom: 16,
  },

  btnContainer: {
    marginTop: 24,
  },

  submitBtn: {
    height: 50,
  },

  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
});

export default AddDesignationScreen;

import React, { useEffect, useState } from 'react';
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
import { createTenureYear, updateTenureYear } from '../../../api/masters';

const INITIAL_FORM = {
  name: '',
  isActive: true,
};

const AddTenureYearScreen = ({ navigation, route }) => {
  const { tenureYearData } = route?.params || {};

  const isEdit = !!tenureYearData;

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);

  // Add / Edit form data
  useEffect(() => {
    if (tenureYearData) {
      setForm({
        name: tenureYearData.name || '',
        isActive: tenureYearData.isActive ?? true,
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
  }, [tenureYearData]);

  // Update form fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save / Update API
  const handleSave = async () => {
    const name = form.name.trim();

    if (!name) {
      Alert.alert('Validation Error', 'Please enter tenure year name.');
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
        const id = tenureYearData?._id || tenureYearData?.id;

        if (!id) {
          Alert.alert('Error', 'Tenure year ID not found.');
          return;
        }

        result = await updateTenureYear(id, payload);
      } else {
        result = await createTenureYear(payload);
      }

      const isSuccess =
        result?.success === true ||
        result?.statusCode === 200 ||
        result?.statusCode === 201 ||
        result?.data?.success === true ||
        result?.data?.statusCode === 200 ||
        result?.data?.statusCode === 201;

      if (isSuccess) {
        Alert.alert(
          'Success',
          isEdit
            ? 'Tenure year updated successfully!'
            : 'Tenure year created successfully!',
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
      console.error('Tenure Year Save Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save tenure year.',
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
          title={isEdit ? 'Edit Tenure Year' : 'Add Tenure Year'}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Body>
                <Label text="Name *" />

                <TextField
                  placeholder="e.g. 2024-2025"
                  value={form.name}
                  onChangeText={text => updateField('name', text)}
                  style={styles.mb}
                  icon="calendar"
                  editable={!loading}
                />

                <Label text="Status" />

                <Dropdown
                  value={form.isActive ? 'Active' : 'Inactive'}
                  options={['Active', 'Inactive']}
                  onSelect={value =>
                    updateField('isActive', value === 'Active')
                  }
                  style={styles.mb}
                />

                <GreenButton
                  title={loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                  onPress={handleSave}
                  disabled={loading}
                  style={styles.submitBtn}
                />

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
    backgroundColor: colors.white,
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
  submitBtn: {
    height: 50,
    marginTop: 24,
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

export default AddTenureYearScreen;

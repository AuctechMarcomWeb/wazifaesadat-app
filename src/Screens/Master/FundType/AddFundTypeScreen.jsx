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

import { createFundType, updateFundType } from '../../../api/masters';

const STATUS_OPTIONS = ['Active', 'Inactive'];

const INITIAL_FORM = {
  name: '',
  isActive: true,
};

const AddFundTypeScreen = ({ navigation, route }) => {
  const { fundTypeData } = route?.params || {};
  const isEdit = !!fundTypeData;

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);

  // Add / Edit form initialization
  useEffect(() => {
    if (fundTypeData) {
      setForm({
        // API field is title, not name
        name: fundTypeData.title || fundTypeData.name || '',
        isActive: fundTypeData.isActive !== false,
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
  }, [fundTypeData]);

  // Update form fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save / Update Fund Type
  const handleSave = async () => {
    if (loading) return;

    if (!form.name.trim()) {
      Alert.alert('Validation Error', 'Please enter Fund Type Name.');
      return;
    }

    // API expects title, not name
    const payload = {
      title: form.name.trim(),
      isActive: form.isActive,
    };

    setLoading(true);

    try {
      let result;

      if (isEdit) {
        const id = fundTypeData?._id || fundTypeData?.id;

        if (!id) {
          Alert.alert('Error', 'Fund Type ID not found.');
          return;
        }

        result = await updateFundType(id, payload);
      } else {
        result = await createFundType(payload);
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
            ? 'Fund Type updated successfully!'
            : 'Fund Type created successfully!',
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
      console.error('Fund Type Save Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save Fund Type.',
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
          title={isEdit ? 'Edit Fund Type' : 'Add Fund Type'}
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
                <Label text="Fund Type Name *" />

                <TextField
                  placeholder="e.g. Scholarship Fund"
                  value={form.name}
                  onChangeText={t => updateField('name', t)}
                  style={styles.mb}
                  icon="cash"
                  editable={!loading}
                />

                <Label text="Status" />

                <Dropdown
                  value={form.isActive ? 'Active' : 'Inactive'}
                  options={STATUS_OPTIONS}
                  onSelect={val => updateField('isActive', val === 'Active')}
                  style={styles.mb}
                  enabled={!loading}
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
  },
});

export default AddFundTypeScreen;

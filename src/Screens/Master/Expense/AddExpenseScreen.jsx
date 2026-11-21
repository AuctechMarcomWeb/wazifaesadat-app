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
  GrayButton,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { createExpense, updateExpense } from '../../../api/masters';

const STATUS_OPTIONS = ['Active', 'Suspended', 'Expired'];

const INITIAL_FORM = {
  title: '',
  status: 'Active',
};

const AddExpenseScreen = ({ navigation, route }) => {
  const expenseData = route?.params?.expenseData || null;
  const isEdit = !!expenseData;

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);

  // Add / Edit Form Initialization
  useEffect(() => {
    if (isEdit && expenseData) {
      // Edit mode: Prefill existing expense data
      setForm({
        title: expenseData.title || '',
        status: expenseData.status || 'Active',
      });
    } else {
      // Add mode: Always keep form empty
      setForm({ ...INITIAL_FORM });
    }
  }, [isEdit, expenseData]);

  // Update Form Fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save / Update Expense
  const handleSave = async () => {
    if (loading) return;

    if (!form.title.trim()) {
      Alert.alert('Validation Error', 'Please enter Expense Title.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      status: form.status,
    };

    setLoading(true);

    try {
      if (isEdit) {
        const expenseId = expenseData?._id || expenseData?.id;

        if (!expenseId) {
          throw new Error('Expense ID not found.');
        }

        await updateExpense(expenseId, payload);

        Alert.alert('Success', 'Expense updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]);
      } else {
        await createExpense(payload);

        Alert.alert('Success', 'Expense added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Expense Save Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save expense. Please try again.',
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
          title={isEdit ? 'Edit Expense' : 'Add Expense'}
          onBack={() => navigation?.goBack()}
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
                {/* Expense Title */}
                <Label text="Expense Title *" />

                <TextField
                  placeholder="e.g. Electricity Bill"
                  value={form.title}
                  onChangeText={value => updateField('title', value)}
                  style={styles.mb}
                  editable={!loading}
                />

                {/* Status */}
                <Label text="Status" />

                <Dropdown
                  value={form.status}
                  options={STATUS_OPTIONS}
                  onSelect={value => updateField('status', value)}
                  style={styles.mb}
                  enabled={!loading}
                />

                {/* Action Buttons */}
                <View style={[styles.btnRow, { marginTop: 20 }]}>
                  <GrayButton
                    title="Cancel"
                    onPress={() => navigation?.goBack()}
                    style={styles.cancelBtn}
                    disabled={loading}
                  />

                  <GreenButton
                    title={
                      loading
                        ? 'Saving...'
                        : isEdit
                        ? 'Update Expense'
                        : 'Save Expense'
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

export default AddExpenseScreen;

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
  shared,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { createBank, updateBank } from '../../../api/masters';

const STATUS_OPTIONS = ['Active', 'Inactive'];

const INITIAL_FORM = {
  name: '',
  ifsc: '',
  accountNumber: '',
  branchAddress: '',
  description: '',
  isActive: true,
};

const AddBankScreen = ({ navigation, route }) => {
  const { bankData } = route?.params || {};
  const isEdit = !!bankData;

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);

  // Add / Edit form initialization
  useEffect(() => {
    if (bankData) {
      setForm({
        name: bankData.name || '',

        // API field is ifscNumber, not ifsc
        ifsc: bankData.ifscNumber || bankData.ifsc || '',

        accountNumber: bankData.accountNumber?.toString() || '',
        branchAddress: bankData.branchAddress || '',

        // API response field spelling is discription
        description: bankData.discription || bankData.description || '',

        isActive: bankData.isActive !== false,
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
  }, [bankData]);

  // Update form fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: key === 'ifsc' ? value.toUpperCase() : value,
    }));
  };

  // Save / Update Bank
  const handleSave = async () => {
    if (loading) return;

    if (!form.name.trim()) {
      Alert.alert('Validation Error', 'Please enter Bank Name.');
      return;
    }

    const payload = {
      name: form.name.trim(),

      // Backend field name
      ifscNumber: form.ifsc.trim().toUpperCase(),

      accountNumber: form.accountNumber.trim(),
      branchAddress: form.branchAddress.trim(),

      // Backend response uses discription
      discription: form.description.trim(),

      isActive: form.isActive,
    };

    setLoading(true);

    try {
      let result;

      if (isEdit) {
        const id = bankData?._id || bankData?.id;

        if (!id) {
          Alert.alert('Error', 'Bank ID not found.');
          return;
        }

        result = await updateBank(id, payload);
      } else {
        result = await createBank(payload);
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
          isEdit ? 'Bank updated successfully!' : 'Bank added successfully!',
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
      console.error('Bank Save Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save bank.',
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
          title={isEdit ? 'Edit Bank' : 'Add Bank'}
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
                {/* Bank Name */}
                <Label text="Bank Name *" />

                <TextField
                  placeholder="e.g. State Bank of India (SBI)"
                  value={form.name}
                  onChangeText={t => updateField('name', t)}
                  style={styles.mb}
                  icon="bank"
                  editable={!loading}
                />

                {/* IFSC Number & Account Number */}
                <View style={[shared.row, styles.gapRow]}>
                  <View style={shared.colL}>
                    <Label text="IFSC Number" />

                    <TextField
                      placeholder="e.g. SBIN0001234"
                      autoCapitalize="characters"
                      value={form.ifsc}
                      onChangeText={t => updateField('ifsc', t)}
                      icon="code-string"
                      editable={!loading}
                    />
                  </View>

                  <View style={shared.col}>
                    <Label text="Account Number" />

                    <TextField
                      placeholder="e.g. 1234567890"
                      keyboardType="number-pad"
                      value={form.accountNumber}
                      onChangeText={t => updateField('accountNumber', t)}
                      icon="credit-card"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Branch Address */}
                <Label text="Branch Address" />

                <TextField
                  placeholder="e.g. Main Branch, Connaught Place, New Delhi"
                  value={form.branchAddress}
                  onChangeText={t => updateField('branchAddress', t)}
                  style={styles.mb}
                  icon="map-marker"
                  editable={!loading}
                />

                {/* Description & Status */}
                <View style={[shared.row, styles.gapRow]}>
                  <View style={shared.colL}>
                    <Label text="Description" />

                    <TextField
                      placeholder="e.g. Primary account"
                      value={form.description}
                      onChangeText={t => updateField('description', t)}
                      icon="note-text"
                      editable={!loading}
                    />
                  </View>

                  <View style={shared.col}>
                    <Label text="Status" />

                    <Dropdown
                      value={form.isActive ? 'Active' : 'Inactive'}
                      options={STATUS_OPTIONS}
                      onSelect={val =>
                        updateField('isActive', val === 'Active')
                      }
                      enabled={!loading}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <View style={styles.btnContainer}>
                  <GreenButton
                    title={
                      loading
                        ? 'Saving...'
                        : isEdit
                        ? 'Update Bank'
                        : 'Save Bank'
                    }
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.submitBtn}
                  />
                </View>

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
  gapRow: {
    marginBottom: 12,
  },
  mb: {
    marginBottom: 12,
  },
  btnContainer: {
    marginTop: 20,
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

export default AddBankScreen;

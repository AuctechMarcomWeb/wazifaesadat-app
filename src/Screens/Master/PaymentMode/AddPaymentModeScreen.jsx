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
  GrayButton,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { createPaymentMode, updatePaymentMode } from '../../../api/masters';

const STATUS_OPTIONS = ['Active', 'Inactive'];

const INITIAL_FORM = {
  name: '',
  isActive: true,
};

const AddPaymentModeScreen = ({ navigation, route }) => {
  const paymentModeData = route?.params?.paymentModeData;
  const isEdit = !!paymentModeData;

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);

  // Add / Edit form initialization
  useEffect(() => {
    if (paymentModeData) {
      setForm({
        name: paymentModeData.name || '',
        isActive: paymentModeData.isActive !== false,
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
  }, [paymentModeData]);

  // Update form fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: key === 'isActive' ? value === 'Active' : value,
    }));
  };

  // Save / Update Payment Mode
  const handleSave = async () => {
    if (loading) return;

    if (!form.name.trim()) {
      Alert.alert('Validation Error', 'Please enter Mode Of Payment.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      isActive: form.isActive,
    };

    setLoading(true);

    try {
      let result;

      if (isEdit) {
        const id = paymentModeData?._id || paymentModeData?.id;

        if (!id) {
          Alert.alert('Error', 'Payment Mode ID not found.');
          return;
        }

        result = await updatePaymentMode(id, payload);
      } else {
        result = await createPaymentMode(payload);
      }

      const success =
        result?.success === true ||
        result?.statusCode === 200 ||
        result?.statusCode === 201 ||
        result?.data?.success === true;

      if (success) {
        Alert.alert(
          'Success',
          isEdit
            ? 'Mode Of Payment updated successfully!'
            : 'Mode Of Payment added successfully!',
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
      console.error('Payment Mode Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save Mode Of Payment.',
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
          title={isEdit ? 'Edit Mode Of Payment' : 'Add Mode Of Payment'}
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
                {/* Mode Of Payment */}
                <Label text="Mode Of Payment *" />

                <TextField
                  placeholder="e.g. Cash, UPI, Bank Transfer"
                  value={form.name}
                  onChangeText={text => updateField('name', text)}
                  style={styles.mb}
                  editable={!loading}
                />

                {/* Status */}
                <Label text="Status" />

                <Dropdown
                  value={form.isActive ? 'Active' : 'Inactive'}
                  options={STATUS_OPTIONS}
                  onSelect={value => updateField('isActive', value)}
                  style={styles.mb}
                  enabled={!loading}
                />

                {/* Action Buttons */}
                <View style={styles.btnRow}>
                  <GrayButton
                    title="Cancel"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelBtn}
                    disabled={loading}
                  />

                  <GreenButton
                    title={loading ? '' : isEdit ? 'Update' : 'Save'}
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
    marginTop: 20,
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

export default AddPaymentModeScreen;

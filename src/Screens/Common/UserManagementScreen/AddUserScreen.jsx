import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

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
import { createStaff } from '../../../api/userManagement';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const ROLE_OPTIONS = ['Admin', 'Office Bearers', 'OfficeStaff'];

const INITIAL_FORM = {
  userId: '',
  fullName: '',
  phone: '',
  email: '',
  gender: 'Male',
  role: 'OfficeStaff',
  password: '',
};

const AddUserScreen = ({ navigation }) => {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    Keyboard.dismiss();
  };

  const handleCreate = async () => {
    if (loading) return;

    if (!form.userId.trim()) {
      Alert.alert('Validation Error', 'Please enter User ID.');
      return;
    }

    if (!form.fullName.trim()) {
      Alert.alert('Validation Erxror', 'Please enter Full Name.');
      return;
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid 10-digit mobile number.',
      );
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (form.password.trim().length < 4) {
      Alert.alert(
        'Validation Error',
        'Password must be at least 4 characters.',
      );
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const payload = {
        name: form.fullName.trim(),
        userId: form.userId.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        gender: form.gender,
        role: form.role,
        password: form.password.trim(),
        isSuspended: false,
      };

      const result = await createStaff(payload);

      if (result?.success === false) {
        Alert.alert('Error', result?.message || 'Failed to create user.');
        return;
      }

      // Clear form
      resetForm();

      // Navigate back after successful creation
      Alert.alert('Success', 'User created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.log('Create User Error:', error?.response?.data || error.message);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to create user.',
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
          title="Add New User"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <Body>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* User ID */}
                <Label text="User ID *" />

                <TextField
                  placeholder="e.g. OR2630"
                  value={form.userId}
                  onChangeText={t => updateField('userId', t)}
                  editable={!loading}
                  style={styles.mb}
                />

                {/* Full Name */}
                <Label text="Full Name *" />

                <TextField
                  placeholder="Enter full name"
                  value={form.fullName}
                  onChangeText={t => updateField('fullName', t)}
                  editable={!loading}
                  style={styles.mb}
                />

                {/* Phone and Email */}
                <View style={[shared.row, styles.gapRow]}>
                  <View style={shared.colL}>
                    <Label text="Phone *" />

                    <TextField
                      placeholder="10-digit mobile"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={form.phone}
                      onChangeText={t =>
                        updateField('phone', t.replace(/\D/g, '').slice(0, 10))
                      }
                      editable={!loading}
                    />
                  </View>

                  <View style={shared.col}>
                    <Label text="Email" />

                    <TextField
                      placeholder="email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={form.email}
                      onChangeText={t => updateField('email', t)}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Gender and Role */}
                <View style={[shared.row, styles.gapRow]}>
                  <View style={shared.colL}>
                    <Label text="Gender" />

                    <Dropdown
                      value={form.gender}
                      options={GENDER_OPTIONS}
                      onSelect={val => updateField('gender', val)}
                    />
                  </View>

                  <View style={shared.col}>
                    <Label text="Role *" />

                    <Dropdown
                      value={form.role}
                      options={ROLE_OPTIONS}
                      onSelect={val => updateField('role', val)}
                    />
                  </View>
                </View>

                {/* Password */}
                <Label text="Password * (Min 4 characters)" />

                <TextField
                  placeholder="Enter password"
                  secureTextEntry
                  value={form.password}
                  onChangeText={t => updateField('password', t)}
                  editable={!loading}
                  style={styles.mb}
                />

                {/* Submit Button */}
                <View style={styles.btnContainer}>
                  <GreenButton
                    title={loading ? 'Creating...' : 'Create User'}
                    icon="check"
                    onPress={handleCreate}
                    disabled={loading}
                    style={styles.submitBtn}
                  />
                </View>

                {/* Loading */}
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}
              </ScrollView>
            </Body>
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
    overflow: 'hidden',
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: 30,
    paddingBottom: 40,
  },

  gapRow: {
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 10,
  },

  mb: {
    marginBottom: 16,
  },

  btnContainer: {
    marginTop: 20,
    marginBottom: 20,
  },

  submitBtn: {
    height: 50,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    zIndex: 10,
  },
});

export default AddUserScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
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
  TextField as InputField,
  Dropdown,
  DateField,
  GreenButton,
  GrayButton,
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { createMember, fetchMemberSuggestions } from '../../../../api/member';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STEPS = [
  { no: 1, title: 'Basic Info' },
  { no: 2, title: 'Contact' },
  { no: 3, title: 'Address' },
  { no: 4, title: 'Status' },
];

const MEMBER_TYPES = [
  'Ordinary Member',
  'Life Member',
  'Dawami Member',
  'Sarparast Member',
  'Mohsine Member',
];

const STATUS_OPTIONS = ['Active', 'Suspended', 'Expired'];

const AddMembershipApplicationScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [introducersLoading, setIntroducersLoading] = useState(true);
  const [introducersList, setIntroducersList] = useState([]);
  const [introducerOptions, setIntroducerOptions] = useState([]);

  const [form, setForm] = useState({
    wmrn: 'AUTO-GEN-2026-001',
    accountNo: '',
    membershipDate: new Date(),
    renewDate: null,
    fullName: '',
    fatherName: '',
    memberType: 'Ordinary Member',
    mobile: '',
    whatsapp: '',
    isSameWhatsapp: true,
    email: '',
    citizenship: 'Indian',
    state: '',
    city: '',
    postOffice: '',
    postalCode: '',
    address: '',
    status: 'Active',
    introducedBy: '',
  });

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Load introducers on mount
  useEffect(() => {
    loadIntroducers();
  }, []);

  // Fetch and prepare introducer dropdown data
  const loadIntroducers = async () => {
    try {
      setIntroducersLoading(true);

      const result = await fetchMemberSuggestions('');

      if (result.success && result.members) {
        // Remove duplicate members
        const uniqueMembers = new Map();

        result.members.forEach(member => {
          const uniqueKey = member?._id || member?.memberId;

          if (!uniqueKey || uniqueMembers.has(uniqueKey)) {
            return;
          }

          uniqueMembers.set(uniqueKey, {
            fullName: member.fullName || '',
            memberId: member.memberId || '',
            _id: member._id,
          });
        });

        const normalizedMembers = Array.from(uniqueMembers.values()).filter(
          member => member.fullName && member.memberId,
        );

        // Prepare dropdown options only once
        const dropdownOptions = normalizedMembers.map(
          member => `${member.memberId} - ${member.fullName}`,
        );

        setIntroducersList(normalizedMembers);
        setIntroducerOptions(dropdownOptions);

        console.log('✅ Introducers loaded:', normalizedMembers.length);
      }
    } catch (err) {
      console.error('❌ Error loading introducers:', err);
    } finally {
      setIntroducersLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!form.fullName.trim()) {
        Alert.alert('Validation Error', 'Please enter Full Name.');
        return;
      }
    } else if (currentStep === 2) {
      if (!form.mobile.trim() || form.mobile.length < 10) {
        Alert.alert(
          'Validation Error',
          'Please enter a valid 10-digit mobile number.',
        );
        return;
      }
    }

    if (currentStep < 4) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(prev => prev - 1);
    } else {
      navigation && navigation.goBack();
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const memberData = {
        acountNo: form.accountNo || '',
        membershipDate: form.membershipDate,
        renewDate: form.renewDate,
        fullName: form.fullName,
        fatherName: form.fatherName || '',
        memberType: form.memberType,
        mobileNumber: form.mobile,
        whatsappNumber: form.whatsapp,
        email: form.email || '',
        citizenship: form.citizenship || 'Indian',
        state: form.state || '',
        city: form.city || '',
        postOffice: form.postOffice || '',
        postalCode: form.postalCode || '',
        residentialAddress: form.address || '',
        status: form.status,
        introducedBy: form.introducedBy || '',
      };

      const result = await createMember(memberData);

      if (result.success) {
        Alert.alert('Success', 'Membership application added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation && navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to create membership');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving membership');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Add Membership Application"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Body>
                {/* Multi-step Header Indicator */}
                <View style={styles.stepperRow}>
                  {STEPS.map(s => {
                    const isActive = currentStep === s.no;
                    const isPassed = currentStep > s.no;

                    return (
                      <View key={s.no} style={styles.stepItem}>
                        <View
                          style={[
                            styles.stepCircle,
                            isActive && styles.stepCircleActive,
                            isPassed && styles.stepCirclePassed,
                          ]}
                        >
                          {isPassed ? (
                            <Icon name="check" size={14} color={colors.white} />
                          ) : (
                            <Text
                              style={[
                                styles.stepNoText,
                                (isActive || isPassed) &&
                                  styles.stepNoTextActive,
                              ]}
                            >
                              {s.no}
                            </Text>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.stepTitleText,
                            isActive && styles.stepTitleTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {s.title}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* ================= STEP 1: BASIC INFO ================= */}
                {currentStep === 1 && (
                  <View>
                    <Text style={styles.sectionHeading}>Basic Information</Text>

                    <View style={[shared.row, styles.gapRow]}>
                      <View style={shared.colL}>
                        <Label text="WMRN Number" />
                        <InputField
                          value={form.wmrn}
                          editable={false}
                          style={styles.disabledInput}
                        />
                      </View>

                      <View style={shared.col}>
                        <Label text="Account Number" />
                        <InputField
                          placeholder="Enter account no"
                          value={form.accountNo}
                          onChangeText={t => updateField('accountNo', t)}
                        />
                      </View>
                    </View>

                    <View style={[shared.row, styles.gapRow]}>
                      <View style={shared.colL}>
                        <Label text="Membership Date" />
                        <DateField
                          value={form.membershipDate}
                          onChange={d => updateField('membershipDate', d)}
                          leftIcon="calendar-month-outline"
                          hideRightIcon
                        />
                      </View>

                      <View style={shared.col}>
                        <Label text="Renew Date" />
                        <DateField
                          value={form.renewDate}
                          onChange={d => updateField('renewDate', d)}
                          leftIcon="calendar-month-outline"
                          hideRightIcon
                        />
                      </View>
                    </View>

                    <Label text="Full Name *" />
                    <InputField
                      placeholder="Type or select member name"
                      value={form.fullName}
                      onChangeText={t => updateField('fullName', t)}
                      style={styles.mb}
                    />

                    <Label text="Father / Husband Name" />
                    <InputField
                      placeholder="Enter name"
                      value={form.fatherName}
                      onChangeText={t => updateField('fatherName', t)}
                      style={styles.mb}
                    />

                    <Label text="Member Type *" />
                    <Dropdown
                      value={form.memberType}
                      options={MEMBER_TYPES}
                      onSelect={val => updateField('memberType', val)}
                      style={styles.mb}
                    />
                  </View>
                )}

                {/* ================= STEP 2: CONTACT DETAILS ================= */}
                {currentStep === 2 && (
                  <View>
                    <Text style={styles.sectionHeading}>Contact Details</Text>

                    <View style={[shared.row, styles.gapRow]}>
                      <View style={shared.colL}>
                        <Label text="Mobile Number *" />
                        <InputField
                          placeholder="10-digit mobile"
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={form.mobile}
                          onChangeText={t => {
                            updateField('mobile', t);

                            if (form.isSameWhatsapp) {
                              updateField('whatsapp', t);
                            }
                          }}
                        />
                      </View>

                      <View style={shared.col}>
                        <View style={styles.whatsappLabelRow}>
                          <Label text="WhatsApp Number" />

                          <TouchableOpacity
                            onPress={() => {
                              const newVal = !form.isSameWhatsapp;

                              setForm(prev => ({
                                ...prev,
                                isSameWhatsapp: newVal,
                                whatsapp: newVal ? prev.mobile : '',
                              }));
                            }}
                          >
                            <Text style={styles.sameToggleText}>
                              {form.isSameWhatsapp
                                ? '✓ Same as mobile'
                                : 'Make same'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <InputField
                          placeholder="WhatsApp number"
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={form.whatsapp}
                          editable={!form.isSameWhatsapp}
                          onChangeText={t => updateField('whatsapp', t)}
                        />
                      </View>
                    </View>

                    <Label text="Email" />
                    <InputField
                      placeholder="email@example.com"
                      keyboardType="email-address"
                      value={form.email}
                      onChangeText={t => updateField('email', t)}
                      style={styles.mb}
                    />
                  </View>
                )}

                {/* ================= STEP 3: ADDRESS DETAILS ================= */}
                {currentStep === 3 && (
                  <View>
                    <Text style={styles.sectionHeading}>Address Details</Text>

                    <View style={[shared.row, styles.gapRow]}>
                      <View style={shared.colL}>
                        <Label text="Citizenship" />
                        <InputField
                          placeholder="Indian"
                          value={form.citizenship}
                          onChangeText={t => updateField('citizenship', t)}
                        />
                      </View>

                      <View style={shared.col}>
                        <Label text="State" />
                        <InputField
                          placeholder="Enter state"
                          value={form.state}
                          onChangeText={t => updateField('state', t)}
                        />
                      </View>
                    </View>

                    <View style={[shared.row, styles.gapRow]}>
                      <View style={shared.colL}>
                        <Label text="City" />
                        <InputField
                          placeholder="Enter city"
                          value={form.city}
                          onChangeText={t => updateField('city', t)}
                        />
                      </View>

                      <View style={shared.col}>
                        <Label text="Post Office" />
                        <InputField
                          placeholder="Enter post office"
                          value={form.postOffice}
                          onChangeText={t => updateField('postOffice', t)}
                        />
                      </View>
                    </View>

                    <Label text="Postal Code" />
                    <InputField
                      placeholder="Enter postal code"
                      keyboardType="numeric"
                      maxLength={6}
                      value={form.postalCode}
                      onChangeText={t => updateField('postalCode', t)}
                      style={styles.mb}
                    />

                    <Label text="Residential Address" />
                    <InputField
                      placeholder="Enter complete residential address"
                      multiline
                      numberOfLines={3}
                      value={form.address}
                      onChangeText={t => updateField('address', t)}
                      style={[styles.mb, styles.addressInput]}
                    />
                  </View>
                )}

                {/* ================= STEP 4: STATUS & SUBMISSION ================= */}
                {currentStep === 4 && (
                  <View>
                    <Text style={styles.sectionHeading}>
                      Status & Reference
                    </Text>

                    {/* Status Row */}
                    <Label text="Status" />
                    <Dropdown
                      value={form.status}
                      options={STATUS_OPTIONS}
                      onSelect={val => updateField('status', val)}
                      style={styles.mb}
                    />

                    {/* Introduced By Row */}
                    <Label text="Introduced By" />

                    <View style={styles.introducerContainer}>
                      <Dropdown
                        value={form.introducedBy}
                        placeholder={
                          introducersLoading
                            ? 'Loading members...'
                            : introducerOptions.length > 0
                            ? 'Select introducer'
                            : 'No members available'
                        }
                        options={introducerOptions}
                        onSelect={displayName => {
                          const introducer = introducersList.find(
                            m =>
                              `${m.memberId} - ${m.fullName}` === displayName,
                          );

                          updateField(
                            'introducedBy',
                            introducer?.fullName || displayName,
                          );
                        }}
                        searchable
                      />

                      {introducersLoading && (
                        <View style={styles.loaderOverlay}>
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </Body>
            </ScrollView>

            {/* Footer Navigation Buttons */}
            <View style={shared.footer}>
              <GrayButton
                title={currentStep === 1 ? 'Cancel' : '← Back'}
                onPress={handleBackStep}
                disabled={loading}
                style={styles.cancelBtn}
              />

              <GreenButton
                title={
                  loading
                    ? 'Saving...'
                    : currentStep === 4
                    ? 'Save Membership Application'
                    : 'Next →'
                }
                icon={currentStep === 4 && !loading ? 'check' : undefined}
                onPress={handleNext}
                disabled={loading}
                style={styles.nextBtn}
              />
            </View>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 14,
    paddingBottom: 24,
    marginTop: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: colors.primary || '#2E8B3E',
  },
  stepCirclePassed: {
    backgroundColor: colors.success || '#10B981',
  },
  stepNoText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  stepNoTextActive: {
    color: colors.white,
  },
  stepTitleText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepTitleTextActive: {
    fontFamily: FontFamily.bold,
    color: colors.primary || '#2E8B3E',
  },
  sectionHeading: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 12,
  },
  gapRow: {
    marginBottom: 12,
  },
  mb: {
    marginBottom: 12,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  whatsappLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sameToggleText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  addressInput: {
    height: 75,
    textAlignVertical: 'top',
  },
  introducerContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    right: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  cancelBtn: {
    flex: 1,
    marginRight: 10,
  },
  nextBtn: {
    flex: 1.6,
  },
});

export default AddMembershipApplicationScreen;

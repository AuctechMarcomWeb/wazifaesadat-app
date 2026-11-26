import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import {
  CountryPicker,
  StatePicker,
  CityPicker,
} from 'react-native-country-state-city-picker';
import PayUCheckout from '../../components/Payments/PayUCheckout';
import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import { Body } from '../../components/Formparts';
import { getFundTypes, createPayuDonation } from '../../api/donation';
import { BASE_URL } from '../../api/apiConfig';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const INDIA = { name: 'India', isoCode: 'IN', flag: '🇮🇳' };

const getFundAmount = fund => {
  const amt = Number(fund?.amount);
  return !Number.isNaN(amt) && amt > 0 ? amt : 0;
};

const normalizeLocation = val => {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed
      ? {
          name: trimmed,
          isoCode: trimmed.toLowerCase() === 'india' ? 'IN' : '',
        }
      : null;
  }
  const name = String(
    val.name || val.label || val.country || val.state || val.city || '',
  ).trim();
  const isoCode = String(
    val.isoCode || val.code || val.countryCode || val.stateCode || '',
  ).trim();
  if (!name && !isoCode) return null;
  return {
    ...val,
    name: name || isoCode,
    isoCode: isoCode || (name.toLowerCase() === 'india' ? 'IN' : ''),
  };
};

/* ---------- Reusable UI ---------- */

const Field = ({ label, inputStyle, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, inputStyle]}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  </View>
);

const SelectField = ({ label, value, placeholder, disabled, onPress }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      style={[styles.input, styles.select, disabled && styles.disabled]}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        style={[styles.selectText, !value && styles.placeholder]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      <Icon name="chevron-down" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

const FundSheet = ({ visible, funds, selectedId, onSelect, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select Fund Type</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={funds}
          keyExtractor={(item, index) => `fund-${item._id}-${index}`}
          renderItem={({ item }) => {
            const active = item._id === selectedId;
            const fundAmt = getFundAmount(item);
            return (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View style={styles.optionLeft}>
                  <Text
                    style={[styles.optionText, active && styles.optionActive]}
                  >
                    {item.title}
                  </Text>
                  {fundAmt > 0 && (
                    <Text style={styles.optionMeta}>
                      ₹{fundAmt.toLocaleString('en-IN')}
                      {item.contributeType ? ` · ${item.contributeType}` : ''}
                    </Text>
                  )}
                </View>
                {active && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  </Modal>
);

/* ---------- Screen ---------- */

const DonationFormScreen = ({ navigation }) => {
  const reduxUser = useSelector(
    state => state?.user?.user || state?.auth?.user,
  );

  const [step, setStep] = useState(1);
  const [fundPickerVisible, setFundPickerVisible] = useState(false);

  const [fundTypes, setFundTypes] = useState([]);
  const [loadingFunds, setLoadingFunds] = useState(true);

  // Step 1
  const [selectedFundId, setSelectedFundId] = useState('');
  const [contributeType, setContributeType] = useState('One-time');
  const [amount, setAmount] = useState('');
  const [pan, setPan] = useState('');

  // Step 2
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState(INDIA);
  const [stateValue, setStateValue] = useState(null);
  const [city, setCity] = useState(null);
  const [pinCode, setPinCode] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (reduxUser) {
      setName(prev => prev || reduxUser.name || '');
      setPhone(prev => prev || reduxUser.phone || reduxUser.mobileNumber || '');
      setEmail(prev => prev || reduxUser.email || '');
      setAddress(prev => prev || reduxUser.address || '');
      if (reduxUser.country) {
        const normalizedCountry = normalizeLocation(reduxUser.country);
        if (normalizedCountry) {
          setCountry(prev => (prev?.isoCode ? prev : normalizedCountry));
        }
      }
      if (
        reduxUser.state &&
        typeof reduxUser.state === 'object' &&
        reduxUser.state.isoCode
      ) {
        setStateValue(prev => prev || normalizeLocation(reduxUser.state));
      }
      if (reduxUser.city) {
        setCity(prev => prev || normalizeLocation(reduxUser.city));
      }
      setPinCode(prev => prev || String(reduxUser.pinCode || ''));
    }
  }, [reduxUser]);

  useEffect(() => {
    let mounted = true;
    const loadFundTypes = async () => {
      setLoadingFunds(true);
      try {
        const res = await getFundTypes();
        if (!mounted) return;

        const list = Array.isArray(res?.data?.fundTypes)
          ? res.data.fundTypes
          : Array.isArray(res?.fundTypes)
          ? res.fundTypes
          : [];

        const activeList = list
          .filter(item => item?.isActive !== false)
          .sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));

        setFundTypes(activeList);

        if (activeList.length > 0) {
          const first = activeList[0];
          const firstAmount = getFundAmount(first);
          setSelectedFundId(first._id);
          setAmount(firstAmount > 0 ? String(firstAmount) : '');
          setContributeType(first.contributeType || 'One-time');
        }
      } catch (err) {
        if (mounted) {
          Alert.alert('Error', err?.message || 'Could not load fund types.');
        }
      } finally {
        if (mounted) setLoadingFunds(false);
      }
    };

    loadFundTypes();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- Derived ---------- */

  const selectedFund = useMemo(
    () => fundTypes.find(item => item._id === selectedFundId) || null,
    [fundTypes, selectedFundId],
  );

  const presetFundAmount = getFundAmount(selectedFund);
  const hasFixedAmount = presetFundAmount > 0;

  const rawAmount = Number(amount);
  const safeAmount = Number.isNaN(rawAmount) || rawAmount < 0 ? 0 : rawAmount;
  const requiresPan = !Number.isNaN(rawAmount) && rawAmount > 2000;

  /* ---------- Handlers ---------- */

  const handleSelectFund = fund => {
    const fundAmt = getFundAmount(fund);
    setSelectedFundId(fund._id);
    setAmount(fundAmt > 0 ? String(fundAmt) : '');
    setContributeType(fund.contributeType || 'One-time');
  };

  const handleCountryChange = value => {
    const normalized = normalizeLocation(value);
    setCountry(normalized);
    setStateValue(null);
    setCity(null);
  };

  const handleStateChange = value => {
    const normalized = normalizeLocation(value);
    setStateValue(normalized);
    setCity(null);
  };

  const handleCityChange = value => {
    const normalized = normalizeLocation(value);
    setCity(normalized);
  };

  const handlePanChange = text => {
    const upper = String(text || '')
      .toUpperCase()
      .replace(/\s+/g, '');
    setPan(upper);
  };

  const validateStepOne = () => {
    if (!selectedFundId) {
      Alert.alert('Validation', 'Please select a fund type.');
      return false;
    }
    if (!amount.trim() || Number.isNaN(rawAmount) || rawAmount <= 0) {
      Alert.alert('Validation', 'Please enter a valid donation amount.');
      return false;
    }
    if (requiresPan && !PAN_REGEX.test(pan.trim().toUpperCase())) {
      Alert.alert(
        'PAN Required',
        'For donations above ₹2,000, please enter a valid PAN (e.g. ABCDE1234F).',
      );
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    const checks = [
      [name.trim(), 'Please enter donor name.'],
      [
        /^\d{10}$/.test(phone.trim()),
        'Please enter a valid 10-digit phone number.',
      ],
      [email.trim().includes('@'), 'Please enter a valid email address.'],
      [address.trim(), 'Please enter address.'],
      [country?.name, 'Please select a country.'],
      [stateValue?.name, 'Please select a state.'],
      [city?.name, 'Please select a city.'],
      [
        /^\d{6}$/.test(pinCode.trim()),
        'Please enter a valid 6-digit pin code.',
      ],
    ];
    const failed = checks.find(([valid]) => !valid);
    if (failed) {
      Alert.alert('Validation', failed[1]);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStepOne()) setStep(2);
  };

  const buildPayload = () => ({
    fundType: selectedFundId,
    contributeType,
    amount: rawAmount,
    pan: requiresPan ? pan.trim().toUpperCase() : '',
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    address: address.trim(),
    country: country?.name || '',
    state: stateValue?.name || '',
    city: city?.name || '',
    pinCode: pinCode.trim(),
  });

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateStepOne()) {
      setStep(1);
      return;
    }
    if (!validateStepTwo()) return;

    const payload = buildPayload();
    setSubmitting(true);

    try {
      // Create PayU donation and open checkout
      const res = await createPayuDonation(payload);

      if (res?.success) {
        const payuData = res?.data?.payuData;

        if (payuData) {
          console.log('💳 Opening PayU checkout with params:', payuData);
          
          // Open native PayU checkout using the SDK
          openPayment(payuData);
        } else {
          Alert.alert(
            'Error',
            res?.message || 'PayU parameters not available',
          );
        }
      } else {
        Alert.alert(
          'Error',
          res?.message || 'Could not initiate PayU donation.',
        );
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err?.message || 'Something went wrong while processing donation.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // PayU Checkout Setup
  const { openPayment } = PayUCheckout({
    backendUrl: BASE_URL,  // Use configured BASE_URL from apiConfig
    onSuccess: event => {
      console.log('✅ PayU Payment Success:', event);
      setSubmitting(false);
      Alert.alert('Success', 'Payment completed successfully!', [
        { text: 'OK', onPress: () => navigation?.goBack() },
      ]);
    },

    onFailure: event => {
      console.log('❌ PayU Payment Failure:', event);
      setSubmitting(false);
      Alert.alert('Payment Failed', 'Payment was unsuccessful. Please try again.', [
        { text: 'OK', onPress: () => {} },
      ]);
    },

    onCancel: () => {
      console.log('⚠️ PayU Payment Cancelled');
      setSubmitting(false);
      Alert.alert('Cancelled', 'Payment was cancelled by user.', [
        { text: 'OK', onPress: () => {} },
      ]);
    },

    onError: error => {
      console.log('⚠️ PayU Payment Error:', error);
      setSubmitting(false);
      Alert.alert('Error', 'Unable to process payment. Please try again.', [
        { text: 'OK', onPress: () => {} },
      ]);
    },
  });

  /* ---------- UI ---------- */

  const selectedCountryCode = country?.isoCode || '';
  const selectedStateCode = stateValue?.isoCode || '';

  return (
    <AppLayout>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <BackHeader
            navigation={navigation}
            title="Donation Form"
            onBack={() => (step === 2 ? setStep(1) : navigation?.goBack())}
            style={styles.headerBar}
            headerStyle={styles.headerBar}
            titleStyle={styles.headerTitle}
          />
        </View>

        <View style={styles.body}>
          <Body>
            {loadingFunds ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loaderText}>Loading...</Text>
              </View>
            ) : (
              <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                {/* Progress */}
                <View style={styles.progressWrap}>
                  <Text style={styles.stepText}>Step {step} of 2</Text>
                  <Text style={styles.heading}>
                    {step === 1 ? 'Your Donation' : 'Your Details'}
                  </Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.bar, styles.barActive]} />
                    <View
                      style={[styles.bar, step === 2 && styles.barActive]}
                    />
                  </View>
                </View>

                <ScrollView
                  key={step}
                  style={styles.flex}
                  contentContainerStyle={styles.content}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {step === 1 ? (
                    <>
                      <SelectField
                        label="Fund Type"
                        value={selectedFund?.title}
                        placeholder="Select fund type"
                        onPress={() => setFundPickerVisible(true)}
                      />

                      <Text style={styles.label}>Amount</Text>
                      <View
                        style={[
                          styles.amountBox,
                          hasFixedAmount && styles.amountBoxLocked,
                        ]}
                      >
                        <Text style={styles.rupee}>₹</Text>
                        <TextInput
                          style={styles.amountInput}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          editable={!hasFixedAmount}
                          value={amount}
                          onChangeText={setAmount}
                        />
                      </View>

                      {hasFixedAmount ? (
                        <Text style={styles.hint}>
                          Fixed amount for {selectedFund?.title}
                          {selectedFund?.contributeType
                            ? ` (${selectedFund.contributeType})`
                            : ''}
                        </Text>
                      ) : (
                        <View style={styles.chipRow}>
                          {QUICK_AMOUNTS.map(value => {
                            const active = rawAmount === value;
                            return (
                              <TouchableOpacity
                                key={value}
                                style={[
                                  styles.chip,
                                  active && styles.chipActive,
                                ]}
                                activeOpacity={0.75}
                                onPress={() => setAmount(String(value))}
                              >
                                <Text
                                  style={[
                                    styles.chipText,
                                    active && styles.chipTextActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  ₹{value.toLocaleString('en-IN')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {requiresPan && (
                        <>
                          <Field
                            label="PAN Number"
                            placeholder="ABCDE1234F"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={10}
                            inputStyle={styles.panInput}
                            value={pan}
                            onChangeText={handlePanChange}
                          />
                          <Text style={styles.hint}>
                            Required for donations above ₹2,000
                          </Text>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Field
                        label="Full Name"
                        placeholder="Enter your name"
                        value={name}
                        onChangeText={setName}
                      />
                      <Field
                        label="Phone Number"
                        placeholder="10-digit mobile number"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={setPhone}
                      />
                      <Field
                        label="Email"
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                      <Field
                        label="Address"
                        placeholder="Street / Locality / Area"
                        value={address}
                        onChangeText={setAddress}
                      />
                      <CountryPicker
                        value={country}
                        onChange={handleCountryChange}
                        onSelect={handleCountryChange}
                        placeholder="Select country"
                        style={styles.picker}
                        labelStyle={styles.pickerLabel}
                        inputStyle={styles.input}
                        labels={{
                          countryLabel: 'Country',
                          countryPlaceholder: 'Select country',
                          searchPlaceholder: 'Search country...',
                        }}
                      />
                      <StatePicker
                        key={`state-${selectedCountryCode}`}
                        value={stateValue}
                        onChange={handleStateChange}
                        onSelect={handleStateChange}
                        countryCode={selectedCountryCode}
                        disabled={!selectedCountryCode}
                        placeholder="Select state"
                        style={[
                          styles.picker,
                          !selectedCountryCode && styles.disabled,
                        ]}
                        labelStyle={styles.pickerLabel}
                        inputStyle={styles.input}
                        labels={{
                          stateLabel: 'State',
                          statePlaceholder: 'Select state',
                          searchPlaceholder: 'Search state...',
                        }}
                      />
                      <CityPicker
                        key={`city-${selectedCountryCode}-${selectedStateCode}`}
                        value={city}
                        onChange={handleCityChange}
                        onSelect={handleCityChange}
                        countryCode={selectedCountryCode}
                        stateCode={selectedStateCode}
                        disabled={!selectedCountryCode || !selectedStateCode}
                        placeholder="Select city"
                        style={[
                          styles.picker,
                          (!selectedCountryCode || !selectedStateCode) &&
                            styles.disabled,
                        ]}
                        labelStyle={styles.pickerLabel}
                        inputStyle={styles.input}
                        labels={{
                          cityLabel: 'City',
                          cityPlaceholder: 'Select city',
                          searchPlaceholder: 'Search city...',
                        }}
                      />
                      <Field
                        label="Pin Code"
                        placeholder="6-digit pin code"
                        keyboardType="numeric"
                        maxLength={6}
                        value={pinCode}
                        onChangeText={setPinCode}
                      />
                    </>
                  )}
                </ScrollView>

                {/* Bottom button */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.button, submitting && styles.disabled]}
                    activeOpacity={0.85}
                    disabled={submitting}
                    onPress={step === 1 ? handleNextStep : handleSubmit}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>
                        {step === 1
                          ? 'Continue'
                          : `Donate ₹${safeAmount.toLocaleString(
                              'en-IN',
                            )} via PayU`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}
          </Body>
        </View>

        <FundSheet
          visible={fundPickerVisible}
          funds={fundTypes}
          selectedId={selectedFundId}
          onSelect={handleSelectFund}
          onClose={() => setFundPickerVisible(false)}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, width: '100%', backgroundColor: colors.white },
  headerContainer: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 14,
  },
  headerBar: {
    minHeight: 44,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 24,
    paddingVertical: 2,
    color: colors.white,
  },
  body: { flex: 1, width: '100%', backgroundColor: colors.white },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loaderText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  progressWrap: { paddingHorizontal: 18, paddingTop: 18 },
  stepText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 2,
  },
  progressRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  barActive: { backgroundColor: colors.primary },

  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24 },
  field: { marginBottom: 2 },
  picker: { marginTop: 14 },
  pickerLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    backgroundColor: '#F9FAFB',
  },
  panInput: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FontFamily.semiBold,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
  },
  placeholder: { color: '#9CA3AF' },
  disabled: { opacity: 0.5 },

  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
  },
  amountBoxLocked: {
    backgroundColor: '#F3F4F6',
  },
  rupee: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 28,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#F0FDF4' },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.primary, fontFamily: FontFamily.bold },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 6,
  },

  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: colors.white,
  },
  button: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },

  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionLeft: {
    flex: 1,
    paddingRight: 10,
  },
  optionText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.TitleColor,
  },
  optionActive: { color: colors.primary, fontFamily: FontFamily.bold },
  optionMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default DonationFormScreen;

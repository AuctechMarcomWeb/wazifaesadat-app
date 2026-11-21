import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';
import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  TextField,
  Dropdown,
  DateField,
  GreenButton,
  GrayButton,
  shared,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  getCollectors,
  getPaymentModes,
  getFundTypes,
  createPaymentEntry,
  preparePaymentPayload,
  formatCollectorsForDisplay,
  formatFundTypesForDisplay,
} from '../../../../api/collection';

const STEPS = [
  { no: 1, title: 'Transaction' },
  { no: 2, title: 'Amounts' },
  { no: 3, title: 'Donor Info' },
  { no: 4, title: 'Remarks' },
];

const newFund = () => ({
  id: String(Date.now() + Math.random()),
  type: '',
  amount: '',
});

// Wraps an input/dropdown and shows a loader inside the box (right side) while loading
const FieldLoader = ({ loading, height = 48, style, children }) => (
  <View style={style}>
    {children}

    {loading && (
      <View pointerEvents="none" style={[styles.fieldLoader, { height }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )}
  </View>
);

const ReceivePaymentScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [date, setDate] = useState(new Date());
  const [regNo, setRegNo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [tallyNo, setTallyNo] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [collectedByMemberId, setCollectedByMemberId] = useState('');
  const [method, setMethod] = useState('');
  const [funds, setFunds] = useState([newFund()]);

  const [anonymous, setAnonymous] = useState(false);
  const [member, setMember] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberType, setMemberType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  // API data states
  const [collectors, setCollectors] = useState([]);
  const [collectorsList, setCollectorsList] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [fundTypes, setFundTypes] = useState([]);
  const [fundTypesList, setFundTypesList] = useState([]);

  // Individual loading states for dropdowns
  const [loadingStates, setLoadingStates] = useState({
    collectors: true,
    paymentModes: true,
    fundTypes: true,
  });

  // Load API data on mount
  useEffect(() => {
    loadFormData();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Receive Payment screen focused - refreshing data');
      loadFormData();
    }, []),
  );

  const loadFormData = async () => {
    try {
      setLoadingStates({
        collectors: true,
        paymentModes: true,
        fundTypes: true,
      });

      const [collectorsRes, modesRes, fundsRes] = await Promise.all([
        getCollectors(),
        getPaymentModes(),
        getFundTypes(),
      ]);

      if (collectorsRes.success && collectorsRes.collectors) {
        console.log('✅ Collectors loaded:', collectorsRes.collectors.length);
        setCollectorsList(collectorsRes.collectors);
        const formatted = formatCollectorsForDisplay(collectorsRes.collectors);
        console.log('📋 Formatted collectors:', formatted);
        // Remove duplicates by keeping only first occurrence
        const seenNames = new Set();
        const uniqueCollectors = formatted.filter(c => {
          if (seenNames.has(c.displayName)) {
            return false;
          }
          seenNames.add(c.displayName);
          return true;
        });
        const collectorDisplayNames = uniqueCollectors.map(c => c.displayName);
        console.log(
          '🎯 Unique collectors for dropdown:',
          collectorDisplayNames,
        );
        setCollectors(collectorDisplayNames);
      } else {
        console.error('❌ Collectors API failed:', collectorsRes);
      }
      setLoadingStates(p => ({ ...p, collectors: false }));

      if (modesRes.success && modesRes.paymentModes) {
        console.log('✅ Payment modes loaded:', modesRes.paymentModes.length);
        setPaymentMethods(modesRes.paymentModes);
      } else {
        console.error('❌ Payment modes API failed:', modesRes);
      }
      setLoadingStates(p => ({ ...p, paymentModes: false }));

      if (fundsRes.success && fundsRes.fundTypes) {
        console.log('✅ Fund types loaded:', fundsRes.fundTypes.length);
        setFundTypesList(fundsRes.fundTypes);
        const formatted = formatFundTypesForDisplay(fundsRes.fundTypes);
        console.log('📋 Formatted fund types:', formatted);
        // Remove duplicates by keeping only first occurrence
        const seenNames = new Set();
        const uniqueFunds = formatted.filter(f => {
          if (seenNames.has(f.displayName)) {
            return false;
          }
          seenNames.add(f.displayName);
          return true;
        });
        const fundDisplayNames = uniqueFunds.map(f => f.displayName);
        console.log('🎯 Unique fund types for dropdown:', fundDisplayNames);
        setFundTypes(fundDisplayNames);
      } else {
        console.error('❌ Fund types API failed:', fundsRes);
      }
      setLoadingStates(p => ({ ...p, fundTypes: false }));
    } catch (error) {
      console.error('❌ Error loading form data:', error);
      Alert.alert('Error', 'Failed to load form data');
      setLoadingStates({
        collectors: false,
        paymentModes: false,
        fundTypes: false,
      });
    }
  };

  const handleMemberSelected = selectedMember => {
    if (!selectedMember) return;
    const code = selectedMember.memberId || selectedMember.uniqueId || 'N/A';
    const name = selectedMember.fullName || selectedMember.memberName || '';
    setMember(`${code} - ${name}`);
    setMemberCode(selectedMember.memberId || selectedMember.uniqueId);
    setMemberName(name);
    setMemberType(selectedMember.memberType || '');
    setCity(selectedMember.city || '');
    setAddress(
      selectedMember.residentialAddress || selectedMember.address || '',
    );
  };

  const openSelectMember = () => {
    navigation &&
      navigation.navigate('SelectMemberScreen', {
        onSelect: handleMemberSelected,
        selectedId: memberCode,
      });
  };

  const updateFund = (id, patch) =>
    setFunds(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));

  const removeFund = id =>
    setFunds(prev => (prev.length > 1 ? prev.filter(f => f.id !== id) : prev));

  const handleReset = () => {
    setDate(new Date());
    setRegNo('');
    setReceiptNo('');
    setTallyNo('');
    setCollectedBy('');
    setMethod('');
    setFunds([newFund()]);
    setAnonymous(false);
    setMember('');
    setAddress('');
    setCity('');
    setCountry('India');
    setRemarks('');
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!date) return Alert.alert('Required', 'Please select date');
      if (!collectedBy)
        return Alert.alert('Required', 'Please select collector');
      if (!method)
        return Alert.alert('Required', 'Please select payment method');
    } else if (currentStep === 2) {
      const validFunds = funds.filter(f => f.type && Number(f.amount) > 0);
      if (validFunds.length === 0) {
        return Alert.alert(
          'Required',
          'Please add at least one fund with amount',
        );
      }
    } else if (currentStep === 3) {
      if (!anonymous && !member) {
        return Alert.alert('Required', 'Please select a member');
      }
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigation && navigation.goBack();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateString = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const validFunds = funds.filter(f => f.type && Number(f.amount) > 0);

      const payload = preparePaymentPayload({
        date: dateString,
        regNo,
        receiptNo,
        tallyNo,
        collectedBy,
        collectedByMemberId,
        paymentMode: method,
        funds: validFunds.map(f => ({
          type: f.type,
          amount: f.amount,
        })),
        isAnonymous: anonymous,
        memberCode,
        memberName,
        memberType,
        address,
        city,
        country,
        remarks,
      });

      const result = await createPaymentEntry(payload);

      if (result.success) {
        Alert.alert('Success', 'Payment recorded successfully!', [
          {
            text: 'OK',
            onPress: () => {
              handleReset();
              navigation && navigation.navigate('Transactions');
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to save payment');
      }
    } catch (error) {
      console.error('❌ Error saving:', error);
      Alert.alert('Error', error.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Received Payment"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
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

                {/* ================= STEP 1: TRANSACTION DETAILS ================= */}
                {currentStep === 1 && (
                  <View>
                    <Text style={styles.sectionHeading}>
                      Transaction Details
                    </Text>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Date" required />
                        <DateField value={date} onChange={setDate} />
                      </View>

                      <View style={shared.col}>
                        <Label text="Reg No. (Wasool No)" />
                        <TextField
                          placeholder="Enter Reg / Wasool No"
                          value={regNo}
                          onChangeText={setRegNo}
                        />
                      </View>
                    </View>

                    <Label text="Receipt No." />
                    <TextField
                      placeholder="Enter Receipt No"
                      value={receiptNo}
                      onChangeText={setReceiptNo}
                      style={styles.gap}
                    />

                    <Label text="Tally No." />
                    <TextField
                      placeholder="Enter Tally No"
                      value={tallyNo}
                      onChangeText={setTallyNo}
                      style={styles.gap}
                    />

                    <Label text="Collected By" required />
                    <FieldLoader
                      loading={loadingStates.collectors}
                      style={styles.gap}
                    >
                      <Dropdown
                        value={collectedBy}
                        placeholder="Search collector by name..."
                        options={collectors}
                        onSelect={displayName => {
                          console.log(
                            '🔍 Selected collector:',
                            displayName,
                            'Available:',
                            collectors,
                          );
                          const formatted =
                            formatCollectorsForDisplay(collectorsList);
                          // Remove duplicates when searching
                          const seenNames = new Set();
                          const uniqueFormatted = formatted.filter(c => {
                            if (seenNames.has(c.displayName)) {
                              return false;
                            }
                            seenNames.add(c.displayName);
                            return true;
                          });
                          const collector = uniqueFormatted.find(
                            c => c.displayName === displayName,
                          );
                          setCollectedBy(displayName);
                          setCollectedByMemberId(collector?._id || '');
                        }}
                        searchable
                      />
                    </FieldLoader>

                    <Label text="Payment Method" required />
                    <FieldLoader loading={loadingStates.paymentModes}>
                      <Dropdown
                        value={method}
                        placeholder="Select Payment Method"
                        options={paymentMethods.map(m => m.name)}
                        onSelect={setMethod}
                      />
                    </FieldLoader>
                  </View>
                )}

                {/* ================= STEP 2: AMOUNT DETAILS ================= */}
                {currentStep === 2 && (
                  <View>
                    <Text style={styles.sectionHeading}>Amount Details</Text>

                    <View style={styles.tableHead}>
                      <Text style={[styles.headText, styles.hashCol]}>#</Text>
                      <Text style={[styles.headText, styles.typeCol]}>
                        Fund Type
                      </Text>
                      <Text style={[styles.headText, styles.amountCol]}>
                        Amount (Rs.)
                      </Text>
                      <View style={styles.deleteCol} />
                    </View>

                    {funds.map((f, index) => (
                      <View key={f.id} style={styles.fundRow}>
                        <Text style={[styles.hashText, styles.hashCol]}>
                          {index + 1}
                        </Text>

                        <View style={styles.typeCol}>
                          <FieldLoader
                            loading={loadingStates.fundTypes}
                            height={42}
                          >
                            <Dropdown
                              value={f.type}
                              placeholder="Search fund type..."
                              options={fundTypes}
                              onSelect={displayName => {
                                const formatted =
                                  formatFundTypesForDisplay(fundTypesList);
                                // Remove duplicates when searching
                                const seenNames = new Set();
                                const uniqueFormatted = formatted.filter(ft => {
                                  if (seenNames.has(ft.displayName)) {
                                    return false;
                                  }
                                  seenNames.add(ft.displayName);
                                  return true;
                                });
                                const fund = uniqueFormatted.find(
                                  ft => ft.displayName === displayName,
                                );
                                updateFund(f.id, {
                                  type: fund?._id || displayName,
                                  typeName: displayName,
                                });
                              }}
                              searchable
                              style={styles.smallField}
                            />
                          </FieldLoader>
                        </View>

                        <View style={styles.amountCol}>
                          <TextField
                            placeholder="Enter Amount"
                            value={f.amount}
                            onChangeText={v =>
                              updateFund(f.id, {
                                amount: v.replace(/[^0-9.]/g, ''),
                              })
                            }
                            keyboardType="numeric"
                            style={styles.smallField}
                          />
                        </View>

                        <TouchableOpacity
                          style={styles.deleteCol}
                          onPress={() => removeFund(f.id)}
                          disabled={funds.length === 1}
                        >
                          <Icon
                            name="trash-can-outline"
                            size={22}
                            color={funds.length === 1 ? '#F3B1B1' : '#E53935'}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}

                    <GreenButton
                      title="Add Fund"
                      icon="plus"
                      onPress={() => setFunds(prev => [...prev, newFund()])}
                      style={styles.addFund}
                    />
                  </View>
                )}

                {/* ================= STEP 3: DONOR DETAILS ================= */}
                {currentStep === 3 && (
                  <View>
                    <View style={styles.donorHeaderContainer}>
                      <Text style={styles.sectionHeading}>Donor Details</Text>
                      <TouchableOpacity
                        style={styles.anonRow}
                        activeOpacity={0.8}
                        onPress={() => setAnonymous(!anonymous)}
                      >
                        <View style={styles.anonBox}>
                          {anonymous && (
                            <Icon name="check" size={14} color="#2E7D32" />
                          )}
                        </View>
                        <Text style={styles.anonText}>Anonymous</Text>
                      </TouchableOpacity>
                    </View>

                    <Label text="Member" style={styles.noMargin} />

                    <View
                      style={[anonymous && styles.dim, styles.gap]}
                      pointerEvents={anonymous ? 'none' : 'auto'}
                    >
                      <TouchableOpacity
                        style={styles.memberField}
                        activeOpacity={0.8}
                        onPress={openSelectMember}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.memberFieldText,
                            !member && styles.memberFieldPlaceholder,
                          ]}
                        >
                          {member || 'Search by Member ID or Name...'}
                        </Text>
                        <Icon name="chevron-down" size={22} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <Label text="Address" />
                    <TextField
                      placeholder="Enter Address"
                      value={address}
                      onChangeText={setAddress}
                      style={styles.gap}
                    />

                    <Label text="City" />
                    <TextField
                      placeholder="Enter City"
                      value={city}
                      onChangeText={setCity}
                      style={styles.gap}
                    />

                    <Label text="Country" />
                    <Dropdown
                      value={country}
                      options={['India', 'UAE', 'Other']}
                      onSelect={setCountry}
                    />
                  </View>
                )}

                {/* ================= STEP 4: REMARKS / OTHER DETAILS ================= */}
                {currentStep === 4 && (
                  <View>
                    <Text style={styles.sectionHeading}>Other Details</Text>
                    <Label text="Remarks" />
                    <TextField
                      placeholder="Optional notes..."
                      value={remarks}
                      onChangeText={setRemarks}
                      multiline
                      textAlignVertical="top"
                      style={styles.area}
                      inputStyle={styles.areaInput}
                    />
                  </View>
                )}
              </ScrollView>

              {/* Footer Buttons */}
              <View style={shared.footer}>
                <GrayButton
                  title={currentStep === 1 ? 'Cancel' : '← Back'}
                  onPress={handleBackStep}
                  disabled={saving}
                  style={styles.resetButton}
                />

                <GreenButton
                  title={
                    saving
                      ? 'Saving...'
                      : currentStep === 4
                      ? 'Save Payment'
                      : 'Next →'
                  }
                  icon={currentStep === 4 ? 'content-save-outline' : undefined}
                  onPress={handleNext}
                  disabled={saving}
                  style={styles.saveButton}
                />
              </View>
            </KeyboardAvoidingView>
          </Body>
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
    marginTop: 20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'visible',
  },
  flex: {
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
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: colors.primary || '#2E8B3E' },
  stepCirclePassed: { backgroundColor: colors.success || '#10B981' },
  stepNoText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#6B7280' },
  stepNoTextActive: { color: colors.white },
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
  fieldLoader: {
    position: 'absolute',
    top: 0,
    right: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gap: {
    marginBottom: 12,
  },
  noMargin: {
    marginBottom: 0,
  },
  dim: {
    opacity: 0.45,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3F0',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 8,
    borderRadius: 6,
  },
  headText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#374151',
  },
  fundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hashCol: {
    width: 26,
    paddingLeft: 4,
  },
  hashText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  typeCol: {
    flex: 1.3,
    marginRight: 6,
  },
  amountCol: {
    flex: 1,
    marginRight: 4,
  },
  deleteCol: {
    width: 32,
    alignItems: 'center',
  },
  smallField: {
    height: 42,
    paddingHorizontal: 8,
  },
  addFund: {
    alignSelf: 'flex-end',
    height: 40,
    marginTop: 4,
  },
  donorHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  anonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#334155',
  },
  memberField: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  memberFieldText: {
    flex: 1,
    marginRight: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  memberFieldPlaceholder: {
    color: '#9CA3AF',
  },
  area: {
    height: 90,
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  areaInput: {
    height: '100%',
  },
  resetButton: {
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    flex: 1.5,
  },
});

export default ReceivePaymentScreen;

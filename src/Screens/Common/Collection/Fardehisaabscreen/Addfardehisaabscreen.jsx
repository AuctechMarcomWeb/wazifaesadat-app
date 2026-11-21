/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  LayoutAnimation,
  UIManager,
} from 'react-native';

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

import { createMemberCollectionReport } from '../../../../api/collection';
import {
  getExecutiveMembers,
  getOfficeBearers,
  getLocalSecretaries,
} from '../../../../api/collection'; // adjust path if needed

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------------------------------------------------------
// Config & Static Collected By Data
// ---------------------------------------------------------------
export const STATIC_COLLECTED_BY = [
  {
    _id: 'static-head-office',
    serialNo: 1,
    memberId: '1111',
    name: 'Head Office',
    roleLabel: 'Static',
    contactNo: '-',
    mobileNumber: '',
    email: '-',
    image: '-',
    address: '-',
    city: '',
    state: '',
    remarks: '-',
    status: 'Active',
    isStatic: true,
  },
  {
    _id: 'static-digital-drive',
    serialNo: 2,
    memberId: '2222',
    name: 'Digital Drive',
    roleLabel: 'Static',
    contactNo: '-',
    mobileNumber: '',
    email: '-',
    image: '-',
    address: '-',
    city: '',
    state: '',
    remarks: '-',
    status: 'Active',
    isStatic: true,
  },
];

const STEPS = [
  { no: 1, title: 'Report Info' },
  { no: 2, title: 'Entries & Funds' },
];

const STATUSES = ['Draft', 'Submitted'];

const FUND_TYPE_COLUMNS = [
  { title: 'Ordinary Member', fundCode: 'OM' },
  { title: 'Life Member', fundCode: 'LM' },
  { title: 'Dawami Member', fundCode: 'DM' },
  { title: 'Sarparsat Member', fundCode: 'SM' },
  { title: 'Mohsine member', fundCode: 'MM' },
  { title: 'Return of Qarze Hasna', fundCode: 'RQH' },
  { title: 'Sahme-Imam(Khums)', fundCode: 'SIK' },
  { title: 'Sahme-Sadat(khums)', fundCode: 'SSK' },
  { title: 'General Donation', fundCode: 'GD' },
  { title: 'Namzad Fund', fundCode: 'NF' },
  { title: 'Corpus Fund', fundCode: 'CF' },
  { title: 'Calendar Hadiya', fundCode: 'CH' },
  { title: 'Magazine Hadiya', fundCode: 'MH' },
  { title: 'Calendar Ad hadiya', fundCode: 'CAH' },
  { title: 'Magazine Ad hadiya', fundCode: 'MAH' },
  { title: 'Scholaship Pay', fundCode: 'SP' },
];

const FUND_TYPES = FUND_TYPE_COLUMNS.map(col => col.title);

const COLS = [
  { key: 'sr', label: 'Sr.\nNo.', width: 52 },
  { key: 'date', label: 'Date *', width: 140 },
  { key: 'receiptNo', label: 'Receipt\nNo', width: 96 },
  { key: 'regNo', label: 'Reg.\nNo', width: 86 },
  { key: 'tallyNo', label: 'Tally\nNo', width: 86 },
  { key: 'memberCode', label: 'Member\nCode', width: 96 },
  { key: 'name', label: 'Name *', width: 160 },
  { key: 'city', label: 'City', width: 110 },
  { key: 'del', label: '', width: 44 },
];

const formatDateYMD = date => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const newEntry = () => ({
  id: String(Date.now() + Math.random()),
  date: null,
  receiptNo: '',
  regNo: '',
  tallyNo: '',
  memberCode: '',
  name: '',
  city: '',
  wazifaName: '',
  phone: '',
  paymentMode: 'Cash',
});

const emptyAmounts = () =>
  FUND_TYPES.reduce((acc, f) => ({ ...acc, [f]: '' }), {});

const toNumericAmounts = rawAmounts =>
  FUND_TYPE_COLUMNS.reduce((acc, col) => {
    const val = Number(rawAmounts?.[col.title]) || 0;
    return { ...acc, [col.title]: val };
  }, {});

const normalizeMember = (item, source = 'Member') => {
  const rawId =
    item.memberId !== undefined && item.memberId !== null
      ? String(item.memberId).trim()
      : '';

  const designationName = item.designation?.name
    ? String(item.designation.name)
    : '';
  const roleLabel = item.isStatic
    ? 'Static'
    : designationName || item.memberType || source;

  return {
    uniqueKey: `${source}-${item._id || item.id || rawId || Math.random()}`,
    _id: item._id || item.id || rawId,
    name: String(item.name || item.fullName || 'Unnamed').trim(),
    memberId: rawId,
    roleLabel,
    mobileNumber:
      item.mobileNumber !== undefined && item.mobileNumber !== null
        ? String(item.mobileNumber).trim()
        : item.contactNo && item.contactNo !== '-'
        ? String(item.contactNo).trim()
        : '',
    city: item.city && item.city !== '-' ? String(item.city).trim() : '',
    state: item.state && item.state !== '-' ? String(item.state).trim() : '',
    isStatic: Boolean(item.isStatic),
  };
};

const AddFardeHisaabScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [collectedBy, setCollectedBy] = useState('');
  const [memberId, setMemberId] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState('Draft');
  const [remarks, setRemarks] = useState('');
  const [entries, setEntries] = useState([newEntry()]);
  const [amounts, setAmounts] = useState(emptyAmounts());
  const [saving, setSaving] = useState(false);

  const [apiMembers, setApiMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  // Load combined members once on mount (no separate search API)
  useEffect(() => {
    let mounted = true;

    const loadAllMembers = async () => {
      try {
        const [execRes, bearerRes, secRes] = await Promise.allSettled([
          getExecutiveMembers(),
          getOfficeBearers(),
          getLocalSecretaries(),
        ]);

        const merged = [];

        if (execRes.status === 'fulfilled' && execRes.value?.success) {
          (execRes.value.members || []).forEach(m =>
            merged.push(normalizeMember(m, 'Executive')),
          );
        }

        if (bearerRes.status === 'fulfilled' && bearerRes.value?.success) {
          (bearerRes.value.bearers || []).forEach(b =>
            merged.push(normalizeMember(b, 'Bearer')),
          );
        }

        if (secRes.status === 'fulfilled' && secRes.value?.success) {
          (secRes.value.members || []).forEach(s =>
            merged.push(normalizeMember(s, 'Secretary')),
          );
        }

        if (mounted) {
          setApiMembers(merged);
        }
      } catch (err) {
        console.error('Error loading members:', err);
      }
    };

    loadAllMembers();
    return () => {
      mounted = false;
    };
  }, []);

  // Combined list with STATIC_COLLECTED_BY always on top
  const combinedMembersList = useMemo(() => {
    const staticNormalized = STATIC_COLLECTED_BY.map(s =>
      normalizeMember(s, 'Static'),
    );
    return [...staticNormalized, ...apiMembers];
  }, [apiMembers]);

  // Pure frontend search across static + combined members
  const filteredDropdownMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return combinedMembersList;

    const staticMatches = [];
    const memberMatches = [];

    combinedMembersList.forEach(item => {
      const isMatch =
        item.name.toLowerCase().includes(q) ||
        item.memberId.toLowerCase().includes(q) ||
        item.mobileNumber.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.roleLabel.toLowerCase().includes(q);

      if (isMatch) {
        if (item.isStatic) {
          staticMatches.push(item);
        } else {
          memberMatches.push(item);
        }
      }
    });

    return [...staticMatches, ...memberMatches];
  }, [combinedMembersList, memberSearch]);

  const handleMemberSearch = useCallback(text => {
    setMemberSearch(text);
    setShowMembers(true);
  }, []);

  // Auto-fill Collected By, Member ID, City, and State
  const selectMember = member => {
    setCollectedBy(member.name);
    setMemberId(member.memberId || '');
    if (member.city) setCity(member.city);
    if (member.state) setState(member.state);

    setShowMembers(false);
    setMemberSearch('');
  };

  const clearSelectedCollectedBy = () => {
    setCollectedBy('');
    setMemberId('');
    setMemberSearch('');
    setShowMembers(false);
  };

  const updateEntry = (id, patch) =>
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));

  const removeEntry = id =>
    setEntries(prev =>
      prev.length > 1 ? prev.filter(e => e.id !== id) : prev,
    );

  const setAmount = (key, value) =>
    setAmounts(prev => ({ ...prev, [key]: value.replace(/[^0-9.]/g, '') }));

  const numericAmounts = toNumericAmounts(amounts);
  const grandTotal = FUND_TYPE_COLUMNS.reduce(
    (sum, col) => sum + numericAmounts[col.title],
    0,
  );

  const validateStepOne = () => {
    if (!collectedBy.trim()) {
      Alert.alert('Required', 'Please select or enter collected by');
      return false;
    }
    if (!fromDate) {
      Alert.alert('Required', 'Please select from date');
      return false;
    }
    if (!toDate) {
      Alert.alert('Required', 'Please select to date');
      return false;
    }
    if (fromDate > toDate) {
      Alert.alert('Invalid dates', 'From date cannot be after To date');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStepOne()) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(2);
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

  const buildReportPayload = filledEntries => {
    const rowCount = filledEntries.length;

    const tableData = filledEntries.map((e, idx) => {
      const rowFundAmounts = FUND_TYPE_COLUMNS.reduce((acc, col) => {
        const totalForFund = numericAmounts[col.title] || 0;
        const amt = idx === 0 ? totalForFund : 0;
        return { ...acc, [col.title]: amt };
      }, {});

      const rowTotal = Object.values(rowFundAmounts).reduce(
        (s, v) => s + (Number(v) || 0),
        0,
      );

      return {
        srNo: idx + 1,
        date: formatDateYMD(e.date),
        receiptNo: e.receiptNo.trim(),
        memberName: e.name.trim(),
        wazifaName: (e.wazifaName || '').trim(),
        phone: (e.phone || '').trim(),
        city: e.city.trim(),
        memberCode: e.memberCode.trim(),
        regitorNo: e.regNo.trim(),
        tallyNo: e.tallyNo.trim(),
        paymentMode: e.paymentMode || 'Cash',
        fundAmounts: rowFundAmounts,
        total: rowTotal,
      };
    });

    const columnTotals = FUND_TYPE_COLUMNS.reduce((acc, col) => {
      const totalAmountForCol = tableData.reduce(
        (sum, row) => sum + (Number(row.fundAmounts?.[col.title]) || 0),
        0,
      );
      const countForCol = tableData.reduce(
        (cnt, row) =>
          cnt + ((Number(row.fundAmounts?.[col.title]) || 0) > 0 ? 1 : 0),
        0,
      );

      acc[col.title] = {
        amount: totalAmountForCol,
        count: countForCol > 0 ? countForCol : rowCount > 0 ? 1 : 0,
        fundCode: col.fundCode,
      };
      return acc;
    }, {});

    const computedGrandTotal = tableData.reduce(
      (sum, row) => sum + (Number(row.total) || 0),
      0,
    );

    return {
      collectedBy: collectedBy.trim(),
      collectedByCity: city.trim(),
      collectedByMemberId: memberId.trim(),
      collectedByState: state.trim(),
      fromDate: formatDateYMD(fromDate),
      toDate: formatDateYMD(toDate),
      remarks: remarks.trim(),
      status,
      fundTypeColumns: FUND_TYPE_COLUMNS,
      tableData,
      columnTotals,
      summary: {
        grandTotal: computedGrandTotal,
        totalTransactions: tableData.length,
        totalFundTypes: FUND_TYPE_COLUMNS.length,
      },
    };
  };

  const handleSave = async () => {
    if (!validateStepOne()) {
      setCurrentStep(1);
      return;
    }

    const filled = entries.filter(
      e =>
        e.date ||
        e.receiptNo ||
        e.regNo ||
        e.tallyNo ||
        e.memberCode ||
        e.name ||
        e.city,
    );

    if (filled.length === 0) {
      return Alert.alert('Required', 'Please add at least one entry');
    }

    if (filled.some(e => !e.date || !e.name.trim())) {
      return Alert.alert('Required', 'Each entry needs a date and name');
    }

    setSaving(true);

    try {
      const payload = buildReportPayload(filled);
      const result = await createMemberCollectionReport(payload);

      if (result.success) {
        Alert.alert('Success', 'Collection report created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation && navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to save report');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save report');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Add Farde Hisaab Report"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Body>
                {/* Stepper Header */}
                <View style={styles.stepperRow}>
                  {STEPS.map(s => {
                    const isActive = currentStep === s.no;
                    const isPassed = currentStep > s.no;

                    return (
                      <TouchableOpacity
                        key={s.no}
                        style={styles.stepItem}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (s.no === 1 || (s.no === 2 && validateStepOne())) {
                            LayoutAnimation.configureNext(
                              LayoutAnimation.Presets.easeInEaseOut,
                            );
                            setCurrentStep(s.no);
                          }
                        }}
                      >
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
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ================= STEP 1: REPORT DETAILS ================= */}
                {currentStep === 1 && (
                  <View>
                    <Text style={styles.sectionHeading}>Report Details</Text>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Collected By" required />
                        <View style={styles.memberSearchBox}>
                          <TextField
                            icon="account-outline"
                            placeholder="Search member or ID..."
                            value={memberSearch}
                            onFocus={() => setShowMembers(true)}
                            onChangeText={handleMemberSearch}
                          />
                          {showMembers &&
                            filteredDropdownMembers.length > 0 && (
                              <View style={styles.memberDropdown}>
                                <ScrollView
                                  nestedScrollEnabled
                                  keyboardShouldPersistTaps="handled"
                                  style={styles.memberList}
                                >
                                  {filteredDropdownMembers.map(member => (
                                    <TouchableOpacity
                                      key={member.uniqueKey}
                                      style={[
                                        styles.memberItem,
                                        member.isStatic &&
                                          styles.staticMemberItem,
                                      ]}
                                      onPress={() => selectMember(member)}
                                    >
                                      <View style={styles.memberRow}>
                                        <View style={styles.flex}>
                                          <Text style={styles.memberName}>
                                            {member.name}
                                          </Text>
                                          <Text style={styles.memberCode}>
                                            {member.isStatic
                                              ? `Member ID: ${member.memberId} • Static`
                                              : `ID: ${
                                                  member.memberId || 'N/A'
                                                }${
                                                  member.roleLabel
                                                    ? ` • ${member.roleLabel}`
                                                    : ''
                                                }${
                                                  member.city
                                                    ? ` • ${member.city}`
                                                    : ''
                                                }`}
                                          </Text>
                                        </View>
                                        {member.memberId ? (
                                          <Text style={styles.idBadge}>
                                            #{member.memberId}
                                          </Text>
                                        ) : null}
                                      </View>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                        </View>

                        {collectedBy ? (
                          <View style={styles.selectedRow}>
                            <Text
                              style={[styles.selectedMember, styles.flex]}
                              numberOfLines={1}
                            >
                              {collectedBy}
                            </Text>
                            <TouchableOpacity
                              onPress={clearSelectedCollectedBy}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Icon
                                name="close-circle-outline"
                                size={16}
                                color={colors.textSecondary}
                              />
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>

                      <View style={shared.col}>
                        <Label text="City" />
                        <TextField
                          icon="office-building-outline"
                          placeholder="Enter city"
                          value={city}
                          onChangeText={setCity}
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Member ID" />
                        <TextField
                          icon="card-account-details-outline"
                          placeholder="Auto-filled member ID"
                          value={memberId}
                          onChangeText={setMemberId}
                        />
                      </View>

                      <View style={shared.col}>
                        <Label text="State" />
                        <TextField
                          icon="map-marker-outline"
                          placeholder="Enter state"
                          value={state}
                          onChangeText={setState}
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="From Date" required />
                        <DateField
                          value={fromDate}
                          onChange={setFromDate}
                          leftIcon="calendar-month-outline"
                          hideRightIcon
                        />
                      </View>

                      <View style={shared.col}>
                        <Label text="Status" />
                        <Dropdown
                          value={status}
                          options={STATUSES}
                          onSelect={setStatus}
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="To Date" required />
                        <DateField
                          value={toDate}
                          onChange={setToDate}
                          leftIcon="calendar-month-outline"
                          hideRightIcon
                        />
                      </View>

                      <View style={shared.col} />
                    </View>

                    <Label text="Remarks" />
                    <TextField
                      icon="note-edit-outline"
                      placeholder="Enter remarks..."
                      value={remarks}
                      onChangeText={setRemarks}
                      multiline
                      textAlignVertical="top"
                      style={styles.area}
                      inputStyle={styles.areaInput}
                    />
                  </View>
                )}

                {/* ================= STEP 2: ENTRIES & FUNDS ================= */}
                {currentStep === 2 && (
                  <View>
                    <Text style={styles.sectionHeading}>
                      Entries & Fund Amounts
                    </Text>

                    <View style={styles.entriesWrap}>
                      <View style={styles.entriesBar}>
                        <Text style={styles.entriesTitle}>
                          Farde Hisaab Entries
                        </Text>

                        <TouchableOpacity
                          style={styles.addRow}
                          activeOpacity={0.8}
                          onPress={() =>
                            setEntries(prev => [...prev, newEntry()])
                          }
                        >
                          <Icon name="plus" size={18} color={colors.white} />
                          <Text style={styles.addRowText}>Add Row</Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        <View>
                          <View style={styles.tHead}>
                            {COLS.map(c => (
                              <View
                                key={c.key}
                                style={[styles.tHeadCell, { width: c.width }]}
                              >
                                <Text style={styles.tHeadText}>{c.label}</Text>
                              </View>
                            ))}
                          </View>

                          {entries.map((e, index) => (
                            <View key={e.id} style={styles.tRow}>
                              <View
                                style={[
                                  styles.srCell,
                                  { width: COLS[0].width },
                                ]}
                              >
                                <Text style={styles.srText}>{index + 1}</Text>
                              </View>

                              <View
                                style={[styles.cell, { width: COLS[1].width }]}
                              >
                                <DateField
                                  value={e.date}
                                  onChange={d => updateEntry(e.id, { date: d })}
                                  style={styles.cellField}
                                />
                              </View>

                              {[
                                ['receiptNo', 2, ''],
                                ['regNo', 3, ''],
                                ['tallyNo', 4, ''],
                                ['memberCode', 5, 'Code'],
                                ['name', 6, 'Enter name'],
                                ['city', 7, ''],
                              ].map(([key, ci, ph]) => (
                                <View
                                  key={key}
                                  style={[
                                    styles.cell,
                                    { width: COLS[ci].width },
                                  ]}
                                >
                                  <TextInput
                                    style={styles.cellInput}
                                    placeholder={ph}
                                    placeholderTextColor={
                                      colors.placeHolderColor
                                    }
                                    value={e[key]}
                                    onChangeText={v =>
                                      updateEntry(e.id, { [key]: v })
                                    }
                                  />
                                </View>
                              ))}

                              <TouchableOpacity
                                style={[
                                  styles.cell,
                                  styles.delCell,
                                  { width: COLS[8].width },
                                ]}
                                onPress={() => removeEntry(e.id)}
                                disabled={entries.length === 1}
                              >
                                <Icon
                                  name="trash-can-outline"
                                  size={20}
                                  color={
                                    entries.length === 1 ? '#F3B1B1' : '#E53935'
                                  }
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    <View style={styles.fundWrap}>
                      <View style={styles.fundBar}>
                        <Text style={styles.fundTitle}>
                          Membership / Fund Type (Amount ₹)
                        </Text>
                      </View>

                      <View style={styles.fundGrid}>
                        {FUND_TYPE_COLUMNS.map(col => (
                          <View key={col.fundCode} style={styles.fundCell}>
                            <Text style={styles.fundLabel} numberOfLines={1}>
                              {col.title}
                            </Text>
                            <TextInput
                              style={styles.fundInput}
                              placeholder="0"
                              placeholderTextColor={colors.placeHolderColor}
                              value={amounts[col.title]}
                              onChangeText={v => setAmount(col.title, v)}
                              keyboardType="numeric"
                              textAlign="center"
                            />
                          </View>
                        ))}
                      </View>

                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹ {grandTotal}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </Body>
            </ScrollView>

            <View style={shared.footer}>
              <GrayButton
                title={currentStep === 1 ? 'Cancel' : '← Back'}
                onPress={handleBackStep}
                disabled={saving}
                style={styles.cancel}
              />

              <GreenButton
                title={
                  saving
                    ? 'Saving...'
                    : currentStep === 2
                    ? 'Save & Close'
                    : 'Next →'
                }
                icon={
                  currentStep === 2 && !saving
                    ? 'content-save-outline'
                    : undefined
                }
                onPress={handleNext}
                disabled={saving}
                style={styles.save}
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
    backgroundColor: colors.backgroundDark,
  },
  body: {
    flex: 1,
    marginTop: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    marginTop: 20,
    paddingHorizontal: wp('4%'),
    paddingTop: 14,
    paddingBottom: 24,
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
  memberSearchBox: {
    position: 'relative',
  },
  memberDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 220,
    zIndex: 100,
    elevation: 6,
  },
  memberList: {
    maxHeight: 220,
  },
  memberItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  staticMemberItem: {
    backgroundColor: '#F6FBF8',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  memberCode: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  idBadge: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginLeft: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  selectedMember: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.success,
    marginRight: 6,
  },
  area: {
    height: 84,
    alignItems: 'flex-start',
    paddingTop: 12,
    marginBottom: 16,
  },
  areaInput: {
    height: '100%',
    paddingTop: 0,
  },
  entriesWrap: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: colors.cardColorLight,
  },
  entriesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  entriesTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addRowText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
    marginLeft: 2,
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F3',
  },
  tHeadCell: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.neutral.border,
  },
  tHeadText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    textAlign: 'center',
  },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardColorLight,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  srCell: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  srText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  cell: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  cellField: {
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  cellInput: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  delCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundWrap: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.cardColorLight,
    marginBottom: 12,
  },
  fundBar: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  fundTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  fundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 6,
  },
  fundCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fundLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.TitleColor,
    marginRight: 6,
  },
  fundInput: {
    width: 64,
    height: 38,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    paddingVertical: 0,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F7FAF8',
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  totalLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  totalValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.success,
  },
  cancel: {
    flex: 1,
    marginRight: 10,
  },
  save: {
    flex: 1.6,
  },
});

export default AddFardeHisaabScreen;

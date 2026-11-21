import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import colors from '../../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../../themes/typography';

import AppLayout from '../../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../../components/BackHeader/BackHeader';
import {
  Body,
  GreenButton,
  GrayButton,
  Label,
  TextField,
  DateField,
  Dropdown,
  formatRs,
  shared,
} from '../../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  getOpeningBalance,
  getFundTypeReport,
  getExpenditureReport,
  createIncomeExpenditureStatement,
  updateIncomeExpenditureStatement,
} from '../../../../../api/collection';

const STATUS_OPTIONS = ['Draft', 'Submitted', 'Approved'];

/* ── Get Current Month Dates ── */
const getCurrentMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return { from: firstDay, to: lastDay };
};

const toDateObj = val => {
  if (!val) return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  const parsed = new Date(val);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateYMD = dateVal => {
  const d = toDateObj(dateVal);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ── Income / Expenditure Row ── */
const ItemRow = ({ item, type }) => {
  const title = type === 'income' ? item.fundTitle : item.expenseTitle;
  const amount = Number(item.totalAmount ?? item.amount ?? 0) || 0;

  return (
    <View style={styles.innerRow}>
      <Text style={styles.innerLabel} numberOfLines={1}>
        {title || '-'}
      </Text>
      <Text style={styles.innerValue}>{formatRs(amount)}</Text>
    </View>
  );
};

/* ── Summary Section Card ── */
const SummarySection = ({
  title,
  items,
  totalLabel,
  total,
  type,
  totalColor,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderTitle}>{title}</Text>
        <View style={styles.srBadge}>
          <Text style={styles.srText}>
            {items.length} item{items.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.innerBox}>
        {items.map((item, idx) => (
          <ItemRow
            key={
              item.fundTypeId ||
              item.expenseId ||
              item._id ||
              item.fundType?._id ||
              item.expense?._id ||
              idx
            }
            item={item}
            type={type}
          />
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerLabel}>{totalLabel}:</Text>
        <Text
          style={[
            styles.footerAmount,
            totalColor ? { color: totalColor } : null,
          ]}
        >
          {formatRs(total || 0)}
        </Text>
      </View>
    </View>
  );
};

/* ── Main Modal ── */
const IncomeExpenditureModal = ({
  visible,
  editingStatement,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [openingBalance, setOpeningBalance] = useState(0);
  const [incomeData, setIncomeData] = useState([]);
  const [expenditureData, setExpenditureData] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState({ grandTotal: 0 });
  const [expenditureSummary, setExpenditureSummary] = useState({
    grandTotal: 0,
  });

  const [formData, setFormData] = useState({
    sentToHeadOffice: '0',
    depositedInLocalBank: '0',
    note: '',
    sign1: '',
    sign2: '',
    sign3: '',
    status: 'Draft',
  });

  const resetModalState = useCallback(() => {
    setFromDate(null);
    setToDate(null);
    setOpeningBalance(0);
    setIncomeData([]);
    setExpenditureData([]);
    setIncomeSummary({ grandTotal: 0 });
    setExpenditureSummary({ grandTotal: 0 });
    setFormData({
      sentToHeadOffice: '0',
      depositedInLocalBank: '0',
      note: '',
      sign1: '',
      sign2: '',
      sign3: '',
      status: 'Draft',
    });
  }, []);

  const handleClose = useCallback(() => {
    resetModalState();
    onClose && onClose();
  }, [onClose, resetModalState]);

  /* ── Fetch Modal Data ── */
  const fetchModalData = useCallback(async (fromVal, toVal) => {
    const fromStr = formatDateYMD(fromVal);
    const toStr = formatDateYMD(toVal);
    if (!fromStr || !toStr) return;

    setLoading(true);
    try {
      const balanceResult = await getOpeningBalance();
      const rawOpening =
        balanceResult?.openingBalance ??
        balanceResult?.data?.openingBalance ??
        0;
      setOpeningBalance(Number(rawOpening) || 0);

      const incomeResult = await getFundTypeReport(fromStr, toStr);
      const incomePayload = incomeResult?.data || incomeResult || {};
      if (incomeResult?.success || Array.isArray(incomePayload.fundTypes)) {
        setIncomeData(incomePayload.fundTypes || []);
        setIncomeSummary(incomePayload.summary || { grandTotal: 0 });
      }

      const expResult = await getExpenditureReport(fromStr, toStr);
      const expPayload = expResult?.data || expResult || {};
      const rawExpenses = expPayload.expenses || expPayload.expenditures || [];
      if (expResult?.success || Array.isArray(rawExpenses)) {
        setExpenditureData(rawExpenses);
        setExpenditureSummary(expPayload.summary || { grandTotal: 0 });
      }
    } catch (error) {
      console.error('Error fetching statement modal data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Handle Date Change ── */
  const handleFromDateChange = async nextFrom => {
    setFromDate(nextFrom);
    if (nextFrom && toDate) {
      await fetchModalData(nextFrom, toDate);
    }
  };

  const handleToDateChange = async nextTo => {
    setToDate(nextTo);
    if (fromDate && nextTo) {
      await fetchModalData(fromDate, nextTo);
    }
  };

  /* ── Load Edit Data ── */
  const loadEditData = useCallback(() => {
    if (!editingStatement) return;

    const fromObj = toDateObj(editingStatement.fromDate);
    const toObj = toDateObj(editingStatement.toDate);

    setFromDate(fromObj);
    setToDate(toObj);
    setOpeningBalance(Number(editingStatement.openingBalance) || 0);
    setIncomeData(editingStatement.incomes || []);
    setExpenditureData(editingStatement.expenditures || []);
    setIncomeSummary({
      grandTotal: Number(editingStatement.totalIncome) || 0,
    });
    setExpenditureSummary({
      grandTotal: Number(editingStatement.totalExpenditure) || 0,
    });

    setFormData({
      sentToHeadOffice: String(editingStatement.sentToHeadOffice ?? 0),
      depositedInLocalBank: String(editingStatement.depositedInLocalBank ?? 0),
      note: editingStatement.note || '',
      sign1: editingStatement.sign1 || '',
      sign2: editingStatement.sign2 || '',
      sign3: editingStatement.sign3 || '',
      status: editingStatement.status || 'Draft',
    });
  }, [editingStatement]);

  /* ── Initialize Modal ── */
  useEffect(() => {
    if (!visible) return;

    if (editingStatement) {
      loadEditData();
    } else {
      const dates = getCurrentMonthDates();
      setFromDate(dates.from);
      setToDate(dates.to);
      fetchModalData(dates.from, dates.to);
    }
  }, [visible, editingStatement, loadEditData, fetchModalData]);

  /* ── Calculate Totals ── */
  const calculateTotals = () => {
    const incomeTotal = Number(incomeSummary?.grandTotal) || 0;
    const expenseTotal = Number(expenditureSummary?.grandTotal) || 0;
    const sentToHO = parseFloat(formData.sentToHeadOffice) || 0;
    const depositedBank = parseFloat(formData.depositedInLocalBank) || 0;

    const total1 = (Number(openingBalance) || 0) + incomeTotal;
    const total2 = expenseTotal + sentToHO + depositedBank;
    const presentBalance = total1 - total2;

    return { total1, total2, presentBalance, incomeTotal, expenseTotal };
  };

  const totals = calculateTotals();

  /* ── Handle Submit ── */
  const handleSubmit = async () => {
    const fromStr = formatDateYMD(fromDate);
    const toStr = formatDateYMD(toDate);

    if (!fromStr || !toStr) {
      Alert.alert('Error', 'Please select both From Date and To Date');
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      Alert.alert('Invalid dates', 'From date cannot be after To date');
      return;
    }

    if (!formData.status) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    setSubmitting(true);
    try {
      const incomesPayload = (incomeData || []).map(item => {
        const mappedIncome = {
          fundType:
            item.fundTypeId ||
            item.fundType?._id ||
            (typeof item.fundType === 'string' ? item.fundType : '') ||
            item._id ||
            '',
          fundTitle: item.fundTitle || '',
          amount: Number(item.totalAmount ?? item.amount) || 0,
          remarks: item.remarks ?? '',
        };
        if (item.fundCode !== undefined && item.fundCode !== null) {
          mappedIncome.fundCode = item.fundCode;
        }
        return mappedIncome;
      });

      const expendituresPayload = (expenditureData || []).map(item => ({
        expense:
          item.expenseId ||
          item.expense?._id ||
          (typeof item.expense === 'string' ? item.expense : '') ||
          item._id ||
          '',
        expenseTitle: item.expenseTitle || '',
        amount: Number(item.totalAmount ?? item.amount) || 0,
        remarks: item.remarks ?? '',
      }));

      const payload = {
        fromDate: fromStr,
        toDate: toStr,
        openingBalance: Number(openingBalance) || 0,
        incomes: incomesPayload,
        expenditures: expendituresPayload,
        sentToHeadOffice: parseFloat(formData.sentToHeadOffice) || 0,
        depositedInLocalBank: parseFloat(formData.depositedInLocalBank) || 0,
        note: formData.note || '',
        sign1: formData.sign1 || '',
        sign2: formData.sign2 || '',
        sign3: formData.sign3 || '',
        status: formData.status,
      };

      const result = editingStatement
        ? await updateIncomeExpenditureStatement(editingStatement._id, payload)
        : await createIncomeExpenditureStatement(payload);

      if (result?.success) {
        Alert.alert(
          'Success',
          result.message || 'Statement saved successfully',
        );
        handleClose();
        onSuccess && onSuccess();
      } else {
        Alert.alert('Error', result?.message || 'Failed to save statement');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to save statement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <AppLayout>
        <View style={styles.container}>
          <BackHeader
            title={editingStatement ? 'Edit Statement' : 'Create Statement'}
            onBack={handleClose}
          />

          <View style={styles.body}>
            <Body>
              {loading ? (
                <View style={styles.centerLoader}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loaderText}>Loading data...</Text>
                </View>
              ) : (
                <KeyboardAvoidingView
                  style={styles.flex}
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Period Card */}
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>Period</Text>
                      </View>

                      <View style={shared.row}>
                        <View style={shared.colL}>
                          <Label text="From Date" required />
                          <DateField
                            value={fromDate}
                            onChange={handleFromDateChange}
                            leftIcon="calendar-month-outline"
                            hideRightIcon
                          />
                        </View>

                        <View style={shared.col}>
                          <Label text="To Date" required />
                          <DateField
                            value={toDate}
                            onChange={handleToDateChange}
                            leftIcon="calendar-month-outline"
                            hideRightIcon
                          />
                        </View>
                      </View>
                    </View>

                    {/* Income Section */}
                    {incomeData.length > 0 && (
                      <SummarySection
                        title="Income"
                        items={incomeData}
                        totalLabel="Total Income"
                        total={totals.incomeTotal}
                        type="income"
                        totalColor={colors.success}
                      />
                    )}

                    {/* Expenditure Section */}
                    {expenditureData.length > 0 && (
                      <SummarySection
                        title="Expenditure"
                        items={expenditureData}
                        totalLabel="Total Expenditure"
                        total={totals.expenseTotal}
                        type="expenditure"
                        totalColor="#DC2626"
                      />
                    )}

                    {/* Summary & Calculations */}
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>Summary</Text>
                      </View>

                      <View style={styles.cardBody}>
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>
                            Opening Balance:
                          </Text>
                          <Text style={styles.fieldValueBold}>
                            {formatRs(openingBalance)}
                          </Text>
                        </View>

                        <View style={[styles.fieldRow, styles.highlightRow]}>
                          <Text
                            style={[styles.fieldLabel, styles.fieldLabelBold]}
                          >
                            Last Balance + Income:
                          </Text>
                          <Text style={styles.fieldValueBold}>
                            {formatRs(totals.total1)}
                          </Text>
                        </View>

                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>
                            Sent to Head Office:
                          </Text>
                          <TextInput
                            style={styles.valueInput}
                            placeholder="0"
                            placeholderTextColor={colors.placeHolderColor}
                            value={formData.sentToHeadOffice}
                            onChangeText={val =>
                              setFormData(prev => ({
                                ...prev,
                                sentToHeadOffice: val.replace(/[^0-9.]/g, ''),
                              }))
                            }
                            keyboardType="decimal-pad"
                          />
                        </View>

                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>
                            Deposited in Local Bank:
                          </Text>
                          <TextInput
                            style={styles.valueInput}
                            placeholder="0"
                            placeholderTextColor={colors.placeHolderColor}
                            value={formData.depositedInLocalBank}
                            onChangeText={val =>
                              setFormData(prev => ({
                                ...prev,
                                depositedInLocalBank: val.replace(
                                  /[^0-9.]/g,
                                  '',
                                ),
                              }))
                            }
                            keyboardType="decimal-pad"
                          />
                        </View>

                        <View style={[styles.fieldRow, styles.highlightRow]}>
                          <Text
                            style={[styles.fieldLabel, styles.fieldLabelBold]}
                          >
                            Total Deductions:
                          </Text>
                          <Text
                            style={[
                              styles.fieldValueBold,
                              { color: '#DC2626' },
                            ]}
                          >
                            {formatRs(totals.total2)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.presentBalanceBox}>
                        <Text style={styles.presentBalanceLabel}>
                          PRESENT BALANCE
                        </Text>
                        <Text style={styles.presentBalanceValue}>
                          {formatRs(totals.presentBalance)}
                        </Text>
                      </View>
                    </View>

                    {/* Note & Status Card */}
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>
                          Status & Note
                        </Text>
                      </View>

                      <Label text="Status" />
                      <Dropdown
                        value={formData.status}
                        options={STATUS_OPTIONS}
                        onSelect={val =>
                          setFormData(prev => ({ ...prev, status: val }))
                        }
                        style={styles.statusGap}
                      />

                      <Label text="Note" />
                      <TextField
                        icon="note-edit-outline"
                        placeholder="Enter notes..."
                        value={formData.note}
                        onChangeText={val =>
                          setFormData(prev => ({ ...prev, note: val }))
                        }
                        multiline
                        textAlignVertical="top"
                        style={styles.noteBox}
                        inputStyle={styles.noteInput}
                      />
                    </View>

                    {/* Signatures Card */}
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>Signatures</Text>
                      </View>

                      <View style={styles.signatureRow}>
                        <View style={styles.signatureCol}>
                          <Label text="Local Secretary" />
                          <TextInput
                            style={styles.signInput}
                            placeholder="Name & Sign"
                            placeholderTextColor={colors.placeHolderColor}
                            value={formData.sign1}
                            onChangeText={val =>
                              setFormData(prev => ({ ...prev, sign1: val }))
                            }
                          />
                        </View>

                        <View style={styles.signatureCol}>
                          <Label text="Office Assistant" />
                          <TextInput
                            style={styles.signInput}
                            placeholder="Name & Sign"
                            placeholderTextColor={colors.placeHolderColor}
                            value={formData.sign2}
                            onChangeText={val =>
                              setFormData(prev => ({ ...prev, sign2: val }))
                            }
                          />
                        </View>

                        <View style={styles.signatureCol}>
                          <Label text="Office Superintendent" />
                          <TextInput
                            style={styles.signInput}
                            placeholder="Name & Sign"
                            placeholderTextColor={colors.placeHolderColor}
                            value={formData.sign3}
                            onChangeText={val =>
                              setFormData(prev => ({ ...prev, sign3: val }))
                            }
                          />
                        </View>
                      </View>
                    </View>
                  </ScrollView>

                  <View style={shared.footer}>
                    <GrayButton
                      title="Cancel"
                      onPress={handleClose}
                      disabled={submitting}
                      style={styles.cancelBtn}
                    />
                    <GreenButton
                      title={submitting ? 'Saving...' : 'Submit'}
                      icon={!submitting ? 'content-save-outline' : undefined}
                      onPress={handleSubmit}
                      disabled={submitting}
                      style={styles.submitBtn}
                    />
                  </View>
                </KeyboardAvoidingView>
              )}
            </Body>
          </View>
        </View>
      </AppLayout>
    </Modal>
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

  flex: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 20,
    paddingBottom: 24,
  },

  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },

  loaderText: {
    marginTop: 12,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginTop: 25,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    paddingBottom: 8,
    marginBottom: 10,
  },

  cardHeaderTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  srBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  srText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  innerBox: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },

  innerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  innerLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },

  innerValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: 10,
    marginTop: 10,
  },

  footerLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  footerAmount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  cardBody: {
    gap: 8,
  },

  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  highlightRow: {
    backgroundColor: '#F7FAF8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },

  fieldLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },

  fieldLabelBold: {
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  fieldValueBold: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  valueInput: {
    width: 110,
    height: 38,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    backgroundColor: colors.white,
    textAlign: 'right',
    paddingVertical: 0,
  },

  presentBalanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },

  presentBalanceLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  presentBalanceValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.success,
  },

  statusGap: {
    marginBottom: 12,
  },

  noteBox: {
    height: 84,
    alignItems: 'flex-start',
    paddingTop: 12,
  },

  noteInput: {
    height: '100%',
    paddingTop: 0,
  },

  signatureRow: {
    flexDirection: 'row',
    gap: 8,
  },

  signatureCol: {
    flex: 1,
  },

  signInput: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    backgroundColor: colors.white,
    paddingVertical: 0,
  },

  cancelBtn: {
    flex: 1,
    marginRight: 10,
  },

  submitBtn: {
    flex: 1.6,
  },
});

export default IncomeExpenditureModal;

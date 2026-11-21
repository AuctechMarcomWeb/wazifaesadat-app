import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../../themes/typography';

import AppLayout from '../../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../../components/BackHeader/BackHeader';
import {
  Body,
  Badge,
  GrayButton,
  formatRs,
  shared,
} from '../../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { getIncomeExpenditureStatement } from '../../../../../api/collection';

const formatDate = date => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/* ── Item Row ── */
const ItemRow = ({ label, amount, isBold = false, valueColor }) => (
  <View style={[styles.fieldRow, isBold && styles.highlightRow]}>
    <Text style={[styles.fieldLabel, isBold && styles.fieldLabelBold]}>
      {label}:
    </Text>
    <Text
      style={[
        styles.fieldValue,
        isBold && styles.fieldValueBold,
        valueColor ? { color: valueColor } : null,
      ]}
    >
      {formatRs(amount || 0)}
    </Text>
  </View>
);

/* ── Main View Modal ── */
const IncomeExpenditureViewModal = ({ visible, statementId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState(null);

  const handleClose = useCallback(() => {
    setStatement(null);
    onClose && onClose();
  }, [onClose]);

  const fetchStatement = useCallback(async () => {
    if (!statementId) return;
    setLoading(true);
    try {
      const result = await getIncomeExpenditureStatement(statementId);
      if (result?.success) {
        setStatement(result.statement || null);
      } else {
        setStatement(null);
      }
    } catch (error) {
      console.error('Error loading statement detail:', error);
      setStatement(null);
    } finally {
      setLoading(false);
    }
  }, [statementId]);

  useEffect(() => {
    if (visible && statementId) {
      fetchStatement();
    } else if (!visible) {
      setStatement(null);
    }
  }, [visible, statementId, fetchStatement]);

  const totalOpeningAndIncome =
    (Number(statement?.openingBalance) || 0) +
    (Number(statement?.totalIncome) || 0);

  const totalDeductions =
    (Number(statement?.totalExpenditure) || 0) +
    (Number(statement?.sentToHeadOffice) || 0) +
    (Number(statement?.depositedInLocalBank) || 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <AppLayout>
        <View style={styles.container}>
          <BackHeader title="Statement Details" onBack={handleClose} />

          <View style={styles.body}>
            <Body>
              {loading && !statement ? (
                <View style={styles.centerLoader}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loaderText}>Loading statement...</Text>
                </View>
              ) : !statement ? (
                <View style={shared.empty}>
                  <Icon
                    name="file-document-outline"
                    size={46}
                    color={colors.placeHolderColor}
                  />
                  <Text style={shared.emptyText}>
                    Statement details not found
                  </Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    activeOpacity={0.8}
                    onPress={fetchStatement}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Period & Status Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardHeaderTitle}>
                        Period & Status
                      </Text>
                      {statement.status ? (
                        <Badge text={statement.status} />
                      ) : null}
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>From Date:</Text>
                        <Text style={styles.fieldValueBold}>
                          {formatDate(statement.fromDate)}
                        </Text>
                      </View>
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>To Date:</Text>
                        <Text style={styles.fieldValueBold}>
                          {formatDate(statement.toDate)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Income Card */}
                  {Array.isArray(statement.incomes) &&
                    statement.incomes.length > 0 && (
                      <View style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardHeaderTitle}>Income</Text>
                          <View style={styles.srBadge}>
                            <Text style={styles.srText}>
                              {statement.incomes.length} item
                              {statement.incomes.length > 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.innerBox}>
                          {statement.incomes.map((item, idx) => (
                            <View
                              key={item._id || `${item.fundTitle}-${idx}`}
                              style={styles.innerRow}
                            >
                              <Text style={styles.innerLabel} numberOfLines={1}>
                                {item.fundTitle || '-'}
                              </Text>
                              <Text style={styles.innerValue}>
                                {formatRs(item.amount || 0)}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.cardFooter}>
                          <Text style={styles.footerLabel}>Total Income:</Text>
                          <Text
                            style={[
                              styles.footerAmount,
                              { color: colors.success },
                            ]}
                          >
                            {formatRs(statement.totalIncome || 0)}
                          </Text>
                        </View>
                      </View>
                    )}

                  {/* Expenditure Card */}
                  {Array.isArray(statement.expenditures) &&
                    statement.expenditures.length > 0 && (
                      <View style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardHeaderTitle}>
                            Expenditure
                          </Text>
                          <View style={styles.srBadge}>
                            <Text style={styles.srText}>
                              {statement.expenditures.length} item
                              {statement.expenditures.length > 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.innerBox}>
                          {statement.expenditures.map((item, idx) => (
                            <View
                              key={item._id || `${item.expenseTitle}-${idx}`}
                              style={styles.innerRow}
                            >
                              <Text style={styles.innerLabel} numberOfLines={1}>
                                {item.expenseTitle || '-'}
                              </Text>
                              <Text style={styles.innerValue}>
                                {formatRs(item.amount || 0)}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.cardFooter}>
                          <Text style={styles.footerLabel}>
                            Total Expenditure:
                          </Text>
                          <Text
                            style={[styles.footerAmount, { color: '#DC2626' }]}
                          >
                            {formatRs(statement.totalExpenditure || 0)}
                          </Text>
                        </View>
                      </View>
                    )}

                  {/* Summary Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardHeaderTitle}>Summary</Text>
                    </View>

                    <View style={styles.cardBody}>
                      <ItemRow
                        label="Opening Balance"
                        amount={statement.openingBalance}
                      />
                      <ItemRow
                        label="Total Income"
                        amount={statement.totalIncome}
                        valueColor={colors.success}
                      />
                      <ItemRow
                        label="Total (Opening + Income)"
                        amount={totalOpeningAndIncome}
                        isBold
                      />
                      <ItemRow
                        label="Total Expenditure"
                        amount={statement.totalExpenditure}
                        valueColor="#DC2626"
                      />
                      <ItemRow
                        label="Sent To Head Office"
                        amount={statement.sentToHeadOffice}
                      />
                      <ItemRow
                        label="Deposited in Local Bank"
                        amount={statement.depositedInLocalBank}
                      />
                      <ItemRow
                        label="Total Deductions"
                        amount={totalDeductions}
                        isBold
                      />
                    </View>

                    <View style={styles.presentBalanceBox}>
                      <Text style={styles.presentBalanceLabel}>
                        PRESENT BALANCE
                      </Text>
                      <Text style={styles.presentBalanceValue}>
                        {formatRs(statement.presentBalance || 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Note Card */}
                  {statement.note ? (
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>Note</Text>
                      </View>
                      <View style={styles.innerBox}>
                        <Text style={styles.noteText}>{statement.note}</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Signatures Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardHeaderTitle}>Signatures</Text>
                    </View>

                    <View style={styles.signaturesRow}>
                      <View style={styles.signatureCol}>
                        <Text style={styles.signatureLabel}>
                          Local Secretary
                        </Text>
                        <View style={styles.signatureBox}>
                          <Text style={styles.signatureValue}>
                            {statement.sign1 || '-'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.signatureCol}>
                        <Text style={styles.signatureLabel}>
                          Office Assistant
                        </Text>
                        <View style={styles.signatureBox}>
                          <Text style={styles.signatureValue}>
                            {statement.sign2 || '-'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.signatureCol}>
                        <Text style={styles.signatureLabel}>
                          Office Superintendent
                        </Text>
                        <View style={styles.signatureBox}>
                          <Text style={styles.signatureValue}>
                            {statement.sign3 || '-'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <GrayButton
                    title="Close"
                    onPress={handleClose}
                    style={styles.closeBtn}
                  />
                </ScrollView>
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

  retryBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },

  retryText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  card: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginTop:15,
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

  fieldValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },

  fieldValueBold: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
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

  noteText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    lineHeight: 20,
  },

  signaturesRow: {
    flexDirection: 'row',
    gap: 8,
  },

  signatureCol: {
    flex: 1,
  },

  signatureLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  signatureBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    padding: 8,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },

  signatureValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    textAlign: 'center',
  },

  closeBtn: {
    height: 48,
    marginTop: 4,
  },
});

export default IncomeExpenditureViewModal;

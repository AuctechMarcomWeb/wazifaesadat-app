import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import { Body } from '../../components/Formparts';

const formatCurrency = amount => {
  const num = Number(amount);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatDate = dateVal => {
  if (!dateVal) return '—';
  const parsed = new Date(dateVal);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusStyle = status => {
  const normalized = String(status || '').toLowerCase();
  if (
    normalized === 'success' ||
    normalized === 'completed' ||
    normalized === 'paid'
  ) {
    return {
      bg: '#D1FAE5',
      text: '#065F46',
      icon: 'check-circle',
      label: 'Success',
    };
  }
  if (normalized === 'failed' || normalized === 'cancelled') {
    return {
      bg: '#FEE2E2',
      text: '#991B1B',
      icon: 'close-circle',
      label: 'Failed',
    };
  }
  return {
    bg: '#FEF3C7',
    text: '#92400E',
    icon: 'clock-outline',
    label: 'Pending',
  };
};

const InfoRow = ({ label, value, isBold = false, color = null }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text
      style={[
        styles.value,
        isBold && { fontFamily: FontFamily.bold },
        color && { color },
      ]}
      numberOfLines={2}
    >
      {value || '—'}
    </Text>
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const DonationDetailsScreen = ({ navigation, route }) => {
  const { donation } = route.params || {};
  const [loading] = useState(false);

  if (!donation) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <View style={styles.headerWrapper}>
            <BackHeader
              navigation={navigation}
              title="Donation Details"
              onBack={() => navigation && navigation.goBack()}
            />
          </View>
          <View style={styles.centerContainer}>
            <Icon name="alert-circle-outline" size={42} color="#DC2626" />
            <Text style={styles.errorTitle}>Donation not found</Text>
          </View>
        </View>
      </AppLayout>
    );
  }

  const statusInfo = getStatusStyle(donation.paymentStatus || donation.status);
  const donorName = donation.name || 'Anonymous Donor';
  const donorPhone = donation.phone || '—';
  const donorEmail = donation.email || '—';
  const fundType = donation.fundType?.title || donation.fundType || 'General';
  const paymentMode =
    donation.paymentMode || donation.paymentGateway || 'Online';
  const refId =
    donation.txnId ||
    donation.transactionId ||
    donation.receiptNo ||
    donation._id ||
    '—';

  const payuData = donation.payu || {};
  const gatewayResponse = donation.gatewayResponse || {};

  return (
    <AppLayout>
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <BackHeader
            navigation={navigation}
            title="Donation Details"
            onBack={() => navigation && navigation.goBack()}
          />
        </View>

        <View style={styles.body}>
          <Body>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Status Header */}
                <View style={styles.statusHeader}>
                  <View
                    style={[
                      styles.statusIconContainer,
                      { backgroundColor: statusInfo.bg },
                    ]}
                  >
                    <Icon
                      name={statusInfo.icon}
                      size={32}
                      color={statusInfo.text}
                    />
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text
                      style={[styles.statusLabel, { color: statusInfo.text }]}
                    >
                      {statusInfo.label}
                    </Text>
                    <Text style={styles.amountDisplay}>
                      {formatCurrency(donation.amount || donation.totalAmount)}
                    </Text>
                  </View>
                </View>

                {/* Donor Information Section */}
                <Section title="Donor Information">
                  <InfoRow label="Donor Name" value={donorName} isBold />
                  <InfoRow label="Phone" value={donorPhone} />
                  <InfoRow label="Email" value={donorEmail} />
                  <InfoRow label="City" value={donation.city} />
                  <InfoRow label="Pin Code" value={donation.pinCode} />
                  <InfoRow label="Address" value={donation.address} />
                </Section>

                {/* Donation Details Section */}
                <Section title="Donation Details">
                  <InfoRow label="Fund Type" value={fundType} isBold />
                  <InfoRow
                    label="Amount"
                    value={formatCurrency(donation.amount)}
                  />
                  <InfoRow label="Currency" value={donation.currency} />
                  <InfoRow
                    label="Contribution Type"
                    value={donation.contributeType}
                  />
                  <InfoRow
                    label="Is Anonymous"
                    value={donation.isAnonymous ? 'Yes' : 'No'}
                  />
                </Section>

                {/* Payment Information Section */}
                <Section title="Payment Information">
                  <InfoRow label="Payment Gateway" value={paymentMode} />
                  <InfoRow label="Payment Status" value={statusInfo.label} />
                  <InfoRow
                    label="Receipt No"
                    value={donation.receiptNo}
                    color={colors.primary}
                  />
                  <InfoRow label="Order ID" value={donation.orderId} />
                  <InfoRow
                    label="Transaction ID"
                    value={donation.transactionId}
                  />
                  <InfoRow label="Reference ID" value={refId} />
                </Section>

                {/* Transaction Dates */}
                <Section title="Transaction Dates">
                  <InfoRow
                    label="Created"
                    value={formatDate(donation.createdAt)}
                  />
                  <InfoRow
                    label="Updated"
                    value={formatDate(donation.updatedAt)}
                  />
                  <InfoRow
                    label="Paid At"
                    value={formatDate(donation.paidAt)}
                  />
                  <InfoRow
                    label="Transaction Date"
                    value={formatDate(donation.date)}
                  />
                </Section>

                {/* PayU Response */}
                {Object.keys(payuData).length > 0 && (
                  <Section title="PayU Details">
                    <InfoRow label="PayU TXN ID" value={payuData.txnid} />
                    <InfoRow label="PayU MI Pay ID" value={payuData.mihpayid} />
                    <InfoRow label="Mode" value={payuData.mode || '—'} />
                    <InfoRow
                      label="Bank Ref"
                      value={payuData.bankRefNum || '—'}
                    />
                  </Section>
                )}

                {/* Gateway Response Details */}
                {Object.keys(gatewayResponse).length > 0 && (
                  <Section title="Gateway Response">
                    <InfoRow
                      label="Status"
                      value={gatewayResponse.status?.toUpperCase()}
                      color={
                        gatewayResponse.status === 'success'
                          ? '#10B981'
                          : '#EF4444'
                      }
                    />
                    <InfoRow label="Error" value={gatewayResponse.error} />
                    <InfoRow
                      label="Error Message"
                      value={gatewayResponse.error_Message}
                    />
                    <InfoRow
                      label="Amount Debit"
                      value={formatCurrency(gatewayResponse.net_amount_debit)}
                    />
                    <InfoRow
                      label="Unmapped Status"
                      value={gatewayResponse.unmappedstatus}
                    />
                    <InfoRow label="PG Type" value={gatewayResponse.PG_TYPE} />
                  </Section>
                )}

                {/* PAN Details if exists */}
                {donation.pan && (
                  <Section title="Tax Information">
                    <InfoRow label="PAN" value={donation.pan} />
                  </Section>
                )}

                <View style={styles.footerSpacer} />
              </ScrollView>
            )}
          </Body>
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
  },
  headerWrapper: {
    zIndex: 10,
    backgroundColor: colors.white || '#FFFFFF',
  },
  body: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: '#1F2937',
    marginTop: 10,
  },
  scrollContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 30,
    paddingBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 10,
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  sectionContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    flex: 0.4,
  },
  value: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textPrimary,
    flex: 0.6,
    textAlign: 'right',
  },
  footerSpacer: {
    height: 20,
  },
});

export default DonationDetailsScreen;

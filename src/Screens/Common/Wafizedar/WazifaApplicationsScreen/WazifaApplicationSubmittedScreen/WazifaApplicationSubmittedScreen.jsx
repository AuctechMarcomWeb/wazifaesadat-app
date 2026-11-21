import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../../themes/typography';

import AppLayout from '../../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../../components/BackHeader/BackHeader';
import {
  Body,
  GreenButton,
  GrayButton,
  Badge,
} from '../../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const WazifaApplicationSubmittedScreen = ({ navigation }) => {
  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Application Submitted"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Success Banner */}
              <View style={styles.successBanner}>
                <View style={styles.successIconCircle}>
                  <Icon name="check" size={32} color={colors.white} />
                </View>
                <Text style={styles.successTitle}>
                  Wazifa Application Submitted Successfully!
                </Text>
                <Text style={styles.successSubtitle}>
                  Your application has been received.
                </Text>
              </View>

              {/* Details Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumKey}>Application No.</Text>
                  <Text style={styles.sumValBold}>202610174685</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumKey}>Student Name</Text>
                  <Text style={styles.sumVal}>Ali Raza</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumKey}>Form Type</Text>
                  <Text style={styles.sumVal}>New</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumKey}>Session</Text>
                  <Text style={styles.sumVal}>2026 - 2027</Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.sumKey}>Status</Text>
                  <Badge text="Pending" />
                </View>
              </View>

              {/* Notification Box */}
              <View style={styles.noteBox}>
                <Icon
                  name="information-outline"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.noteText}>
                  You will be notified once your application is verified.
                </Text>
              </View>

              {/* Action Buttons */}
              <GreenButton
                title="View Application"
                onPress={() => navigation.navigate('WazifaApplicationsScreen')}
                style={styles.viewAppBtn}
              />

              <GrayButton
                title="Back to List"
                onPress={() =>
                  navigation && navigation.navigate('WazifaApplications')
                }
                style={styles.backListBtn}
              />
            </ScrollView>
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
    marginTop: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  scrollContent: {
    marginTop: 20,
    paddingHorizontal: wp('4%'),
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  successBanner: { alignItems: 'center', marginBottom: 20 },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  sumKey: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  sumVal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
  },
  sumValBold: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.primary,
  },
  viewAppBtn: { width: '100%', height: 48, marginBottom: 10 },
  backListBtn: { width: '100%', height: 48 },
});

export default WazifaApplicationSubmittedScreen;

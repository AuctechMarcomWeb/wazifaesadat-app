import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import Colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import BottomNav from '../../../components/BottomNav/BottomNav';

const PrivacyPolicyScreen = ({ navigation }) => {
  const handleTabPress = key => {
    if (key === 'SettingScreen') return;
    navigation?.navigate(key);
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Privacy Policy" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.lastUpdated}>Last updated: November 2026</Text>
          </View>

          {/* Content */}
          <View style={styles.contentCard}>
            <Section
              title="1. Introduction"
              content="At AWSM, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services."
            />

            <Section
              title="2. Information We Collect"
              content="We collect information you provide directly to us, such as:
• Personal identification information (name, email, phone number)
• Account credentials and password
• Profile information and preferences
• Transaction and payment information
• Communication records
• Location data (if permitted)"
            />

            <Section
              title="3. How We Use Your Information"
              content="We use the information we collect to:
• Provide and maintain our services
• Process your transactions
• Send you updates and notifications
• Improve our app and user experience
• Ensure security and prevent fraud
• Comply with legal obligations"
            />

            <Section
              title="4. Data Security"
              content="We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is completely secure."
            />

            <Section
              title="5. Information Sharing"
              content="We do not sell, trade, or rent your personal information to third parties. We may share information with:
• Service providers who assist us in operating our app
• Law enforcement when required by law
• Other parties with your consent"
            />

            <Section
              title="6. Your Rights"
              content="You have the right to:
• Access your personal information
• Request correction of inaccurate data
• Request deletion of your information
• Opt-out of marketing communications
• Data portability"
            />

            <Section
              title="7. Contact Us"
              content="If you have questions about this Privacy Policy or our privacy practices, please contact us at:

Email: privacy@awsm.org
Phone: +91-XXXX-XXX-XXX

We will respond to your inquiry within 30 days."
            />

            <Section
              title="8. Changes to This Policy"
              content="We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date."
            />
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </View>

      <BottomNav active="SettingScreen" onPress={handleTabPress} />
    </AppLayout>
  );
};

// Reusable Section Component
const Section = ({ title, content }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionContent}>{content}</Text>
  </View>
);

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('3%'),
  },

  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  headerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.white,
    marginBottom: hp('0.5%'),
  },

  lastUpdated: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.primaryLight,
  },

  contentCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    elevation: 1,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.035,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  section: {
    marginBottom: hp('2.5%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9E7',
  },

  sectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginBottom: hp('0.8%'),
  },

  sectionContent: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  footer: {
    height: hp('2%'),
  },
});

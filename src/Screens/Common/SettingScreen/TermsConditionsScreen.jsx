import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import Colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import BottomNav from '../../../components/BottomNav/BottomNav';

const TermsConditionsScreen = ({ navigation }) => {
  const handleTabPress = key => {
    if (key === 'SettingScreen') return;
    navigation?.navigate(key);
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Terms & Conditions" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
            <Text style={styles.lastUpdated}>Last updated: November 2026</Text>
          </View>

          {/* Content */}
          <View style={styles.contentCard}>
            <Section
              title="1. Acceptance of Terms"
              content="By downloading, accessing, and using the AWSM application, you agree to be bound by these Terms & Conditions. If you disagree with any part of these terms, please do not use our services."
            />

            <Section
              title="2. User Eligibility"
              content="• You must be at least 18 years old to use this application
• You are responsible for maintaining the confidentiality of your account credentials
• You agree to provide accurate and truthful information during registration"
            />

            <Section
              title="3. User Responsibilities"
              content="You agree to:
• Use the application only for lawful purposes
• Not engage in any conduct that restricts or inhibits access to the service
• Not attempt to gain unauthorized access to any portion of the application
• Not upload or transmit viruses or harmful code
• Comply with all applicable laws and regulations"
            />

            <Section
              title="4. Intellectual Property Rights"
              content="All content, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are the exclusive property of AWSM, its licensors, or content providers."
            />

            <Section
              title="5. Limitation of Liability"
              content="To the fullest extent permissible by law, AWSM shall not be liable for any indirect, incidental, special, consequential, or punitive damages, regardless of the cause of action or the theory of liability, even if AWSM has been advised of the possibility of such damages."
            />

            <Section
              title="6. Disclaimer of Warranties"
              content="The application is provided 'AS IS' and 'AS AVAILABLE' without any representations or warranties. AWSM makes no representations or warranties regarding the accuracy, reliability, or completeness of the content."
            />

            <Section
              title="7. Third-Party Links"
              content="The application may contain links to third-party websites and applications. AWSM is not responsible for the content, accuracy, or practices of these external sites. Your use of third-party websites is governed by their own terms and conditions."
            />

            <Section
              title="8. Termination"
              content="AWSM reserves the right to suspend or terminate your account and access to the application at any time, with or without cause, and with or without notice."
            />

            <Section
              title="9. Governing Law"
              content="These Terms & Conditions are governed by and construed in accordance with the laws applicable in the jurisdiction where AWSM operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location."
            />

            <Section
              title="10. Contact Information"
              content="For any questions regarding these Terms & Conditions, please contact us at:

Email: support@awsm.org
Phone: +91-XXXX-XXX-XXX

We will respond to your inquiry within 30 days."
            />

            <Section
              title="11. Changes to Terms"
              content="AWSM reserves the right to modify these Terms & Conditions at any time. Your continued use of the application following the posting of revised terms means that you accept and agree to the changes."
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

export default TermsConditionsScreen;

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

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import Colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';
import BottomNav from '../../../components/BottomNav/BottomNav';

const AboutAppScreen = ({ navigation }) => {
  const handleTabPress = key => {
    if (key === 'SettingScreen') return;
    navigation?.navigate(key);
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="About App" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* App Logo & Title Card */}
          <View style={styles.logoCard}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons
                name="application-braces"
                size={60}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.appName}>AWSM</Text>
            <Text style={styles.appTagline}>Member Management Platform</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          {/* About Section */}
          <View style={styles.contentCard}>
            <SectionHeader icon="information-outline" title="About AWSM" />

            <Text style={styles.description}>
              AWSM is a comprehensive member management and financial tracking platform designed for organizations to efficiently manage collections, memberships, and financial operations.
            </Text>

            <Text style={styles.description}>
              Our platform provides tools for:
            </Text>

            <FeatureItem icon="cash-multiple" title="Collection Management" />
            <FeatureItem icon="clipboard-list" title="Member Registry" />
            <FeatureItem icon="chart-line" title="Financial Reports" />
            <FeatureItem icon="account-multiple" title="Organization Structure" />
            <FeatureItem icon="file-document" title="Document Management" />
          </View>

          {/* Features Card */}
          <View style={styles.contentCard}>
            <SectionHeader icon="star-outline" title="Key Features" />

            <Feature
              title="Secure Authentication"
              description="Two-factor authentication and encrypted credentials"
            />

            <Feature
              title="Real-Time Reports"
              description="Generate financial and membership reports instantly"
            />

            <Feature
              title="Mobile First Design"
              description="Optimized for mobile devices with offline capabilities"
            />

            <Feature
              title="Permission-Based Access"
              description="Granular role-based access control"
            />

            <Feature
              title="Data Privacy"
              description="Enterprise-grade security and data protection"
            />
          </View>

          {/* Contact Card */}
          <View style={styles.contentCard}>
            <SectionHeader icon="contact-mail-outline" title="Contact & Support" />

            <ContactItem icon="email-outline" label="Email" value="support@awsm.org" />
            <ContactItem icon="phone-outline" label="Phone" value="+91-XXXX-XXX-XXX" />
            <ContactItem icon="web" label="Website" value="www.awsm.org" />
          </View>

          {/* Build Info Card */}
          <View style={styles.buildCard}>
            <Text style={styles.buildTitle}>Build Information</Text>
            <BuildInfo label="App Version" value="1.0.0" />
            <BuildInfo label="Build Number" value="100" />
            <BuildInfo label="Release Date" value="November 2026" />
            <BuildInfo label="Platform" value="React Native" />
          </View>

          {/* Legal Section */}
          <View style={styles.contentCard}>
            <SectionHeader icon="scale-balance" title="Legal" />
            <LegalLink title="Privacy Policy" />
            <LegalLink title="Terms & Conditions" />
          </View>

          {/* Footer */}
          <View style={styles.footerCard}>
            <MaterialCommunityIcons
              name="heart"
              size={20}
              color={Colors.danger}
            />
            <Text style={styles.footerText}>Made with care for our members</Text>
            <Text style={styles.copyrightText}>© 2026 AWSM. All rights reserved.</Text>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </View>

      <BottomNav active="SettingScreen" onPress={handleTabPress} />
    </AppLayout>
  );
};

// Section Header Component
const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <MaterialCommunityIcons
      name={icon}
      size={22}
      color={Colors.primary}
    />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// Feature Item Component
const FeatureItem = ({ icon, title }) => (
  <View style={styles.featureItem}>
    <MaterialCommunityIcons
      name={icon}
      size={20}
      color={Colors.primary}
    />
    <Text style={styles.featureText}>{title}</Text>
  </View>
);

// Feature Component
const Feature = ({ title, description }) => (
  <View style={styles.feature}>
    <View style={styles.featureBullet} />
    <View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

// Contact Item Component
const ContactItem = ({ icon, label, value }) => (
  <View style={styles.contactItem}>
    <MaterialCommunityIcons
      name={icon}
      size={18}
      color={Colors.primary}
    />
    <View style={styles.contactContent}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
  </View>
);

// Build Info Component
const BuildInfo = ({ label, value }) => (
  <View style={styles.buildInfo}>
    <Text style={styles.buildLabel}>{label}:</Text>
    <Text style={styles.buildValue}>{value}</Text>
  </View>
);

// Legal Link Component
const LegalLink = ({ title }) => (
  <View style={styles.legalLink}>
    <View style={styles.legalBullet} />
    <Text style={styles.legalText}>{title}</Text>
    <MaterialCommunityIcons
      name="chevron-right"
      size={18}
      color={Colors.textSecondary}
    />
  </View>
);

export default AboutAppScreen;

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

  logoCard: {
    backgroundColor: Colors.primary,
    borderRadius: wp('4%'),
    padding: wp('6%'),
    marginBottom: hp('2.5%'),
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  logoContainer: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },

  appName: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.white,
    marginBottom: hp('0.3%'),
  },

  appTagline: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.primaryLight,
    marginBottom: hp('0.5%'),
  },

  version: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.white,
    opacity: 0.8,
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },

  sectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
  },

  description: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: hp('1%'),
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
    gap: wp('2.5%'),
  },

  featureText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.TitleColor,
  },

  feature: {
    flexDirection: 'row',
    paddingVertical: hp('1.2%'),
    gap: wp('2.5%'),
    paddingLeft: wp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9E7',
  },

  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: hp('0.3%'),
  },

  featureTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginBottom: hp('0.2%'),
  },

  featureDescription: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },

  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: hp('1.2%'),
    gap: wp('3%'),
    paddingLeft: wp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9E7',
  },

  contactContent: {
    flex: 1,
  },

  contactLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },

  contactValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginTop: hp('0.2%'),
  },

  buildCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },

  buildTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginBottom: hp('1%'),
  },

  buildInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('0.7%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9E7',
  },

  buildLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },

  buildValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },

  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    gap: wp('2%'),
    paddingHorizontal: wp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9E7',
  },

  legalBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  legalText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.TitleColor,
  },

  footerCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.primaryLight,
  },

  footerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginTop: hp('0.5%'),
  },

  copyrightText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: hp('0.5%'),
  },

  footer: {
    height: hp('2%'),
  },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';


import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import BackHeader from '../../components/BackHeader/BackHeader';
import AppLayout from '../../components/AppLayout/AppLayout';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import Colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import BottomNav from '../../components/BottomNav/BottomNav';

const ABOUT_PARAGRAPHS = [
  'The objects of the Anjuman Wazifa-e-Sadat-wa-Momineen include spreading of education in the community and to provide vocational guidance to the students for acquiring purposeful and job oriented education. Beside this the idea behind this provision is that the scholarship holders should develop a sense of pride and self confidence, also develop a sense of responsibility for helping their community to become self respecting.',
  'Anjuman Wazifa-e-Sadat-wa-Momineen is duly registered as a society under the society registration act 1860 of India. Anjuman has its own constitution and bye-laws framed under the society act. The highest body of the Anjuman is its Executive Committee. Its office bearers are elected every year in its Annual Session.',
  'Anjuman Wazifa-e-Sadat-wa-Momineen has 117 local secretaries spread over various cities of India and some abroad too. The local secretaries are the backbone of the Anjuman, who collect membership fees, recover loans and enroll new members. They collect applications for scholarship and recommend them for sanction.',
  'Anjuman Wazifa-e-Sadat wa Momineen has its own building "Wazifa Manzil" at Ahmad Nager, Aligarh where its Head office is located. Its central office remains attached with the General Secretary which keeps changing as per the elections. Anjuman\'s General Body Meeting is also held at different places accordingly.',
  'Anjuman Wazifa-e-Sadat wa Momineen publishes monthly journal \'Wazifa\' (Aligarh) which covers all the activities of the Anjumen and name and addresses of all new members as per categories. The annual subscription of the journal is Rs. 40/-. The Anjuman also publishes a calender every year. Now \'Ijaza\' has been obtained by the Anjuman for receiving "Khums" (Sahme-Imam) from Ayatullah Syed Ali Hussaini Seestani and from Ayatullah Makaram Shirazi. Momineen may donate "Khums" to Anjuman for this noble cause of education for the needy.',
  "Philanthropists of the community may also help the Anjuman by establishing 'Nominated Fund' or 'Namzad Fund' in the name of their deceased or living relatives and loved ones. The fund can be started from rupees five thousand (Rs. 5000/-) and any amount can be added to it at any later stage. Right now 711 such funds already exist in the Anjuman. It is also worth mentioning that all the amounts received for 'Nominated Funds' are kept as \"Fixed Deposit\" in the Bank and annual interest of F.D. is lent as scholarship to meritorious students. As such the capital amount remains intact while its benefit reaches to the community on recurring basis. We urge each well meaning individual to help make this list longer by forming new nominate funds.",
];

const AboutAppScreen = ({ navigation }) => {
  const handleTabPress = key => {
    if (key === 'SettingScreen') return;
    navigation?.navigate(key);
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="About Us" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.contentCard}>
            {/* <SectionHeader icon="information-outline" title="About" /> */}

            {ABOUT_PARAGRAPHS.map((paragraph, index) => (
              <Text
                key={index}
                style={[
                  styles.description,
                  index === ABOUT_PARAGRAPHS.length - 1 && styles.lastParagraph,
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </View>

    

          <View style={styles.footer} />
        </ScrollView>
      </View>

      <BottomNav active="SettingScreen" onPress={handleTabPress} />
    </AppLayout>
  );
};

const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <MaterialCommunityIcons name={icon} size={22} color={Colors.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
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
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: hp('0.3%'),
  },

  appTagline: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.primaryLight,
    textAlign: 'center',
  },

  contentCard: {
    marginBottom: hp('2%'),
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
    lineHeight: 21,
    marginBottom: hp('1.4%'),
  },

  lastParagraph: {
    marginBottom: 0,
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
    textAlign: 'center',
  },

  footer: {
    height: hp('2%'),
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Share,
  SafeAreaView,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import {
  Body,
  PillTabs,
  GreenButton,
  GrayButton,
} from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const TABS = ['Posts', 'Blogs', 'Jobs', 'Appeals'];

const JOBS_DATA = [
  {
    id: '1',
    title: 'Field Coordinator',
    company: 'Anjuman Wazifa',
    location: 'Lucknow, UP',
    salary: '20K - 30K',
    date: '22 Oct 2026',
    type: 'Full Time',
    image: '💼',
    experience: '2-3 Years',
    qualifications: 'Graduate in any stream',
    description:
      'Looking for dedicated individuals to coordinate field operations. Responsibilities include managing teams, community outreach, and program implementation.',
    responsibilities: [
      'Manage field operations',
      'Community engagement',
      'Data collection',
      'Report submission',
    ],
    applicants: 24,
  },
  {
    id: '2',
    title: 'Education Mentor',
    company: 'Anjuman Education Cell',
    location: 'Delhi',
    salary: '15K - 25K',
    date: '20 Oct 2026',
    type: 'Contract',
    image: '📚',
    experience: '1-2 Years',
    qualifications: "Bachelor's in Education or relevant field",
    description:
      'Be part of our education initiative. Guide and mentor students in their academic journey.',
    responsibilities: [
      'Tuition delivery',
      'Student guidance',
      'Progress tracking',
      'Parent communication',
    ],
    applicants: 18,
  },
];

const JobsScreen = ({ navigation, onTabChange }) => {
  const [activeTab, setActiveTab] = useState('Jobs');
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTabChange = tab => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleJobPress = job => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  const handleShare = async job => {
    try {
      await Share.share({
        message: `${job.title}\n${job.company}\n${job.salary}\nLocation: ${job.location}\n\nApply now on Anjuman Community App`,
        title: job.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderJob = ({ item }) => (
    <TouchableOpacity
      style={styles.jobCard}
      activeOpacity={0.8}
      onPress={() => handleJobPress(item)}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobImageBox}>
          <Text style={styles.jobImage}>{item.image}</Text>
        </View>
        <View style={styles.jobInfo}>
          <View style={styles.jobTypeBadge}>
            <Text style={styles.jobTypeText}>{item.type}</Text>
          </View>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.company}>{item.company}</Text>
        </View>
        <Text style={styles.salary}>{item.salary}</Text>
      </View>
      <View style={styles.jobMeta}>
        <Icon name="map-marker" size={14} color={colors.textSecondary} />
        <Text style={styles.location}>{item.location}</Text>
        <Icon
          name="calendar"
          size={14}
          color={colors.textSecondary}
          style={{ marginLeft: 12 }}
        />
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Anjuman Jobs"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <View style={styles.tabContainer}>
              <PillTabs
                tabs={TABS}
                active={activeTab}
                onChange={handleTabChange}
              />
            </View>

            <FlatList
              data={JOBS_DATA}
              keyExtractor={item => item.id}
              renderItem={renderJob}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </Body>
        </View>

        {/* Job Detail Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <AppLayout style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Job Details</Text>
              <TouchableOpacity onPress={() => handleShare(selectedJob)}>
                <Icon name="share-variant" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedJob && (
                <View>
                  {/* Job Header */}
                  <View style={styles.jobHeaderModal}>
                    <View style={styles.jobImageBoxModal}>
                      <Text style={styles.largeImage}>{selectedJob.image}</Text>
                    </View>
                    <Text style={styles.jobTitleModal}>
                      {selectedJob.title}
                    </Text>
                    <Text style={styles.companyModal}>
                      {selectedJob.company}
                    </Text>
                    <View style={styles.salaryBadge}>
                      <Icon
                        name="currency-inr"
                        size={16}
                        color={colors.white}
                      />
                      <Text style={styles.salaryBadgeText}>
                        {selectedJob.salary}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Info */}
                  <View style={styles.quickInfoBox}>
                    <View style={styles.infoItem}>
                      <Icon
                        name="map-marker"
                        size={18}
                        color={colors.primary}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>
                          {selectedJob.location}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.infoItem}>
                      <Icon name="briefcase" size={18} color={colors.primary} />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.infoLabel}>Type</Text>
                        <Text style={styles.infoValue}>{selectedJob.type}</Text>
                      </View>
                    </View>
                    <View style={styles.infoItem}>
                      <Icon name="school" size={18} color={colors.primary} />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.infoLabel}>Experience</Text>
                        <Text style={styles.infoValue}>
                          {selectedJob.experience}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>About This Job</Text>
                    <Text style={styles.sectionContent}>
                      {selectedJob.description}
                    </Text>
                  </View>

                  {/* Responsibilities */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Responsibilities</Text>
                    {selectedJob.responsibilities.map((resp, idx) => (
                      <View key={idx} style={styles.respItem}>
                        <Icon
                          name="check-circle"
                          size={16}
                          color={colors.success}
                        />
                        <Text style={styles.respText}>{resp}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Requirements */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Requirements</Text>
                    <View style={styles.reqItem}>
                      <Icon name="book" size={16} color={colors.primary} />
                      <Text style={styles.reqText}>
                        {selectedJob.qualifications}
                      </Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsBox}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Applicants</Text>
                      <Text style={styles.statNum}>
                        {selectedJob.applicants}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Posted</Text>
                      <Text style={styles.statNum}>{selectedJob.date}</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <GrayButton
                title="Cancel"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <GreenButton
                title="Apply Now"
                icon="send"
                onPress={() => {
                  alert(`Applied for ${selectedJob.title}`);
                  setModalVisible(false);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </AppLayout>
        </Modal>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  body: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  tabContainer: { paddingHorizontal: wp('4%'), marginTop: 12, marginBottom: 8 },
  listContent: { paddingHorizontal: wp('4%'), paddingBottom: 20 },
  jobCard: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  jobImageBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  jobImage: { fontSize: 28 },
  jobInfo: { flex: 1 },
  jobTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  jobTypeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: '#1976D2',
  },
  jobTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  company: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },
  salary: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.success,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  date: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: wp('4%'),
    paddingVertical: 14,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 2,
  },
  jobHeaderModal: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  jobImageBoxModal: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  largeImage: { fontSize: 40 },
  jobTitleModal: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 4,
  },
  companyModal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
    marginBottom: 8,
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  salaryBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 6,
  },
  quickInfoBox: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 2,
  },
  sectionBox: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    lineHeight: 20,
  },
  respItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  respText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    marginLeft: 8,
    flex: 1,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    marginLeft: 8,
    flex: 1,
  },
  statsBox: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },
  statNum: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
});

export default JobsScreen;

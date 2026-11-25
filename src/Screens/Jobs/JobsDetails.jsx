import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { shareNewsEvent } from '../../api/AllTabsApi';
import { BASE_URL } from '../../api/apiConfig';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';

const getShareUrl = (jobId) => {
  if (!jobId) return '';
  const segment = 'jobs';
  return `${BASE_URL}/${segment}/${jobId}`;
};

const JobsDetails = ({ route, navigation }) => {
  const { jobId, job: initialJob } = route?.params || {};
  const [job, setJob] = useState(initialJob);
  const [loading, setLoading] = useState(!initialJob);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!initialJob && jobId) {
      // Could fetch job details if needed
      setLoading(false);
    }
  }, [jobId, initialJob]);

  const handleShare = async () => {
    if (!job || isSharing) return;

    setIsSharing(true);

    try {
      const shareUrl = getShareUrl(job._id);
      const message = [job?.title, shareUrl]
        .filter(Boolean)
        .join('\n\n');

      const result = await Share.share({
        message: message || shareUrl,
        url: shareUrl,
        title: job?.title || 'Share Job',
      });

      if (result?.action !== Share.sharedAction) return;

      const payload = {
        shareUrl,
        platform: 'native_share',
        title: job?.title || '',
        type: 'job',
      };

      await shareNewsEvent(job._id, payload);
    } catch (err) {
      console.error('Share Error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BackHeader title="Job Details" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <BackHeader title="Job Details" />
        <View style={styles.centerContent}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Job Details" />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.titleSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitle}>{job?.title}</Text>
              <Text style={styles.company}>{job?.company}</Text>
            </View>
            <TouchableOpacity
              style={[styles.shareBtn, isSharing && styles.sharingBtn]}
              onPress={handleShare}
              disabled={isSharing}
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color={isSharing ? colors.secondary : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Info */}
        <View style={styles.infoGrid}>
          {job?.jobType && (
            <View style={styles.infoCard}>
              <Ionicons
                name="briefcase"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.infoLabel}>Job Type</Text>
              <Text style={styles.infoValue}>{job.jobType}</Text>
            </View>
          )}
          {job?.location && (
            <View style={styles.infoCard}>
              <Ionicons
                name="location"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{job.location}</Text>
            </View>
          )}
          {job?.minSalary && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons
                name="cash"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.infoLabel}>Salary</Text>
              <Text style={styles.infoValue}>
                ₹{job.minSalary}
                {job?.maxSalary ? ` - ${job.maxSalary}` : '+'}
              </Text>
            </View>
          )}
          {job?.experience && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons
                name="briefcase-clock"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>{job.experience}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {job?.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>
        )}

        {/* Requirements */}
        {job?.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.requirementText}>
              {Array.isArray(job.requirements)
                ? job.requirements.join('\n• ')
                : job.requirements}
            </Text>
          </View>
        )}

        {/* Skills */}
        {job?.skills && job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {job.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Apply Button */}
        {job?.applyLink && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => Linking.openURL(job.applyLink)}
          >
            <Text style={styles.applyBtnText}>Apply Now</Text>
            <Ionicons name="open" size={18} color="white" />
          </TouchableOpacity>
        )}

        <View style={styles.spacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  shareBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  sharingBtn: {
    opacity: 0.6,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  requirementText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  skillText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
  },
  applyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  spacing: {
    height: 20,
  },
});

export default JobsDetails;

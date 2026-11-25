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
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { shareNewsEvent } from '../../api/AllTabsApi';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';
import AppLayout from '../../components/AppLayout/AppLayout';

const stripHtml = html => {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/(p|div|h1|h2|h3|h4|br)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const getJobTitle = job => job?.jobTitle || job?.title || 'Untitled Job';

const getCompanyName = job =>
  job?.companyName || job?.company || 'Company Not Specified';

const getLocationText = job => {
  if (typeof job?.location === 'string' && job.location.trim()) {
    return job.location.trim();
  }
  if (Array.isArray(job?.locations) && job.locations.length > 0) {
    return job.locations
      .map(loc =>
        [loc?.address, loc?.city, loc?.state, loc?.pincode]
          .filter(Boolean)
          .join(', '),
      )
      .filter(Boolean)
      .join(' | ');
  }
  return '';
};

const formatSalaryRange = job => {
  if (typeof job?.salary === 'string' && job.salary.trim()) {
    return job.salary.trim();
  }
  const min = Number(job?.minimumSalary || 0);
  const max = Number(job?.maximumSalary || 0);
  if (!min && !max) return '';

  const symbol = job?.currency === 'USD' ? '$' : '₹';
  const period =
    job?.salaryPeriod === 'YEARLY'
      ? '/yr'
      : job?.salaryPeriod === 'MONTHLY'
      ? '/mo'
      : '';

  const fmt = val => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${Math.round(val / 1000)}K`;
    return `${val.toLocaleString('en-IN')}`;
  };

  if (min && max && min !== max) {
    return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}${period}`;
  }
  return `${symbol}${fmt(min || max)}${period}`;
};

const formatExperience = job => {
  if (typeof job?.experience === 'string' && job.experience.trim()) {
    return job.experience.trim();
  }
  const minExp = job?.minimumExperience;
  const maxExp = job?.maximumExperience;
  const unit = (job?.experienceUnit || 'YEARS').toLowerCase();
  if (
    minExp !== undefined &&
    minExp !== null &&
    maxExp !== undefined &&
    maxExp !== null
  ) {
    if (minExp === maxExp) return `${minExp} ${unit}`;
    return `${minExp}–${maxExp} ${unit}`;
  }
  if (minExp) return `${minExp}+ ${unit}`;
  if (maxExp) return `Up to ${maxExp} ${unit}`;
  return '';
};

const formatEnumLabel = val => {
  if (!val || typeof val !== 'string') return '';
  return val
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, ch => ch.toUpperCase());
};

const getApplyTarget = job => {
  if (job?.externalApplicationUrl) return job.externalApplicationUrl;
  if (job?.applyLink) return job.applyLink;
  if (job?.url) return job.url;
  if (job?.applicationEmail) return `mailto:${job.applicationEmail}`;
  return '';
};

const JobsCareerDetails = ({ route, navigation }) => {
  const { jobId, job: initialJob } = route?.params || {};
  const [job, setJob] = useState(initialJob);
  const [loading, setLoading] = useState(!initialJob);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!initialJob && jobId) {
      setLoading(false);
    }
  }, [jobId, initialJob]);

  const applyTarget = getApplyTarget(job);
  const isMailApply = applyTarget.startsWith('mailto:');

  const handleShare = async () => {
    const id = job?._id || job?.id || jobId;
    if (!job || !id || isSharing) return;

    setIsSharing(true);

    try {
      const title = getJobTitle(job);
      const company = getCompanyName(job);
      const location = getLocationText(job);

      const message = [
        title,
        company ? `Company: ${company}` : '',
        location ? `Location: ${location}` : '',
        applyTarget && !isMailApply ? applyTarget : '',
      ]
        .filter(Boolean)
        .join('\n');

      const result = await Share.share({
        message: message || title,
        url: applyTarget && !isMailApply ? applyTarget : undefined,
        title,
      });

      if (result?.action !== Share.sharedAction) return;

      await shareNewsEvent(id, {
        shareUrl: applyTarget || '',
        platform: 'native_share',
        title,
        type: 'job',
      });
    } catch (err) {
      console.error('Share Error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleApply = () => {
    if (applyTarget) {
      Linking.openURL(applyTarget).catch(() => {
        Alert.alert(
          'Unable to Open',
          'Application link/email could not be opened on this device.',
        );
      });
      return;
    }

    const recruiterEmail = job?.recruiter?.email;
    if (recruiterEmail) {
      Alert.alert(
        'Apply for Position',
        `Send your application or resume to ${recruiterEmail} with Job Code: ${
          job?.jobCode || getJobTitle(job)
        }.`,
      );
      return;
    }

    Alert.alert(
      'Application Info',
      `To apply for ${getJobTitle(job)} at ${getCompanyName(job)}, please contact the recruiter or check the portal listing (${job?.jobCode || 'N/A'}).`,
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader title="Job Details" navigation={navigation} />
          <View style={styles.centerContent}>
            <ActivityIndicator
              size="large"
              color={colors.primary || '#167A43'}
            />
          </View>
        </View>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader title="Job Details" navigation={navigation} />
          <View style={styles.centerContent}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.textSecondary || '#737373'}
            />
            <Text style={styles.errorText}>Job not found</Text>
          </View>
        </View>
      </AppLayout>
    );
  }

  const title = getJobTitle(job);
  const company = getCompanyName(job);
  const location = getLocationText(job);
  const salary = formatSalaryRange(job);
  const experience = formatExperience(job);
  const jobType = formatEnumLabel(job?.jobType);
  const workMode = formatEnumLabel(job?.workMode);
  const categoryTitle = job?.jobCategory?.title || '';
  const cleanDescription = stripHtml(
    job?.description || job?.jobDescription || '',
  );
  const postedDate = job?.publishedAt || job?.postedDate || job?.createdAt;
  const deadlineDate = job?.applicationDeadline || job?.deadline;

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader title="Job Details" navigation={navigation} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.titleSection}>
              <View style={styles.titleWrap}>
                {(categoryTitle || workMode) && (
                  <Text style={styles.categoryBadge}>
                    {[categoryTitle, workMode].filter(Boolean).join(' • ')}
                  </Text>
                )}
                <Text style={styles.jobTitle}>{title}</Text>
                <Text style={styles.company}>{company}</Text>
                {!!job?.jobCode && (
                  <Text style={styles.jobCode}>Code: {job.jobCode}</Text>
                )}
              </View>


            </View>
          </View>

          {/* Quick Info Grid */}
          <View style={styles.infoGrid}>
            {!!jobType && (
              <View style={styles.infoCard}>
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.infoLabel}>Job Type</Text>
                <Text style={styles.infoValue}>{jobType}</Text>
              </View>
            )}

            {!!location && (
              <View style={styles.infoCard}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {location}
                </Text>
              </View>
            )}

            {!!salary && (
              <View style={styles.infoCard}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={20}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.infoLabel}>Salary</Text>
                <Text style={styles.infoValue}>{salary}</Text>
              </View>
            )}

            {!!experience && (
              <View style={styles.infoCard}>
                <MaterialCommunityIcons
                  name="briefcase-clock-outline"
                  size={20}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>{experience}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {!!cleanDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <Text style={styles.description}>{cleanDescription}</Text>
            </View>
          )}

          {/* Responsibilities */}
          {Array.isArray(job?.responsibilities) &&
            job.responsibilities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Responsibilities</Text>
                <Text style={styles.listText}>
                  {job.responsibilities.map(item => `• ${item}`).join('\n')}
                </Text>
              </View>
            )}

          {/* Requirements */}
          {!!job?.requirements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.listText}>
                {Array.isArray(job.requirements)
                  ? job.requirements.map(req => `• ${req}`).join('\n')
                  : stripHtml(job.requirements)}
              </Text>
            </View>
          )}

          {/* Skills */}
          {Array.isArray(job?.skills) && job.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Skills</Text>
              <View style={styles.skillsContainer}>
                {job.skills.map((skill, idx) => (
                  <View key={`${skill}-${idx}`} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Extra Metadata */}
          {(!!job?.numberOfVacancies ||
            !!job?.minimumQualification ||
            !!postedDate ||
            !!deadlineDate) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>

              {!!job?.numberOfVacancies && (
                <View style={styles.metaRow}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.primary || '#167A43'}
                  />
                  <Text style={styles.metaRowText}>
                    Vacancies: {job.numberOfVacancies}
                  </Text>
                </View>
              )}

              {!!job?.minimumQualification && (
                <View style={styles.metaRow}>
                  <Ionicons
                    name="school-outline"
                    size={16}
                    color={colors.primary || '#167A43'}
                  />
                  <Text style={styles.metaRowText}>
                    Qualification: {job.minimumQualification}
                  </Text>
                </View>
              )}

              {!!postedDate && (
                <View style={styles.metaRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.primary || '#167A43'}
                  />
                  <Text style={styles.metaRowText}>
                    Posted: {new Date(postedDate).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {!!deadlineDate && (
                <View style={styles.metaRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.primary || '#167A43'}
                  />
                  <Text style={styles.metaRowText}>
                    Apply Before: {new Date(deadlineDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Ionicons
              name={
                isMailApply
                  ? 'mail-outline'
                  : applyTarget
                  ? 'open-outline'
                  : 'checkmark-circle-outline'
              }
              size={19}
              color="#FFFFFF"
            />
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>

          {/* Share Button */}
   
        </ScrollView>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F6F7F9',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary || '#737373',
    marginTop: 12,
  },
  headerCard: {
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary || '#167A43',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text || '#121212',
    lineHeight: 25,
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: colors.textSecondary || '#374151',
    fontWeight: '600',
  },
  jobCode: {
    fontSize: 11.5,
    color: colors.textSecondary || '#737373',
    marginTop: 4,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingBtn: {
    opacity: 0.6,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  infoCard: {
    width: '48.4%',
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary || '#737373',
    marginTop: 5,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12.5,
    color: colors.text || '#121212',
    marginTop: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text || '#121212',
    marginBottom: 8,
  },
  description: {
    fontSize: 13.5,
    color: colors.textSecondary || '#4B5563',
    lineHeight: 21,
  },
  listText: {
    fontSize: 13.5,
    color: colors.textSecondary || '#4B5563',
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  skillBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  skillText: {
    fontSize: 12,
    color: colors.primary || '#167A43',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaRowText: {
    fontSize: 13,
    color: colors.textSecondary || '#4B5563',
    flex: 1,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#167A43',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  shareFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white || '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: colors.primary || '#167A43',
    gap: 8,
  },
  shareFullBtnText: {
    color: colors.primary || '#167A43',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default JobsCareerDetails;
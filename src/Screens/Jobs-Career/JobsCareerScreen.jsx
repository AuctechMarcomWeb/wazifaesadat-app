import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getPersonalizedJobs } from '../../api/JobsApi';
import { shareNewsEvent } from '../../api/AllTabsApi';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';
import AppLayout from '../../components/AppLayout/AppLayout';

const PAGE_LIMIT = 10;

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
    const first = job.locations[0];
    const parts = [first?.city, first?.state].filter(Boolean);
    const base = parts.join(', ') || first?.address || '';
    return job.locations.length > 1
      ? `${base} (+${job.locations.length - 1})`
      : base;
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
  if (minExp !== undefined && minExp !== null && maxExp !== undefined && maxExp !== null) {
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

const JobsCareerScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sharingIds, setSharingIds] = useState({});

  const fetchJobs = useCallback(
    async ({ append = false } = {}) => {
      if (append && !hasMore) return;

      try {
        if (!append) setLoading(true);

        const nextPage = append ? page + 1 : 1;
        const result = await getPersonalizedJobs({
          page: nextPage,
          limit: PAGE_LIMIT,
        });

        if (result?.success) {
          const rawData = result.data;
          const newJobs = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.jobs)
            ? rawData.jobs
            : [];

          setJobs(prev => (append ? [...prev, ...newJobs] : newJobs));
          setPage(nextPage);

          const totalPages = rawData?.pagination?.totalPages;
          if (typeof totalPages === 'number') {
            setHasMore(nextPage < totalPages);
          } else {
            setHasMore(newJobs.length >= PAGE_LIMIT);
          }
        }
      } catch (err) {
        console.error('Fetch Jobs Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [page, hasMore],
  );

  useEffect(() => {
    fetchJobs({ append: false });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobs({ append: false });
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchJobs({ append: true });
    }
  };

  const handleShare = useCallback(async job => {
    const id = job?._id || job?.id;
    if (!id) return;

    setSharingIds(prev => ({ ...prev, [id]: true }));

    try {
      const title = getJobTitle(job);
      const company = getCompanyName(job);
      const location = getLocationText(job);
      const applyUrl = getApplyTarget(job);

      const summary = [
        title,
        company ? `Company: ${company}` : '',
        location ? `Location: ${location}` : '',
        applyUrl && !applyUrl.startsWith('mailto:') ? applyUrl : '',
      ]
        .filter(Boolean)
        .join('\n');

      const result = await Share.share({
        message: summary || title,
        url: applyUrl && !applyUrl.startsWith('mailto:') ? applyUrl : undefined,
        title,
      });

      if (result?.action !== Share.sharedAction) return;

      await shareNewsEvent(id, {
        shareUrl: applyUrl || '',
        platform: 'native_share',
        title,
        type: 'job',
      });
    } catch (err) {
      console.error('Share Error:', err);
    } finally {
      setSharingIds(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  }, []);

  const handleJobPress = useCallback(
    job => {
      navigation?.navigate('JobsCareerDetails', {
        jobId: job?._id || job?.id,
        job,
      });
    },
    [navigation],
  );

  const renderJob = useCallback(
    ({ item }) => {
      const id = item?._id || item?.id;
      const title = getJobTitle(item);
      const company = getCompanyName(item);
      const location = getLocationText(item);
      const salary = formatSalaryRange(item);
      const experience = formatExperience(item);
      const jobType = formatEnumLabel(item?.jobType);
      const workMode = formatEnumLabel(item?.workMode);
      const categoryTitle = item?.jobCategory?.title || '';
      const cleanDescription = stripHtml(
        item?.description || item?.jobDescription || '',
      );
      const applyTarget = getApplyTarget(item);
      const isSharing = !!sharingIds[id];
      const skills = Array.isArray(item?.skills) ? item.skills.slice(0, 4) : [];

      return (
        <TouchableOpacity
          style={styles.jobCard}
          onPress={() => handleJobPress(item)}
          activeOpacity={0.85}
        >
          <View style={styles.jobHeader}>
            <View style={styles.companyBadgeIcon}>
              <Ionicons
                name="business-outline"
                size={20}
                color={colors.primary || '#167A43'}
              />
            </View>

            <View style={styles.jobInfo}>
              {!!categoryTitle && (
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {categoryTitle}
                  {workMode ? ` • ${workMode}` : ''}
                </Text>
              )}
              <Text style={styles.jobTitle} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.company} numberOfLines={1}>
                {company}
              </Text>
            </View>


          </View>

          {!!cleanDescription && (
            <Text style={styles.jobDescription} numberOfLines={2}>
              {cleanDescription}
            </Text>
          )}

          <View style={styles.metaChips}>
            {!!jobType && (
              <View style={styles.badge}>
                <Ionicons
                  name="briefcase-outline"
                  size={13}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.badgeText}>{jobType}</Text>
              </View>
            )}

            {!!location && (
              <View style={styles.badge}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.badgeText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            )}

            {!!experience && (
              <View style={styles.badge}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.badgeText}>{experience}</Text>
              </View>
            )}

            {!!salary && (
              <View style={[styles.badge, styles.salaryBadge]}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={13}
                  color={colors.primary || '#167A43'}
                />
                <Text style={styles.badgeText}>{salary}</Text>
              </View>
            )}
          </View>

          {skills.length > 0 && (
            <View style={styles.skillsRow}>
              {skills.map((skill, i) => (
                <View key={`${skill}-${i}`} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.vacancyText}>
              {item?.numberOfVacancies
                ? `${item.numberOfVacancies} Openings`
                : 'Open Role'}
            </Text>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => handleJobPress(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.detailsBtnText}>View Details</Text>
              </TouchableOpacity>

              {!!applyTarget && (
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() =>
                    Linking.openURL(applyTarget).catch(err =>
                      console.error('Apply URL Error:', err),
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyBtnText}>Apply</Text>
                  <Ionicons name="open-outline" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [sharingIds, handleShare, handleJobPress],
  );

  const renderFooter = () => {
    if (!loading || jobs.length === 0 || !hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator
          size="small"
          color={colors.primary || '#167A43'}
        />
        <Text style={styles.footerLoadingText}>Loading more jobs...</Text>
      </View>
    );
  };

  if (loading && jobs.length === 0) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader title="Jobs & Careers" navigation={navigation} />
          <View style={styles.centerContent}>
            <ActivityIndicator
              size="large"
              color={colors.primary || '#167A43'}
            />
            <Text style={styles.loadingText}>Finding matching jobs...</Text>
          </View>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader title="Jobs & Careers" navigation={navigation} />
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item, idx) => item?._id || item?.id || `job-${idx}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary || '#167A43']}
              tintColor={colors.primary || '#167A43'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centerContent}>
                <Ionicons
                  name="briefcase-outline"
                  size={56}
                  color={colors.textSecondary || '#737373'}
                />
                <Text style={styles.emptyText}>No jobs available</Text>
              </View>
            ) : null
          }
          scrollIndicatorInsets={{ right: 1 }}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F6F7F9',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  jobCard: {
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  companyBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  jobInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary || '#167A43',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text || '#121212',
    lineHeight: 21,
    marginBottom: 2,
  },
  company: {
    fontSize: 13,
    color: colors.textSecondary || '#525252',
    fontWeight: '600',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingBtn: {
    opacity: 0.6,
  },
  jobDescription: {
    fontSize: 13,
    color: colors.textSecondary || '#4B5563',
    lineHeight: 19,
    marginBottom: 10,
  },
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  salaryBadge: {
    backgroundColor: '#ECFDF5',
  },
  badgeText: {
    fontSize: 11.5,
    color: colors.text || '#1F2937',
    fontWeight: '600',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillPill: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillPillText: {
    fontSize: 11,
    color: colors.textSecondary || '#4B5563',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  vacancyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary || '#6B7280',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  detailsBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text || '#121212',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#167A43',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary || '#737373',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary || '#737373',
    marginTop: 12,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 12.5,
    color: colors.textSecondary || '#737373',
  },
});

export default JobsCareerScreen;
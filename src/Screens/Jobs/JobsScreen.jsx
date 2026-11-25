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
import { getPersonalizedJobs, shareNewsEvent } from '../../api/AllTabsApi';
import { BASE_URL } from '../../api/apiConfig';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';
import typography from '../../themes/typography';

const PAGE_LIMIT = 10;

const getShareUrl = (jobId) => {
  if (!jobId) return '';
  const segment = 'jobs';
  return `${BASE_URL}/${segment}/${jobId}`;
};

const JobsScreen = ({ navigation }) => {
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

        const result = await getPersonalizedJobs({
          page: append ? page + 1 : 1,
          limit: PAGE_LIMIT,
        });

        if (result?.success) {
          const newJobs = result.data || [];
          setJobs((prev) =>
            append ? [...prev, ...newJobs] : newJobs
          );
          setPage(append ? page + 1 : 1);
          setHasMore(newJobs.length >= PAGE_LIMIT);
        }
      } catch (err) {
        console.error('Fetch Jobs Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [page, hasMore]
  );

  useEffect(() => {
    fetchJobs();
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

  const handleShare = useCallback(async (job) => {
    if (!job?._id) return;

    setSharingIds((prev) => ({ ...prev, [job._id]: true }));

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
      setSharingIds((prev) => {
        const updated = { ...prev };
        delete updated[job._id];
        return updated;
      });
    }
  }, []);

  const handleJobPress = (job) => {
    navigation?.navigate('JobsDetails', { jobId: job._id, job });
  };

  const renderJob = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => handleJobPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item?.title || 'Untitled Job'}
            </Text>
            <Text style={styles.company} numberOfLines={1}>
              {item?.company || 'Company Not Specified'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.shareBtn, sharingIds[item._id] && styles.sharingBtn]}
            onPress={() => handleShare(item)}
            disabled={sharingIds[item._id]}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={18}
              color={sharingIds[item._id] ? colors.secondary : colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.jobDescription} numberOfLines={3}>
          {item?.description || 'No description provided'}
        </Text>

        <View style={styles.jobDetails}>
          {item?.jobType && (
            <View style={styles.badge}>
              <Ionicons name="briefcase" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>{item.jobType}</Text>
            </View>
          )}
          {item?.location && (
            <View style={styles.badge}>
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>{item.location}</Text>
            </View>
          )}
          {item?.minSalary && (
            <View style={styles.badge}>
              <MaterialCommunityIcons
                name="cash"
                size={12}
                color={colors.primary}
              />
              <Text style={styles.badgeText}>
                ₹{item.minSalary}
                {item?.maxSalary ? ` - ₹${item.maxSalary}` : '+'}
              </Text>
            </View>
          )}
        </View>

        {item?.applyLink && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => Linking.openURL(item.applyLink)}
          >
            <Text style={styles.applyBtnText}>Apply Now</Text>
            <Ionicons name="open" size={14} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    ),
    [sharingIds, handleShare]
  );

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  if (loading && jobs.length === 0) {
    return (
      <View style={styles.container}>
        <BackHeader title="Jobs & Careers" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Jobs & Careers" />
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
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
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No jobs available</Text>
            </View>
          ) : null
        }
        scrollIndicatorInsets={{ right: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  company: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  shareBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  sharingBtn: {
    opacity: 0.6,
  },
  jobDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  applyBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default JobsScreen;

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
  Image,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAllAppeals, shareNewsEvent } from '../../api/AllTabsApi';
import { BASE_URL } from '../../api/apiConfig';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';
import AppLayout from '../../components/AppLayout/AppLayout';

const PAGE_LIMIT = 10;

const getShareUrl = appealId => {
  if (!appealId) return '';
  const segment = 'appeals';
  return `${BASE_URL}/${segment}/${appealId}`;
};

const getAppealImage = item => {
  if (typeof item?.image === 'string' && item.image) return item.image;
  if (Array.isArray(item?.images) && item.images.length > 0) {
    const first = item.images[0];
    return typeof first === 'string' ? first : first?.url || first?.uri || null;
  }
  return null;
};

const formatAmount = amount => {
  const num = Number(amount || 0);
  if (!num) return '₹0';
  if (num >= 1000000) return '₹' + (num / 1000000).toFixed(1) + 'M';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + 'K';
  return '₹' + num.toLocaleString('en-IN');
};

const AppealScreen = ({ navigation }) => {
  const { width: screenWidth } = useWindowDimensions();

  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sharingIds, setSharingIds] = useState({});

  const fetchAppeals = useCallback(
    async ({ append = false } = {}) => {
      if (append && !hasMore) return;

      try {
        if (!append) setLoading(true);

        const nextPage = append ? page + 1 : 1;
        const result = await getAllAppeals({
          page: nextPage,
          limit: PAGE_LIMIT,
          isPagination: true,
        });

        if (result?.success) {
          const rawData = result.data;
          const newAppeals = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.appeals)
            ? rawData.appeals
            : [];

          setAppeals(prev => (append ? [...prev, ...newAppeals] : newAppeals));
          setPage(nextPage);
          setHasMore(newAppeals.length >= PAGE_LIMIT);
        }
      } catch (err) {
        console.error('Fetch Appeals Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [page, hasMore],
  );

  useEffect(() => {
    fetchAppeals({ append: false });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppeals({ append: false });
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchAppeals({ append: true });
    }
  };

  const handleShare = useCallback(async appeal => {
    if (!appeal?._id) return;

    setSharingIds(prev => ({ ...prev, [appeal._id]: true }));

    try {
      const shareUrl = getShareUrl(appeal._id);
      const message = [appeal?.title, shareUrl].filter(Boolean).join('\n\n');

      const result = await Share.share({
        message: message || shareUrl,
        url: shareUrl,
        title: appeal?.title || 'Share Appeal',
      });

      if (result?.action !== Share.sharedAction) return;

      const payload = {
        shareUrl,
        platform: 'native_share',
        title: appeal?.title || '',
        type: 'appeal',
      };

      await shareNewsEvent(appeal._id, payload);
    } catch (err) {
      console.error('Share Error:', err);
    } finally {
      setSharingIds(prev => {
        const updated = { ...prev };
        delete updated[appeal._id];
        return updated;
      });
    }
  }, []);

  const handleAppealPress = useCallback(
    appeal => {
      navigation?.navigate('AppealDetails', { appealId: appeal._id, appeal });
    },
    [navigation],
  );

  const renderAppeal = useCallback(
    ({ item }) => {
      const raised = Number(item?.raisedAmount ?? item?.amountRaised ?? 0);
      const target = Number(item?.targetAmount ?? 0);
      const progress = target > 0 ? Math.min((raised / target) * 100, 100) : 0;
      const imageUri = getAppealImage(item);
      const isSharing = !!sharingIds[item._id];
      const status = (item?.status || '').toLowerCase();

      return (
        <View style={styles.instaFeedItem}>
          {/* Top IG Header */}
          <View style={styles.postHeader}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAppealPress(item)}
              style={styles.userInfo}
            >
              <View style={styles.avatarRing}>
                <MaterialCommunityIcons
                  name="hand-heart"
                  size={18}
                  color={colors.primary || '#167A43'}
                />
              </View>

              <View style={styles.userTextContainer}>
                <Text style={styles.userName} numberOfLines={1}>
                  {item?.category || 'Community Appeal'}
                </Text>
                <Text style={styles.userSubText} numberOfLines={1}>
                  {item?.title || 'Untitled Appeal'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerRight}>
              {!!item?.status && (
                <View
                  style={[
                    styles.statusBadge,
                    status === 'active' && styles.activeStatus,
                    status === 'completed' && styles.completedStatus,
                    (status === 'paused' || status === 'closed') &&
                      styles.pausedStatus,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      status === 'active' && styles.activeDot,
                      status === 'completed' && styles.completedDot,
                      (status === 'paused' || status === 'closed') &&
                        styles.pausedDot,
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              )}

            </View>
          </View>

          {/* Full-Bleed Screen Image */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => handleAppealPress(item)}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[styles.appealImage, { width: screenWidth }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { width: screenWidth }]}>
                <MaterialCommunityIcons
                  name="hand-heart-outline"
                  size={40}
                  color={colors.textSecondary || '#737373'}
                />
              </View>
            )}
          </TouchableOpacity>

      

          {/* Progress Section */}
          {target > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>

              <View style={styles.progressText}>
                <Text style={styles.raisedAmount}>
                  {formatAmount(raised)} raised
                </Text>
                <Text style={styles.targetAmount}>
                  of {formatAmount(target)} ({Math.round(progress)}%)
                </Text>
              </View>
            </View>
          )}

          {/* Title & Caption */}
          <View style={styles.instaMetaPad}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAppealPress(item)}
            >
              <Text style={styles.appealTitle} numberOfLines={2}>
                {item?.title || 'Untitled Appeal'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.description} numberOfLines={3}>
              {item?.description || 'No description provided'}
            </Text>
          </View>
        </View>
      );
    },
    [sharingIds, handleShare, handleAppealPress, screenWidth],
  );

  const renderFooter = () => {
    if (!loading || appeals.length === 0 || !hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary || '#121212'} />
        <Text style={styles.footerText}>Loading more appeals...</Text>
      </View>
    );
  };

  if (loading && appeals.length === 0) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader title="Appeals" />
          <View style={styles.centerContent}>
            <ActivityIndicator
              size="large"
              color={colors.primary || '#121212'}
            />
            <Text style={styles.loadingText}>Loading appeals...</Text>
          </View>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader title="Appeals"  navigation={navigation} />
        <FlatList
          data={appeals}
          renderItem={renderAppeal}
          keyExtractor={(item, index) => String(item?._id || item?.id || index)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary || '#121212']}
              tintColor={colors.primary || '#121212'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centerContent}>
                <Ionicons
                  name="heart-outline"
                  size={56}
                  color={colors.textSecondary || '#737373'}
                />
                <Text style={styles.emptyText}>No appeals available</Text>
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
    backgroundColor: colors.white || '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  instaFeedItem: {
    width: '100%',
    backgroundColor: colors.white || '#FFFFFF',
    paddingBottom: 16,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary || '#167A43',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text || '#121212',
  },
  userSubText: {
    fontSize: 11.5,
    color: colors.textSecondary || '#737373',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBtn: {
    padding: 6,
    borderRadius: 18,
  },
  sharingBtn: {
    opacity: 0.65,
  },
  appealImage: {
    height: 340,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    height: 220,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instaActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  instaLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconActionBtn: {
    paddingVertical: 2,
  },
  instaMetaPad: {
    paddingHorizontal: 12,
  },
  appealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text || '#121212',
    lineHeight: 21,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary || '#4B5563',
    lineHeight: 19,
  },
  progressSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressBar: {
    height: 7,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary || '#167A43',
    borderRadius: 4,
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raisedAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text || '#121212',
  },
  targetAmount: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary || '#737373',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeStatus: {
    backgroundColor: '#E8F5E9',
  },
  completedStatus: {
    backgroundColor: '#E3F2FD',
  },
  pausedStatus: {
    backgroundColor: '#FFF3E0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
  },
  activeDot: {
    backgroundColor: '#167A43',
  },
  completedDot: {
    backgroundColor: '#1D5FD6',
  },
  pausedDot: {
    backgroundColor: '#B86500',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text || '#121212',
    letterSpacing: 0.3,
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewMoreText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text || '#121212',
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
  footerText: {
    fontSize: 12.5,
    color: colors.textSecondary || '#737373',
  },
});

export default AppealScreen;

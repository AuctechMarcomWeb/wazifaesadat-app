import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Share,
  Linking,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getNewsEventById } from '../../api/AllTabsApi';
import colors from '../../themes/colors';
import BackHeader from '../../components/BackHeader/BackHeader';
import AppLayout from '../../components/AppLayout/AppLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ----------------------------- helpers ----------------------------- */

const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// thumbnail first, then gallery images, no duplicates
const getNewsImages = item => {
  if (!item) return [];
  const seen = new Set();
  const uris = [];

  [item.thumbnail, ...(Array.isArray(item.images) ? item.images : [])].forEach(
    entry => {
      const uri =
        typeof entry === 'string' ? entry : entry?.url || entry?.secure_url;
      if (typeof uri === 'string' && uri.trim() && !seen.has(uri.trim())) {
        seen.add(uri.trim());
        uris.push(uri.trim());
      }
    },
  );

  return uris;
};

/* ------------------------------- screen ------------------------------- */

const NewsDetails = ({ route, navigation }) => {
  const { newsId, news: initialNews } = route.params || {};
  const [news, setNews] = useState(initialNews || null);
  const [loading, setLoading] = useState(!initialNews);
  const [error, setError] = useState('');
  const [carouselWidth, setCarouselWidth] = useState(SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState({});

  // Show the card data instantly, then refresh with the full details
  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      try {
        const result = await getNewsEventById(newsId);
        if (cancelled) return;

        if (!result?.success) {
          throw new Error(result?.message || 'Failed to load news');
        }

        setNews(result.data);
        setError('');
      } catch (err) {
        if (cancelled) return;
        console.error('Fetch News Details Error:', err.message);
        if (!initialNews) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (newsId) fetchDetails();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [newsId, initialNews]);

  const handleShare = async () => {
    if (!news) return;
    try {
      await Share.share({
        message: [news.title, news.description].filter(Boolean).join('\n\n'),
        title: news.title || 'News',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleSourceUrl = () => {
    if (!news?.sourceUrl) return;
    Linking.openURL(news.sourceUrl).catch(err =>
      console.error('URL open error:', err),
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading news...</Text>
      </View>
    );
  }

  if (error || !news) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={styles.errorTitle}>Error Loading News</Text>
        <Text style={styles.errorMessage}>{error || 'News not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getNewsImages(news).filter(uri => !failed[uri]);
  const tags = Array.isArray(news.tags) ? news.tags : [];
  const dateText = formatDate(news.createdAt);

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="News Details" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {images.length > 0 && (
            <View
              onLayout={e =>
                setCarouselWidth(Math.round(e.nativeEvent.layout.width))
              }
            >
              <FlatList
                data={images}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(uri, idx) => `${uri}-${idx}`}
                getItemLayout={(_, index) => ({
                  length: carouselWidth,
                  offset: carouselWidth * index,
                  index,
                })}
                onMomentumScrollEnd={e =>
                  setActiveIndex(
                    Math.round(e.nativeEvent.contentOffset.x / carouselWidth),
                  )
                }
                renderItem={({ item: uri }) => (
                  <Image
                    source={{ uri }}
                    style={{
                      width: carouselWidth,
                      height: Math.round((carouselWidth * 9) / 16),
                      backgroundColor: '#F3F4F6',
                    }}
                    resizeMode="cover"
                    onError={() => {
                      console.warn('News image failed to load:', uri);
                      setFailed(prev => ({ ...prev, [uri]: true }));
                    }}
                  />
                )}
              />

              {images.length > 1 && (
                <View style={styles.dotsRow}>
                  {images.map((uri, i) => (
                    <View
                      key={`${uri}-dot-${i}`}
                      style={[styles.dot, i === activeIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{news.title}</Text>

            <Text style={styles.meta}>
              {news.source || 'Official'}
              {dateText ? `  ·  ${dateText}` : ''}
            </Text>

            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleShare}
            >
              <Ionicons
                name="paper-plane-outline"
                size={26}
                color={colors.textDark || '#111827'}
              />
            </TouchableOpacity>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, idx) => (
                  <View key={`${tag}-${idx}`} style={styles.tagBadge}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!news.description && (
              <Text style={styles.description}>{news.description}</Text>
            )}

            {!!news.sourceUrl && (
              <TouchableOpacity
                style={styles.sourceButton}
                activeOpacity={0.85}
                onPress={handleSourceUrl}
              >
                <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                <Text style={styles.sourceButtonText}>Read Original Source</Text>
              </TouchableOpacity>
            )}

            {!!news.createdBy?.name && (
              <Text style={styles.publishedBy}>
                Published by {news.createdBy.name}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </AppLayout>
  );
};

/* -------------------------------- styles -------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F6F3' },

  scrollView: { flex: 1, backgroundColor: colors.white },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight || colors.white,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    gap: 5,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7C7CC',
  },

  dotActive: { backgroundColor: '#0095F6' },

  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 30,
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 29,
    color: colors.textDark || '#111827',
  },

  meta: {
    fontSize: 12,
    marginTop: 6,
    color: colors.textSecondary || '#6B7280',
  },

  shareBtn: {
    alignSelf: 'flex-start',
    marginTop: 14,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },

  tagBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary || '#1B5E3F',
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
    color: colors.textDark || '#333333',
  },

  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    paddingVertical: 12,
    backgroundColor: colors.primary || '#1B5E3F',
    borderRadius: 10,
  },

  sourceButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  publishedBy: {
    fontSize: 12,
    marginTop: 18,
    color: colors.textSecondary || '#6B7280',
  },

  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    color: colors.textSecondary || '#6B7280',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    color: colors.textDark || '#111827',
  },

  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 20,
    color: colors.textSecondary || '#6B7280',
  },

  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },

  backButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});

export default NewsDetails;
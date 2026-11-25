import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Share,
  Image,
  FlatList,
  Linking,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getBlogById, likeBlog, shareBlog } from '../../api/AllTabsApi';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';
import AppLayout from '../../components/AppLayout/AppLayout';

const LIKE_RED = '#ED4956';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// If your backend returns relative image paths (e.g. "uploads/a.jpg"),
// put your server base URL here, e.g. 'https://api.yoursite.com'
const IMAGE_BASE_URL = '';

/* ----------------------------- helpers ----------------------------- */

const stripHtml = text =>
  String(text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const normalizeUri = raw => {
  const uri = String(raw || '')
    .trim()
    .replace(/\\/g, '/');
  if (!uri) return null;
  if (uri.startsWith('//')) return `https:${uri}`;
  if (/^(https?:|file:|data:|content:)/i.test(uri)) return uri;
  if (!IMAGE_BASE_URL) return uri;
  return `${IMAGE_BASE_URL.replace(/\/$/, '')}/${uri.replace(/^\//, '')}`;
};

const extractImageUri = entry => {
  if (!entry) return null;
  if (typeof entry === 'string') return normalizeUri(entry);
  if (typeof entry === 'object') {
    const candidate =
      entry.url ||
      entry.uri ||
      entry.secure_url ||
      entry.location ||
      entry.path ||
      entry.imageUrl ||
      entry.src ||
      entry.image;
    if (typeof candidate === 'string') return normalizeUri(candidate);
  }
  return null;
};

const IMAGE_KEYS = [
  'imgs',
  'images',
  'img',
  'media',
  'photos',
  'attachments',
  'gallery',
  'blogImages',
  'thumbnail',
  'image',
  'coverImage',
  'cover',
  'banner',
  'featuredImage',
  'photo',
  'blogImage',
];

const getBlogImages = item => {
  if (!item || typeof item !== 'object') return [];

  const seen = new Set();
  const uris = [];

  IMAGE_KEYS.forEach(key => {
    const value = item[key];
    if (!value) return;
    const list = Array.isArray(value) ? value : [value];
    list.forEach(entry => {
      const uri = extractImageUri(entry);
      if (uri && !seen.has(uri)) {
        seen.add(uri);
        uris.push(uri);
      }
    });
  });

  return uris;
};

const getLikesCount = item => {
  if (typeof item.likes === 'number') return item.likes;
  if (typeof item.likesCount === 'number') return item.likesCount;
  if (typeof item.likeCount === 'number') return item.likeCount;
  if (Array.isArray(item.likedBy)) return item.likedBy.length;
  return 0;
};

const getIsLiked = item => {
  if (typeof item.isLiked === 'boolean') return item.isLiked;
  if (typeof item.liked === 'boolean') return item.liked;
  return false;
};

// Server response is the source of truth. If it has no isLiked flag,
// the change in like count tells us whether it was a like or an unlike.
const resolveLikeResult = (payload, wasLiked, prevCount) => {
  const data = payload?.blog || payload?.data || payload || {};

  const serverCount =
    typeof data.likes === 'number'
      ? data.likes
      : typeof data.likesCount === 'number'
      ? data.likesCount
      : typeof data.likeCount === 'number'
      ? data.likeCount
      : Array.isArray(data.likedBy)
      ? data.likedBy.length
      : null;

  let liked;
  if (typeof data.isLiked === 'boolean') {
    liked = data.isLiked;
  } else if (typeof data.liked === 'boolean') {
    liked = data.liked;
  } else if (serverCount !== null && serverCount !== prevCount) {
    liked = serverCount > prevCount;
  } else {
    liked = !wasLiked;
  }

  const count =
    serverCount !== null
      ? serverCount
      : Math.max(0, prevCount + (liked ? 1 : -1));

  return { liked, count: Math.max(0, count) };
};

const SOCIALS = [
  { key: 'facebook', icon: 'logo-facebook', color: '#1877F2', label: 'Facebook' },
  { key: 'instagram', icon: 'logo-instagram', color: '#E4405F', label: 'Instagram' },
  { key: 'twitter', icon: 'logo-twitter', color: '#1DA1F2', label: 'Twitter' },
  { key: 'linkedin', icon: 'logo-linkedin', color: '#0A66C2', label: 'LinkedIn' },
  { key: 'youtube', icon: 'logo-youtube', color: '#FF0000', label: 'YouTube' },
  { key: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366', label: 'WhatsApp' },
];

/* ------------------------------- screen ------------------------------- */

const BlogsDetails = ({ route, navigation }) => {
  const { blogId, blog: initialBlog } = route.params || {};
  const [blog, setBlog] = useState(initialBlog || null);
  const [loading, setLoading] = useState(!initialBlog);
  const [error, setError] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState({});
  const likeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (initialBlog) return;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await getBlogById(blogId);

        if (!response?.success) {
          throw new Error(response?.message || 'Failed to load blog');
        }

        setBlog(response.data);
        setError('');
      } catch (err) {
        console.error('Fetch Blog Error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [blogId, initialBlog]);

  const handleLike = async () => {
    if (isLiking || !blog) return;

    const wasLiked = getIsLiked(blog);
    const prevCount = getLikesCount(blog);
    const nextLiked = !wasLiked;

    likeScale.setValue(0.7);
    Animated.spring(likeScale, {
      toValue: 1,
      friction: 3,
      tension: 140,
      useNativeDriver: true,
    }).start();

    setIsLiking(true);
    setBlog(prev => ({
      ...prev,
      isLiked: nextLiked,
      likes: Math.max(0, prevCount + (nextLiked ? 1 : -1)),
    }));

    try {
      const response = await likeBlog(blog._id);

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to like blog');
      }

      const { liked, count } = resolveLikeResult(
        response.data,
        wasLiked,
        prevCount,
      );
      setBlog(prev => ({ ...prev, isLiked: liked, likes: count }));
    } catch (err) {
      console.error('Like Blog Error:', err.message);
      setBlog(prev => ({ ...prev, isLiked: wasLiked, likes: prevCount }));
      alert('Failed to like blog');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!blog || isSharing) return;

    try {
      setIsSharing(true);

      const message = [
        blog.title,
        stripHtml(blog.description || blog.discription),
      ]
        .filter(Boolean)
        .join('\n\n');

      const result = await Share.share({
        message: message || 'Check out this blog!',
        title: blog.title || 'Share Blog',
      });

      if (result?.action !== Share.dismissedAction) {
        const response = await shareBlog(blog._id);

        if (response?.success) {
          const updatedShares =
            typeof response.data?.shareCount === 'number'
              ? response.data.shareCount
              : (blog.shareCount || 0) + 1;

          setBlog(prev => ({ ...prev, shareCount: updatedShares }));
        }
      }
    } catch (err) {
      console.error('Share Blog Error:', err.message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSocialLink = (url, platform) => {
    if (!url) return;
    Linking.openURL(url).catch(err =>
      console.error(`Failed to open ${platform}:`, err),
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading blog...</Text>
      </View>
    );
  }

  if (error || !blog) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={styles.errorTitle}>Error Loading Blog</Text>
        <Text style={styles.errorMessage}>{error || 'Blog not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getBlogImages(blog).filter(uri => !failed[uri]);
  const isLiked = getIsLiked(blog);
  const likeCount = getLikesCount(blog);
  const shareCount = blog.shareCount || 0;
  const tags = Array.isArray(blog.tags) ? blog.tags : [];
  const description = stripHtml(blog.description || blog.discription);
  const dateObj = new Date(blog.date || blog.createdAt);
  const dateText = Number.isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  const socials = SOCIALS.filter(s => blog.socialLinks?.[s.key]);

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Blog Details" />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Images */}
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
                      console.warn('Blog image failed to load:', uri);
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
            <Text style={styles.title}>{blog.title}</Text>

            <Text style={styles.meta}>
              By {blog.author || 'Unknown'}
              {dateText ? `  ·  ${dateText}` : ''}
            </Text>

            {/* Like + Share (same as posts) */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isLiking}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={handleLike}
              >
                <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={28}
                    color={isLiked ? LIKE_RED : colors.textDark || '#111827'}
                  />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                activeOpacity={0.7}
                disabled={isSharing}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={handleShare}
              >
                <Ionicons
                  name="paper-plane-outline"
                  size={26}
                  color={colors.textDark || '#111827'}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.likesText}>
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              {shareCount > 0
                ? `  ·  ${shareCount} ${shareCount === 1 ? 'share' : 'shares'}`
                : ''}
            </Text>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, idx) => (
                  <View key={`${tag}-${idx}`} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!description && (
              <Text style={styles.descriptionText}>{description}</Text>
            )}

            {socials.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Follow Us</Text>
                <View style={styles.socialLinksContainer}>
                  {socials.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      style={styles.socialButton}
                      onPress={() =>
                        handleSocialLink(blog.socialLinks[s.key], s.label)
                      }
                    >
                      <Ionicons name={s.icon} size={22} color={s.color} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
    backgroundColor: colors.backgroundLight,
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
    color: colors.textDark,
  },

  meta: {
    fontSize: 12,
    marginTop: 6,
    color: colors.textSecondary,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  shareBtn: { marginLeft: 16 },

  likesText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    color: colors.textDark,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },

  tagBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  tagText: { fontSize: 11, fontWeight: '600', color: '#0369A1' },

  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
    color: colors.textDark,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 24,
    marginBottom: 12,
  },

  socialLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 12,
  },

  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 20,
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

export default BlogsDetails;
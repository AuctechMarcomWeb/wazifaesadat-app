import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Share,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAllBlogs, likeBlog, shareBlog } from '../../api/AllTabsApi';
import colors from '../../themes/colors';
import BackHeader from '../../components/BackHeader/BackHeader';
import AppLayout from '../../components/AppLayout/AppLayout';
import { Body } from '../../components/Formparts';

const PAGE_LIMIT = 10;
const DOUBLE_TAP_DELAY = 280;
const LIKE_RED = '#ED4956';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// If your backend returns relative image paths (e.g. "uploads/a.jpg"),
// put your server base URL here, e.g. 'https://api.yoursite.com'
const IMAGE_BASE_URL = '';

/* ----------------------------- helpers ----------------------------- */

const formatBlogDate = dateVal => {
  if (!dateVal) return '';
  const parsed = new Date(dateVal);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

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

const getSharesCount = item => {
  if (typeof item.shareCount === 'number') return item.shareCount;
  if (typeof item.shares === 'number') return item.shares;
  return Number(item.shareCount ?? item.shares) || 0;
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

/* ------------------------- image slide (double tap) ------------------------- */

const DoubleTapSlide = memo(
  ({ uri, index, total, width, height, onSingleTap, onDoubleTap, onError }) => {
    const lastTapRef = useRef(0);
    const timerRef = useRef(null);
    const heartScale = useRef(new Animated.Value(0)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    useEffect(
      () => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      },
      [],
    );

    const burst = useCallback(() => {
      heartScale.setValue(0.3);
      heartOpacity.setValue(1);
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1.1,
          friction: 4,
          tension: 130,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(420),
          Animated.timing(heartOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => heartScale.setValue(0));
    }, [heartOpacity, heartScale]);

    const handlePress = useCallback(() => {
      const now = Date.now();
      const delta = now - lastTapRef.current;

      if (delta > 0 && delta < DOUBLE_TAP_DELAY) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        lastTapRef.current = 0;
        burst();
        onDoubleTap?.();
      } else {
        lastTapRef.current = now;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          onSingleTap?.();
        }, DOUBLE_TAP_DELAY);
      }
    }, [burst, onDoubleTap, onSingleTap]);

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={{ width, height }}
        onPress={handlePress}
      >
        <Image
          source={{ uri }}
          style={styles.slideImage}
          resizeMode="cover"
          onError={onError}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.heartBurstOverlay,
            { opacity: heartOpacity, transform: [{ scale: heartScale }] },
          ]}
        >
          <Ionicons name="heart" size={80} color="#FFFFFF" />
        </Animated.View>

        {total > 1 && (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>
              {index + 1}/{total}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

const BlogImageSlider = ({ images, onOpen, onDoubleTapLike }) => {
  const [failed, setFailed] = useState({});
  const [width, setWidth] = useState(SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(0);

  const valid = images.filter(uri => !failed[uri]);
  if (valid.length === 0) return null;

  const height = Math.round((width * 9) / 16);

  return (
    <View onLayout={e => setWidth(Math.round(e.nativeEvent.layout.width))}>
      <FlatList
        data={valid}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, idx) => `${uri}-${idx}`}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={e =>
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item: uri, index }) => (
          <DoubleTapSlide
            uri={uri}
            index={index}
            total={valid.length}
            width={width}
            height={height}
            onSingleTap={onOpen}
            onDoubleTap={onDoubleTapLike}
            onError={() => {
              console.warn('Blog image failed to load:', uri);
              setFailed(prev => ({ ...prev, [uri]: true }));
            }}
          />
        )}
      />

      {valid.length > 1 && (
        <View style={styles.dotsRow}>
          {valid.map((uri, i) => (
            <View
              key={`${uri}-dot-${i}`}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/* ------------------------------ blog card ------------------------------ */

const BlogCard = memo(
  ({ item, isSharing, onToggleLike, onShare, onOpen }) => {
    const likeScale = useRef(new Animated.Value(1)).current;

    const isLiked = getIsLiked(item);
    const likesCount = getLikesCount(item);
    const sharesCount = getSharesCount(item);
    const images = getBlogImages(item);
    const description = stripHtml(
      item.description || item.discription || item.text,
    );
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const dateText = formatBlogDate(item.date || item.createdAt);
    const author = item.author || 'Unknown Author';

    const bounceHeart = useCallback(() => {
      likeScale.setValue(0.7);
      Animated.spring(likeScale, {
        toValue: 1,
        friction: 3,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }, [likeScale]);

    const handleHeartPress = useCallback(() => {
      bounceHeart();
      onToggleLike(item, 'toggle');
    }, [bounceHeart, onToggleLike, item]);

    // Double tap only LIKES (never un-likes), like Instagram
    const handleDoubleTapLike = useCallback(() => {
      if (!isLiked) bounceHeart();
      onToggleLike(item, 'like');
    }, [isLiked, bounceHeart, onToggleLike, item]);

    const open = useCallback(() => onOpen(item), [onOpen, item]);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={open}
          style={styles.headBlock}
        >
          <Text style={styles.title} numberOfLines={2}>
            {item.title || 'Untitled Blog'}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            By {author}
            {dateText ? `  ·  ${dateText}` : ''}
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <BlogImageSlider
            images={images}
            onOpen={open}
            onDoubleTapLike={handleDoubleTapLike}
          />
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handleHeartPress}
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
            onPress={() => onShare(item)}
          >
            <Ionicons
              name="paper-plane-outline"
              size={26}
              color={colors.textDark || '#111827'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={open}
          style={styles.textBlock}
        >
          <Text style={styles.likesText}>
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            {sharesCount > 0
              ? `  ·  ${sharesCount} ${sharesCount === 1 ? 'share' : 'shares'}`
              : ''}
          </Text>

          {!!description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}

          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.slice(0, 3).map((tag, idx) => (
                <View key={`${tag}-${idx}`} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {tags.length > 3 && (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>+{tags.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

/* ------------------------------- screen ------------------------------- */

const BlogsScreen = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [sharingIds, setSharingIds] = useState({});

  const likingRef = useRef({});
  const onEndReachedCalledDuringMomentum = useRef(false);

  const fetchBlogs = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getAllBlogs({
        page: pageNum,
        limit: PAGE_LIMIT,
        isPagination: true,
        sortBy: 'latest',
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to fetch blogs');
      }

      const newBlogs = Array.isArray(response.data) ? response.data : [];

      setBlogs(prev => {
        if (pageNum === 1 || isRefresh) return newBlogs;
        const seenIds = new Set(prev.map((b, idx) => String(b._id || idx)));
        return [
          ...prev,
          ...newBlogs.filter((b, idx) => !seenIds.has(String(b._id || idx))),
        ];
      });

      const pg = response.pagination;
      if (pg) {
        const current = Number(pg.currentPage ?? pg.page) || pageNum;
        const totalPages = Number(pg.totalPages) || 1;
        setHasMore(current < totalPages);
      } else {
        setHasMore(newBlogs.length === PAGE_LIMIT);
      }

      setPage(pageNum);
      setError('');
    } catch (err) {
      const msg = err?.message || 'Failed to fetch blogs';
      console.error('Fetch Blogs Error:', msg);
      setError(msg);
      if (pageNum === 1 && !isRefresh) setBlogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(1, false);
  }, [fetchBlogs]);

  const handleRefresh = useCallback(() => {
    onEndReachedCalledDuringMomentum.current = false;
    fetchBlogs(1, true);
  }, [fetchBlogs]);

  const handleLoadMore = useCallback(() => {
    if (onEndReachedCalledDuringMomentum.current) return;
    if (!loadingMore && !loading && !refreshing && hasMore && blogs.length > 0) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchBlogs(page + 1, false);
    }
  }, [page, loadingMore, loading, refreshing, hasMore, blogs.length, fetchBlogs]);

  const patchBlog = useCallback((blogId, patch) => {
    setBlogs(prev =>
      prev.map(b => (b._id === blogId ? { ...b, ...patch } : b)),
    );
  }, []);

  // Same likeBlog(blogId) endpoint handles like and unlike.
  // mode: 'toggle' (heart button) | 'like' (double tap, never un-likes)
  const handleToggleLike = useCallback(
    async (blog, mode = 'toggle') => {
      const blogId = blog?._id;
      if (!blogId || likingRef.current[blogId]) return;

      const wasLiked = getIsLiked(blog);
      if (mode === 'like' && wasLiked) return;

      const prevCount = getLikesCount(blog);
      const nextLiked = !wasLiked;
      const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

      likingRef.current[blogId] = true;
      patchBlog(blogId, { isLiked: nextLiked, likes: nextCount });

      try {
        const res = await likeBlog(blogId);
        if (!res?.success) {
          throw new Error(res?.message || 'Failed to update like status');
        }

        const { liked, count } = resolveLikeResult(
          res.data,
          wasLiked,
          prevCount,
        );
        patchBlog(blogId, { isLiked: liked, likes: count });
      } catch (err) {
        console.error('Toggle Blog Like Error:', err);
        patchBlog(blogId, { isLiked: wasLiked, likes: prevCount });
      } finally {
        delete likingRef.current[blogId];
      }
    },
    [patchBlog],
  );

  const handleShareBlog = useCallback(async blog => {
    const blogId = blog?._id;
    if (!blogId) return;

    setSharingIds(prev => ({ ...prev, [blogId]: true }));

    try {
      const message = [
        blog.title || 'Blog',
        stripHtml(blog.description || blog.discription || blog.text),
      ]
        .filter(Boolean)
        .join('\n\n');

      const shareResult = await Share.share({
        message: message || 'Check out this blog!',
      });

      if (shareResult?.action !== Share.dismissedAction) {
        const res = await shareBlog(blogId);
        if (res?.success) {
          const payload = res.data || {};
          const nextShares =
            typeof payload.shareCount === 'number'
              ? payload.shareCount
              : getSharesCount(blog) + 1;

          setBlogs(prev =>
            prev.map(b =>
              b._id === blogId
                ? { ...b, shareCount: nextShares, shares: nextShares }
                : b,
            ),
          );
        }
      }
    } catch (err) {
      console.error('Share Blog Error:', err);
    } finally {
      setSharingIds(prev => {
        const next = { ...prev };
        delete next[blogId];
        return next;
      });
    }
  }, []);

  const openBlog = useCallback(
    blog => {
      navigation?.navigate('BlogsDetails', { blogId: blog._id, blog });
    },
    [navigation],
  );

  const renderBlogItem = useCallback(
    ({ item }) => (
      <BlogCard
        item={item}
        isSharing={Boolean(sharingIds[item._id])}
        onToggleLike={handleToggleLike}
        onShare={handleShareBlog}
        onOpen={openBlog}
      />
    ),
    [sharingIds, handleToggleLike, handleShareBlog, openBlog],
  );

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading more blogs…</Text>
        </View>
      );
    }
    if (blogs.length > 0 && !hasMore) {
      return (
        <Text style={styles.endOfListText}>
          You've reached the end of blogs
        </Text>
      );
    }
    return null;
  }, [loadingMore, blogs.length, hasMore]);

  const renderContent = () => {
    if (loading && blogs.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading blogs…</Text>
        </View>
      );
    }

    if (error && blogs.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons
              name="alert-circle-outline"
              size={36}
              color={colors.danger || '#DC2626'}
            />
          </View>
          <Text style={styles.errorTitle}>Oops! Error Loading</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.85}
            onPress={handleRefresh}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={blogs}
        extraData={sharingIds}
        renderItem={renderBlogItem}
        keyExtractor={(item, index) => String(item._id || `blog-${index}`)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="document-text-outline"
                size={34}
                color={colors.placeHolderColor || '#9CA3AF'}
              />
            </View>
            <Text style={styles.emptyTitle}>No Blogs Yet</Text>
            <Text style={styles.emptyMessage}>
              Check back later for new blogs.
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Blogs" />
        <View style={styles.body}>
          <Body>{renderContent()}</Body>
        </View>
      </View>
    </AppLayout>
  );
};

/* -------------------------------- styles -------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F6F3' },

  body: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },

  listContent: {
    paddingTop: 4,
    paddingBottom: 24,
    marginTop: 22,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },

  /* card */
  card: {
    backgroundColor: colors.white,
    marginBottom: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },

  headBlock: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    color: colors.textDark || '#111827',
  },

  meta: {
    fontSize: 12,
    marginTop: 3,
    color: colors.textSecondary || '#6B7280',
  },

  slideImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },

  heartBurstOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageCountBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },

  imageCountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

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

  /* actions */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  shareBtn: { marginLeft: 16 },

  textBlock: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark || '#111827',
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    color: colors.textDark || '#262626',
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },

  tagBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  tagText: { fontSize: 11, fontWeight: '600', color: '#0369A1' },

  /* states */
  loadingFooter: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  loadingText: {
    fontSize: 14,
    color: colors.textSecondary || '#6B7280',
    fontWeight: '500',
    marginTop: 8,
  },

  endOfListText: {
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary || '#6B7280',
  },

  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark || '#111827',
    marginTop: 14,
  },

  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary || '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 26,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },

  retryText: { color: colors.white, fontWeight: '600', fontSize: 14 },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },

  emptyIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark || '#111827',
    marginTop: 12,
  },

  emptyMessage: {
    fontSize: 13,
    color: colors.textSecondary || '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default BlogsScreen;
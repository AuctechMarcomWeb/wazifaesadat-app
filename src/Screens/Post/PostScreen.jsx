import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Share,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAllPosts, likePost, sharePost } from '../../api/AllTabsApi';
import colors from '../../themes/colors';
import BackHeader from '../../components/BackHeader/BackHeader';
import AppLayout from '../../components/AppLayout/AppLayout';
import { Body } from '../../components/Formparts';

const PAGE_LIMIT = 10;
const DOUBLE_TAP_DELAY = 280;
const LIKE_RED = '#ED4956';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ----------------------------- helpers ----------------------------- */

const formatPostDate = dateVal => {
  if (!dateVal) return '';
  const parsed = new Date(dateVal);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed
    .toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();
};

const extractImageUri = entry => {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof entry === 'object') {
    const candidate =
      entry.url ||
      entry.uri ||
      entry.secure_url ||
      entry.path ||
      entry.imageUrl ||
      entry.src;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
};

const getPostImages = item => {
  if (!item || typeof item !== 'object') return [];

  const rawSources = [
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.media) ? item.media : []),
    ...(Array.isArray(item.photos) ? item.photos : []),
    ...(Array.isArray(item.attachments) ? item.attachments : []),
  ];

  if (rawSources.length === 0) {
    const single =
      extractImageUri(item.image) ||
      extractImageUri(item.thumbnail) ||
      extractImageUri(item.banner);
    if (single) return [single];
  }

  const seen = new Set();
  const uris = [];

  for (const src of rawSources) {
    const uri = extractImageUri(src);
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      uris.push(uri);
    }
  }

  return uris;
};

const getLikesCount = item => {
  if (typeof item.likesCount === 'number') return item.likesCount;
  if (typeof item.likeCount === 'number') return item.likeCount;
  if (typeof item.likes === 'number') return item.likes;
  if (Array.isArray(item.likedBy)) return item.likedBy.length;
  return Number(item.likes) || 0;
};

// Backend sends `likedBy: [userId]` (no isLiked), so derive liked state from it.
const getIsLiked = (item, myId, fallbackMap) => {
  if (typeof item.isLiked === 'boolean') return item.isLiked;
  if (typeof item.liked === 'boolean') return item.liked;
  if (myId && Array.isArray(item.likedBy)) {
    return item.likedBy.some(u => String(u?._id ?? u) === String(myId));
  }
  return Boolean(fallbackMap?.[item._id]);
};

const getSharesCount = item => {
  if (typeof item.shareCount === 'number') return item.shareCount;
  if (typeof item.shares === 'number') return item.shares;
  return Number(item.shareCount ?? item.shares) || 0;
};

const idOf = u => String(u?._id ?? u);

// Server is the source of truth. Works even if the response has no isLiked:
// compares likedBy before/after to know whether the toggle liked or unliked,
// and learns the logged-in user's id from the difference.
const resolveServerLikeState = (
  payload,
  prevLikedBy,
  myId,
  fallbackLiked,
  fallbackCount,
) => {
  const fallback = {
    liked: fallbackLiked,
    count: fallbackCount,
    likedBy: null,
    learnedId: null,
  };
  if (!payload || typeof payload !== 'object') return fallback;

  const nested =
    payload.post && typeof payload.post === 'object'
      ? payload.post
      : payload.data && typeof payload.data === 'object'
      ? payload.data
      : payload;

  const after = Array.isArray(nested.likedBy) ? nested.likedBy.map(idOf) : null;
  const before = Array.isArray(prevLikedBy) ? prevLikedBy.map(idOf) : null;

  let liked = fallbackLiked;
  let learnedId = null;

  if (typeof nested.isLiked === 'boolean') {
    liked = nested.isLiked;
  } else if (typeof nested.liked === 'boolean') {
    liked = nested.liked;
  } else if (after && myId) {
    liked = after.includes(String(myId));
  } else if (after && before) {
    const added = after.filter(id => !before.includes(id));
    const removed = before.filter(id => !after.includes(id));
    if (added.length === 1) {
      liked = true;
      learnedId = added[0];
    } else if (removed.length === 1) {
      liked = false;
      learnedId = removed[0];
    } else if (after.length !== before.length) {
      liked = after.length > before.length;
    }
  }

  const count =
    typeof nested.likesCount === 'number'
      ? nested.likesCount
      : typeof nested.likeCount === 'number'
      ? nested.likeCount
      : typeof nested.likes === 'number'
      ? nested.likes
      : after
      ? after.length
      : fallbackCount;

  return {
    liked,
    count: Math.max(0, Number(count) || 0),
    likedBy: after,
    learnedId,
  };
};

const getAuthorName = item =>
  typeof item.createdBy === 'string'
    ? item.createdBy
    : item.createdBy?.name || 'Unknown';

/* ------------------------- image slide (double tap) ------------------------- */

const DoubleTapSlide = memo(
  ({ uri, index, totalImages, size, onSingleTap, onDoubleTap, onError }) => {
    const lastTapRef = useRef(0);
    const singleTapTimerRef = useRef(null);
    const heartScale = useRef(new Animated.Value(0)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    useEffect(
      () => () => {
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
        }
      },
      [],
    );

    const triggerHeartBurst = useCallback(() => {
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
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        lastTapRef.current = 0;
        triggerHeartBurst();
        onDoubleTap?.();
      } else {
        lastTapRef.current = now;
        singleTapTimerRef.current = setTimeout(() => {
          singleTapTimerRef.current = null;
          onSingleTap?.(index);
        }, DOUBLE_TAP_DELAY);
      }
    }, [index, onDoubleTap, onSingleTap, triggerHeartBurst]);

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={{ width: size, height: size }}
        onPress={handlePress}
      >
        <Image
          source={{ uri }}
          style={styles.postImage}
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
          <Ionicons name="heart" size={96} color="#FFFFFF" />
        </Animated.View>

        {totalImages > 1 && (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>
              {index + 1}/{totalImages}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

/* ------------------------- full-width paging slider ------------------------- */

const InstaImageSlider = ({ images, onImagePress, onDoubleTapLike }) => {
  const [failedUris, setFailedUris] = useState({});
  const [width, setWidth] = useState(SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(0);

  const validImages = images.filter(uri => !failedUris[uri]);
  if (validImages.length === 0) return null;

  const onMomentumEnd = e => {
    const x = e.nativeEvent.contentOffset.x;
    setActiveIndex(Math.round(x / width));
  };

  return (
    <View onLayout={e => setWidth(Math.round(e.nativeEvent.layout.width))}>
      <FlatList
        data={validImages}
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
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item: uri, index }) => (
          <DoubleTapSlide
            uri={uri}
            index={index}
            totalImages={validImages.length}
            size={width}
            onSingleTap={idx => onImagePress(validImages, idx)}
            onDoubleTap={onDoubleTapLike}
            onError={() => setFailedUris(prev => ({ ...prev, [uri]: true }))}
          />
        )}
      />

      {validImages.length > 1 && (
        <View style={styles.dotsRow}>
          {validImages.map((uri, i) => (
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

/* ------------------------------ post card ------------------------------ */

const PostCard = memo(
  ({ item, isLiked, isSharing, onToggleLike, onShare, onImagePress }) => {
    const [expanded, setExpanded] = useState(false);
    const likeScale = useRef(new Animated.Value(1)).current;

    const authorName = getAuthorName(item);
    const likesCount = getLikesCount(item);
    const sharesCount = getSharesCount(item);
    const images = getPostImages(item);
    const caption = item.description || item.text || '';
    const dateText = formatPostDate(item.createdAt);

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

    // Instagram: double tap only LIKES (never un-likes)
    const handleDoubleTapLike = useCallback(() => {
      if (!isLiked) bounceHeart();
      onToggleLike(item, 'like');
    }, [isLiked, bounceHeart, onToggleLike, item]);

    return (
      <View style={styles.postCard}>
        {/* header */}
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName} numberOfLines={1}>
            {authorName}
          </Text>
        </View>

        {/* image */}
        {images.length > 0 && (
          <InstaImageSlider
            images={images}
            onImagePress={onImagePress}
            onDoubleTapLike={handleDoubleTapLike}
          />
        )}

        {/* action row: heart + share, icons only */}
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

        {/* likes + shares (stacked below, not side by side with icons) */}
        <View style={styles.textBlock}>
          <Text style={styles.likesText}>
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            {sharesCount > 0
              ? `  ·  ${sharesCount} ${sharesCount === 1 ? 'share' : 'shares'}`
              : ''}
          </Text>

          {!!item.title && <Text style={styles.titleText}>{item.title}</Text>}

          {!!caption && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setExpanded(v => !v)}
            >
              <Text style={styles.captionText} numberOfLines={expanded ? 0 : 2}>
                <Text style={styles.captionAuthor}>{authorName} </Text>
                {caption}
              </Text>
              {!expanded && caption.length > 90 && (
                <Text style={styles.moreText}>more</Text>
              )}
            </TouchableOpacity>
          )}

          {!!dateText && <Text style={styles.postDate}>{dateText}</Text>}
        </View>
      </View>
    );
  },
);

/* ------------------------------- screen ------------------------------- */

// currentUserId = logged-in user's _id (pass from your auth/redux if available).
// If not passed, it is learned automatically after the first like/unlike.
const PostScreen = ({ navigation, currentUserId = null }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [sharingIds, setSharingIds] = useState({});
  const [myId, setMyId] = useState(
    currentUserId ? String(currentUserId) : null,
  );
  const myIdRef = useRef(myId);
  const likedMapRef = useRef({});
  const likingRef = useRef({});

  const [previewState, setPreviewState] = useState({
    visible: false,
    images: [],
    initialIndex: 0,
  });

  const flatListRef = useRef(null);
  const onEndReachedCalledDuringMomentum = useRef(false);

  // Log component mount
  useEffect(() => {
    console.log('🚀 [PostScreen] Component mounted');
    console.log('📋 [PostScreen] Initial props:', { currentUserId });
    return () => {
      console.log('🚀 [PostScreen] Component unmounted');
    };
  }, []);

  // Log posts changes
  useEffect(() => {
    console.log('📋 [PostScreen] Posts updated:', {
      count: posts.length,
      firstPostLiked: posts[0]?.isLiked,
      samplePost: posts[0],
    });
  }, [posts]);

  // Log myId changes
  useEffect(() => {
    console.log('👤 [PostScreen] myId updated:', { myId });
    myIdRef.current = myId;
  }, [myId]);

  // Log error changes
  useEffect(() => {
    if (error) {
      console.error('⚠️ [PostScreen] Error state:', error);
    }
  }, [error]);

  const fetchPosts = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log('📡 [fetchPosts] Starting fetch:', { pageNum, isRefresh });

      const response = await getAllPosts({
        page: pageNum,
        limit: PAGE_LIMIT,
        isPagination: true,
        sortBy: 'latest',
      });

      console.log('📡 [fetchPosts] Response received:', {
        success: response?.success,
        postsCount: response?.data?.length,
        pagination: response?.pagination,
        firstPostData: response?.data?.[0],
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to fetch posts');
      }

      const newPosts = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.posts)
        ? response.data.posts
        : [];

      console.log('✅ [fetchPosts] Processing posts:', {
        newPostsCount: newPosts.length,
        isRefresh,
        pageNum,
        samplePost: newPosts[0],
      });

      setPosts(prev => {
        if (pageNum === 1 || isRefresh) {
          console.log('🔄 [fetchPosts] Replacing posts (refresh or page 1)');
          return newPosts;
        }
        const seenIds = new Set(prev.map((p, idx) => String(p._id || idx)));
        const uniqueIncoming = newPosts.filter(
          (p, idx) => !seenIds.has(String(p._id || idx)),
        );
        console.log('🔄 [fetchPosts] Appending posts:', {
          prevCount: prev.length,
          newUniqueCount: uniqueIncoming.length,
          duplicateCount: newPosts.length - uniqueIncoming.length,
        });
        return [...prev, ...uniqueIncoming];
      });

      const pg =
        response.pagination ||
        (response.data &&
        !Array.isArray(response.data) &&
        response.data.totalPages
          ? response.data
          : null);

      if (pg) {
        const current = Number(pg.currentPage ?? pg.page) || pageNum;
        const totalPages = Number(pg.totalPages) || 1;
        setHasMore(current < totalPages);
        console.log('📄 [fetchPosts] Pagination info:', {
          currentPage: current,
          totalPages,
          hasMore: current < totalPages,
        });
      } else {
        setHasMore(newPosts.length === PAGE_LIMIT);
        console.log('📄 [fetchPosts] No pagination data, using length check');
      }

      setPage(pageNum);
      setError('');
    } catch (err) {
      const msg = err?.message || 'Failed to fetch posts';
      console.error('❌ [fetchPosts] Error:', msg, err);
      setError(msg);
      if (pageNum === 1 && !isRefresh) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  const handleRefresh = useCallback(() => {
    onEndReachedCalledDuringMomentum.current = false;
    fetchPosts(1, true);
  }, [fetchPosts]);

  const handleLoadMore = useCallback(() => {
    if (onEndReachedCalledDuringMomentum.current) return;
    if (
      !loadingMore &&
      !loading &&
      !refreshing &&
      hasMore &&
      posts.length > 0
    ) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchPosts(page + 1, false);
    }
  }, [
    page,
    loadingMore,
    loading,
    refreshing,
    hasMore,
    posts.length,
    fetchPosts,
  ]);

  const setLiked = useCallback((postId, value) => {
    likedMapRef.current = { ...likedMapRef.current, [postId]: value };
  }, []);

  const patchPost = useCallback((postId, patch) => {
    setPosts(prev =>
      prev.map(p => (p._id === postId ? { ...p, ...patch } : p)),
    );
  }, []);

  // mode: 'toggle' (heart button) | 'like' (double tap, never un-likes)
  // Same likePost(postId) endpoint handles both like and unlike.
  const handleToggleLike = useCallback(
    async (post, mode = 'toggle') => {
      const postId = post?._id;
      console.log('💙 [handleToggleLike] Starting:', {
        postId,
        mode,
        postTitle: post?.title,
        currentIsLiked: getIsLiked(post, myId, likedMapRef.current),
      });

      if (!postId || likingRef.current[postId]) {
        console.log('⚠️ [handleToggleLike] Cancelled - already liking or no ID');
        return;
      }

      const wasLiked = getIsLiked(post, myIdRef.current, likedMapRef.current);
      const prevLikedBy = Array.isArray(post.likedBy) ? post.likedBy : null;

      console.log('💙 [handleToggleLike] Pre-action state:', {
        wasLiked,
        mode,
        prevLikedByCount: prevLikedBy?.length || 0,
      });

      if (mode === 'like' && wasLiked) {
        console.log('⚠️ [handleToggleLike] Cancelled - double tap only likes, already liked');
        return;
      }

      const nextLiked = !wasLiked;
      const currentCount = getLikesCount(post);
      const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

      console.log('💙 [handleToggleLike] Optimistic update:', {
        nextLiked,
        currentCount,
        nextCount,
      });

      likingRef.current[postId] = true;

      // optimistic update
      setLiked(postId, nextLiked);
      patchPost(postId, {
        isLiked: nextLiked,
        liked: nextLiked,
        likes: nextCount,
        likesCount: nextCount,
      });

      console.log('💙 [handleToggleLike] UI updated optimistically');

      try {
        console.log('📡 [handleToggleLike] Calling API...');
        const res = await likePost(postId);

        console.log('📡 [handleToggleLike] API response:', {
          success: res?.success,
          data: res?.data,
          message: res?.message,
        });

        if (!res?.success) {
          throw new Error(res?.message || 'Failed to update like status');
        }

        const {
          liked: serverLiked,
          count: serverCount,
          likedBy: serverLikedBy,
          learnedId,
        } = resolveServerLikeState(
          res.data ?? res,
          prevLikedBy,
          myIdRef.current,
          nextLiked,
          nextCount,
        );

        console.log('✅ [handleToggleLike] Server state resolved:', {
          serverLiked,
          serverCount,
          learnedId,
          serverLikedByCount: serverLikedBy?.length || 'null',
        });

        if (learnedId && !myIdRef.current) {
          console.log('🔍 [handleToggleLike] Learned user ID:', learnedId);
          myIdRef.current = learnedId;
          setMyId(learnedId);
        }

        setLiked(postId, serverLiked);
        patchPost(postId, {
          isLiked: serverLiked,
          liked: serverLiked,
          likes: serverCount,
          likesCount: serverCount,
          ...(serverLikedBy ? { likedBy: serverLikedBy } : {}),
        });

        console.log('✅ [handleToggleLike] UI synced with server');
      } catch (err) {
        console.error('❌ [handleToggleLike] Error:', err.message);
        // rollback
        console.log('🔄 [handleToggleLike] Rolling back UI state...');
        setLiked(postId, wasLiked);
        patchPost(postId, {
          isLiked: wasLiked,
          liked: wasLiked,
          likes: currentCount,
          likesCount: currentCount,
        });
      } finally {
        delete likingRef.current[postId];
        console.log('✅ [handleToggleLike] Completed for postId:', postId);
      }
    },
    [patchPost, setLiked],
  );

  const handleSharePost = useCallback(async post => {
    const postId = post?._id;
    if (!postId) {
      console.log('⚠️ [handleSharePost] No postId');
      return;
    }

    console.log('🔄 [handleSharePost] Starting share:', { postId, title: post?.title });

    setSharingIds(prev => ({ ...prev, [postId]: true }));

    try {
      const shareMessage = [
        post.title || 'Post',
        post.description || post.text || '',
      ]
        .filter(Boolean)
        .join('\n\n');

      console.log('📤 [handleSharePost] Share message:', shareMessage.substring(0, 100));

      const shareResult = await Share.share({
        message: shareMessage || 'Check out this post!',
      });

      console.log('📤 [handleSharePost] Share result:', {
        action: shareResult?.action,
        dismissed: shareResult?.action === Share.dismissedAction,
      });

      if (shareResult?.action !== Share.dismissedAction) {
        console.log('📡 [handleSharePost] Calling sharePost API...');
        const res = await sharePost(postId);

        console.log('📡 [handleSharePost] API response:', {
          success: res?.success,
          shareCount: res?.data?.shareCount,
        });

        if (res?.success) {
          const payload = res.data || {};
          const nextShares =
            typeof payload.shareCount === 'number'
              ? payload.shareCount
              : typeof payload.shares === 'number'
              ? payload.shares
              : getSharesCount(post) + 1;

          console.log('✅ [handleSharePost] Share count updated:', nextShares);

          setPosts(prev =>
            prev.map(item =>
              item._id === postId
                ? { ...item, shareCount: nextShares, shares: nextShares }
                : item,
            ),
          );
        }
      } else {
        console.log('⚠️ [handleSharePost] Share was dismissed by user');
      }
    } catch (err) {
      console.error('❌ [handleSharePost] Error:', err.message);
    } finally {
      setSharingIds(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  }, []);

  const openImagePreview = useCallback((images, index = 0) => {
    setPreviewState({ visible: true, images, initialIndex: index });
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewState(prev => ({ ...prev, visible: false }));
  }, []);

  const renderPostItem = useCallback(
    ({ item }) => {
      const isLiked = getIsLiked(item, myId, likedMapRef.current);

      console.log('🎨 [renderPostItem] Rendering post:', {
        postId: item._id,
        title: item.title?.substring(0, 50),
        isLiked,
        likes: getLikesCount(item),
        likedBy: item.likedBy?.length || 0,
        myId,
      });

      return (
        <PostCard
          item={item}
          isLiked={isLiked}
          isSharing={Boolean(sharingIds[item._id])}
          onToggleLike={handleToggleLike}
          onShare={handleSharePost}
          onImagePress={openImagePreview}
        />
      );
    },
    [myId, sharingIds, handleToggleLike, handleSharePost, openImagePreview],
  );

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading more posts…</Text>
        </View>
      );
    }

    if (posts.length > 0 && !hasMore) {
      return (
        <Text style={styles.endOfListText}>
          You’ve reached the end of posts
        </Text>
      );
    }

    return null;
  }, [loadingMore, posts.length, hasMore]);

  const renderContent = () => {
    if (loading && posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading posts…</Text>
        </View>
      );
    }

    if (error && posts.length === 0) {
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
        ref={flatListRef}
        data={posts}
        extraData={{ myId, sharingIds }}
        renderItem={renderPostItem}
        keyExtractor={(item, index) => String(item._id || `post-${index}`)}
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
                name="file-tray-outline"
                size={34}
                color={colors.placeHolderColor || '#9CA3AF'}
              />
            </View>
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptyMessage}>
              Check back later for new posts.
            </Text>
          </View>
        }
        scrollIndicatorInsets={{ right: 1 }}
      />
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Post " />
        <View style={styles.body}>
          <Body>{renderContent()}</Body>
        </View>
      </View>

      <Modal
        visible={previewState.visible}
        transparent
        animationType="fade"
        onRequestClose={closeImagePreview}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            activeOpacity={0.8}
            onPress={closeImagePreview}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <FlatList
            data={previewState.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={previewState.initialIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(uri, idx) => `preview-${uri}-${idx}`}
            renderItem={({ item: uri }) => (
              <View style={styles.previewSlide}>
                <Image
                  source={{ uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>
    </AppLayout>
  );
};

/* -------------------------------- styles -------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },

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
  postCard: {
    backgroundColor: colors.white,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  authorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark || '#111827',
  },

  /* images */
  postImage: {
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

  imageCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
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

  dotActive: {
    backgroundColor: '#0095F6',
  },

  /* actions */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  shareBtn: {
    marginLeft: 16,
  },

  /* text block */
  textBlock: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark || '#111827',
  },

  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark || '#111827',
    marginTop: 6,
  },

  captionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textDark || '#262626',
    marginTop: 4,
  },

  captionAuthor: {
    fontWeight: '700',
  },

  moreText: {
    fontSize: 14,
    color: colors.textSecondary || '#8E8E8E',
    marginTop: 2,
  },

  postDate: {
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.textSecondary || '#8E8E8E',
    marginTop: 8,
  },

  /* footer / states */
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

  retryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

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

  /* preview modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
  },

  modalCloseButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.72,
  },
});

export default PostScreen;

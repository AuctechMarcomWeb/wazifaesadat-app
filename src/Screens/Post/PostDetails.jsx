import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getPostById, likePost, sharePost } from '../../api/AllTabsApi';
import BackHeader from '../../components/BackHeader/BackHeader';
import colors from '../../themes/colors';

const PostDetails = ({ route, navigation }) => {
  const { postId, post: initialPost } = route.params || {};
  const [post, setPost] = useState(initialPost || null);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (initialPost) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await getPostById(postId);

        if (!response.success) {
          throw new Error(response.message || 'Failed to load post');
        }

        setPost(response.data);
        setError('');
      } catch (err) {
        console.error('Fetch Post Error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, initialPost]);

  const handleLike = async () => {
    if (isLiking || !post) return;

    try {
      setIsLiking(true);
      const response = await likePost(post._id);

      if (!response.success) {
        throw new Error(response.message || 'Failed to like post');
      }

      // Update like count
      setPost(prev => ({
        ...prev,
        likes: response.data?.likes || prev.likes,
      }));
    } catch (err) {
      console.error('Like Post Error:', err.message);
      alert('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;

    try {
      setIsSharing(true);

      const message = [post.title, post.text || post.description]
        .filter(Boolean)
        .join('\n\n');

      const result = await Share.share({
        message: message || 'Check out this post!',
        title: post.title || 'Share Post',
      });

      if (result?.action === Share.sharedAction) {
        const response = await sharePost(post._id);

        if (response.success) {
          setPost(prev => ({
            ...prev,
            shares: (prev.shares || 0) + 1,
          }));
        }
      }
    } catch (err) {
      console.error('Share Error:', err.message);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={colors.danger}
        />
        <Text style={styles.errorTitle}>Error Loading Post</Text>
        <Text style={styles.errorMessage}>{error || 'Post not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const likeCount = post.likedBy?.length || post.likes || 0;
  const isLiked = post.likedBy?.some(like => like.userId === post.currentUserId);

  return (
    <View style={styles.container}>
      <BackHeader navigation={navigation} title="Post Details" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Images Carousel */}
        {post.images && post.images.length > 0 && (
          <View style={styles.imagesContainer}>
            <FlatList
              data={post.images}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => `img-${idx}`}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <View>
            <Text style={styles.author}>
              By{' '}
              {typeof post.createdBy === 'string'
                ? post.createdBy
                : post.createdBy?.name || 'Unknown'}
            </Text>
            <Text style={styles.date}>
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Body */}
        <Text style={styles.body}>
          {post.description || post.text || 'No content'}
        </Text>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{likeCount}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {post.shareCount || post.shares || 0}
            </Text>
            <Text style={styles.statLabel}>Shares</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {post.views || post.viewCount || 0}
            </Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={handleLike}
            disabled={isLiking}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? colors.danger : colors.primary}
            />
            <Text
              style={[
                styles.actionText,
                isLiked && styles.actionTextActive,
              ]}
            >
              {isLiking ? 'Liking...' : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            disabled={isSharing}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionText}>
              {isSharing ? 'Sharing...' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },

  scrollView: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },

  imagesContainer: {
    height: 300,
    marginBottom: 16,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors.placeHolderColor,
  },

  content: {
    padding: 16,
  },

  backIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },

  content: {
    padding: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 12,
    lineHeight: 28,
  },

  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },

  author: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },

  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  body: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 24,
    marginBottom: 24,
  },

  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.primaryBg,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },

  statBox: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: 8,
  },

  actionButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.danger,
  },

  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  actionTextActive: {
    color: colors.danger,
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

  backButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PostDetails;

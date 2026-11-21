import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import colors from '../../themes/colors';
import typography from '../../themes/typography';

import CommunityPostHeader from '../../components/CommunityPostHeader/CommunityPostHeader';
import BottomNav from '../../components/BottomNav/BottomNav';

const COMMUNITY_POSTS = [
  {
    id: '1',
    name: 'Holo D. Wisewolf',
    time: 'Posted 3m ago',
    avatar:
      'https://images.unsplash.com/photo-1594824813568-a4005ffc873f?w=150',
    text: "I've been struggling with severe headaches for years, but recently I've found some relief thanks to Doc Nightingale AI.!",
    emojis: '🎉🙌',
    hashtags: ['#goodbyeheadache', '#nightingalerocks'],
    images: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600',
    ],
    views: '5,874',
    likes: '215',
  },
  {
    id: '2',
    name: 'Dr. Alex Mercer',
    time: 'Posted 2h ago',
    avatar:
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
    text: 'Just integrated the new AI diagnostic assistant into our daily clinic workflow. The accuracy in initial triage is truly remarkable!',
    emojis: '⚡ Stethoscope',
    hashtags: ['#HealthTech', '#FutureOfMedicine'],
    images: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600',
    ],
    views: '1,240',
    likes: '89',
  },
  {
    id: '3',
    name: 'Sarah Jenkins',
    time: 'Posted 5h ago',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    text: 'Amazing support group session today. Remembering that we are never alone in our wellness journeys means everything.',
    emojis: '💚💪',
    hashtags: ['#MentalHealthAwareness', '#Community'],
    images: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600',
    ],
    views: '3,412',
    likes: '150',
  },
  {
    id: '4',
    name: 'Dr. Robert Chen',
    time: 'Posted 1d ago',
    avatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    text: 'Explored advanced cardiovascular telemetry tools today. Patient monitoring has never been this seamless and non-invasive.',
    emojis: '🩺📈',
    hashtags: ['#Cardiology', '#Innovation'],
    images: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600',
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600',
    ],
    views: '4,120',
    likes: '310',
  },
  {
    id: '5',
    name: 'Emily Watson',
    time: 'Posted 1d ago',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    text: 'Morning yoga routine combined with guided meditation app prompts. Feeling extremely energized and centered for the work week!',
    emojis: '🧘‍♀️✨',
    hashtags: ['#Mindfulness', '#HealthyHabits'],
    images: ['https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600'],
    views: '2,950',
    likes: '184',
  },
  {
    id: '6',
    name: 'Mark Taylor',
    time: 'Posted 2d ago',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    text: 'Recovery tracking after knee surgery has become so easy with digital physical therapy check-ins. Highly recommended!',
    emojis: '🦾🚀',
    hashtags: ['#RecoveryJourney', '#PhysioTech'],
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
    ],
    views: '1,890',
    likes: '95',
  },
  {
    id: '7',
    name: 'Dr. Priya Sharma',
    time: 'Posted 3d ago',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    text: 'Pediatric care seminar was a huge success today. Sharing digital vaccination tracker apps with parents is changing child healthcare compliance.',
    emojis: '👶💖',
    hashtags: ['#Pediatrics', '#DigitalHealth'],
    images: [
      'https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=600',
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600',
    ],
    views: '5,012',
    likes: '420',
  },
  {
    id: '8',
    name: 'Liam O’Connor',
    time: 'Posted 3d ago',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    text: 'Meal prepping healthy lunches for the week. Good nutrition is 80% of your fitness transformation goals!',
    emojis: '🥗🥑',
    hashtags: ['#Nutrition', '#CleanEating'],
    images: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
    ],
    views: '3,100',
    likes: '230',
  },
  {
    id: '9',
    name: 'Jessica Alba',
    time: 'Posted 4d ago',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    text: 'Completed my 30-day sleep improvement challenge using smart wearable tracking. Waking up refreshed is a game changer!',
    emojis: '😴🌙',
    hashtags: ['#SleepScience', '#Wellness'],
    images: [
      'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=600',
    ],
    views: '2,450',
    likes: '175',
  },
  {
    id: '10',
    name: 'Dr. Marcus Vance',
    time: 'Posted 5d ago',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    text: 'Excited to publish our latest findings on AI-driven preventative screening mechanisms in modern oncology.',
    emojis: '🔬📊',
    hashtags: ['#Oncology', '#MedicalResearch'],
    images: [
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600',
    ],
    views: '6,780',
    likes: '512',
  },
];

const CommunityPostCard = ({ navigation }) => {
  const handleTabPress = key => {
    if (key === 'Dashboard') return;
    navigation?.navigate(key);
  };

  // Share Post Function
  const handleShare = async post => {
    try {
      const hashtags = post.hashtags?.join(' ') || '';

      const imageLinks = post.images?.length
        ? '\n\nImages:\n' + post.images.join('\n')
        : '';

      const message = `${post.name}\n\n${post.text} ${
        post.emojis || ''
      }\n\n${hashtags}${imageLinks}`;

      await Share.share({
        message,
        title: 'Share Community Post',
      });
    } catch (error) {
      console.log('Share Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <CommunityPostHeader
        onMenuPress={() => navigation?.openDrawer?.()}
        onBellPress={() => navigation?.navigate('Notifications')}
        onProfilePress={() => navigation?.navigate('ProfileScreen')}
      />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {COMMUNITY_POSTS.map(post => (
            <View key={post.id} style={styles.cardWrapper}>
              <View style={styles.card}>
                {/* Post Header */}

                <View style={styles.postHeader}>
                  <View style={styles.userInfo}>
                    <Image
                      source={{ uri: post.avatar }}
                      style={styles.avatar}
                    />

                    <View style={styles.userTextContainer}>
                      <View style={styles.nameRow}>
                        <Text style={[typography.heading, styles.userName]}>
                          {post.name}
                        </Text>

                        <MaterialIcons
                          name="verified"
                          size={16}
                          color={colors.info}
                          style={styles.verifiedIcon}
                        />
                      </View>

                      <Text style={[typography.caption, styles.postTime]}>
                        {post.time}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Post Description */}

                <View style={styles.contentContainer}>
                  <Text style={[typography.body, styles.postText]}>
                    {post.text} <Text>{post.emojis}</Text>
                  </Text>

                  <View style={styles.hashtagRow}>
                    {post.hashtags.map((tag, index) => (
                      <Text key={index} style={styles.hashtag}>
                        {tag}{' '}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Post Images */}

                {post.images?.length > 0 && (
                  <View
                    style={
                      post.images.length === 1
                        ? styles.imageContainer
                        : styles.imageGridContainer
                    }
                  >
                    {post.images.length === 1 ? (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: post.images[0] }}
                          style={styles.postImage}
                          resizeMode="cover"
                        />

                        <View style={styles.expandButton}>
                          <MaterialIcons
                            name="fullscreen"
                            size={20}
                            color={colors.white}
                          />
                        </View>
                      </View>
                    ) : (
                      post.images.map((imgUri, imgIndex) => (
                        <View
                          key={imgIndex}
                          style={
                            post.images.length === 2
                              ? styles.halfImageWrapper
                              : styles.gridImageWrapper
                          }
                        >
                          <Image
                            source={{ uri: imgUri }}
                            style={styles.gridImage}
                            resizeMode="cover"
                          />
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* Post Footer: Views, Likes, Share */}

                <View style={styles.postFooter}>
                  <View style={styles.footerLeft}>
                    {/* Views */}

                    <View style={styles.statItem}>
                      <Ionicons
                        name="eye-outline"
                        size={17}
                        color={colors.textSecondary}
                      />

                      <Text style={styles.statText}>{post.views}</Text>
                    </View>

                    {/* Likes */}

                    <View style={styles.statItem}>
                      <Ionicons name="heart" size={17} color={colors.danger} />

                      <Text style={styles.statText}>{post.likes}</Text>
                    </View>
                  </View>

                  {/* Share Button */}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.shareButton}
                    onPress={() => handleShare(post)}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={19}
                      color={colors.success}
                    />

                    <Text style={styles.shareText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <BottomNav active="CommunityPost" onPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },

  body: {
    flex: 1,
    marginTop: -22,
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  scrollContent: {
    paddingBottom: 24,
    paddingTop: 12,
  },

  cardWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: colors.cardColor,
    borderRadius: 24,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBorder,
  },

  userTextContainer: {
    marginLeft: 10,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  verifiedIcon: {
    marginLeft: 4,
  },

  postTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },

  contentContainer: {
    marginBottom: 12,
  },

  postText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },

  hashtag: {
    fontSize: 14,
    color: colors.info,
    fontWeight: '600',
  },

  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },

  postImage: {
    width: '100%',
    height: '100%',
  },

  imageGridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },

  halfImageWrapper: {
    width: '48.8%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },

  gridImageWrapper: {
    width: '31.8%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
  },

  gridImage: {
    width: '100%',
    height: '100%',
  },

  expandButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 6,
    borderRadius: 8,
  },

  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },

  statText: {
    marginLeft: 4,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E8F5EC',
    gap: 6,
  },

  shareText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
});

export default CommunityPostCard;

// import React, {
//   memo,
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Share,
//   RefreshControl,
//   ActivityIndicator,
//   Modal,
//   Animated,
//   Platform,
//   StatusBar,
//   useWindowDimensions,
// } from 'react-native';

// import Ionicons from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// import colors from '../../themes/colors';
// import typography from '../../themes/typography';

// import CommunityPostHeader from '../../components/CommunityPostHeader/CommunityPostHeader';
// import BottomNav from '../../components/BottomNav/BottomNav';

// // API imports - adjust path according to your project
// import { getAllPosts, likePost, sharePost } from '../../api/post';

// // ─── CONSTANTS ──────────────────────────────────────────

// const LIMIT = 10;
// const H_PAD = 12; // list horizontal padding
// const CARD_PADDING = 16;
// const GAP = 4; // gap between grid images

// const C = {
//   primary: colors.success || '#2E9E5B',
//   primarySoft: '#E8F5EC',
//   danger: colors.danger || '#E5484D',
//   dangerSoft: '#FFF0F0',
//   info: colors.info || '#1D9BF0',
//   textPrimary: colors.textPrimary || '#1B1F23',
//   textSecondary: colors.textSecondary || '#5B6770',
//   textMuted: colors.textMuted || '#8A949C',
//   card: colors.cardColor || '#FFFFFF',
//   bodyBg: colors.backgroundDark || '#F1F6F3',
//   border: '#EAEEF0',
//   tile: '#EEF2F4',
// };

// const AVATAR_COLORS = [
//   '#2E7D32',
//   '#1565C0',
//   '#6A1B9A',
//   '#EF6C00',
//   '#00838F',
//   '#AD1457',
//   '#4E342E',
// ];

// // ─── HELPERS ────────────────────────────────────────────

// const getId = user => (typeof user === 'string' ? user : user?._id);

// const getInitials = (name = '') => {
//   const parts = name.trim().split(/\s+/).filter(Boolean);
//   if (parts.length === 0) return '?';
//   if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
//   return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
// };

// const getAvatarColor = (name = '') => {
//   let hash = 0;
//   for (let i = 0; i < name.length; i += 1) {
//     hash = name.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
// };

// const formatDate = date => {
//   if (!date) return '';

//   const created = new Date(date);
//   if (Number.isNaN(created.getTime())) return '';

//   const diff = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000));

//   if (diff < 60) return 'Just now';
//   if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
//   if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

//   return created.toLocaleDateString();
// };

// // NOTE: "unliked successfully" also CONTAINS "liked successfully",
// // so "unlike" must always be checked first.
// const detectLikeState = (message, fallback) => {
//   const msg = (message || '').toLowerCase();
//   if (msg.includes('unlike')) return false;
//   if (msg.includes('like')) return true;
//   return fallback;
// };

// const getIsLiked = (post, currentUserId) => {
//   if (typeof post._localLiked === 'boolean') return post._localLiked;
//   if (currentUserId) {
//     return (post.likedBy || []).some(user => getId(user) === currentUserId);
//   }
//   return false;
// };

// const pluralize = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

// // ─── IMAGE TILE (with error fallback) ───────────────────

// const ImageTile = memo(({ uri, style, onPress, overlayText }) => {
//   const [failed, setFailed] = useState(false);

//   return (
//     <TouchableOpacity
//       activeOpacity={0.9}
//       onPress={onPress}
//       style={[styles.tile, style]}
//     >
//       {failed ? (
//         <View style={styles.tileFallback}>
//           <Ionicons name="image-outline" size={28} color={C.textMuted} />
//         </View>
//       ) : (
//         <Image
//           source={{ uri }}
//           style={styles.fill}
//           resizeMode="cover"
//           onError={() => setFailed(true)}
//         />
//       )}

//       {!!overlayText && (
//         <View style={styles.moreOverlay}>
//           <Text style={styles.moreText}>{overlayText}</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// });

// // ─── IMAGE CAROUSEL (side-by-side, swipeable) ───────────

// const SLIDE_GAP = 10;

// const ImageCarousel = memo(({ images, width, onPress }) => {
//   const [active, setActive] = useState(0);
//   const multiple = images.length > 1;

//   const slideW = multiple ? Math.round(width * 0.86) : width;
//   const slideH = Math.min(Math.round(slideW * 0.85), 360);
//   const step = slideW + SLIDE_GAP;

//   const onScrollEnd = e => {
//     const i = Math.round(e.nativeEvent.contentOffset.x / step);
//     setActive(Math.max(0, Math.min(images.length - 1, i)));
//   };

//   if (!multiple) {
//     return (
//       <ImageTile
//         uri={images[0]}
//         style={{ width: slideW, height: slideH, borderRadius: 16 }}
//         onPress={() => onPress(0)}
//       />
//     );
//   }

//   return (
//     <View style={{ width }}>
//       <FlatList
//         horizontal
//         data={images}
//         keyExtractor={(uri, i) => `${uri}-${i}`}
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={step}
//         snapToAlignment="start"
//         decelerationRate="fast"
//         disableIntervalMomentum
//         nestedScrollEnabled
//         ItemSeparatorComponent={() => <View style={{ width: SLIDE_GAP }} />}
//         onMomentumScrollEnd={onScrollEnd}
//         renderItem={({ item, index }) => (
//           <ImageTile
//             uri={item}
//             style={{ width: slideW, height: slideH, borderRadius: 16 }}
//             onPress={() => onPress(index)}
//           />
//         )}
//       />

//       <View style={styles.countBadge}>
//         <Ionicons name="images-outline" size={12} color="#FFF" />
//         <Text style={styles.countText}>
//           {active + 1}/{images.length}
//         </Text>
//       </View>

//       <View style={styles.dotsRow}>
//         {images.map((_, i) => (
//           <View
//             key={i}
//             style={[styles.dot, i === active && styles.dotActive]}
//           />
//         ))}
//       </View>
//     </View>
//   );
// });

// // ─── FULL SCREEN IMAGE VIEWER ───────────────────────────

// const ImageViewer = ({ visible, images, startIndex, onClose }) => {
//   const { width, height } = useWindowDimensions();
//   const [index, setIndex] = useState(startIndex);

//   useEffect(() => {
//     setIndex(startIndex);
//   }, [startIndex, visible]);

//   if (!visible) return null;

//   const topOffset =
//     Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 10;

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="fade"
//       statusBarTranslucent
//       onRequestClose={onClose}
//     >
//       <View style={styles.viewerBackdrop}>
//         <FlatList
//           data={images}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           keyExtractor={(uri, i) => `${uri}-${i}`}
//           initialScrollIndex={startIndex}
//           getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
//           onMomentumScrollEnd={e =>
//             setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
//           }
//           renderItem={({ item }) => (
//             <View style={{ width, height, justifyContent: 'center' }}>
//               <Image
//                 source={{ uri: item }}
//                 style={{ width, height: height * 0.8 }}
//                 resizeMode="contain"
//               />
//             </View>
//           )}
//         />

//         <TouchableOpacity
//           style={[styles.viewerClose, { top: topOffset }]}
//           onPress={onClose}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Ionicons name="close" size={24} color="#FFF" />
//         </TouchableOpacity>

//         {images.length > 1 && (
//           <View style={[styles.viewerCounter, { top: topOffset + 4 }]}>
//             <Text style={styles.viewerCounterText}>
//               {index + 1} / {images.length}
//             </Text>
//           </View>
//         )}
//       </View>
//     </Modal>
//   );
// };

// // ─── POST CARD ──────────────────────────────────────────

// const PostCard = memo(
//   ({
//     post,
//     cardWidth,
//     currentUserId,
//     isSharing,
//     onLike,
//     onShare,
//     onImagePress,
//   }) => {
//     const [expanded, setExpanded] = useState(false);
//     const scale = useRef(new Animated.Value(1)).current;

//     const isLiked = getIsLiked(post, currentUserId);
//     const likes = post.likes || 0;
//     const shares = post.shareCount || 0;
//     const images = (post.images || []).filter(Boolean);
//     const userName = post.createdBy?.name || 'Unknown User';
//     const description = post.description || '';
//     const isLong = description.length > 140;
//     const innerWidth = cardWidth - CARD_PADDING * 2;

//     const handleLikePress = () => {
//       Animated.sequence([
//         Animated.spring(scale, {
//           toValue: 1.3,
//           speed: 40,
//           bounciness: 12,
//           useNativeDriver: true,
//         }),
//         Animated.spring(scale, {
//           toValue: 1,
//           speed: 40,
//           useNativeDriver: true,
//         }),
//       ]).start();

//       onLike(post);
//     };

//     return (
//       <View style={[styles.card, { width: cardWidth }]}>
//         {/* HEADER */}
//         <View style={styles.postHeader}>
//           <View
//             style={[
//               styles.avatar,
//               { backgroundColor: getAvatarColor(userName) },
//             ]}
//           >
//             <Text style={styles.avatarText}>{getInitials(userName)}</Text>
//           </View>

//           <View style={styles.userTextContainer}>
//             <View style={styles.nameRow}>
//               <Text
//                 style={[typography.heading, styles.userName]}
//                 numberOfLines={1}
//               >
//                 {userName}
//               </Text>
//               <MaterialIcons
//                 name="verified"
//                 size={15}
//                 color={C.info}
//                 style={styles.verifiedIcon}
//               />
//             </View>

//             <View style={styles.timeRow}>
//               <Ionicons name="time-outline" size={12} color={C.textMuted} />
//               <Text style={[typography.caption, styles.postTime]}>
//                 {formatDate(post.createdAt)}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* CONTENT */}
//         <View style={styles.contentContainer}>
//           {!!post.title && (
//             <Text style={[typography.heading, styles.postTitle]}>
//               {post.title}
//             </Text>
//           )}

//           {!!description && (
//             <>
//               <Text
//                 style={[typography.body, styles.postText]}
//                 numberOfLines={expanded ? undefined : 4}
//               >
//                 {description}
//               </Text>

//               {isLong && (
//                 <TouchableOpacity onPress={() => setExpanded(v => !v)}>
//                   <Text style={styles.readMore}>
//                     {expanded ? 'Show less' : 'Read more'}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//             </>
//           )}
//         </View>

//         {/* IMAGES */}
//         {images.length > 0 && (
//           <View style={styles.mediaContainer}>
//             <ImageCarousel
//               images={images}
//               width={innerWidth}
//               onPress={index => onImagePress(images, index)}
//             />
//           </View>
//         )}

//         {/* STATS */}
//         <View style={styles.statsRow}>
//           <View style={styles.statsLeft}>
//             <View style={styles.heartBadge}>
//               <Ionicons name="heart" size={11} color="#FFF" />
//             </View>
//             <Text style={styles.statsText}>{pluralize(likes, 'like')}</Text>
//           </View>

//           <Text style={styles.statsText}>{pluralize(shares, 'share')}</Text>
//         </View>

//         {/* ACTIONS */}
//         <View style={styles.actionsRow}>
//           <TouchableOpacity
//             activeOpacity={0.7}
//             style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
//             onPress={handleLikePress}
//           >
//             <Animated.View style={{ transform: [{ scale }] }}>
//               <Ionicons
//                 name={isLiked ? 'heart' : 'heart-outline'}
//                 size={20}
//                 color={isLiked ? C.danger : C.textSecondary}
//               />
//             </Animated.View>
//             <Text
//               style={[
//                 styles.actionText,
//                 isLiked && { color: C.danger },
//               ]}
//             >
//               {isLiked ? 'Liked' : 'Like'}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             activeOpacity={0.7}
//             style={[styles.actionBtn, styles.actionBtnShare]}
//             onPress={() => onShare(post)}
//             disabled={isSharing}
//           >
//             {isSharing ? (
//               <ActivityIndicator size="small" color={C.primary} />
//             ) : (
//               <Ionicons
//                 name="share-social-outline"
//                 size={19}
//                 color={C.primary}
//               />
//             )}
//             <Text style={[styles.actionText, { color: C.primary }]}>
//               Share
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   },
// );

// // ─── MAIN SCREEN ────────────────────────────────────────

// const CommunityPostCard = ({ navigation, currentUserId }) => {
//   const { width } = useWindowDimensions();

//   const [posts, setPosts] = useState([]);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [error, setError] = useState('');

//   const [sharingId, setSharingId] = useState(null);
//   const [viewer, setViewer] = useState({ visible: false, images: [], index: 0 });

//   // in-flight locks (don't cause re-render)
//   const fetchingRef = useRef(false);
//   const likingRef = useRef(new Set());
//   const sharingRef = useRef(new Set());

//   const hasMore = page < totalPages;

//   // Responsive layout: 2 columns on tablets / landscape
//   const columns = width >= 900 ? 2 : 1;
//   const cardWidth =
//     columns === 2
//       ? (width - H_PAD * 2) / 2 - 12
//       : Math.min(width - H_PAD * 2, 600);

//   // ─── GET POSTS ────────────────────────────────────────

//   const fetchPosts = useCallback(async (pageNumber = 1, isRefresh = false) => {
//     if (fetchingRef.current) return;
//     fetchingRef.current = true;

//     try {
//       setError('');

//       if (isRefresh) setRefreshing(true);
//       else if (pageNumber === 1) setLoading(true);
//       else setLoadingMore(true);

//       const response = await getAllPosts({
//         page: pageNumber,
//         limit: LIMIT,
//         isPagination: true,
//         sortBy: 'latest',
//       });

//       if (response?.success) {
//         const fetched = response.data?.posts || [];

//         setPosts(prev =>
//           pageNumber === 1
//             ? fetched
//             : [
//                 ...prev,
//                 ...fetched.filter(
//                   np => !prev.some(op => op._id === np._id),
//                 ),
//               ],
//         );

//         setPage(response.data?.page || pageNumber);
//         setTotalPages(response.data?.totalPages || 1);
//       } else {
//         setError(response?.message || 'Unable to load posts');
//       }
//     } catch (e) {
//       console.log('Fetch Posts Error:', e);
//       setError('Something went wrong. Please try again.');
//     } finally {
//       fetchingRef.current = false;
//       setLoading(false);
//       setRefreshing(false);
//       setLoadingMore(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPosts(1);
//   }, [fetchPosts]);

//   const handleRefresh = useCallback(() => {
//     fetchPosts(1, true);
//   }, [fetchPosts]);

//   const handleLoadMore = useCallback(() => {
//     if (posts.length === 0 || !hasMore) return;
//     if (loading || refreshing || loadingMore) return;
//     fetchPosts(page + 1);
//   }, [posts.length, hasMore, loading, refreshing, loadingMore, page, fetchPosts]);

//   // ─── LIKE / UNLIKE ────────────────────────────────────

//   // Sets the liked state of a post locally (optimistic / reconcile / rollback)
//   const applyLikeState = useCallback(
//     (postId, liked, serverLikes) => {
//       setPosts(prev =>
//         prev.map(item => {
//           if (item._id !== postId) return item;

//           const alreadyLiked = getIsLiked(item, currentUserId);

//           const likes =
//             typeof serverLikes === 'number'
//               ? serverLikes
//               : Math.max(
//                   0,
//                   (item.likes || 0) +
//                     (liked === alreadyLiked ? 0 : liked ? 1 : -1),
//                 );

//           const likedBy = (item.likedBy || []).filter(
//             user => getId(user) !== currentUserId,
//           );
//           if (liked && currentUserId) likedBy.push(currentUserId);

//           return { ...item, likes, likedBy, _localLiked: liked };
//         }),
//       );
//     },
//     [currentUserId],
//   );

//   const handleLike = useCallback(
//     async post => {
//       if (likingRef.current.has(post._id)) return;
//       likingRef.current.add(post._id);

//       const wasLiked = getIsLiked(post, currentUserId);
//       const prevLikes = post.likes || 0;

//       // Optimistic update only when we reliably know the current state
//       // (currentUserId available, or state already synced from server once).
//       const optimistic =
//         !!currentUserId || typeof post._localLiked === 'boolean';

//       if (optimistic) applyLikeState(post._id, !wasLiked);

//       try {
//         const response = await likePost(post._id);

//         if (response?.success) {
//           // 2) sync with what the server actually did
//           const finalLiked = detectLikeState(response.message, !wasLiked);
//           const serverLikes =
//             typeof response.data?.likes === 'number'
//               ? response.data.likes
//               : undefined;

//           applyLikeState(post._id, finalLiked, serverLikes);
//         } else {
//           // 3) failed → rollback
//           console.log('Like API Error:', response?.message);
//           if (optimistic) applyLikeState(post._id, wasLiked, prevLikes);
//         }
//       } catch (e) {
//         console.log('Like Error:', e);
//         if (optimistic) applyLikeState(post._id, wasLiked, prevLikes);
//       } finally {
//         likingRef.current.delete(post._id);
//       }
//     },
//     [currentUserId, applyLikeState],
//   );

//   // ─── SHARE ────────────────────────────────────────────

//   const handleShare = useCallback(async post => {
//     if (sharingRef.current.has(post._id)) return;
//     sharingRef.current.add(post._id);
//     setSharingId(post._id);

//     try {
//       const images = (post.images || []).filter(Boolean);

//       const message = [
//         post.title,
//         post.description,
//         images.length ? images.join('\n') : null,
//       ]
//         .filter(Boolean)
//         .join('\n\n');

//       const result = await Share.share(
//         { message, title: post.title || 'Community Post' },
//         { dialogTitle: 'Share Community Post' },
//       );

//       // Count the share only if the user really shared (not dismissed)
//       if (result?.action === Share.sharedAction) {
//         const response = await sharePost(post._id);

//         if (response?.success) {
//           setPosts(prev =>
//             prev.map(item =>
//               item._id === post._id
//                 ? {
//                     ...item,
//                     shareCount:
//                       typeof response.data?.shareCount === 'number'
//                         ? response.data.shareCount
//                         : (item.shareCount || 0) + 1,
//                   }
//                 : item,
//             ),
//           );
//         } else {
//           console.log('Share API Error:', response?.message);
//         }
//       }
//     } catch (e) {
//       console.log('Share Error:', e?.message || e);
//     } finally {
//       sharingRef.current.delete(post._id);
//       setSharingId(null);
//     }
//   }, []);

//   // ─── IMAGE VIEWER ─────────────────────────────────────

//   const handleImagePress = useCallback((images, index) => {
//     setViewer({ visible: true, images, index });
//   }, []);

//   const closeViewer = useCallback(() => {
//     setViewer(v => ({ ...v, visible: false }));
//   }, []);

//   // ─── NAVIGATION ───────────────────────────────────────

//   const handleTabPress = key => {
//     if (key === 'Dashboard') return;
//     navigation?.navigate(key);
//   };

//   // ─── LIST PIECES ──────────────────────────────────────

//   const renderPost = useCallback(
//     ({ item }) => (
//       <View style={[styles.cardWrapper, columns === 2 && styles.cardWrapperCol]}>
//         <PostCard
//           post={item}
//           cardWidth={cardWidth}
//           currentUserId={currentUserId}
//           isSharing={sharingId === item._id}
//           onLike={handleLike}
//           onShare={handleShare}
//           onImagePress={handleImagePress}
//         />
//       </View>
//     ),
//     [
//       columns,
//       cardWidth,
//       currentUserId,
//       sharingId,
//       handleLike,
//       handleShare,
//       handleImagePress,
//     ],
//   );

//   const renderFooter = () => {
//     if (loadingMore) {
//       return (
//         <View style={styles.footerLoader}>
//           <ActivityIndicator size="small" color={C.primary} />
//           <Text style={styles.loaderText}>Loading more posts...</Text>
//         </View>
//       );
//     }

//     if (posts.length > 0 && !hasMore) {
//       return (
//         <View style={styles.footerLoader}>
//           <Text style={styles.endText}>You're all caught up 🎉</Text>
//         </View>
//       );
//     }

//     return null;
//   };

//   const renderEmpty = () => {
//     if (loading) return null;

//     return (
//       <View style={styles.emptyContainer}>
//         <View style={styles.emptyIconCircle}>
//           <Ionicons
//             name={error ? 'cloud-offline-outline' : 'newspaper-outline'}
//             size={44}
//             color={C.textMuted}
//           />
//         </View>

//         <Text style={styles.emptyTitle}>
//           {error ? 'Something went wrong' : 'No Posts Found'}
//         </Text>

//         <Text style={styles.emptyDescription}>
//           {error || 'There are no community posts available right now.'}
//         </Text>

//         <TouchableOpacity
//           style={styles.retryBtn}
//           activeOpacity={0.8}
//           onPress={() => fetchPosts(1)}
//         >
//           <Ionicons name="refresh" size={16} color="#FFF" />
//           <Text style={styles.retryText}>{error ? 'Try again' : 'Refresh'}</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   // ─── MAIN UI ──────────────────────────────────────────

//   return (
//     <View style={styles.container}>
//       <CommunityPostHeader
//         onMenuPress={() => navigation?.openDrawer?.()}
//         onBellPress={() => navigation?.navigate('Notifications')}
//         onProfilePress={() => navigation?.navigate('ProfileScreen')}
//       />

//       <View style={styles.body}>
//         {loading && posts.length === 0 ? (
//           <View style={styles.centerLoader}>
//             <ActivityIndicator size="large" color={C.primary} />
//             <Text style={styles.loaderText}>Loading community posts...</Text>
//           </View>
//         ) : (
//           <FlatList
//             key={`columns-${columns}`}
//             numColumns={columns}
//             data={posts}
//             keyExtractor={item => item._id}
//             renderItem={renderPost}
//             contentContainerStyle={[
//               styles.scrollContent,
//               columns === 2 && { paddingHorizontal: H_PAD },
//               posts.length === 0 && styles.emptyList,
//             ]}
//             showsVerticalScrollIndicator={false}
//             onEndReached={handleLoadMore}
//             onEndReachedThreshold={0.4}
//             ListFooterComponent={renderFooter}
//             ListEmptyComponent={renderEmpty}
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={handleRefresh}
//                 colors={[C.primary]}
//                 tintColor={C.primary}
//               />
//             }
//             initialNumToRender={4}
//             maxToRenderPerBatch={4}
//             windowSize={7}
//             removeClippedSubviews={Platform.OS === 'android'}
//           />
//         )}
//       </View>

//       <ImageViewer
//         visible={viewer.visible}
//         images={viewer.images}
//         startIndex={viewer.index}
//         onClose={closeViewer}
//       />

//       <BottomNav active="CommunityPost" onPress={handleTabPress} />
//     </View>
//   );
// };

// // ─── STYLES ─────────────────────────────────────────────

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F1F6F3',
//   },

//   body: {
//     flex: 1,
//     marginTop: -22,
//     backgroundColor: C.bodyBg,
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     overflow: 'hidden',
//   },

//   scrollContent: {
//     paddingTop: 14,
//     paddingBottom: 28,
//   },

//   cardWrapper: {
//     paddingHorizontal: H_PAD,
//     paddingVertical: 8,
//     alignItems: 'center',
//   },

//   cardWrapperCol: {
//     flex: 1,
//     paddingHorizontal: 6,
//   },

//   card: {
//     backgroundColor: C.card,
//     borderRadius: 22,
//     padding: CARD_PADDING,
//     borderWidth: 1,
//     borderColor: C.border,
//     shadowColor: '#0B2A1A',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.08,
//     shadowRadius: 14,
//     elevation: 4,
//   },

//   // header
//   postHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },

//   avatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   avatarText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },

//   userTextContainer: {
//     marginLeft: 10,
//     flex: 1,
//   },

//   nameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   userName: {
//     fontSize: 14.5,
//     fontWeight: '700',
//     color: C.textPrimary,
//     flexShrink: 1,
//   },

//   verifiedIcon: {
//     marginLeft: 4,
//   },

//   timeRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 2,
//     gap: 4,
//   },

//   postTime: {
//     fontSize: 11.5,
//     color: C.textMuted,
//   },

//   // content
//   contentContainer: {
//     marginBottom: 12,
//   },

//   postTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: C.textPrimary,
//     marginBottom: 6,
//     lineHeight: 22,
//   },

//   postText: {
//     fontSize: 13.5,
//     color: C.textSecondary,
//     lineHeight: 20,
//   },

//   readMore: {
//     marginTop: 4,
//     fontSize: 12.5,
//     fontWeight: '700',
//     color: C.primary,
//   },

//   // media
//   mediaContainer: {
//     marginBottom: 12,
//   },

//   countBadge: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 9,
//     paddingVertical: 4,
//     borderRadius: 12,
//     backgroundColor: 'rgba(0,0,0,0.55)',
//   },

//   countText: {
//     color: '#FFF',
//     fontSize: 11.5,
//     fontWeight: '700',
//   },

//   dotsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 5,
//     marginTop: 10,
//   },

//   dot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#D5DBDF',
//   },

//   dotActive: {
//     width: 18,
//     backgroundColor: C.primary,
//   },

//   rowWrap: {
//     flexDirection: 'row',
//     gap: GAP,
//   },

//   gridWrap: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },

//   tile: {
//     overflow: 'hidden',
//     backgroundColor: C.tile,
//   },

//   tileFallback: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   fill: {
//     width: '100%',
//     height: '100%',
//   },

//   moreOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   moreText: {
//     color: '#FFF',
//     fontSize: 26,
//     fontWeight: '700',
//   },

//   // stats + actions
//   statsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingBottom: 10,
//   },

//   statsLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },

//   heartBadge: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: C.danger,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   statsText: {
//     fontSize: 12.5,
//     color: C.textSecondary,
//     fontWeight: '600',
//   },

//   actionsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#F0F2F5',
//   },

//   actionBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 7,
//     paddingVertical: 10,
//     borderRadius: 14,
//     backgroundColor: '#F5F7F8',
//   },

//   actionBtnLiked: {
//     backgroundColor: C.dangerSoft,
//   },

//   actionBtnShare: {
//     backgroundColor: C.primarySoft,
//   },

//   actionText: {
//     fontSize: 13.5,
//     fontWeight: '700',
//     color: C.textSecondary,
//   },

//   // loaders / empty
//   centerLoader: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   loaderText: {
//     fontSize: 13,
//     color: C.textSecondary,
//     marginTop: 10,
//   },

//   footerLoader: {
//     paddingVertical: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   endText: {
//     fontSize: 12.5,
//     color: C.textMuted,
//     fontWeight: '600',
//   },

//   emptyList: {
//     flexGrow: 1,
//   },

//   emptyContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 30,
//     paddingVertical: 80,
//   },

//   emptyIconCircle: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//   },

//   emptyTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: C.textPrimary,
//     marginTop: 16,
//   },

//   emptyDescription: {
//     fontSize: 13,
//     color: C.textMuted,
//     textAlign: 'center',
//     marginTop: 6,
//     lineHeight: 20,
//   },

//   retryBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginTop: 18,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 20,
//     backgroundColor: C.primary,
//   },

//   retryText: {
//     color: '#FFF',
//     fontSize: 13.5,
//     fontWeight: '700',
//   },

//   // image viewer
//   viewerBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.95)',
//     justifyContent: 'center',
//   },

//   viewerClose: {
//     position: 'absolute',
//     right: 16,
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: 'rgba(255,255,255,0.18)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   viewerCounter: {
//     position: 'absolute',
//     left: 16,
//     paddingHorizontal: 12,
//     paddingVertical: 5,
//     borderRadius: 14,
//     backgroundColor: 'rgba(255,255,255,0.18)',
//   },

//   viewerCounterText: {
//     color: '#FFF',
//     fontSize: 12.5,
//     fontWeight: '600',
//   },
// });

// export default CommunityPostCard;

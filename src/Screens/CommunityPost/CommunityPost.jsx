import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Modal,
  Animated,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../../themes/colors';
import typography from '../../themes/typography';

import CommunityPostHeader from '../../components/CommunityPostHeader/CommunityPostHeader';
import BottomNav from '../../components/BottomNav/BottomNav';
import { useSelector } from 'react-redux';

const TABS = [
  { key: 'All', label: 'All' },
  { key: 'Post&Blogs', label: 'Post&Blogs' },
  { key: 'Jobs&Career', label: 'Jobs&Career' },
  { key: 'Event&News', label: 'Event&News' },
  { key: 'Donation&Appeal', label: 'Donation&Appeal' },
];

const BADGE_THEMES = {
  'Post&Blogs': { bg: '#E6F0FF', text: '#1D5FD6', border: '#C7DCFF' },
  'Jobs&Career': { bg: '#FFF4E5', text: '#B86500', border: '#FFE0B5' },
  'Event&News': { bg: '#F1ECFF', text: '#6338D9', border: '#DDD1FF' },
  'Donation&Appeal': { bg: '#E7F8EE', text: '#167A43', border: '#C4EED6' },
};

const COMMUNITY_POSTS = [
  {
    id: '1',
    category: 'Post&Blogs',
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
    category: 'Post&Blogs',
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
    category: 'Jobs&Career',
    name: 'Apex Care Hospitals',
    time: 'Posted 4h ago',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    text: 'Hiring Registered Nurses & Telehealth Coordinators (Full-Time / Hybrid). Competitive salary, health benefits, and shift allowances.',
    emojis: '💼🩺',
    hashtags: ['#HealthcareJobs', '#HiringNow', '#Career'],
    images: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600',
    ],
    views: '3,412',
    likes: '150',
  },
  {
    id: '4',
    category: 'Jobs&Career',
    name: 'Dr. Robert Chen',
    time: 'Posted 1d ago',
    avatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    text: 'Clinical Research Associate & Medical Data Analyst openings available for early-career doctors and life-science graduates.',
    emojis: '📋🔬',
    hashtags: ['#MedicalCareers', '#ClinicalResearch'],
    images: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600',
    ],
    views: '4,120',
    likes: '310',
  },
  {
    id: '5',
    category: 'Event&News',
    name: 'Emily Watson',
    time: 'Posted 1d ago',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    text: 'Annual Community Wellness & Preventive Health Camp starts this Saturday at 8:00 AM. Free BP, sugar, and yoga sessions for all.',
    emojis: '📅🧘‍♀️',
    hashtags: ['#HealthCamp', '#CommunityEvent'],
    images: ['https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600'],
    views: '2,950',
    likes: '184',
  },
  {
    id: '6',
    category: 'Event&News',
    name: 'Dr. Priya Sharma',
    time: 'Posted 2d ago',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    text: 'National Digital Health Conclave highlights: New guidelines on child immunization tracking and rural telemedicine outreach.',
    emojis: '📰🏥',
    hashtags: ['#HealthNews', '#DigitalHealth'],
    images: [
      'https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=600',
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600',
    ],
    views: '5,012',
    likes: '420',
  },
  {
    id: '7',
    category: 'Donation&Appeal',
    name: 'Sarah Jenkins',
    time: 'Posted 3d ago',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    text: 'Urgent appeal for winter medical kits, blankets, and essential medicines for flood-affected families. Every contribution helps!',
    emojis: '❤️🙏',
    hashtags: ['#DonationAppeal', '#SupportLocal'],
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
    ],
    views: '3,100',
    likes: '230',
  },
  {
    id: '8',
    category: 'Donation&Appeal',
    name: 'Dr. Marcus Vance',
    time: 'Posted 4d ago',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    text: 'Blood & Platelet Donation Drive this Sunday. Donors receive a complete basic health checkup and nutrition pack.',
    emojis: '🩸💚',
    hashtags: ['#BloodDonation', '#SaveLives'],
    images: [
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600',
    ],
    views: '6,780',
    likes: '512',
  },
];

const CommunityPostCard = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const reduxUser = useSelector(
    state => state?.user?.user || state?.auth?.user,
  );

  // Check if WhatsApp verification is needed
  useEffect(() => {
    if (reduxUser?.isWatsappVerify === false && reduxUser?.pendingWhatsapp) {
      setShowVerificationBanner(true);
    }
  }, [reduxUser]);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'All') return COMMUNITY_POSTS;
    return COMMUNITY_POSTS.filter(item => item.category === activeTab);
  }, [activeTab]);

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

      const message = `[${post.category}] ${post.name}\n\n${post.text} ${
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

      {/* WhatsApp Verification Banner */}
      {showVerificationBanner && (
        <View style={styles.verificationBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <MaterialIcons name="whatsapp" size={20} color="#25D366" />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Verify WhatsApp</Text>
              <Text style={styles.bannerSubtitle}>
                Complete your WhatsApp verification 
              </Text>
            </View>
          </View>
          <View style={styles.bannerActions}>
            <TouchableOpacity
              onPress={() => navigation?.navigate('CreateProfile')}
              style={styles.bannerCheckButton}
            >
              <MaterialIcons name="check" size={18} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowVerificationBanner(false)}
              style={styles.bannerCloseButton}
            >
              <MaterialIcons name="close" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.body}>
        {/* Category Tabs */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.75}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                >
                  <Text
                    style={[styles.tabText, isActive && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredPosts.map(post => {
            const badgeTheme = BADGE_THEMES[post.category] || {
              bg: '#E8F5EC',
              text: colors.success,
              border: '#C7E6D2',
            };

            return (
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

                    {/* Category Badge */}
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor: badgeTheme.bg,
                          borderColor: badgeTheme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          { color: badgeTheme.text },
                        ]}
                      >
                        {post.category}
                      </Text>
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
                        <Ionicons
                          name="heart"
                          size={17}
                          color={colors.danger}
                        />

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
            );
          })}
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

  tabBarWrapper: {
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },

  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },

  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardColor,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  tabPillActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },

  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  tabTextActive: {
    color: colors.white,
  },

  scrollContent: {
    paddingBottom: 24,
    paddingTop: 10,
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
    gap: 8,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBorder,
  },

  userTextContainer: {
    marginLeft: 10,
    flex: 1,
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

  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },

  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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

  verificationBanner: {
    backgroundColor: '#E8F5EC',
    borderBottomWidth: 1,
    borderBottomColor: '#B8DEC8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 26,
    padding
  },

  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8DEC8',
  },

  bannerText: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006B3B',
    marginBottom: 2,
  },

  bannerSubtitle: {
    fontSize: 11,
    color: '#167A43',
    fontWeight: '500',
    lineHeight: 16,
  },

  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 10,
  },

  bannerCheckButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8DEC8',
  },

  bannerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});

export default CommunityPostCard;

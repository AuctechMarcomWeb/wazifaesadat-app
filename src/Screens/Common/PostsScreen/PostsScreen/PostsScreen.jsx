import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Share,
  Alert,
  TextInput,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';

import {
  Body,
  PillTabs,
  GreenButton,
  GrayButton,
} from '../../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import App from '../../../../../App';

// --------------------------------------------------
// TABS
// --------------------------------------------------

const TABS = ['Posts', 'Blogs', 'Jobs', 'Appeals'];

// --------------------------------------------------
// DUMMY POSTS DATA
// --------------------------------------------------

const POSTS_DATA = [
  {
    id: '1',
    author: 'Anjuman Secretariat',
    time: '2 hours ago',
    content:
      'Anjuman Head Office renovation work has been completed. Thank you for your continuous support. 🙏',

    authorImage: 'https://randomuser.me/api/portraits/men/32.jpg',

    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900',

    arabicTitle: 'انجمن الوظيف المقام الشمبريين',
    arabicSubtitle: 'ANJUMAN WAZIFA-E-SADAT WA MOMINEEN',

    likes: 124,
    comments: 18,
    shares: 42,

    fullDescription:
      'Our head office has undergone extensive renovation to serve our community better. The new facilities will host more programs and activities.',
  },

  {
    id: '2',
    author: 'Education Cell',
    time: '1 day ago',

    content:
      'Applications are now open for the Anjuman Scholarship Program (2026-27).',

    authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',

    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900',

    likes: 86,
    comments: 12,
    shares: 28,

    fullDescription:
      'We are pleased to announce the Anjuman Scholarship Program for deserving students. Applications are open until 30th November 2026. Visit our website for more details.',
  },

  {
    id: '3',
    author: 'Health Initiative',
    time: '3 days ago',

    content:
      'Free medical camp successfully completed in East Delhi. Over 500+ people benefited.',

    authorImage: 'https://randomuser.me/api/portraits/men/45.jpg',

    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900',

    likes: 156,
    comments: 34,
    shares: 67,

    fullDescription:
      'Our health initiative team conducted a successful medical camp covering general checkups, dental care, and health awareness sessions.',
  },
];

// --------------------------------------------------
// MAIN SCREEN
// --------------------------------------------------

const PostsScreen = ({ navigation, onTabChange }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [search, setSearch] = useState('');

  const [posts, setPosts] = useState(POSTS_DATA);

  const [selectedPost, setSelectedPost] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ------------------------------------------------
  // TAB CHANGE
  // ------------------------------------------------

  const handleTabChange = tab => {
    setActiveTab(tab);

    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // ------------------------------------------------
  // SEARCH
  // ------------------------------------------------

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return posts;

    return posts.filter(
      item =>
        item.author.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query),
    );
  }, [posts, search]);

  // ------------------------------------------------
  // OPEN POST DETAILS
  // ------------------------------------------------

  const handlePostPress = post => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  // ------------------------------------------------
  // LIKE POST
  // ------------------------------------------------

  const handleLike = post => {
    setPosts(prev =>
      prev.map(item =>
        item.id === post.id
          ? {
              ...item,
              liked: !item.liked,
              likes: item.likes + (item.liked ? -1 : 1),
            }
          : item,
      ),
    );

    setSelectedPost(prev => {
      if (!prev || prev.id !== post.id) return prev;

      return {
        ...prev,
        liked: !prev.liked,
        likes: prev.likes + (prev.liked ? -1 : 1),
      };
    });
  };

  // ------------------------------------------------
  // SHARE POST
  // ------------------------------------------------

  const handleShare = async post => {
    try {
      await Share.share({
        message: `${post.content}\n\n${post.author}\nhttps://anjuman.com`,
        title: post.author,
      });

      setPosts(prev =>
        prev.map(item =>
          item.id === post.id ? { ...item, shares: item.shares + 1 } : item,
        ),
      );
    } catch (error) {
      console.error('Share Error:', error);
    }
  };

  // ------------------------------------------------
  // COMMENT ACTION
  // ------------------------------------------------

  const handleComment = () => {
    Alert.alert(
      'Comments',
      'Comment functionality will be connected with the API.',
    );
  };

  // ------------------------------------------------
  // POST CARD
  // ------------------------------------------------

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => handlePostPress(item)}
    >
      {/* POST HEADER */}

      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.authorImage }}
          style={styles.avatarImage}
          resizeMode="cover"
        />

        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author}</Text>

          <Text style={styles.postTime}>{item.time}</Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            Alert.alert('Post Options', 'Post options will be connected later.')
          }
        >
          <Icon name="dots-horizontal" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ARABIC BANNER */}

      {item.arabicTitle && (
        <View style={styles.bannerBox}>
          <Text style={styles.arabicTitle}>{item.arabicTitle}</Text>

          <Text style={styles.arabicSubtitle}>{item.arabicSubtitle}</Text>
        </View>
      )}

      {/* POST DESCRIPTION */}

      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>

      {/* MAIN ONLINE IMAGE */}

      <Image
        source={{ uri: item.image }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* POST FOOTER */}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleLike(item)}
        >
          <Icon
            name={item.liked ? 'heart' : 'heart-outline'}
            size={20}
            color="#E53935"
          />

          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.actionBtn} onPress={handleComment}>
          <Icon name="comment-outline" size={19} color={colors.textSecondary} />

          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleShare(item)}
        >
          <Icon
            name="share-variant-outline"
            size={19}
            color={colors.textSecondary}
          />

          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ------------------------------------------------
  // SCREEN UI
  // ------------------------------------------------

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Anjuman Community"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {/* TABS */}

            <View style={styles.tabContainer}>
              <PillTabs
                tabs={TABS}
                active={activeTab}
                onChange={handleTabChange}
              />
            </View>

            {/* SEARCH */}

            <View style={styles.searchContainer}>
              <Icon name="magnify" size={21} color={colors.textSecondary} />

              <TextInput
                placeholder="Search posts..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />

              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close-circle" size={19} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* POSTS LIST */}

            <FlatList
              data={filteredPosts}
              keyExtractor={item => item.id}
              renderItem={renderPost}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="post-outline" size={42} color="#9CA3AF" />

                  <Text style={styles.emptyText}>No posts found</Text>
                </View>
              }
            />
          </Body>
        </View>

        {/* ----------------------------------------- */}
        {/* POST DETAILS MODAL */}
        {/* ----------------------------------------- */}

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <AppLayout>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={25} color={colors.white} />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>Post Details</Text>

                <TouchableOpacity
                  onPress={() => selectedPost && handleShare(selectedPost)}
                >
                  <Icon name="share-variant" size={23} color={colors.white} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedPost && (
                  <View>
                    {/* AUTHOR */}

                    <View style={styles.modalHeaderSection}>
                      <Image
                        source={{ uri: selectedPost.authorImage }}
                        style={styles.modalAvatarImage}
                      />

                      <View style={styles.modalAuthorInfo}>
                        <Text style={styles.modalAuthorName}>
                          {selectedPost.author}
                        </Text>

                        <Text style={styles.modalTime}>
                          {selectedPost.time}
                        </Text>
                      </View>
                    </View>

                    {/* ARABIC BANNER */}

                    {selectedPost.arabicTitle && (
                      <View style={styles.modalBannerBox}>
                        <Text style={styles.modalArabicTitle}>
                          {selectedPost.arabicTitle}
                        </Text>

                        <Text style={styles.modalArabicSubtitle}>
                          {selectedPost.arabicSubtitle}
                        </Text>
                      </View>
                    )}

                    {/* FULL ONLINE IMAGE */}

                    <Image
                      source={{ uri: selectedPost.image }}
                      style={styles.modalPostImage}
                      resizeMode="cover"
                    />

                    {/* DESCRIPTION */}

                    <View style={styles.modalContentBox}>
                      <Text style={styles.modalPostTitle}>
                        {selectedPost.content}
                      </Text>

                      <Text style={styles.modalPostDescription}>
                        {selectedPost.fullDescription}
                      </Text>
                    </View>

                    {/* ENGAGEMENT STATS */}

                    <View style={styles.engagementStats}>
                      <View style={styles.statItem}>
                        <Icon name="heart" size={20} color="#E53935" />

                        <View>
                          <Text style={styles.statLabel}>Likes</Text>

                          <Text style={styles.statValue}>
                            {selectedPost.likes}
                          </Text>
                        </View>
                      </View>

                      {/* <View style={styles.statItem}>
                        <Icon
                          name="comment"
                          size={20}
                          color={colors.textSecondary}
                        />

                        <View>
                          <Text style={styles.statLabel}>Comments</Text>

                          <Text style={styles.statValue}>
                            {selectedPost.comments}
                          </Text>
                        </View>
                      </View> */}

                      <View style={styles.statItem}>
                        <Icon
                          name="share-variant"
                          size={20}
                          color={colors.primary}
                        />

                        <View>
                          <Text style={styles.statLabel}>Shares</Text>

                          <Text style={styles.statValue}>
                            {selectedPost.shares}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ACTION BUTTONS */}

                    <View style={styles.actionButtons}>
                      <GreenButton
                        title={selectedPost.liked ? 'Liked' : 'Like Post'}
                        icon="heart-outline"
                        onPress={() => handleLike(selectedPost)}
                        style={{ flex: 1, marginRight: 8 }}
                      />

                      {/* <GreenButton
                        title="Comment"
                        icon="comment-outline"
                        onPress={handleComment}
                        style={{ flex: 1 }}
                      /> */}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* MODAL FOOTER */}

              <View style={styles.modalFooter}>
                <GrayButton
                  title="Close"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </AppLayout>
        </Modal>
      </View>
    </AppLayout>
  );
};

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  body: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },

  tabContainer: {
    paddingHorizontal: wp('4%'),
    marginTop: 12,
    marginBottom: 8,
  },

  // SEARCH

  searchContainer: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: wp('4%'),
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
  },

  // LIST

  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 25,
  },

  card: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 13,
    padding: 12,
    marginBottom: 13,
  },

  // AUTHOR

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarImage: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },

  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },

  authorName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  postTime: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 3,
  },

  // ARABIC BANNER

  bannerBox: {
    backgroundColor: '#FAF5ED',
    borderWidth: 1,
    borderColor: '#EFE3D0',
    borderRadius: 8,
    padding: 11,
    alignItems: 'center',
    marginBottom: 11,
  },

  arabicTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: '#9A3412',
    textAlign: 'center',
  },

  arabicSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
  },

  // POST CONTENT

  postContent: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    lineHeight: 21,
    marginBottom: 12,
  },

  // MAIN POST IMAGE

  postImage: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },

  // FOOTER

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: 10,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },

  actionText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },

  // EMPTY

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 10,
  },

  // MODAL

  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: wp('4%'),
    paddingVertical: 15,
  },

  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // MODAL AUTHOR

  modalHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },

  modalAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },

  modalAuthorInfo: {
    flex: 1,
    marginLeft: 12,
  },

  modalAuthorName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },

  modalTime: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 3,
  },

  // MODAL BANNER

  modalBannerBox: {
    backgroundColor: '#FAF5ED',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE3D0',
    paddingHorizontal: wp('4%'),
    paddingVertical: 13,
    alignItems: 'center',
  },

  modalArabicTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: '#9A3412',
    textAlign: 'center',
  },

  modalArabicSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
  },

  // MODAL IMAGE

  modalPostImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E5E7EB',
  },

  // MODAL DESCRIPTION

  modalContentBox: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },

  modalPostTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 9,
    lineHeight: 22,
  },

  modalPostDescription: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    lineHeight: 22,
  },

  // ENGAGEMENT

  engagementStats: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },

  statValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 2,
  },

  // ACTIONS

  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingVertical: 14,
    gap: 8,
  },

  // FOOTER

  modalFooter: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
});

export default PostsScreen;

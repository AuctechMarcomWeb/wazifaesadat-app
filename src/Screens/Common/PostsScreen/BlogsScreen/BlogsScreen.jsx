import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Share,
  SafeAreaView,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';

import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import { Body, PillTabs, GreenButton, GrayButton } from '../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const TABS = ['Posts', 'Blogs', 'Jobs', 'Appeals'];

const BLOGS_DATA = [
  {
    id: '1',
    title: 'The Role of Anjuman in Community Welfare',
    desc: 'A brief overview of Anjuman initiatives in education, health...',
    date: '20 Oct 2026',
    views: '1.2K',
    author: 'Dr. Ahmed Khan',
    category: 'Education',
    image: '📚',
    fullContent: 'Anjuman has been serving the community for over 50 years through various welfare initiatives. Our focus areas include education, healthcare, social welfare, and women empowerment. This article explores our comprehensive approach to community development.',
    likes: 234,
    comments: 45,
  },
  {
    id: '2',
    title: 'How Your Donations Create Impact',
    desc: 'Know how your contribution supports families, education...',
    date: '15 Oct 2026',
    views: '856',
    author: 'Fatima Begum',
    category: 'Donation',
    image: '❤️',
    fullContent: 'Every contribution, no matter how small, creates a meaningful impact in our community. Learn how your donations are utilized for various welfare programs and initiatives that change lives.',
    likes: 156,
    comments: 28,
  },
  {
    id: '3',
    title: 'Scholarship Program: Eligibility & Process',
    desc: 'Complete guide for students including eligibility, documents...',
    date: '10 Oct 2026',
    views: '2.1K',
    author: 'Prof. Rashid Ali',
    category: 'Scholarships',
    image: '🎓',
    fullContent: 'Our comprehensive scholarship program aims to support deserving students. This guide provides detailed information about eligibility criteria, application process, and required documents.',
    likes: 432,
    comments: 67,
  },
];

const BlogsScreen = ({ navigation, onTabChange }) => {
  const [activeTab, setActiveTab] = useState('Blogs');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTabChange = tab => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleBlogPress = blog => {
    setSelectedBlog(blog);
    setModalVisible(true);
  };

  const handleShare = async blog => {
    try {
      await Share.share({
        message: `${blog.title}\n${blog.desc}\n\nRead full article on Anjuman Community App`,
        title: blog.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderBlog = ({ item }) => (
    <TouchableOpacity
      style={styles.blogCard}
      activeOpacity={0.8}
      onPress={() => handleBlogPress(item)}
    >
      <View style={styles.blogHeader}>
        <View style={styles.blogImageBox}>
          <Text style={styles.blogImage}>{item.image}</Text>
        </View>
        <View style={styles.blogInfo}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.blogMeta}>
            <Icon name="calendar" size={12} color={colors.textSecondary} />
            <Text style={styles.blogDate}>{item.date}</Text>
            <Icon
              name="eye"
              size={12}
              color={colors.textSecondary}
              style={{ marginLeft: 8 }}
            />
            <Text style={styles.blogViews}>{item.views} views</Text>
          </View>
        </View>
      </View>
      <Text style={styles.blogDesc} numberOfLines={2}>{item.desc}</Text>
    </TouchableOpacity>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Anjuman Blogs"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <View style={styles.tabContainer}>
              <PillTabs
                tabs={TABS}
                active={activeTab}
                onChange={handleTabChange}
              />
            </View>

            <FlatList
              data={BLOGS_DATA}
              keyExtractor={item => item.id}
              renderItem={renderBlog}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </Body>
        </View>

        {/* Blog Detail Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <AppLayout style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Blog Article</Text>
              <TouchableOpacity onPress={() => handleShare(selectedBlog)}>
                <Icon name="share-variant" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedBlog && (
                <View>
                  {/* Blog Header */}
                  <View style={styles.blogHeaderModal}>
                    <View style={styles.blogImageBoxModal}>
                      <Text style={styles.largeImage}>{selectedBlog.image}</Text>
                    </View>
                    <View style={styles.categoryBadgeModal}>
                      <Text style={styles.categoryTextModal}>
                        {selectedBlog.category}
                      </Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.contentBox}>
                    <Text style={styles.blogTitleModal}>
                      {selectedBlog.title}
                    </Text>
                    <View style={styles.authorLine}>
                      <Icon
                        name="account-circle"
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={styles.authorName}>{selectedBlog.author}</Text>
                      <Text style={styles.blogDateModal}>
                        • {selectedBlog.date}
                      </Text>
                    </View>
                    <Text style={styles.blogContentModal}>
                      {selectedBlog.fullContent}
                    </Text>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsBox}>
                    <View style={styles.statItem}>
                      <Icon name="heart" size={18} color="#E53935" />
                      <Text style={styles.statValue}>{selectedBlog.likes}</Text>
                    </View>
                    {/* <View style={styles.statItem}>
                      <Icon name="comment" size={18} color={colors.primary} />
                      <Text style={styles.statValue}>
                        {selectedBlog.comments}
                      </Text>
                    </View> */}
                    <View style={styles.statItem}>
                      <Icon name="eye" size={18} color={colors.textSecondary} />
                      <Text style={styles.statValue}>{selectedBlog.views}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionButtons}>
                    <GreenButton
                      title="Like"
                      icon="heart-outline"
                      onPress={() => {}}
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    {/* <GreenButton
                      title="Comment"
                      icon="comment-outline"
                      onPress={() => {}}
                      style={{ flex: 1 }}
                    /> */}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <GrayButton
                title="Close"
                onPress={() => setModalVisible(false)}
              />
            </View>
          </AppLayout>
        </Modal>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  body: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  tabContainer: { paddingHorizontal: wp('4%'), marginTop: 12, marginBottom: 8 },
  listContent: { paddingHorizontal: wp('4%'), paddingBottom: 20 },
  blogCard: {
    backgroundColor: colors.cardColorLight,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  blogHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  blogImageBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  blogImage: { fontSize: 32 },
  blogInfo: { flex: 1 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  blogTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 4,
  },
  blogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blogDate: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  blogViews: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  blogDesc: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: wp('4%'),
    paddingVertical: 14,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 2,
  },
  blogHeaderModal: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.primaryLight,
  },
  blogImageBoxModal: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  largeImage: { fontSize: 48 },
  categoryBadgeModal: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryTextModal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
  contentBox: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  blogTitleModal: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 10,
    lineHeight: 24,
  },
  authorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorName: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    marginLeft: 6,
  },
  blogDateModal: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  blogContentModal: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: colors.TitleColor,
    lineHeight: 22,
  },
  statsBox: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    gap: 8,
  },
  modalFooter: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
});

export default BlogsScreen;

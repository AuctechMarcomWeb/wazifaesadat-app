import React, { useState, useCallback, useMemo } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';

import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';

import { Body } from '../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { useFocusEffect } from '@react-navigation/native';

// Dummy Notifications
const DUMMY_NOTIFICATIONS = [
  {
    _id: '1',
    title: 'Junior Scholarship Registration Open',
    message:
      'The registration for Junior scholarship has started. Last date to apply is 31 July 2026.',
    type: 'scholarship',
    icon: 'school',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    backgroundColor: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    _id: '2',
    title: 'Senior Scholarship Deadline Extended',
    message:
      'The deadline for Senior scholarship has been extended to 30 September 2026.',
    type: 'update',
    icon: 'bell-ring',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    backgroundColor: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    _id: '3',
    title: 'Application Submitted Successfully',
    message:
      'Your scholarship application has been submitted successfully. Reference ID: AWARD-2024-001.',
    type: 'success',
    icon: 'check-circle',
    read: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    backgroundColor: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    _id: '4',
    title: 'Graduate Scholarship Form Available',
    message:
      'Download the application form for Graduate scholarship from the portal.',
    type: 'info',
    icon: 'download',
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    backgroundColor: '#F0F9FF',
    iconColor: '#0369A1',
  },
  {
    _id: '5',
    title: 'Important: Update Your Profile',
    message:
      'Please update your profile information to avoid delays in scholarship processing.',
    type: 'warning',
    icon: 'alert-circle',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    backgroundColor: '#FEE2E2',
    iconColor: '#DC2626',
  },
  {
    _id: '6',
    title: 'Scholarship Payment Processed',
    message: 'Your scholarship amount has been credited to your account.',
    type: 'payment',
    icon: 'cash-check',
    read: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    backgroundColor: '#F3E8FF',
    iconColor: '#7C3AED',
  },
];

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Load notifications (simulated API call)
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setNotifications(DUMMY_NOTIFICATIONS);
    } catch (error) {
      console.log('Notification Error:', error?.message || error);

      Alert.alert('Error', error?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    } else if (filter === 'read') {
      return notifications.filter(n => n.read);
    }
    return notifications;
  }, [notifications, filter]);

  // Format time
  const formatTime = date => {
    if (!date) return 'N/A';

    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Mark as read
  const handleMarkAsRead = useCallback(notificationId => {
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === notificationId ? { ...notif, read: true } : notif,
      ),
    );
  }, []);

  // Delete notification
  const handleDelete = useCallback(notificationId => {
    Alert.alert('Delete', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          setNotifications(prev =>
            prev.filter(notif => notif._id !== notificationId),
          );
        },
        style: 'destructive',
      },
    ]);
  }, []);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  // Render notification card
  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleMarkAsRead(item._id)}
    >
      {/* Left Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: item.backgroundColor },
        ]}
      >
        <Icon name={item.icon} size={24} color={item.iconColor} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>

        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item._id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="close" size={18} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Count unread
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Notifications"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'all' && styles.filterTabActive,
                ]}
                onPress={() => setFilter('all')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === 'all' && styles.filterTabTextActive,
                  ]}
                >
                  All ({notifications.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'unread' && styles.filterTabActive,
                ]}
                onPress={() => setFilter('unread')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === 'unread' && styles.filterTabTextActive,
                  ]}
                >
                  Unread ({unreadCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'read' && styles.filterTabActive,
                ]}
                onPress={() => setFilter('read')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === 'read' && styles.filterTabTextActive,
                  ]}
                >
                  Read ({notifications.length - unreadCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mark All as Read Button */}
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={handleMarkAllAsRead}
              >
                <Icon name="check-all" size={16} color={colors.primary} />
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            )}

            {/* Notifications List */}
            {loading && notifications.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredNotifications}
                keyExtractor={item => String(item._id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={loadNotifications}
                    colors={[colors.primary]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="bell-outline"
                      size={50}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.emptyTitle}>No Notifications</Text>

                    <Text style={styles.emptySubtitle}>
                      {filter === 'unread'
                        ? "You're all caught up!"
                        : 'No notifications to display.'}
                    </Text>
                  </View>
                }
              />
            )}
          </Body>
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },

  body: {
    flex: 1,
    marginTop: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingTop: 16,
    marginTop: 23,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    gap: 8,
  },

  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  filterTabActive: {
    backgroundColor: colors.primary,
  },

  filterTabText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: colors.textSecondary,
  },

  filterTabTextActive: {
    color: colors.white,
  },

  // Mark All Button
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
    gap: 8,
  },

  markAllText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },

  // List Content
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingVertical: 12,
  },

  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'flex-start',
  },

  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  // Icon Container
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  // Content Container
  contentContainer: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  title: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    flex: 1,
  },

  unreadTitle: {
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },

  message: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },

  time: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#9B9B94',
  },

  // Delete Button
  deleteBtn: {
    paddingLeft: 10,
    paddingVertical: 5,
  },

  // Loading
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginTop: 16,
  },

  emptySubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default NotificationScreen;

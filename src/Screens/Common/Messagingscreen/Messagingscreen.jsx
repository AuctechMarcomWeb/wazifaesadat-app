import React, { useState, useMemo, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import BottomNav from '../../../components/BottomNav/BottomNav';
import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';

// Import API function for Messagingscreen
import { getMessagingAll } from '../../../api/communication';

// ---------------------------------------------------------------
// Tabs Configuration
// ---------------------------------------------------------------
const TABS = [
  { key: 'All', label: 'All', icon: 'format-list-bulleted', type: null },
  { key: 'Inbound', label: 'Inbound', icon: 'email-outline', type: 'received' },
  { key: 'Outbound', label: 'Outbound', icon: 'send-outline', type: 'sent' },
];

const MessagingScreen = ({ navigation }) => {
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10; // Load 10 items per page

  // Fetch messages on mount and when tab changes
  useEffect(() => {
    setPage(1);
    setMessages([]);
    setHasMore(true);
    fetchMessages(1);
  }, [tab]);

  const fetchMessages = async pageNum => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const tabConfig = TABS.find(t => t.key === tab);
      const messageType = tabConfig?.type; // null for 'All', 'received' for 'Inbound', 'sent' for 'Outbound'

      const response = await getMessagingAll(messageType, pageNum, pageSize);

      if (response.success) {
        if (pageNum === 1) {
          setMessages(response.messages);
        } else {
          setMessages(prev => [...prev, ...response.messages]);
        }

        // Check if there are more items
        setHasMore(response.messages.length >= pageSize);
        setPage(pageNum);
      } else {
        console.warn('Failed to fetch messages:', response.message);
        if (pageNum === 1) {
          setMessages([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (pageNum === 1) {
        setMessages([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setMessages([]);
    setHasMore(true);
    fetchMessages(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      fetchMessages(page + 1);
    }
  };

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();

    return messages.filter(m => {
      if (
        q &&
        !m.title.toLowerCase().includes(q) &&
        !m.preview.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [tab, search, messages]);

  const renderItem = ({ item }) => {
    const urgent = item.priority === 'Urgent';
    const isOutbound = item.type === 'outbound' || item.type === 'sent';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.row}
        onPress={() =>
          navigation &&
          navigation.navigate('MessageDetailsScreen', { message: item })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.title.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.preview && (
            <Text style={styles.rowPreview} numberOfLines={2}>
              {item.preview}
            </Text>
          )}
        </View>

        <View style={styles.rowMeta}>
          <Text style={styles.rowDate}>{item.date}</Text>

          <View
            style={[
              styles.badge,
              urgent ? styles.badgeUrgent : styles.badgeNormal,
            ]}
          >
            <Text style={[styles.badgeText, urgent && styles.badgeTextUrgent]}>
              {item.priority}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Messaging"
          onBack={() => navigation && navigation.goBack()}
          rightIcon="plus"
          rightVariant="solid"
          onRightPress={() =>
            navigation && navigation.navigate('ComposeMessage')
          }
        />

        <View style={styles.body}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <>
              {/* Tabs */}
              <View style={styles.tabs}>
                {TABS.map(t => {
                  const active = t.key === tab;

                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.tab, active && styles.tabActive]}
                      activeOpacity={0.85}
                      onPress={() => setTab(t.key)}
                    >
                      <Icon
                        name={t.icon}
                        size={20}
                        color={active ? colors.white : '#1F2937'}
                      />
                      <Text
                        style={[styles.tabText, active && styles.tabTextActive]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search */}
              <View style={styles.searchBox}>
                <Icon name="magnify" size={24} color="#4B5563" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search messages..."
                  placeholderTextColor={colors.placeHolderColor}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.countText}>
                {tab.toUpperCase()} — {data.length} MESSAGES
              </Text>

              <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                  />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListFooterComponent={
                  loadingMore && hasMore ? (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadMoreText}>
                        Loading more messages...
                      </Text>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Icon
                      name="message-off-outline"
                      size={46}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyText}>No messages found</Text>
                  </View>
                }
              />
            </>
          )}
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },

  loadingText: {
    marginTop: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: wp('4%'),
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E8EEEA',
    borderRadius: 14,
    marginTop: 5,
    padding: 4,
  },

  tab: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E8EEEA',
    borderRadius: 12,
    marginRight: 8,
  },

  tabActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },

  tabText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
    marginLeft: 6,
  },

  tabTextActive: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
  },

  // Search
  searchBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: wp('4%'),
    marginTop: 14,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: colors.SecondTitleColor,
    paddingVertical: 0,
  },

  countText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
    letterSpacing: 0.4,
    marginHorizontal: wp('4%'),
    marginTop: 16,
    marginBottom: 4,
  },

  // List
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: 24,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  separator: {
    height: 1,
    backgroundColor: '#EEF1EF',
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DDF1E4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },

  rowInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },

  rowTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },

  rowPreview: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  rowMeta: {
    alignItems: 'flex-end',
    minWidth: 72,
  },

  rowDate: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    marginBottom: 6,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 8,
  },

  badgeNormal: {
    backgroundColor: '#2E8B3E',
  },

  badgeUrgent: {
    backgroundColor: '#F4B93A',
  },

  badgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
  },

  badgeTextUrgent: {
    color: '#4A3200',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 50,
  },

  emptyText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 8,
  },

  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  loadMoreText: {
    marginLeft: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: colors.primary,
  },
});

export default MessagingScreen;

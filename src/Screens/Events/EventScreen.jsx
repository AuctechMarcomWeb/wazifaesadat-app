import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAllNewsEvents } from '../../api/AllTabsApi';
import colors from '../../themes/colors';
import BackHeader from '../../components/BackHeader/BackHeader';
import AppLayout from '../../components/AppLayout/AppLayout';
import { Body } from '../../components/Formparts';

const PAGE_LIMIT = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ----------------------------- helpers ----------------------------- */

const formatEventDateTime = (dateString, timeString) => {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  const formatted = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return timeString ? `${formatted}  ·  ${timeString}` : formatted;
};

const getCoverImage = item => {
  const candidates = [
    item.thumbnail,
    ...(Array.isArray(item.images) ? item.images : []),
  ];
  for (const c of candidates) {
    const uri = typeof c === 'string' ? c : c?.url || c?.secure_url;
    if (typeof uri === 'string' && uri.trim()) return uri.trim();
  }
  return null;
};

// getAllNewsEvents may return the array directly OR the whole
// { data: [...], total, page, totalPages } object - handle both.
const parseResult = (result, pageNum) => {
  const payload = result?.data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  const pg =
    payload && !Array.isArray(payload) && payload.totalPages != null
      ? payload
      : result?.pagination;

  const totalPages = Number(pg?.totalPages) || 0;
  const hasMore = totalPages
    ? pageNum < totalPages
    : list.length === PAGE_LIMIT;

  return { list, hasMore };
};

/* ------------------------------ event card ------------------------------ */

const EventCard = memo(({ item, onOpen }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const cover = getCoverImage(item);
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const place = [item.venue, item.city].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => onOpen(item)}
    >
      {!!cover && !imageFailed && (
        <Image
          source={{ uri: cover }}
          style={styles.cover}
          resizeMode="cover"
          onError={() => {
            console.warn('Event image failed to load:', cover);
            setImageFailed(true);
          }}
        />
      )}

      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={colors.primary || '#1B5E3F'}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {formatEventDateTime(item.eventDate, item.eventTime)}
          </Text>
        </View>

        {!!place && (
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={colors.primary || '#1B5E3F'}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {place}
            </Text>
          </View>
        )}

        {!!item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.slice(0, 3).map((tag, idx) => (
              <View key={`${tag}-${idx}`} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

/* ------------------------------- screen ------------------------------- */

const EventScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const onEndReachedCalledDuringMomentum = useRef(false);

  const fetchEvents = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await getAllNewsEvents({
        type: 'event',
        status: 'published',
        page: pageNum,
        limit: PAGE_LIMIT,
        sortBy: 'eventDate',
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to fetch events');
      }

      const { list, hasMore: more } = parseResult(result, pageNum);

      setEvents(prev => {
        if (pageNum === 1 || isRefresh) return list;
        const seen = new Set(prev.map(e => String(e._id)));
        return [...prev, ...list.filter(e => !seen.has(String(e._id)))];
      });

      setHasMore(more);
      setPage(pageNum);
      setError('');
    } catch (err) {
      const msg = err?.message || 'Failed to fetch events';
      console.error('Fetch Events Error:', msg);
      setError(msg);
      if (pageNum === 1 && !isRefresh) setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(1, false);
  }, [fetchEvents]);

  const handleRefresh = useCallback(() => {
    onEndReachedCalledDuringMomentum.current = false;
    fetchEvents(1, true);
  }, [fetchEvents]);

  const handleLoadMore = useCallback(() => {
    if (onEndReachedCalledDuringMomentum.current) return;
    if (
      !loadingMore &&
      !loading &&
      !refreshing &&
      hasMore &&
      events.length > 0
    ) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchEvents(page + 1, false);
    }
  }, [
    page,
    loadingMore,
    loading,
    refreshing,
    hasMore,
    events.length,
    fetchEvents,
  ]);

  const openEvent = useCallback(
    item => {
      navigation?.navigate('EventDetails', { eventId: item._id, event: item });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }) => <EventCard item={item} onOpen={openEvent} />,
    [openEvent],
  );

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading more events…</Text>
        </View>
      );
    }
    if (events.length > 0 && !hasMore) {
      return (
        <Text style={styles.endText}>You've reached the end of events</Text>
      );
    }
    return null;
  }, [loadingMore, events.length, hasMore]);

  const renderContent = () => {
    if (loading && events.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading events…</Text>
        </View>
      );
    }

    if (error && events.length === 0) {
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
        data={events}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item._id || `event-${index}`)}
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
                name="calendar-outline"
                size={34}
                color={colors.placeHolderColor || '#9CA3AF'}
              />
            </View>
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptyMessage}>
              Check back later for upcoming events.
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Events" />
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
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },

  cover: {
    width: SCREEN_WIDTH,
    height: Math.round((SCREEN_WIDTH * 9) / 16),
    backgroundColor: '#F3F4F6',
  },

  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    color: colors.textDark || '#111827',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary || '#4B5563',
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    color: colors.textDark || '#262626',
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },

  tagBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary || '#1B5E3F',
  },

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
    fontWeight: '500',
    marginTop: 8,
    color: colors.textSecondary || '#6B7280',
  },

  endText: {
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
    marginTop: 14,
    color: colors.textDark || '#111827',
  },

  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    color: colors.textSecondary || '#6B7280',
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
    marginTop: 12,
    color: colors.textDark || '#111827',
  },

  emptyMessage: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    color: colors.textSecondary || '#6B7280',
  },
});

export default EventScreen;

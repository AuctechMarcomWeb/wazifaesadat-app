import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Share,
  Linking,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getNewsEventById } from '../../api/AllTabsApi';
import colors from '../../themes/colors';
import BackHeader from '../../components/BackHeader/BackHeader';
import AppLayout from '../../components/AppLayout/AppLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ----------------------------- helpers ----------------------------- */

const formatEventDateTime = (dateString, timeString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const formatted = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return timeString ? `${formatted}, ${timeString}` : formatted;
};

// thumbnail first, then gallery images, no duplicates
const getEventImages = item => {
  if (!item) return [];
  const seen = new Set();
  const uris = [];

  [item.thumbnail, ...(Array.isArray(item.images) ? item.images : [])].forEach(
    entry => {
      const uri =
        typeof entry === 'string' ? entry : entry?.url || entry?.secure_url;
      if (typeof uri === 'string' && uri.trim() && !seen.has(uri.trim())) {
        seen.add(uri.trim());
        uris.push(uri.trim());
      }
    },
  );

  return uris;
};

const InfoRow = ({ icon, label, children }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={18} color={colors.primary || '#1B5E3F'} />
    </View>
    <View style={styles.infoBody}>
      <Text style={styles.infoLabel}>{label}</Text>
      {children}
    </View>
  </View>
);

/* ------------------------------- screen ------------------------------- */

const EventDetails = ({ route, navigation }) => {
  const { eventId, event: initialEvent } = route.params || {};
  const [event, setEvent] = useState(initialEvent || null);
  const [loading, setLoading] = useState(!initialEvent);
  const [error, setError] = useState('');
  const [carouselWidth, setCarouselWidth] = useState(SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState({});

  // Show the card data instantly, then refresh with the full details
  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      try {
        const result = await getNewsEventById(eventId);
        if (cancelled) return;

        if (!result?.success) {
          throw new Error(result?.message || 'Failed to load event');
        }

        setEvent(result.data);
        setError('');
      } catch (err) {
        if (cancelled) return;
        console.error('Fetch Event Details Error:', err.message);
        if (!initialEvent) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (eventId) fetchDetails();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [eventId, initialEvent]);

  const handleShare = async () => {
    if (!event) return;
    try {
      const when = formatEventDateTime(event.eventDate, event.eventTime);
      const where = [event.venue, event.city].filter(Boolean).join(', ');

      await Share.share({
        message: [
          event.title,
          event.description,
          when && `Date: ${when}`,
          where && `Venue: ${where}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        title: event.title || 'Event',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleRegistration = () => {
    if (!event?.registrationLink) return;
    Linking.openURL(event.registrationLink).catch(err =>
      console.error('URL open error:', err),
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={styles.errorTitle}>Error Loading Event</Text>
        <Text style={styles.errorMessage}>{error || 'Event not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getEventImages(event).filter(uri => !failed[uri]);
  const tags = Array.isArray(event.tags) ? event.tags : [];
  const startText = formatEventDateTime(event.eventDate, event.eventTime);
  const endText = formatEventDateTime(event.eventEndDate, event.eventEndTime);
  const placeLine = [event.venueAddress, event.city].filter(Boolean).join(', ');

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader navigation={navigation} title="Event Details" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {images.length > 0 && (
            <View
              onLayout={e =>
                setCarouselWidth(Math.round(e.nativeEvent.layout.width))
              }
            >
              <FlatList
                data={images}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(uri, idx) => `${uri}-${idx}`}
                getItemLayout={(_, index) => ({
                  length: carouselWidth,
                  offset: carouselWidth * index,
                  index,
                })}
                onMomentumScrollEnd={e =>
                  setActiveIndex(
                    Math.round(e.nativeEvent.contentOffset.x / carouselWidth),
                  )
                }
                renderItem={({ item: uri }) => (
                  <Image
                    source={{ uri }}
                    style={{
                      width: carouselWidth,
                      height: Math.round((carouselWidth * 9) / 16),
                      backgroundColor: '#F3F4F6',
                    }}
                    resizeMode="cover"
                    onError={() => {
                      console.warn('Event image failed to load:', uri);
                      setFailed(prev => ({ ...prev, [uri]: true }));
                    }}
                  />
                )}
              />

              {images.length > 1 && (
                <View style={styles.dotsRow}>
                  {images.map((uri, i) => (
                    <View
                      key={`${uri}-dot-${i}`}
                      style={[
                        styles.dot,
                        i === activeIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{event.title}</Text>

            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleShare}
            >
              <Ionicons
                name="paper-plane-outline"
                size={26}
                color={colors.textDark || '#111827'}
              />
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <InfoRow icon="calendar-outline" label="When">
                <Text style={styles.infoValue}>{startText || 'Date TBD'}</Text>
                {!!endText && <Text style={styles.infoSub}>to {endText}</Text>}
              </InfoRow>

              {!!event.venue && (
                <InfoRow icon="location-outline" label="Venue">
                  <Text style={styles.infoValue}>{event.venue}</Text>
                  {!!placeLine && (
                    <Text style={styles.infoSub}>{placeLine}</Text>
                  )}
                </InfoRow>
              )}

              {!!event.organizer && (
                <InfoRow icon="person-outline" label="Organized by">
                  <Text style={styles.infoValue}>{event.organizer}</Text>
                </InfoRow>
              )}

              {!!event.maxAttendees && (
                <InfoRow icon="people-outline" label="Capacity">
                  <Text style={styles.infoValue}>
                    {event.maxAttendees} attendees
                  </Text>
                </InfoRow>
              )}
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, idx) => (
                  <View key={`${tag}-${idx}`} style={styles.tagBadge}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!event.description && (
              <Text style={styles.description}>{event.description}</Text>
            )}

            {/* {!!event.registrationLink && (
              <TouchableOpacity
                style={styles.registerButton}
                activeOpacity={0.85}
                onPress={handleRegistration}
              >
                <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
                <Text style={styles.registerButtonText}>Register Now</Text>
              </TouchableOpacity>
            )} */}

            {!!event.createdBy?.name && (
              <Text style={styles.publishedBy}>
                Published by {event.createdBy.name}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </AppLayout>
  );
};

/* -------------------------------- styles -------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F6F3' },

  scrollView: { flex: 1, backgroundColor: colors.white },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight || colors.white,
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

  dotActive: { backgroundColor: '#0095F6' },

  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 30,
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 29,
    color: colors.textDark || '#111827',
  },

  shareBtn: {
    alignSelf: 'flex-start',
    marginTop: 14,
  },

  /* info card */
  infoCard: {
    marginTop: 16,
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5EBE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },

  infoIcon: {
    width: 30,
    paddingTop: 1,
  },

  infoBody: { flex: 1 },

  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textSecondary || '#6B7280',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    color: colors.textDark || '#111827',
  },

  infoSub: {
    fontSize: 13,
    marginTop: 2,
    color: colors.textSecondary || '#6B7280',
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },

  tagBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary || '#1B5E3F',
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
    color: colors.textDark || '#333333',
  },

  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    paddingVertical: 13,
    backgroundColor: colors.primary || '#1B5E3F',
    borderRadius: 10,
  },

  registerButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  publishedBy: {
    fontSize: 12,
    marginTop: 18,
    color: colors.textSecondary || '#6B7280',
  },

  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    color: colors.textSecondary || '#6B7280',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    color: colors.textDark || '#111827',
  },

  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 20,
    color: colors.textSecondary || '#6B7280',
  },

  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },

  backButtonText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});

export default EventDetails;

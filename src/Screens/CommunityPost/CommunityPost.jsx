import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Linking,
  useWindowDimensions,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';

import colors from '../../themes/colors';
import typography from '../../themes/typography';

import CommunityPostHeader from '../../components/CommunityPostHeader/CommunityPostHeader';
import BottomNav from '../../components/BottomNav/BottomNav';

import {
  getAllPosts,
  likePost,
  sharePost,
  getAllBlogs,
  likeBlog,
  shareBlog,
  getAllAppeals,
  getAllNewsEvents,
} from '../../api/AllTabsApi';

import { getPersonalizedJobs } from '../../api/JobsApi';

const PAGE_LIMIT = 10;
const CARD_MAX_WIDTH = 450;
const WRAPPER_PADDING = 16;
const CARD_PADDING = 16;
const CARD_BORDER = 1;
const DESCRIPTION_LINES = 4;

const TABS = [
  { key: 'All', label: 'All' },
  { key: 'Post&Blogs', label: 'Post & Blogs' },
  { key: 'News&Events', label: 'News & Events' },
  { key: 'Jobs&Career', label: 'Jobs & Career' },
  { key: 'Donation&Appeal', label: 'Donation & Appeal' },
];

const TYPE_META = {
  post: { label: 'Post', color: '#1D5FD6' },
  blog: { label: 'Blog', color: '#6338D9' },
  job: { label: 'Job', color: '#B86500' },
  appeal: { label: 'Appeal', color: '#167A43' },
  news: { label: 'News', color: '#C2185B' },
  event: { label: 'Event', color: '#0E7C86' },
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const getId = item => item?._id || item?.id;

// Works for: data = [] | data = { [key]: [] }
const getArray = (response, key) => {
  if (!response?.success) return [];

  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];

  return [];
};

const toUri = image => {
  if (typeof image === 'string') return image;

  return image?.url || image?.uri || image?.image || image?.secure_url || null;
};

const toList = value => {
  if (!value) return [];

  return (Array.isArray(value) ? value : [value]).map(toUri).filter(Boolean);
};

// NOTE: blogs come with `images: []` (empty) and real pictures in `imgs`,
// so every image field is merged instead of using the first truthy one.
const getImages = (item, type) => {
  const gallery = [
    ...toList(item?.images),
    ...toList(item?.imgs),
    ...toList(item?.image),
  ];

  const cover = [...toList(item?.coverImage), ...toList(item?.thumbnail)];

  let list;

  if (type === 'news' || type === 'event') {
    // thumbnail is a separate cover picture for news/events
    list = [...cover.slice(0, 1), ...gallery];
  } else {
    // for blogs thumbnail == first image, so only use it as a fallback
    list = gallery.length ? gallery : cover;
  }

  return Array.from(new Set(list));
};

const getDescription = item =>
  item?.description ||
  item?.discription ||
  item?.content ||
  item?.text ||
  item?.summary ||
  '';

const getUserName = item =>
  item?.createdBy?.name ||
  item?.author?.name ||
  (typeof item?.author === 'string' ? item.author : '') ||
  item?.user?.name ||
  item?.postedBy?.name ||
  item?.name ||
  item?.companyName ||
  'Community Member';

const getAvatar = item =>
  item?.createdBy?.profileImage ||
  item?.createdBy?.avatar ||
  item?.author?.profileImage ||
  item?.user?.profileImage ||
  item?.avatar ||
  null;

const formatDate = value => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatMoney = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const openLink = url => {
  if (!url) return;

  Linking.openURL(url).catch(err =>
    console.log('Open link error:', err?.message),
  );
};

/* ---------------------------- HTML (editor) text --------------------------- */
// Blogs / Jobs descriptions come from a rich-text editor (<p>, <strong>, <ul>…)
// This lightweight parser renders them with the same formatting, no extra package.

const HTML_REGEX = /<\/?[a-z][^>]*>/i;

const ENTITIES = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  bull: '•',
  copy: '©',
};

const decodeEntities = str =>
  String(str).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const num =
        code[1].toLowerCase() === 'x'
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);

      return Number.isNaN(num) ? match : String.fromCodePoint(num);
    }

    const value = ENTITIES[code.toLowerCase()];

    return value === undefined ? match : value;
  });

// Plain text version (used for sharing)
const stripHtml = html =>
  decodeEntities(
    String(html || '')
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const HEADING_SIZES = { h1: 20, h2: 18, h3: 17, h4: 16, h5: 16, h6: 16 };

const parseHtml = html => {
  const tokens =
    String(html || '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .match(/<[^>]+>|[^<]+/g) || [];

  const out = [];
  const links = [];
  const lists = [];
  const st = { bold: 0, italic: 0, underline: 0, strike: 0, size: 0 };

  let nl = 99; // trailing newlines (99 = start of content)
  let skip = 0;

  const ensure = n => {
    while (nl < n) {
      out.push({ text: '\n' });
      nl += 1;
    }
  };

  const pushText = raw => {
    let text = decodeEntities(raw).replace(/\s+/g, ' ');

    if (nl > 0) text = text.replace(/^\s+/, '');
    if (!text) return;

    out.push({
      text,
      bold: st.bold > 0,
      italic: st.italic > 0,
      underline: st.underline > 0,
      strike: st.strike > 0,
      size: st.size || 0,
      href: links.length ? links[links.length - 1] : null,
    });

    nl = 0;
  };

  tokens.forEach(token => {
    if (token[0] !== '<') {
      if (skip <= 0) pushText(token);
      return;
    }

    const match = token.match(/^<\s*(\/)?\s*([a-z0-9]+)/i);

    if (!match) return;

    const closing = !!match[1];
    const tag = match[2].toLowerCase();
    const step = closing ? -1 : 1;

    if (tag === 'script' || tag === 'style') {
      skip = Math.max(0, skip + step);
      return;
    }

    if (skip > 0) return;

    switch (tag) {
      case 'br':
        if (out.length && nl < 3) {
          out.push({ text: '\n' });
          nl = nl === 99 ? 1 : nl + 1;
        }
        break;

      case 'strong':
      case 'b':
        st.bold = Math.max(0, st.bold + step);
        break;

      case 'em':
      case 'i':
        st.italic = Math.max(0, st.italic + step);
        break;

      case 'u':
        st.underline = Math.max(0, st.underline + step);
        break;

      case 's':
      case 'strike':
      case 'del':
        st.strike = Math.max(0, st.strike + step);
        break;

      case 'a':
        if (closing) {
          links.pop();
        } else {
          const href = token.match(/href\s*=\s*["']([^"']*)["']/i);
          links.push(href ? decodeEntities(href[1]) : null);
        }
        break;

      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (closing) {
          st.bold = Math.max(0, st.bold - 1);
          st.size = 0;
          ensure(2);
        } else {
          ensure(1);
          st.bold += 1;
          st.size = HEADING_SIZES[tag];
        }
        break;

      case 'p':
        ensure(closing ? 2 : 1);
        break;

      case 'div':
      case 'blockquote':
        ensure(1);
        break;

      case 'ul':
      case 'ol':
        if (closing) {
          lists.pop();
          ensure(lists.length ? 1 : 2);
        } else {
          ensure(1);
          lists.push({ ordered: tag === 'ol', count: 0 });
        }
        break;

      case 'li':
        if (closing) {
          ensure(1);
        } else {
          ensure(1);

          const list = lists[lists.length - 1];
          const indent = '    '.repeat(Math.max(0, lists.length - 1));

          if (list) list.count += 1;

          out.push({
            text: `${indent}${list?.ordered ? `${list.count}. ` : '•  '}`,
            bold: list?.ordered,
          });

          nl = 0;
        }
        break;

      default:
        break;
    }
  });

  // trim trailing line breaks / spaces
  while (out.length && out[out.length - 1].text === '\n') out.pop();

  if (out.length) {
    const last = out[out.length - 1];
    last.text = last.text.replace(/\s+$/, '');
  }

  return out;
};

const RichText = ({ html, style, ...rest }) => {
  const segments = useMemo(() => parseHtml(html), [html]);

  return (
    <Text style={style} {...rest}>
      {segments.map((seg, index) => {
        const decorations = [
          seg.underline || seg.href ? 'underline' : '',
          seg.strike ? 'line-through' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Text
            key={`seg-${index}`}
            onPress={seg.href ? () => openLink(seg.href) : undefined}
            style={[
              seg.bold && styles.richBold,
              seg.italic && styles.richItalic,
              !!decorations && { textDecorationLine: decorations },
              !!seg.href && styles.richLink,
              !!seg.size && { fontSize: seg.size, color: colors.textPrimary },
            ]}
          >
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
};

// Plain text or editor HTML — picks automatically
const Body = ({ text, isHtml, style, ...rest }) =>
  isHtml ? (
    <RichText html={text} style={style} {...rest} />
  ) : (
    <Text style={style} {...rest}>
      {text}
    </Text>
  );

const normalizeItem = (item, type) => {
  const category =
    type === 'post' || type === 'blog'
      ? 'Post&Blogs'
      : type === 'job'
      ? 'Jobs&Career'
      : type === 'appeal'
      ? 'Donation&Appeal'
      : 'News&Events';

  return {
    ...item,
    id: getId(item),
    type,
    category,
    title: item?.title || '',
    name: getUserName(item),
    avatar: getAvatar(item),
    text: getDescription(item),
    images: getImages(item, type),
    likes: item?.likes ?? item?.likeCount ?? 0,
    date: formatDate(item?.date || item?.createdAt),
    tags: Array.isArray(item?.tags) ? item.tags : [],
  };
};

/* -------------------------------------------------------------------------- */
/*                              Small components                              */
/* -------------------------------------------------------------------------- */

// Description with "Read more / Show less"
const ExpandableText = ({ text, lines = DESCRIPTION_LINES, style }) => {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  if (!text) return null;

  const isHtml = HTML_REGEX.test(text);

  return (
    <View style={styles.expandableWrap}>
      <Body
        text={text}
        isHtml={isHtml}
        style={style}
        numberOfLines={expanded ? undefined : lines}
      />

      {/* Invisible copy used only to measure the full line count */}
      <View
        style={styles.measureWrap}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Body
          text={text}
          isHtml={isHtml}
          style={style}
          onTextLayout={e => setCanExpand(e.nativeEvent.lines.length > lines)}
        />
      </View>

      {canExpand && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded(prev => !prev)}
          style={styles.readMoreButton}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.readMoreText}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.success}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Swipeable horizontal image gallery with counter + dots
const ImageCarousel = ({ images, width }) => {
  const [index, setIndex] = useState(0);

  if (!images?.length) return null;

  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0] }}
        style={[styles.singleImage, { width }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.carouselWrap, { width }]}>
      <ScrollView
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onMomentumScrollEnd={e =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {images.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={[styles.carouselImage, { width }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <View style={styles.counterBadge}>
        <Ionicons name="images-outline" size={12} color="#FFFFFF" />
        <Text style={styles.counterText}>
          {index + 1}/{images.length}
        </Text>
      </View>

      <View style={styles.dotsRow} pointerEvents="none">
        {images.map((_, i) => (
          <View
            key={`dot-${i}`}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
};

const InfoRow = ({ icon, text }) => {
  if (!text) return null;

  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.success} />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Feed card                                 */
/* -------------------------------------------------------------------------- */

const FeedCard = memo(
  ({ item, mediaWidth, userId, isLikeLoading, onOpen, onLike, onShare }) => {
    const meta = TYPE_META[item.type] || TYPE_META.post;
    const canLike = item.type === 'post' || item.type === 'blog';
    const liked =
      !!userId && Array.isArray(item.likedBy) && item.likedBy.includes(userId);

    // Appeal helpers
    const raised = Number(item.raisedAmount || 0);
    const target = Number(item.targetAmount || 0);
    const progress = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
    const goalReached = target > 0 && raised >= target;
    const appealClosed = item.status === 'closed';

    // Event helpers
    const startDate = formatDate(item.eventDate);
    const endDate = formatDate(item.eventEndDate);
    const dateRange =
      endDate && endDate !== startDate
        ? `${startDate} – ${endDate}`
        : startDate;
    const timeRange = item.eventTime
      ? `${item.eventTime}${item.eventEndTime ? ` – ${item.eventEndTime}` : ''}`
      : '';
    const place = [item.venue, item.city].filter(Boolean).join(', ');

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={21}
                    color={colors.textSecondary}
                  />
                </View>
              )}

              <View style={styles.userTextContainer}>
                <Text
                  style={[typography.heading, styles.userName]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <Text style={styles.postTime}>{item.date || 'Community'}</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              {!!item.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={12} color="#B86500" />
                </View>
              )}

              <View
                style={[
                  styles.typeIndicator,
                  { backgroundColor: `${meta.color}15` },
                ]}
              >
                <Text style={[styles.typeIndicatorText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Title */}
          {!!item.title && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => onOpen(item)}>
              <Text style={styles.postTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}

          {/* Description (expandable) */}
          <ExpandableText text={item.text} style={styles.postText} />

          {/* Tags */}
          {!!item.tags?.length && (
            <View style={styles.hashtagRow}>
              {item.tags.map((tag, index) => (
                <View key={`${item.id}-tag-${index}`} style={styles.tagChip}>
                  <Text style={styles.hashtag}>
                    #{String(tag).replace(/^#/, '')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Images - horizontal swipe */}
          <ImageCarousel images={item.images} width={mediaWidth} />

          {/* Job details */}
          {item.type === 'job' && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onOpen(item)}
              style={styles.extraInfo}
            >
              <InfoRow icon="business-outline" text={item.companyName} />
              <InfoRow icon="location-outline" text={item.location} />
              <InfoRow icon="briefcase-outline" text={item.jobType} />
              <InfoRow icon="laptop-outline" text={item.workMode} />
            </TouchableOpacity>
          )}

          {/* Event details */}
          {item.type === 'event' && (
            <View style={styles.extraInfo}>
              <InfoRow icon="calendar-outline" text={dateRange} />
              <InfoRow icon="time-outline" text={timeRange} />
              <InfoRow icon="location-outline" text={place} />
              <InfoRow
                icon="people-outline"
                text={item.organizer ? `Organizer: ${item.organizer}` : ''}
              />
              <InfoRow
                icon="ticket-outline"
                text={
                  item.maxAttendees ? `Max attendees: ${item.maxAttendees}` : ''
                }
              />

              {!!item.registrationLink && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.primaryButton}
                  onPress={() => openLink(item.registrationLink)}
                >
                  <Text style={styles.primaryButtonText}>Register Now</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* News source */}
          {item.type === 'news' && !!item.source && (
            <View style={styles.extraInfo}>
              <InfoRow
                icon="newspaper-outline"
                text={`Source: ${item.source}`}
              />

              {!!item.sourceUrl && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.primaryButton}
                  onPress={() => openLink(item.sourceUrl)}
                >
                  <Text style={styles.primaryButtonText}>Read Source</Text>
                  <Ionicons name="open-outline" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Appeal details */}
          {item.type === 'appeal' && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onOpen(item)}
              style={styles.appealInfo}
            >
              <View style={styles.appealTopRow}>
                <View
                  style={[
                    styles.statusChip,
                    appealClosed ? styles.statusClosed : styles.statusActive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: appealClosed ? '#B42318' : '#167A43' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: appealClosed ? '#B42318' : '#167A43' },
                    ]}
                  >
                    {appealClosed ? 'Closed' : 'Active'}
                  </Text>
                </View>

                {!!item.deadline && (
                  <Text style={styles.deadlineText}>
                    {appealClosed ? 'Ended' : 'Ends'}{' '}
                    {formatDate(item.deadline)}
                  </Text>
                )}
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountText}>{formatMoney(raised)}</Text>
                <Text style={styles.amountLabel}> raised</Text>
              </View>

              {target > 0 && (
                <>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: goalReached ? '#167A43' : '#2E9E5B',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.progressMeta}>
                    <Text style={styles.targetText}>
                      Goal {formatMoney(target)}
                    </Text>

                    <Text style={styles.progressPercent}>
                      {goalReached
                        ? 'Goal reached 🎉'
                        : `${Math.round(progress)}%`}
                    </Text>
                  </View>
                </>
              )}

              {Number(item.remainingAmount) > 0 && (
                <Text style={styles.remainingText}>
                  {formatMoney(item.remainingAmount)} still needed
                </Text>
              )}

              {Number(item.donorCount) > 0 && (
                <Text style={styles.remainingText}>
                  {item.donorCount} donors
                </Text>
              )}

              <View style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>View Appeal</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

          {/* Footer */}
          <View style={styles.postFooter}>
            <View style={styles.footerLeft}>
              {canLike ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onLike(item)}
                  disabled={isLikeLoading}
                  activeOpacity={0.7}
                >
                  {isLikeLoading ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={21}
                      color={colors.danger}
                    />
                  )}

                  <Text style={styles.actionText}>{item.likes}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onOpen(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailsText}>View details</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={colors.success}
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.shareButton}
              onPress={() => onShare(item)}
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
  },
);

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

const CommunityPostCard = ({ navigation }) => {
  const { width: screenWidth } = useWindowDimensions();

  // card width -> inner media width (wrapper padding, card border + padding)
  const cardWidth = Math.min(screenWidth - WRAPPER_PADDING * 2, CARD_MAX_WIDTH);
  const mediaWidth = cardWidth - (CARD_PADDING + CARD_BORDER) * 2;

  const [activeTab, setActiveTab] = useState('All');

  const [posts, setPosts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [newsEvents, setNewsEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const reduxUser = useSelector(
    state => state?.user?.user || state?.auth?.user,
  );

  const userId = reduxUser?._id || reduxUser?.id;

  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  useEffect(() => {
    if (reduxUser?.isWatsappVerify === false && reduxUser?.pendingWhatsapp) {
      setShowVerificationBanner(true);
    }
  }, [reduxUser]);

  // Fetch News & Events  (response.data = { data: [...] })
  const fetchNewsEvents = async () => {
    try {
      const response = await getAllNewsEvents({
        page: 1,
        limit: PAGE_LIMIT,
        isPagination: true,
        sortBy: 'latest',
        status: 'published',
      });

      if (!response?.success) {
        throw new Error(response?.message || 'News & Events fetch failed');
      }

      setNewsEvents(
        getArray(response, 'data').map(item =>
          normalizeItem(item, item?.type === 'event' ? 'event' : 'news'),
        ),
      );
    } catch (err) {
      console.log('News & Events API Error:', err?.message);
      setNewsEvents([]);
    }
  };

  // Fetch Posts
  const fetchPosts = async () => {
    try {
      const response = await getAllPosts({
        page: 1,
        limit: PAGE_LIMIT,
        isPagination: true,
        sortBy: 'latest',
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Posts fetch failed');
      }

      setPosts(
        getArray(response, 'posts').map(item => normalizeItem(item, 'post')),
      );
    } catch (err) {
      console.log('Posts API Error:', err?.message);
      setPosts([]);
    }
  };

  // Fetch Blogs
  const fetchBlogs = async () => {
    try {
      const response = await getAllBlogs({
        page: 1,
        limit: PAGE_LIMIT,
        isPagination: true,
        sortBy: 'latest',
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Blogs fetch failed');
      }

      setBlogs(
        getArray(response, 'blogs').map(item => normalizeItem(item, 'blog')),
      );
    } catch (err) {
      console.log('Blogs API Error:', err?.message);
      setBlogs([]);
    }
  };

  // Fetch Personalized Jobs
  const fetchJobs = async () => {
    try {
      const response = await getPersonalizedJobs({
        page: 1,
        limit: PAGE_LIMIT,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Jobs fetch failed');
      }

      setJobs(
        getArray(response, 'jobs').map(item => normalizeItem(item, 'job')),
      );
    } catch (err) {
      console.log('Jobs API Error:', err?.message);
      setJobs([]);
    }
  };

  // Fetch Appeals
  const fetchAppeals = async () => {
    try {
      const response = await getAllAppeals({
        page: 1,
        limit: PAGE_LIMIT,
        isPagination: true,
        sortBy: 'latest',
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Appeals fetch failed');
      }

      setAppeals(
        getArray(response, 'appeals').map(item =>
          normalizeItem(item, 'appeal'),
        ),
      );
    } catch (err) {
      console.log('Appeals API Error:', err?.message);
      setAppeals([]);
    }
  };

  // Fetch All APIs
  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      await Promise.all([
        fetchPosts(),
        fetchBlogs(),
        fetchJobs(),
        fetchAppeals(),
        fetchNewsEvents(),
      ]);
    } catch (err) {
      console.log('Community Feed Error:', err);
      setError('Unable to load community feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Combine all data (newest first)
  const allItems = useMemo(() => {
    return [...posts, ...blogs, ...jobs, ...appeals, ...newsEvents].sort(
      (a, b) =>
        new Date(b?.createdAt || 0).getTime() -
        new Date(a?.createdAt || 0).getTime(),
    );
  }, [posts, blogs, jobs, appeals, newsEvents]);

  // Tab filtering
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'Post&Blogs':
        return [...posts, ...blogs].sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime(),
        );

      case 'Jobs&Career':
        return jobs;

      case 'Donation&Appeal':
        return appeals;

      case 'News&Events':
        return newsEvents;

      default:
        return allItems;
    }
  }, [activeTab, allItems, posts, blogs, jobs, appeals, newsEvents]);

  // Share API + Native Share
  const handleShare = useCallback(async item => {
    if (!item?.id) return;

    try {
      const message = [item?.title, stripHtml(item?.text), item?.images?.[0]]
        .filter(Boolean)
        .join('\n\n');

      const result = await Share.share({
        message: message || 'Check this out!',
        title: item?.title || 'Share Community Content',
      });

      if (result?.action !== Share.sharedAction) return;

      if (item.type === 'post') {
        const response = await sharePost(item.id);

        if (!response?.success) {
          console.log('Post Share API:', response?.message);
        }
      }

      if (item.type === 'blog') {
        const response = await shareBlog(item.id);

        if (!response?.success) {
          console.log('Blog Share API:', response?.message);
        }
      }
    } catch (err) {
      console.log('Share Error:', err?.message);
    }
  }, []);

  // Like API
  const handleLike = useCallback(
    async item => {
      if (!item?.id || actionLoading) return;

      if (item.type !== 'post' && item.type !== 'blog') return;

      setActionLoading(item.id);

      try {
        let response;

        if (item.type === 'post') {
          response = await likePost(item.id);
        } else {
          response = await likeBlog(item.id, {
            createdBy: item?.createdBy || '',
            description: item?.description || item?.text || '',
          });
        }

        if (!response?.success) {
          throw new Error(response?.message || 'Like failed');
        }

        // Refresh only the relevant list
        if (item.type === 'post') {
          await fetchPosts();
        } else {
          await fetchBlogs();
        }
      } catch (err) {
        console.log('Like API Error:', err?.message);
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading],
  );

  // Bottom Navigation
  const handleTabPress = key => {
    if (key === 'Dashboard') return;
    navigation?.navigate(key);
  };

  // Open Details
  const handleItemPress = useCallback(
    item => {
      if (item.type === 'post') {
        navigation?.navigate('PostDetails', { postId: item.id, post: item });
      } else if (item.type === 'blog') {
        navigation?.navigate('BlogDetails', { blogId: item.id, blog: item });
      } else if (item.type === 'job') {
        navigation?.navigate('JobDetails', { jobId: item.id, job: item });
      } else if (item.type === 'appeal') {
        navigation?.navigate('AppealDetails', {
          appealId: item.id,
          appeal: item,
        });
      } else if (item.type === 'news' || item.type === 'event') {
        navigation?.navigate('NewsEventDetails', {
          newsEventId: item.id,
          newsEvent: item,
        });
      }
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }) => (
      <FeedCard
        item={item}
        mediaWidth={mediaWidth}
        userId={userId}
        isLikeLoading={actionLoading === item.id}
        onOpen={handleItemPress}
        onLike={handleLike}
        onShare={handleShare}
      />
    ),
    [
      mediaWidth,
      userId,
      actionLoading,
      handleItemPress,
      handleLike,
      handleShare,
    ],
  );

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
              <Text style={styles.bannerTitle}>Verify Phone Number</Text>

              <Text style={styles.bannerSubtitle}>
                Complete your phone number verification
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowVerificationBanner(false)}
            style={styles.bannerCloseButton}
          >
            <MaterialIcons name="close" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.body}>
        {/* Tabs */}
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

        {/* Feed */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.success} />

            <Text style={styles.loadingText}>Loading community feed...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
            renderItem={renderCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            initialNumToRender={4}
            windowSize={7}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchAllData(true)}
                colors={[colors.success]}
                tintColor={colors.success}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="file-tray-outline"
                  size={45}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>No data found</Text>

                <Text style={styles.emptySubtitle}>
                  {error || 'There is no content available in this category.'}
                </Text>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => fetchAllData()}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      <BottomNav active="CommunityPost" onPress={handleTabPress} />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },

  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },

  tabPill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
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
    flexGrow: 1,
  },

  cardWrapper: {
    paddingHorizontal: WRAPPER_PADDING,
    paddingVertical: 8,
    alignItems: 'center',
  },

  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: colors.cardColor,
    borderRadius: 22,
    padding: CARD_PADDING,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: CARD_BORDER,
    borderColor: colors.neutral.border,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
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

  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userTextContainer: {
    marginLeft: 10,
    flex: 1,
  },

  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  postTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  featuredBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeIndicator: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 15,
  },

  typeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },

  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 7,
    lineHeight: 22,
  },

  /* Expandable text */
  expandableWrap: {
    position: 'relative',
  },

  measureWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },

  postText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 6,
  },

  richBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },

  richItalic: {
    fontStyle: 'italic',
  },

  richLink: {
    color: colors.info,
  },

  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },

  readMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },

  /* Tags */
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },

  tagChip: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },

  hashtag: {
    fontSize: 12,
    color: colors.info,
    fontWeight: '600',
  },

  /* Images */
  singleImage: {
    height: 220,
    borderRadius: 15,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: '#EAEAEA',
  },

  carouselWrap: {
    height: 220,
    borderRadius: 15,
    marginTop: 6,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
  },

  carouselImage: {
    height: 220,
    backgroundColor: '#EAEAEA',
  },

  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },

  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },

  /* Info blocks (job / event / news) */
  extraInfo: {
    backgroundColor: '#F5F8F6',
    padding: 12,
    borderRadius: 14,
    marginTop: 4,
    gap: 8,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  infoRowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  primaryButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },

  primaryButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Appeal */
  appealInfo: {
    backgroundColor: '#F0F8F3',
    padding: 14,
    borderRadius: 14,
    marginTop: 4,
  },

  appealTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusActive: {
    backgroundColor: '#DDF3E5',
  },

  statusClosed: {
    backgroundColor: '#FDE7E4',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  deadlineText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },

  amountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#167A43',
  },

  amountLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D5E8DB',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },

  targetText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  progressPercent: {
    fontSize: 12,
    color: '#167A43',
    fontWeight: '700',
  },

  remainingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  /* Footer */
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingRight: 14,
    gap: 6,
  },

  actionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  detailsText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '700',
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5EC',
    gap: 6,
  },

  shareText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },

  /* Verification banner */
  verificationBanner: {
    backgroundColor: '#E8F5EC',
    borderBottomWidth: 1,
    borderBottomColor: '#B8DEC8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
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

  bannerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },

  emptyContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 19,
  },

  retryButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default CommunityPostCard;

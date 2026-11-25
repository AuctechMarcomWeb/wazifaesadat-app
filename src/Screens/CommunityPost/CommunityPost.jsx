import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useRoute } from '@react-navigation/native';

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
const DESCRIPTION_LINES = 3;
const SHARE_BASE_URL = 'https://community.app';

const FEEDS = ['posts', 'blogs', 'jobs', 'appeals', 'newsEvents'];

const DUMMY_DONATIONS = [
  {
    _id: 'dummy-donation-1',
    isDummy: true,
    type: 'appeal',
    badgeLabel: 'Donation',
    category: 'Donation&Appeal',
    title: 'Winter Blanket & Ration Drive for Families',
    name: 'Community Relief Desk',
    text: 'Helping low-income families and elderly citizens with warm blankets, dry ration kits, and winter essentials across local neighborhoods.',
    images: [
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80',
    ],
    raisedAmount: 85000,
    targetAmount: 150000,
    remainingAmount: 65000,
    donorCount: 64,
    status: 'active',
    deadline: '2026-12-20T00:00:00.000Z',
    createdAt: '2099-12-31T23:59:59.000Z',
    date: '20 Nov 2026',
    tags: ['Donation', 'WinterRelief', 'CommunityCare'],
  },
];

const createInitialPagination = () => ({
  posts: { page: 1, hasMore: true, loadingMore: false },
  blogs: { page: 1, hasMore: true, loadingMore: false },
  jobs: { page: 1, hasMore: true, loadingMore: false },
  appeals: { page: 1, hasMore: true, loadingMore: false },
  newsEvents: { page: 1, hasMore: true, loadingMore: false },
});

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

const sortByFeedPriority = (a, b) => {
  const aDummy = a?.isDummy ? 1 : 0;
  const bDummy = b?.isDummy ? 1 : 0;
  if (aDummy !== bDummy) return bDummy - aDummy;

  return (
    new Date(b?.createdAt || 0).getTime() -
    new Date(a?.createdAt || 0).getTime()
  );
};

const getSharePathSegment = type => {
  switch (type) {
    case 'post':
      return 'posts';
    case 'blog':
      return 'blogs';
    case 'job':
      return 'jobs';
    case 'appeal':
      return 'appeals';
    case 'event':
      return 'events';
    case 'news':
      return 'news';
    default:
      return 'posts';
  }
};

const getShareUrl = item => {
  if (!item) return '';

  const directUrl =
    item?.shareUrl ||
    item?.shareLink ||
    item?.url ||
    item?.link ||
    item?.webUrl;

  if (typeof directUrl === 'string' && /^https?:\/\//i.test(directUrl.trim())) {
    return directUrl.trim();
  }

  const id = encodeURIComponent(String(item?.id || getId(item) || ''));
  if (!id) return SHARE_BASE_URL;

  const base = SHARE_BASE_URL.replace(/\/+$/, '');
  const segment = getSharePathSegment(item?.type);
  const slug = item?.slug ? `/${encodeURIComponent(String(item.slug))}` : '';

  return `${base}/${segment}/${id}${slug}`;
};

const buildSharePayload = (item, itemId, shareUrl) => ({
  id: itemId,
  type: item?.type || 'post',
  shareUrl,
  title: item?.title || '',
  platform: 'native_share',
});

const getArray = (response, key) => {
  if (!response?.success) return [];

  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];

  return [];
};

const getHasMore = (response, incomingLength, page, limit = PAGE_LIMIT) => {
  if (!response?.success || incomingLength === 0) return false;

  const data = response.data;
  const pagination = data?.pagination || response?.pagination || data;

  if (typeof pagination?.hasMore === 'boolean') return pagination.hasMore;
  if (typeof pagination?.hasNextPage === 'boolean') {
    return pagination.hasNextPage;
  }

  const totalPages =
    pagination?.totalPages ?? pagination?.pages ?? data?.totalPages;
  if (typeof totalPages === 'number' && totalPages > 0) {
    return page < totalPages;
  }

  const totalItems =
    pagination?.total ??
    pagination?.totalCount ??
    pagination?.totalDocs ??
    data?.total;
  if (typeof totalItems === 'number' && totalItems >= 0) {
    return page * limit < totalItems;
  }

  return incomingLength >= limit;
};

const mergeUniqueByKey = (existing = [], incoming = []) => {
  const map = new Map();

  existing.forEach((item, idx) => {
    const key = `${item.type}-${item.id || `idx-${idx}`}`;
    map.set(key, item);
  });

  incoming.forEach((item, idx) => {
    const key = `${item.type}-${item.id || `new-${idx}`}`;
    map.set(key, item);
  });

  return Array.from(map.values());
};

const toUri = image => {
  if (typeof image === 'string') return image;

  return image?.url || image?.uri || image?.image || image?.secure_url || null;
};

const toList = value => {
  if (!value) return [];

  return (Array.isArray(value) ? value : [value]).map(toUri).filter(Boolean);
};

const getImages = (item, type) => {
  const gallery = [
    ...toList(item?.images),
    ...toList(item?.imgs),
    ...toList(item?.image),
  ];

  const cover = [...toList(item?.coverImage), ...toList(item?.thumbnail)];

  let list;

  if (type === 'news' || type === 'event') {
    list = [...cover.slice(0, 1), ...gallery];
  } else {
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

  let nl = 99;
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

const Body = ({ text, isHtml, style, ...rest }) =>
  isHtml ? (
    <RichText html={text} style={style} {...rest} />
  ) : (
    <Text style={style} {...rest}>
      {text}
    </Text>
  );

const isItemLiked = (item, userId) => {
  if (typeof item?.isLiked === 'boolean') return item.isLiked;
  if (typeof item?.liked === 'boolean') return item.liked;
  return (
    !!userId && Array.isArray(item?.likedBy) && item.likedBy.includes(userId)
  );
};

const normalizeItem = (item, type) => {
  const category =
    type === 'post' || type === 'blog'
      ? 'Post&Blogs'
      : type === 'job'
      ? 'Jobs&Career'
      : type === 'appeal'
      ? 'Donation&Appeal'
      : 'News&Events';

  const normalizedLikes = item?.likes ?? item?.likeCount ?? 0;
  const normalizedLikedBy = Array.isArray(item?.likedBy) ? item.likedBy : [];
  const normalizedIsLiked =
    typeof item?.isLiked === 'boolean'
      ? item.isLiked
      : typeof item?.liked === 'boolean'
      ? item.liked
      : undefined;

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
    likes: normalizedLikes,
    likedBy: normalizedLikedBy,
    ...(normalizedIsLiked !== undefined ? { isLiked: normalizedIsLiked } : {}),
    date: formatDate(item?.date || item?.createdAt),
    tags: Array.isArray(item?.tags) ? item.tags : [],
  };
};

const INITIAL_DUMMY_APPEALS = DUMMY_DONATIONS.map(item =>
  normalizeItem(item, 'appeal'),
);

/* -------------------------------------------------------------------------- */
/*                              Small components                              */
/* -------------------------------------------------------------------------- */

const ExpandableText = ({
  text,
  prefixName,
  lines = DESCRIPTION_LINES,
  style,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  if (!text) return null;

  const isHtml = HTML_REGEX.test(text);

  return (
    <View style={styles.expandableWrap}>
      <View style={styles.captionRow}>
        {!!prefixName && (
          <Text style={styles.captionAuthor}>{prefixName} </Text>
        )}
        <View style={styles.captionBodyWrap}>
          <Body
            text={text}
            isHtml={isHtml}
            style={style}
            numberOfLines={expanded ? undefined : lines}
          />
        </View>
      </View>

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
          <Text style={styles.readMoreText}>{expanded ? 'less' : 'more'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

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
      <Ionicons name={icon} size={16} color={colors.textPrimary} />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Feed card                                 */
/* -------------------------------------------------------------------------- */

const FeedCard = memo(
  ({ item, screenWidth, userId, onOpen, onLike, onShare }) => {
    const meta = TYPE_META[item.type] || TYPE_META.post;
    const badgeText = item.badgeLabel || meta.label;
    const canLike = item.type === 'post' || item.type === 'blog';
    const liked = isItemLiked(item, userId);

    const raised = Number(item.raisedAmount || 0);
    const target = Number(item.targetAmount || 0);
    const progress = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
    const goalReached = target > 0 && raised >= target;
    const appealClosed = item.status === 'closed';

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
      <View style={styles.instaFeedItem}>
        {/* Top IG Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpen(item)}
            style={styles.userInfo}
          >
            <View style={styles.avatarRing}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </View>

            <View style={styles.userTextContainer}>
              <Text
                style={[typography.heading, styles.userName]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {!!place && (
                <Text style={styles.userSubLocation} numberOfLines={1}>
                  {place}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.badgeRow}>
            {!!item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#B86500" />
              </View>
            )}

            <View
              style={[
                styles.typeIndicator,
                { backgroundColor: `${meta.color}14` },
              ]}
            >
              <Text style={[styles.typeIndicatorText, { color: meta.color }]}>
                {badgeText}
              </Text>
            </View>
          </View>
        </View>

        {/* Full-bleed Media */}
        <ImageCarousel images={item.images} width={screenWidth} />

        {/* IG Action Bar */}
        <View style={styles.instaActionBar}>
          <View style={styles.instaLeftActions}>
            {canLike && (
              <TouchableOpacity
                style={styles.iconActionBtn}
                onPress={() => onLike(item)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={liked ? '#ED4956' : colors.textPrimary}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => onShare(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="paper-plane-outline"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Likes Count */}
        {canLike && (
          <View style={styles.instaMetaPad}>
            <Text style={styles.likesCountText}>
              {Number(item.likes || 0).toLocaleString('en-IN')}{' '}
              {Number(item.likes || 0) === 1 ? 'like' : 'likes'}
            </Text>
          </View>
        )}

        {/* Title + Expandable Caption */}
        <View style={styles.instaMetaPad}>
          {!!item.title && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => onOpen(item)}>
              <Text style={styles.postTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}

          <ExpandableText
            text={item.text}
            prefixName={item.name}
            style={styles.postText}
          />

          {!!item.tags?.length && (
            <View style={styles.hashtagRow}>
              {item.tags.map((tag, index) => (
                <Text key={`${item.id}-tag-${index}`} style={styles.hashtag}>
                  #{String(tag).replace(/^#/, '')}{' '}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Specialized Category Blocks */}
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
            <View style={styles.inlineLinkRow}>
              <Text style={styles.detailsText}>View job details</Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={colors.textPrimary}
              />
            </View>
          </TouchableOpacity>
        )}

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
          </View>
        )}

        {item.type === 'news' && !!item.source && (
          <View style={styles.extraInfo}>
            <InfoRow icon="newspaper-outline" text={`Source: ${item.source}`} />

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
                  {appealClosed ? 'Ended' : 'Ends'} {formatDate(item.deadline)}
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
              <Text style={styles.remainingText}>{item.donorCount} donors</Text>
            )}

            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>View Appeal</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Timestamp at bottom like IG */}
        <View style={styles.instaMetaPad}>
          <Text style={styles.postTime}>{item.date || 'Community'}</Text>
        </View>
      </View>
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

const CommunityPostCard = ({ navigation }) => {
  const route = useRoute();
  const { width: screenWidth } = useWindowDimensions();

  const contentTypeParam = route?.params?.contentType;

  const getInitialTab = () => {
    if (contentTypeParam === 'Post') return 'Post';
    if (contentTypeParam === 'Blogs') return 'Post&Blogs';
    if (contentTypeParam === 'News') return 'News&Events';
    if (contentTypeParam === 'Events') return 'News&Events';
    if (contentTypeParam === 'JobsCareer') return 'Jobs&Career';
    if (contentTypeParam === 'Donation') return 'Donation&Appeal';
    if (contentTypeParam === 'Appeal') return 'Donation&Appeal';
    return 'All';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  const [posts, setPosts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [appeals, setAppeals] = useState(INITIAL_DUMMY_APPEALS);
  const [newsEvents, setNewsEvents] = useState([]);

  const [pagination, setPagination] = useState(createInitialPagination);
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const likeRequestRef = useRef({});
  const onEndReachedCalledDuringMomentum = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const reduxUser = useSelector(
    state => state?.user?.user || state?.auth?.user,
  );

  const userId = reduxUser?._id || reduxUser?.id;
  const user = reduxUser;

  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  useEffect(() => {
    if (reduxUser?.isWatsappVerify === false && reduxUser?.pendingWhatsapp) {
      setShowVerificationBanner(true);
    }
  }, [reduxUser]);

  useEffect(() => {
    if (contentTypeParam) {
      const newTab =
        contentTypeParam === 'Post'
          ? 'Post'
          : contentTypeParam === 'Blogs'
          ? 'Post&Blogs'
          : contentTypeParam === 'News'
          ? 'News&Events'
          : contentTypeParam === 'Events'
          ? 'News&Events'
          : contentTypeParam === 'JobsCareer'
          ? 'Jobs&Career'
          : contentTypeParam === 'Donation'
          ? 'Donation&Appeal'
          : contentTypeParam === 'Appeal'
          ? 'Donation&Appeal'
          : 'All';
      setActiveTab(newTab);
    }
  }, [contentTypeParam]);

  const setFeedPagination = useCallback((feedKey, patch) => {
    setPagination(prev => ({
      ...prev,
      [feedKey]: { ...prev[feedKey], ...patch },
    }));
  }, []);

  const fetchNewsEvents = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (append) setFeedPagination('newsEvents', { loadingMore: true });

      try {
        const response = await getAllNewsEvents({
          page,
          limit: PAGE_LIMIT,
          isPagination: true,
          sortBy: 'latest',
          status: 'published',
        });

        if (!response?.success) {
          throw new Error(response?.message || 'News & Events fetch failed');
        }

        const rawList = getArray(response, 'data');
        const normalized = rawList.map(item =>
          normalizeItem(item, item?.type === 'event' ? 'event' : 'news'),
        );
        const hasMore = getHasMore(response, rawList.length, page, PAGE_LIMIT);

        setNewsEvents(prev =>
          append ? mergeUniqueByKey(prev, normalized) : normalized,
        );
        setFeedPagination('newsEvents', {
          page,
          hasMore,
          loadingMore: false,
        });
      } catch (err) {
        console.log('News & Events API Error:', err?.message);
        if (!append) setNewsEvents([]);
        setFeedPagination('newsEvents', {
          hasMore: append ? paginationRef.current.newsEvents.hasMore : false,
          loadingMore: false,
        });
      }
    },
    [setFeedPagination],
  );

  const fetchPosts = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (append) setFeedPagination('posts', { loadingMore: true });

      try {
        const response = await getAllPosts({
          page,
          limit: PAGE_LIMIT,
          isPagination: true,
          sortBy: 'latest',
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Posts fetch failed');
        }

        const rawList = getArray(response, 'posts');
        const normalized = rawList.map(item => normalizeItem(item, 'post'));
        const hasMore = getHasMore(response, rawList.length, page, PAGE_LIMIT);

        setPosts(prev =>
          append ? mergeUniqueByKey(prev, normalized) : normalized,
        );
        setFeedPagination('posts', {
          page,
          hasMore,
          loadingMore: false,
        });
      } catch (err) {
        console.log('Posts API Error:', err?.message);
        if (!append) setPosts([]);
        setFeedPagination('posts', {
          hasMore: append ? paginationRef.current.posts.hasMore : false,
          loadingMore: false,
        });
      }
    },
    [setFeedPagination],
  );

  const fetchBlogs = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (append) setFeedPagination('blogs', { loadingMore: true });

      try {
        const response = await getAllBlogs({
          page,
          limit: PAGE_LIMIT,
          isPagination: true,
          sortBy: 'latest',
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Blogs fetch failed');
        }

        const rawList = getArray(response, 'blogs');
        const normalized = rawList.map(item => normalizeItem(item, 'blog'));
        const hasMore = getHasMore(response, rawList.length, page, PAGE_LIMIT);

        setBlogs(prev =>
          append ? mergeUniqueByKey(prev, normalized) : normalized,
        );
        setFeedPagination('blogs', {
          page,
          hasMore,
          loadingMore: false,
        });
      } catch (err) {
        console.log('Blogs API Error:', err?.message);
        if (!append) setBlogs([]);
        setFeedPagination('blogs', {
          hasMore: append ? paginationRef.current.blogs.hasMore : false,
          loadingMore: false,
        });
      }
    },
    [setFeedPagination],
  );

  const fetchJobs = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (append) setFeedPagination('jobs', { loadingMore: true });

      try {
        const response = await getPersonalizedJobs({
          page,
          limit: PAGE_LIMIT,
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Jobs fetch failed');
        }

        const rawList = getArray(response, 'jobs');
        const normalized = rawList.map(item => normalizeItem(item, 'job'));
        const hasMore = getHasMore(response, rawList.length, page, PAGE_LIMIT);

        setJobs(prev =>
          append ? mergeUniqueByKey(prev, normalized) : normalized,
        );
        setFeedPagination('jobs', {
          page,
          hasMore,
          loadingMore: false,
        });
      } catch (err) {
        console.log('Jobs API Error:', err?.message);
        if (!append) setJobs([]);
        setFeedPagination('jobs', {
          hasMore: append ? paginationRef.current.jobs.hasMore : false,
          loadingMore: false,
        });
      }
    },
    [setFeedPagination],
  );

  const fetchAppeals = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (append) setFeedPagination('appeals', { loadingMore: true });

      try {
        const response = await getAllAppeals({
          page,
          limit: PAGE_LIMIT,
          isPagination: true,
          sortBy: 'latest',
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Appeals fetch failed');
        }

        const rawList = getArray(response, 'appeals');
        const normalized = rawList.map(item => normalizeItem(item, 'appeal'));
        const combined = mergeUniqueByKey(
          [],
          [...INITIAL_DUMMY_APPEALS, ...normalized],
        ).sort(sortByFeedPriority);
        const hasMore = getHasMore(response, rawList.length, page, PAGE_LIMIT);

        setAppeals(prev =>
          append
            ? mergeUniqueByKey(prev, normalized).sort(sortByFeedPriority)
            : combined,
        );
        setFeedPagination('appeals', {
          page,
          hasMore,
          loadingMore: false,
        });
      } catch (err) {
        console.log('Appeals API Error:', err?.message);
        if (!append) setAppeals(INITIAL_DUMMY_APPEALS);
        setFeedPagination('appeals', {
          hasMore: append ? paginationRef.current.appeals.hasMore : false,
          loadingMore: false,
        });
      }
    },
    [setFeedPagination],
  );

  const fetchAllData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      setPagination(createInitialPagination());
      onEndReachedCalledDuringMomentum.current = false;

      try {
        await Promise.all([
          fetchPosts({ page: 1, append: false }),
          fetchBlogs({ page: 1, append: false }),
          fetchJobs({ page: 1, append: false }),
          fetchAppeals({ page: 1, append: false }),
          fetchNewsEvents({ page: 1, append: false }),
        ]);
      } catch (err) {
        console.log('Community Feed Error:', err);
        setError('Unable to load community feed.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchPosts, fetchBlogs, fetchJobs, fetchAppeals, fetchNewsEvents],
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const activeFeedKeys = useMemo(() => {
    switch (activeTab) {
      case 'Post&Blogs':
        return ['posts', 'blogs'];
      case 'Jobs&Career':
        return ['jobs'];
      case 'Donation&Appeal':
        return ['appeals'];
      case 'News&Events':
        return ['newsEvents'];
      default:
        return FEEDS;
    }
  }, [activeTab]);

  const isAnyLoadingMore = useMemo(
    () => activeFeedKeys.some(key => pagination[key]?.loadingMore),
    [activeFeedKeys, pagination],
  );

  const hasMoreForActiveTab = useMemo(
    () => activeFeedKeys.some(key => pagination[key]?.hasMore),
    [activeFeedKeys, pagination],
  );

  const handleLoadMore = useCallback(async () => {
    if (loading || refreshing) return;

    const currentPagination = paginationRef.current;

    const targets = activeFeedKeys.filter(key => {
      const state = currentPagination[key];
      return state && state.hasMore && !state.loadingMore;
    });

    if (!targets.length) return;

    const fetchers = {
      posts: fetchPosts,
      blogs: fetchBlogs,
      jobs: fetchJobs,
      appeals: fetchAppeals,
      newsEvents: fetchNewsEvents,
    };

    await Promise.all(
      targets.map(key =>
        fetchers[key]({
          page: currentPagination[key].page + 1,
          append: true,
        }),
      ),
    );
  }, [
    loading,
    refreshing,
    activeFeedKeys,
    fetchPosts,
    fetchBlogs,
    fetchJobs,
    fetchAppeals,
    fetchNewsEvents,
  ]);

  const allItems = useMemo(() => {
    return mergeUniqueByKey(
      [],
      [...appeals, ...posts, ...blogs, ...jobs, ...newsEvents],
    ).sort(sortByFeedPriority);
  }, [posts, blogs, jobs, appeals, newsEvents]);

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'Post&Blogs':
        return mergeUniqueByKey([], [...posts, ...blogs]).sort(
          sortByFeedPriority,
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

  const handleShare = useCallback(async item => {
    const itemId = item?.id || getId(item);
    if (!itemId) return;

    try {
      const shareUrl = getShareUrl({ ...item, id: itemId });
      const sharePayload = buildSharePayload(item, itemId, shareUrl);
      const summary = [item?.title, stripHtml(item?.text)]
        .filter(Boolean)
        .join('\n\n');
      const message = [summary, shareUrl].filter(Boolean).join('\n\n');

      const result = await Share.share({
        message: message || shareUrl,
        url: shareUrl,
        title: item?.title || 'Share Community Content',
      });

      if (result?.action !== Share.sharedAction) return;

      if (item.type === 'post') {
        const response = await sharePost(itemId, sharePayload);

        if (!response?.success) {
          console.log('Post Share API:', response?.message);
        }
      }

      if (item.type === 'blog') {
        const response = await shareBlog(itemId, sharePayload);

        if (!response?.success) {
          console.log('Blog Share API:', response?.message);
        }
      }
    } catch (err) {
      console.log('Share Error:', err?.message);
    }
  }, []);

  const handleLike = useCallback(
    async item => {
      const itemId = item?.id || getId(item);
      if (!itemId) return;

      if (item.type !== 'post' && item.type !== 'blog') return;

      const setter = item.type === 'post' ? setPosts : setBlogs;
      const reqKey = `${item.type}-${itemId}`;
      const requestSeq = (likeRequestRef.current[reqKey] || 0) + 1;
      likeRequestRef.current[reqKey] = requestSeq;

      const currentLiked = isItemLiked(item, userId);
      const nextLiked = !currentLiked;
      const currentLikes = Number(item?.likes ?? item?.likeCount ?? 0);
      const nextLikes = Math.max(0, currentLikes + (nextLiked ? 1 : -1));
      const currentLikedBy = Array.isArray(item?.likedBy) ? item.likedBy : [];
      const nextLikedBy = userId
        ? nextLiked
          ? Array.from(new Set([...currentLikedBy, userId]))
          : currentLikedBy.filter(id => id !== userId)
        : currentLikedBy;

      setter(prev =>
        prev.map(entry => {
          const entryId = entry?.id || getId(entry);
          if (entryId !== itemId) return entry;
          return {
            ...entry,
            isLiked: nextLiked,
            likes: nextLikes,
            likedBy: nextLikedBy,
          };
        }),
      );

      try {
        const response =
          item.type === 'post'
            ? await likePost(itemId)
            : await likeBlog(itemId, {
                createdBy: item?.createdBy || '',
                description: item?.description || item?.text || '',
              });

        if (likeRequestRef.current[reqKey] !== requestSeq) return;

        if (!response?.success) {
          throw new Error(response?.message || 'Like failed');
        }

        const serverData = response?.data;
        const payload =
          serverData?.post || serverData?.blog || serverData || {};

        setter(prev =>
          prev.map(entry => {
            const entryId = entry?.id || getId(entry);
            if (entryId !== itemId) return entry;

            const serverIsLiked =
              typeof payload?.isLiked === 'boolean'
                ? payload.isLiked
                : typeof serverData?.isLiked === 'boolean'
                ? serverData.isLiked
                : nextLiked;

            const serverLikes =
              typeof payload?.likes === 'number'
                ? payload.likes
                : typeof payload?.likeCount === 'number'
                ? payload.likeCount
                : typeof serverData?.likes === 'number'
                ? serverData.likes
                : nextLikes;

            const serverLikedBy = Array.isArray(payload?.likedBy)
              ? payload.likedBy
              : Array.isArray(serverData?.likedBy)
              ? serverData.likedBy
              : nextLikedBy;

            return {
              ...entry,
              isLiked: serverIsLiked,
              likes: serverLikes,
              likedBy: serverLikedBy,
            };
          }),
        );
      } catch (err) {
        console.log('Like API Error:', err?.message);

        if (likeRequestRef.current[reqKey] !== requestSeq) return;

        setter(prev =>
          prev.map(entry => {
            const entryId = entry?.id || getId(entry);
            if (entryId !== itemId) return entry;
            return {
              ...entry,
              isLiked: currentLiked,
              likes: currentLikes,
              likedBy: currentLikedBy,
            };
          }),
        );
      }
    },
    [userId],
  );

  const handleTabPress = key => {
    if (key === 'Dashboard') return;
    navigation?.navigate(key);
  };

  const handleItemPress = useCallback(
    item => {
      if (item.type === 'post') {
        navigation?.navigate('PostDetails', { postId: item.id, post: item });
      } else if (item.type === 'blog') {
        navigation?.navigate('BlogDetails', { blogId: item.id, blog: item });
      } else if (item.type === 'job') {
        navigation?.navigate('JobsCareerDetails', {
          jobId: item.id,
          job: item,
        });
      } else if (item.type === 'appeal') {
        navigation?.navigate('AppealDetails', {
          appealId: item.id,
          appeal: item,
        });
      } else if (item.type === 'news' || item.type === 'event') {
        if (item.type === 'event') {
          navigation?.navigate('EventDetails', {
            eventId: item.id,
            event: item,
          });
        } else {
          navigation?.navigate('NewsDetails', {
            newsId: item.id,
            news: item,
          });
        }
      }
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }) => (
      <FeedCard
        item={item}
        screenWidth={screenWidth}
        userId={userId}
        onOpen={handleItemPress}
        onLike={handleLike}
        onShare={handleShare}
      />
    ),
    [screenWidth, userId, handleItemPress, handleLike, handleShare],
  );

  const renderFooter = useCallback(() => {
    if (!filteredItems.length) return null;

    if (isAnyLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.textPrimary} />
          <Text style={styles.footerLoaderText}>Loading more...</Text>
        </View>
      );
    }

    if (!hasMoreForActiveTab) {
      return <Text style={styles.endOfListText}>You’re all caught up</Text>;
    }

    return null;
  }, [filteredItems.length, isAnyLoadingMore, hasMoreForActiveTab]);

  return (
    <View style={styles.container}>
      <CommunityPostHeader
        onMenuPress={() => navigation?.openDrawer?.()}
        profilePic={user?.profilePic}
        onBellPress={() => navigation?.navigate('Notifications')}
        onProfilePress={() => navigation?.navigate('ProfileScreen')}
      />

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
            <ActivityIndicator size="large" color={colors.textPrimary} />

            <Text style={styles.loadingText}>Loading community feed...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
            renderItem={renderCard}
            ListFooterComponent={renderFooter}
            onEndReachedThreshold={0.4}
            onMomentumScrollBegin={() => {
              onEndReachedCalledDuringMomentum.current = false;
            }}
            onEndReached={() => {
              if (onEndReachedCalledDuringMomentum.current) return;
              onEndReachedCalledDuringMomentum.current = true;
              handleLoadMore();
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            initialNumToRender={4}
            windowSize={7}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchAllData(true)}
                colors={[colors.textPrimary]}
                tintColor={colors.textPrimary}
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
    backgroundColor: colors.white || '#FFFFFF',
  },

  body: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
  },

  tabBarWrapper: {
    paddingVertical: 8,
    backgroundColor: colors.white || '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },

  tabScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },

  tabPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFEFEF',
  },

  tabPillActive: {
    backgroundColor: '#084e28',
  },

  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#262626',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },

  instaFeedItem: {
    width: '100%',
    backgroundColor: colors.white || '#FFFFFF',
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEFEF',
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 1.5,
    borderWidth: 1.5,
    borderColor: '#E1306C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: colors.inputBorder,
  },

  avatarPlaceholder: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userTextContainer: {
    marginLeft: 10,
    flex: 1,
  },

  userName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },

  userSubLocation: {
    fontSize: 11,
    color: '#737373',
    marginTop: 1,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  featuredBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  typeIndicatorText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  singleImage: {
    height: 340,
    backgroundColor: '#F5F5F5',
  },

  carouselWrap: {
    height: 340,
    backgroundColor: '#F5F5F5',
  },

  carouselImage: {
    height: 340,
    backgroundColor: '#F5F5F5',
  },

  counterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(18, 18, 18, 0.72)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },

  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  dotActive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },

  instaActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },

  instaLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  iconActionBtn: {
    paddingVertical: 2,
  },

  instaMetaPad: {
    paddingHorizontal: 12,
  },

  likesCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
    marginBottom: 4,
  },

  postTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
    marginBottom: 3,
    lineHeight: 20,
  },

  captionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  captionAuthor: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
    lineHeight: 19,
  },

  captionBodyWrap: {
    flex: 1,
  },

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
    fontSize: 13.5,
    color: '#262626',
    lineHeight: 19,
  },

  richBold: {
    fontWeight: '700',
    color: '#121212',
  },

  richItalic: {
    fontStyle: 'italic',
  },

  richLink: {
    color: '#00376B',
  },

  readMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },

  readMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#737373',
  },

  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },

  hashtag: {
    fontSize: 13,
    color: '#00376B',
    fontWeight: '400',
  },

  inlineLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },

  detailsText: {
    fontSize: 13,
    color: '#121212',
    fontWeight: '600',
  },

  extraInfo: {
    backgroundColor: '#FAFAFA',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
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
    color: '#262626',
    fontWeight: '500',
  },

  primaryButton: {
    backgroundColor: '#121212',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
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

  appealInfo: {
    backgroundColor: '#FAFAFA',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
  },

  appealTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
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
    color: '#737373',
    fontWeight: '500',
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },

  amountText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#121212',
  },

  amountLabel: {
    fontSize: 13,
    color: '#737373',
    fontWeight: '500',
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },

  targetText: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '500',
  },

  progressPercent: {
    fontSize: 12,
    color: '#167A43',
    fontWeight: '700',
  },

  remainingText: {
    fontSize: 12,
    color: '#525252',
    marginTop: 4,
  },

  postTime: {
    fontSize: 10.5,
    color: '#737373',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },

  verificationBanner: {
    backgroundColor: '#E8F5EC',
    borderBottomWidth: 1,
    borderBottomColor: '#B8DEC8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  bannerIcon: {
    width: 38,
    height: 38,
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
    width: 30,
    height: 30,
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
    color: '#737373',
    marginTop: 10,
  },

  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },

  footerLoaderText: {
    fontSize: 12.5,
    color: '#737373',
    fontWeight: '500',
  },

  endOfListText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#737373',
    paddingVertical: 18,
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
    color: '#121212',
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 19,
  },

  retryButton: {
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default CommunityPostCard;
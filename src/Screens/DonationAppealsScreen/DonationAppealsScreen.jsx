import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

import colors from '../../themes/colors';
import typography from '../../themes/typography';
import BackHeader from '../../components/BackHeader/BackHeader';
import BottomNav from '../../components/BottomNav/BottomNav';
import { getAllAppeals } from '../../api/AllTabsApi';
import AppLayout from '../../components/AppLayout/AppLayout';

const PAGE_LIMIT = 10;
const DESCRIPTION_LINES = 3;
const SHARE_BASE_URL = 'https://community.app';

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
    tags: ['Donation', 'WinterRelief', 'CommunityCare'],
  },
];

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

const getShareUrl = item => {
  if (!item) return SHARE_BASE_URL;

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
  const slug = item?.slug ? `/${encodeURIComponent(String(item.slug))}` : '';
  return `${base}/appeals/${id}${slug}`;
};

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
    const key = `${item.type || 'appeal'}-${item.id || `idx-${idx}`}`;
    map.set(key, item);
  });

  incoming.forEach((item, idx) => {
    const key = `${item.type || 'appeal'}-${item.id || `new-${idx}`}`;
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

const getImages = item => {
  const gallery = [
    ...toList(item?.images),
    ...toList(item?.imgs),
    ...toList(item?.image),
  ];
  const cover = [...toList(item?.coverImage), ...toList(item?.thumbnail)];
  const list = gallery.length ? gallery : cover;
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
  'Community Relief Desk';

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

const normalizeAppealItem = item => ({
  ...item,
  id: getId(item),
  type: 'appeal',
  category: 'Donation&Appeal',
  title: item?.title || '',
  name: getUserName(item),
  avatar: getAvatar(item),
  text: getDescription(item),
  images: getImages(item),
  date: formatDate(item?.date || item?.createdAt),
  tags: Array.isArray(item?.tags) ? item.tags : [],
});

const INITIAL_APPEALS = DUMMY_DONATIONS.map(normalizeAppealItem);

/* -------------------------------------------------------------------------- */
/*                              Small Components                              */
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

/* -------------------------------------------------------------------------- */
/*                              Appeal Feed Card                              */
/* -------------------------------------------------------------------------- */

const AppealFeedCard = memo(({ item, screenWidth, onOpen, onShare }) => {
  const badgeText = item.badgeLabel || 'Appeal';
  const place = [item.venue, item.city].filter(Boolean).join(', ');

  const raised = Number(item.raisedAmount || 0);
  const target = Number(item.targetAmount || 0);
  const progress = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  const goalReached = target > 0 && raised >= target;
  const appealClosed = item.status === 'closed';
  const remaining = Math.max(0, target - raised);
  const deadlineText = formatDate(item.deadline);

  return (
    <View style={styles.instaFeedItem}>
      {/* Header */}
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
                <Ionicons name="heart" size={17} color={colors.textSecondary} />
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
              { backgroundColor: 'rgba(22, 122, 67, 0.08)' },
            ]}
          >
            <Text style={[styles.typeIndicatorText, { color: '#167A43' }]}>
              {badgeText}
            </Text>
          </View>
        </View>
      </View>

      {/* Media */}
      <ImageCarousel images={item.images} width={screenWidth} />

      {/* Action Bar */}
      <View style={styles.instaActionBar}>
        <View style={styles.instaLeftActions}>
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

      {/* Title + Caption + Tags */}
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

      {/* Donation & Appeal Progress Block */}
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
                { backgroundColor: appealClosed ? '#C62828' : '#167A43' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: appealClosed ? '#C62828' : '#167A43' },
              ]}
            >
              {appealClosed
                ? 'Closed'
                : goalReached
                ? 'Goal Reached'
                : 'Active'}
            </Text>
          </View>

          {!!deadlineText && (
            <Text style={styles.deadlineText}>Ends {deadlineText}</Text>
          )}
        </View>

        {target > 0 && (
          <>
            <View style={styles.amountRow}>
              <Text style={styles.amountText}>{formatMoney(raised)}</Text>
              <Text style={styles.amountLabel}>
                {' '}
                raised of {formatMoney(target)}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: appealClosed ? '#C62828' : '#167A43',
                  },
                ]}
              />
            </View>

            <View style={styles.progressMeta}>
              <Text style={styles.targetText}>
                {Number(item.donorCount || 0)} donors
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(progress)}%
              </Text>
            </View>

            {remaining > 0 && !appealClosed && (
              <Text style={styles.remainingText}>
                {formatMoney(remaining)} still needed
              </Text>
            )}
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.primaryButton}
          onPress={() => onOpen(item)}
        >
          <Text style={styles.primaryButtonText}>
            {item.isDummy ? 'Donate Now' : 'View Appeal'}
          </Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Date */}
      <View style={styles.instaMetaPad}>
        <Text style={styles.postTime}>{item.date || 'Community'}</Text>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

const DonationAppealsScreen = ({ navigation }) => {
  const { width: screenWidth } = useWindowDimensions();

  const [appeals, setAppeals] = useState(INITIAL_APPEALS);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const onEndReachedCalledDuringMomentum = useRef(false);

  pageRef.current = page;
  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;

  const fetchAppeals = useCallback(
    async ({ targetPage = 1, append = false, isRefresh = false } = {}) => {
      if (append) {
        if (!hasMoreRef.current || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
        setError('');
      } else {
        setLoading(true);
        setError('');
      }

      try {
        const response = await getAllAppeals({
          page: targetPage,
          limit: PAGE_LIMIT,
          isPagination: true,
          sortBy: 'latest',
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Unable to load appeals');
        }

        const rawList = getArray(response, 'appeals');
        const normalized = rawList.map(normalizeAppealItem);
        const nextHasMore = getHasMore(
          response,
          rawList.length,
          targetPage,
          PAGE_LIMIT,
        );

        setAppeals(prev => {
          const base = append
            ? prev
            : mergeUniqueByKey([], [...INITIAL_APPEALS]);
          return mergeUniqueByKey(base, normalized).sort(sortByFeedPriority);
        });

        setPage(targetPage);
        setHasMore(nextHasMore);
      } catch (err) {
        console.log('Donation & Appeals API Error:', err?.message);
        if (!append) {
          setAppeals(INITIAL_APPEALS);
          setError('Unable to load latest appeals.');
        }
        setHasMore(false);
      } finally {
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    onEndReachedCalledDuringMomentum.current = false;
    fetchAppeals({ targetPage: 1, append: false, isRefresh: false });
  }, [fetchAppeals]);

  const handleRefresh = useCallback(() => {
    onEndReachedCalledDuringMomentum.current = false;
    fetchAppeals({ targetPage: 1, append: false, isRefresh: true });
  }, [fetchAppeals]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    fetchAppeals({
      targetPage: pageRef.current + 1,
      append: true,
      isRefresh: false,
    });
  }, [loading, refreshing, loadingMore, hasMore, fetchAppeals]);

  const handleShare = useCallback(async item => {
    const itemId = item?.id || getId(item);
    if (!itemId) return;

    try {
      const shareUrl = getShareUrl({ ...item, id: itemId });
      const summary = [item?.title, stripHtml(item?.text)]
        .filter(Boolean)
        .join('\n\n');
      const message = [summary, shareUrl].filter(Boolean).join('\n\n');

      await Share.share({
        message: message || shareUrl,
        url: shareUrl,
        title: item?.title || 'Donation & Appeal',
      });
    } catch (err) {
      console.log('Share Appeal Error:', err?.message);
    }
  }, []);

  const handleItemPress = useCallback(
    item => {
      if (item.isDummy) {
        navigation?.navigate('DonationFormScreen', { appeal: item });
        return;
      }

      navigation?.navigate('AppealDetails', {
        appealId: item.id,
        appeal: item,
      });
    },
    [navigation],
  );

  const handleTabPress = useCallback(
    key => {
      navigation?.navigate(key);
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }) => (
      <AppealFeedCard
        item={item}
        screenWidth={screenWidth}
        onOpen={handleItemPress}
        onShare={handleShare}
      />
    ),
    [screenWidth, handleItemPress, handleShare],
  );

  const renderFooter = useCallback(() => {
    if (!appeals.length) return null;

    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.textPrimary} />
          <Text style={styles.footerLoaderText}>Loading more...</Text>
        </View>
      );
    }

    if (!hasMore) {
      return <Text style={styles.endOfListText}>You’re all caught up</Text>;
    }

    return null;
  }, [appeals.length, loadingMore, hasMore]);

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Donation & Appeals"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
              <Text style={styles.loadingText}>
                Loading donation & appeals...
              </Text>
            </View>
          ) : (
            <FlatList
              data={appeals}
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
                  onRefresh={handleRefresh}
                  colors={[colors.textPrimary]}
                  tintColor={colors.textPrimary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="heart-outline"
                    size={45}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyTitle}>No appeals found</Text>
                  <Text style={styles.emptySubtitle}>
                    {error ||
                      'No donation or appeal drives available right now.'}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefresh}
                  >
                    <Text style={styles.retryText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>

        <BottomNav active="DonationAppeals" onPress={handleTabPress} />
      </View>
    </AppLayout>
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

  primaryButton: {
    backgroundColor: '#121212',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
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

export default DonationAppealsScreen;

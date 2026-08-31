import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCitizenActivities } from '../services/citizenHooks';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';
import WaveBar from '../components/citizen/WaveBar';
import HeroWave from '../components/citizen/HeroWave';
import WaveMark from '../components/citizen/WaveMark';
import MyActivitySkeleton from '../components/MyActivitySkeleton';

function normalizeImageUrl(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('ipfs://')) {
    return `https://gateway.pinata.cloud/ipfs/${trimmed.replace('ipfs://', '')}`;
  }

  if (/^(Qm[1-9A-HJ-NP-Za-k]{44,}|baf[a-z0-9]{20,})$/i.test(trimmed)) {
    return `https://gateway.pinata.cloud/ipfs/${trimmed}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/ipfs/')) {
    return `https://gateway.pinata.cloud${trimmed}`;
  }

  return trimmed;
}

function getThumbnailUrl(value) {
  const normalized = normalizeImageUrl(value);
  if (!normalized || !normalized.includes('gateway.pinata.cloud/ipfs/')) return normalized;

  const separator = normalized.includes('?') ? '&' : '?';
  return `${normalized}${separator}img-width=640&img-height=344&img-fit=cover&img-format=webp&img-quality=70`;
}

function getImageLoadUrls(value) {
  const normalized = normalizeImageUrl(value);
  if (!normalized) return [];

  const urls = [getThumbnailUrl(normalized), normalized];
  const cidMatch = normalized.match(/\/ipfs\/([^/?#]+)/i);

  if (cidMatch) {
    const cid = cidMatch[1];
    urls.push(`https://ipfs.io/ipfs/${cid}`, `https://dweb.link/ipfs/${cid}`);
  }

  return [...new Set(urls.filter(Boolean))];
}

function getImageUrls(item) {
  const candidateSources = [
    item.imageGatewayUrl,
    item.imageGatewayUrls,
    item.images,
    item.imageUrls,
    item.imageIpfsUrl,
    item.imageCid,
    item.image
  ];

  for (const source of candidateSources) {
    let values = Array.isArray(source) ? source : typeof source === 'string' && source.length > 0 ? [source] : [];

    // Older API responses can contain an encoded JSON array in a text field.
    if (values.length === 1 && typeof values[0] === 'string' && values[0].trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(values[0]);
        if (Array.isArray(parsed)) values = parsed;
      } catch {
        // Keep the original value as a normal URL when it is not valid JSON.
      }
    }

    const normalized = values.map((value) => normalizeImageUrl(value)).filter(Boolean);
    if (normalized.length > 0) {
      return [...new Set(normalized)];
    }
  }

  return [];
}

function formatActivityDate(timestamp) {
  const date = timestamp ? new Date(timestamp) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CAT_ICON = { plastic: '🧴', glass: '🍾', metal: '🥫', organic: '🍂', mixed: '🗑️', other: '📦' };

const STATUS_META = {
  approved: (t) => ({ color: t.success, label: 'Verified' }),
  pending: (t) => ({ color: t.warning, label: 'Pending' }),
  rejected: (t) => ({ color: t.danger, label: 'Rejected' }),
};

function getStatus(item) {
  const value = String(item?.status || 'pending').toLowerCase();
  if (value === 'approved') return 'approved';
  if (value === 'rejected') return 'rejected';
  return 'pending';
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Verified' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

// ─── Pure sub-components ───────────────────────────────────────────────────

const FilterPill = memo(function FilterPill({ t, styles, filter, active, count, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.filterWrap}>
      {active ? (
        <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.filterPill}>
          <Text style={styles.filterTextActive}>
            {filter.label} <Text style={styles.filterCountActive}>({count})</Text>
          </Text>
        </LinearGradient>
      ) : (
        <View style={styles.filterPill}>
          <Text style={styles.filterText}>
            {filter.label} <Text style={styles.filterCount}>({count})</Text>
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const ActivityThumbnail = memo(function ActivityThumbnail({ uri, styles }) {
  const loadUrls = getImageLoadUrls(uri);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [uri]);

  if (sourceIndex >= loadUrls.length) {
    return (
      <View style={styles.mediaPlaceholder}>
        <Text style={styles.mediaPlaceholderIcon}>🖼️</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: loadUrls[sourceIndex], cache: 'force-cache' }}
      style={styles.mediaImage}
      resizeMode="cover"
      resizeMethod="resize"
      fadeDuration={150}
      onError={() => {
        setSourceIndex((current) => current + 1);
      }}
    />
  );
});

const ZoomableImage = memo(function ZoomableImage({ uri, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const gesture = useRef({
    initialDistance: 0,
    initialScale: 1,
    startX: 0,
    startY: 0,
    moved: false,
    startedAt: 0,
    lastTapAt: 0,
  }).current;

  const getDistance = (touches) => {
    if (touches.length < 2) return 0;
    const [first, second] = touches;
    return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
  };

  const reset = useCallback(
    (nextScale = 1) => {
      Animated.parallel([
        Animated.spring(scale, { toValue: nextScale, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    },
    [scale, translateX, translateY]
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;
          gesture.initialDistance = getDistance(touches);
          gesture.initialScale = scale.__getValue();
          gesture.startX = translateX.__getValue();
          gesture.startY = translateY.__getValue();
          gesture.moved = false;
          gesture.startedAt = Date.now();
        },
        onPanResponderMove: (event, state) => {
          const touches = event.nativeEvent.touches;
          const distance = getDistance(touches);

          if (distance > 0 && gesture.initialDistance === 0) {
            gesture.initialDistance = distance;
            gesture.initialScale = scale.__getValue();
            gesture.moved = true;
            return;
          }

          if (distance > 0 && gesture.initialDistance > 0) {
            const nextScale = Math.min(4, Math.max(1, gesture.initialScale * (distance / gesture.initialDistance)));
            scale.setValue(nextScale);
            gesture.moved = true;
            return;
          }

          if (touches.length === 1 && gesture.initialDistance === 0 && gesture.initialScale > 1) {
            translateX.setValue(gesture.startX + state.dx);
            translateY.setValue(gesture.startY + state.dy);
            gesture.moved = Math.abs(state.dx) > 4 || Math.abs(state.dy) > 4;
          }
        },
        onPanResponderRelease: () => {
          const now = Date.now();
          const wasTap = !gesture.moved && now - gesture.startedAt < 250;
          const isDoubleTap = wasTap && now - gesture.lastTapAt < 300;
          gesture.lastTapAt = wasTap ? now : 0;
          gesture.initialDistance = 0;

          if (isDoubleTap) {
            reset(scale.__getValue() > 1 ? 1 : 2.5);
          } else if (wasTap && scale.__getValue() <= 1) {
            reset();
          }
        },
        onPanResponderTerminate: () => {
          gesture.initialDistance = 0;
        },
      }),
    [gesture, reset, scale, translateX, translateY]
  );

  return (
    <View style={style} {...responder.panHandlers}>
      <Animated.Image
        source={{ uri, cache: 'force-cache' }}
        style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }, { translateY }, { scale }] }]}
        resizeMode="contain"
      />
    </View>
  );
});

const ActivityCard = memo(function ActivityCard({ item, t, styles, onImagePress }) {
  const status = getStatus(item);
  const meta = STATUS_META[status](t);
  const imageUrls = getImageUrls(item || {});
  const imageUri = imageUrls[0] || null;
  const photoCount = imageUrls.length;
  const category = String(item?.category || 'other').toLowerCase();
  const dateLabel = formatActivityDate(item?.timestamp);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.media}
        activeOpacity={0.9}
        onPress={() => imageUri && onImagePress(item)}
        disabled={!imageUri}
      >
        {imageUri ? (
          <ActivityThumbnail uri={imageUri} styles={styles} />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Text style={styles.mediaPlaceholderIcon}>🖼️</Text>
          </View>
        )}

        <View style={[styles.mediaBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.mediaBadgeText}>{meta.label}</Text>
        </View>

        {dateLabel ? (
          <View style={styles.mediaDate}>
            <Text style={styles.mediaDateText}>{dateLabel}</Text>
          </View>
        ) : null}

        {photoCount > 1 ? (
          <View style={styles.mediaMore}>
            <Text style={styles.mediaMoreText}>+{photoCount - 1} more</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <Text style={styles.location} numberOfLines={2}>
          {item?.location || 'Unknown location'}
        </Text>

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {CAT_ICON[category] || '📦'} <Text style={styles.chipStrong}>{item?.category || 'Other'}</Text>
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              ⚖️{' '}
              <Text style={styles.chipStrong}>
                {typeof item?.quantity === 'number' ? item.quantity.toFixed(2) : item?.quantity || '0.00'} kg
              </Text>
            </Text>
          </View>
          {item?.volunteers > 0 ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                🤝 <Text style={styles.chipStrong}>{item.volunteers}</Text> vol.
              </Text>
            </View>
          ) : null}
        </View>

        {status === 'rejected' && item?.reviewNote ? (
          <View style={styles.rejectNote}>
            <Text style={styles.rejectNoteText}>{item.reviewNote}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function MyActivityScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { mode } = useTheme();
  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const { activities, loading } = useCitizenActivities(isFocused ? 1 : 0);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  const list = Array.isArray(activities) ? activities : [];

  const counts = useMemo(
    () => ({
      all: list.length,
      approved: list.filter((a) => getStatus(a) === 'approved').length,
      pending: list.filter((a) => getStatus(a) === 'pending').length,
      rejected: list.filter((a) => getStatus(a) === 'rejected').length,
    }),
    [list]
  );

  const filteredActivities = useMemo(
    () => (selectedTab === 'all' ? list : list.filter((a) => getStatus(a) === selectedTab)),
    [list, selectedTab]
  );

  const closeImagePreview = useCallback(() => setSelectedImage(null), []);
  const handleImagePress = useCallback((item) => {
    const images = getImageUrls(item);
    if (images.length > 0) {
      setSelectedImage({ images, index: 0 });
    }
  }, []);

  const goToPreviousImage = useCallback(() => {
    setSelectedImage((current) => (current && current.index > 0 ? { ...current, index: current.index - 1 } : current));
  }, []);

  const goToNextImage = useCallback(() => {
    setSelectedImage((current) =>
      current && current.index < current.images.length - 1 ? { ...current, index: current.index + 1 } : current
    );
  }, []);

  if (loading) {
    return <MyActivitySkeleton />;
  }

  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        data={filteredActivities}
        keyExtractor={(item, i) => item?.id?.toString() || item?._id || String(item?.activityId) || String(i)}
        renderItem={({ item }) => <ActivityCard item={item} t={t} styles={styles} onImagePress={handleImagePress} />}
        ListHeaderComponent={
          <>
            {/* ── Hero ── */}
            <View style={styles.hero}>
              <WaveBar primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />

              <View style={styles.heroWaveWrap} pointerEvents="none">
                <HeroWave primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />
              </View>

              <View style={styles.heroKicker}>
                <Text style={styles.eyebrow}>YOUR RECORD</Text>
                <WaveMark color={t.borderGlow} primary={t.primary} />
              </View>

              <View style={styles.h1Row}>
                <Ionicons name="list-outline" size={20} color={t.primary} style={styles.h1Icon} />
                <Text style={styles.h1}>
                  My <Text style={styles.h1Accent}>activities.</Text>
                </Text>
              </View>
              <Text style={styles.heroSub}>
                Every cleanup you've logged, in one place — a running record of your environmental impact
                contributions.
              </Text>

              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Submit')} style={styles.ctaWrap}>
                <LinearGradient
                  colors={[t.primary, t.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>Submit Activity</Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── Filters ── */}
            {list.length > 0 ? (
              <View style={styles.toolbar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                  {FILTERS.map((f) => (
                    <FilterPill
                      key={f.key}
                      t={t}
                      styles={styles}
                      filter={f}
                      active={selectedTab === f.key}
                      count={counts[f.key]}
                      onPress={() => setSelectedTab(f.key)}
                    />
                  ))}
                </ScrollView>
                {/* <Text style={styles.countText}>
                  Showing {filteredActivities.length} of {list.length}
                </Text> */}
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          list.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🌊</Text>
              <Text style={styles.emptyText}>No activities submitted yet. Start cleaning!</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Submit')} style={styles.ctaWrap}>
                <LinearGradient
                  colors={[t.primary, t.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>Log your first cleanup</Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔎</Text>
              <Text style={styles.emptyText}>
                No {FILTERS.find((f) => f.key === selectedTab)?.label.toLowerCase()} activities to show.
              </Text>
            </View>
          )
        }
      />

      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={closeImagePreview}>
        <Pressable style={styles.modalOverlay} onPress={closeImagePreview}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {selectedImage ? `${selectedImage.index + 1}/${selectedImage.images.length}` : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeImagePreview} activeOpacity={0.8}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedImage ? (
              <View style={styles.modalImageWrapper}>
                <TouchableOpacity
                  style={styles.modalNavArrowLeft}
                  onPress={goToPreviousImage}
                  activeOpacity={0.8}
                  disabled={selectedImage.index === 0}
                >
                  <Text style={styles.modalNavArrowText}>‹</Text>
                </TouchableOpacity>
                <ZoomableImage uri={selectedImage.images[selectedImage.index]} style={styles.modalImage} />
                <TouchableOpacity
                  style={styles.modalNavArrowRight}
                  onPress={goToNextImage}
                  activeOpacity={0.8}
                  disabled={selectedImage.index === selectedImage.images.length - 1}
                >
                  <Text style={styles.modalNavArrowText}>›</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {selectedImage && selectedImage.images.length > 1 ? (
              <View style={styles.thumbnailSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScroll}>
                  {selectedImage.images.map((uri, index) => (
                    <TouchableOpacity
                      key={`${uri}-${index}`}
                      onPress={() => setSelectedImage({ ...selectedImage, index })}
                      activeOpacity={0.8}
                      style={[styles.thumbnailWrapper, selectedImage.index === index && { borderColor: t.borderGlow }]}
                    >
                      <Image source={{ uri, cache: 'force-cache' }} style={styles.thumbnailImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </Background>
  );
}

const getStyles = (t) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 80,
    },
    hero: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 20,
      paddingBottom: 66,
      marginBottom: 14,
    },
    heroWaveWrap: {
      position: 'absolute',
      right: -20,
      bottom: -18,
      opacity: 0.5,
    },
    heroKicker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    eyebrow: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2.2,
      opacity: 0.85,
    },
    h1Row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    h1Icon: {
      marginTop: 2,
    },
    h1: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 22,
      lineHeight: 29,
      letterSpacing: -0.3,
    },
    h1Accent: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.serifItalic,
      fontSize: 24,
    },
    heroSub: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 10,
    },
    ctaWrap: {
      marginTop: 18,
      alignSelf: 'flex-start',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
    },
    ctaText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5,
    },
    ctaArrow: {
      color: '#ffffff',
      fontSize: 14,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    toolbar: {
      marginBottom: 14,
    },
    filters: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 14,
      padding: 5,
      gap: 4,
    },
    filterWrap: {
      borderRadius: 10,
      overflow: 'hidden',
    },
    filterPill: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 10,
    },
    filterText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
    },
    filterCount: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11,
      opacity: 0.85,
    },
    filterTextActive: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
    },
    filterCountActive: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11,
      opacity: 0.85,
    },
    countText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      marginTop: 8,
      textAlign: 'right',
    },
    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 12,
    },
    media: {
      width: '100%',
      height: 172,
      backgroundColor: t.surfaceHover,
      position: 'relative',
    },
    mediaImage: {
      width: '100%',
      height: '100%',
    },
    mediaPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mediaPlaceholderIcon: {
      fontSize: 36,
    },
    mediaBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    mediaBadgeText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    mediaDate: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(4,18,31,0.72)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    mediaDateText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 10.5,
    },
    mediaMore: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(4,18,31,0.82)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    mediaMoreText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10,
    },
    cardBody: {
      padding: 16,
    },
    location: {
      color: t.primaryHover,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 15,
      lineHeight: 20,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    chip: {
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    chipText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12,
    },
    chipStrong: {
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    rejectNote: {
      marginTop: 10,
      backgroundColor: t.dangerBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    rejectNoteText: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      lineHeight: 16,
    },
    empty: {
      alignItems: 'center',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      borderStyle: 'dashed',
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    emptyIcon: {
      fontSize: 28,
      marginBottom: 10,
      opacity: 0.8,
    },
    emptyText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalImage: {
      width: '100%',
      height: '80%',
      borderRadius: 20,
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 2,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 999,
      width: 42,
      height: 42,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 20,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    modalHeader: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    counterBadge: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      alignSelf: 'flex-start',
    },
    counterText: {
      color: '#fff',
      fontSize: 14,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    modalImageWrapper: {
      width: '100%',
      height: '70%',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    modalNavArrowLeft: {
      position: 'absolute',
      left: 8,
      top: '50%',
      transform: [{ translateY: -22 }],
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3,
    },
    modalNavArrowRight: {
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: [{ translateY: -22 }],
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3,
    },
    modalNavArrowText: {
      color: '#fff',
      fontSize: 28,
      lineHeight: 28,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    thumbnailSection: {
      marginTop: 16,
      width: '100%',
    },
    thumbnailScroll: {
      paddingVertical: 8,
    },
    thumbnailWrapper: {
      marginRight: 12,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbnailImage: {
      width: 80,
      height: 80,
      borderRadius: 16,
    },
  });

import React, { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCitizenActivities } from '../services/citizenHooks';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
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

function getImageUrls(item) {
  const candidateSources = [
    item.images,
    item.imageUrls,
    item.imageGatewayUrl,
    item.imageIpfsUrl,
    item.imageCid,
    item.image
  ];

  for (const source of candidateSources) {
    const values = Array.isArray(source)
      ? source
      : typeof source === 'string' && source.length > 0
        ? [source]
        : [];

    const normalized = values
      .map((value) => normalizeImageUrl(value))
      .filter(Boolean);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [];
}

const ActivityCard = memo(function ActivityCard({ item, styles, onImagePress }) {
  const activityDate = item && item.timestamp ? new Date(item.timestamp) : null;
  const imageUrls = getImageUrls(item || {});
  const imageUri = imageUrls[0] || null;
  const photoCount = imageUrls.length || 0;

  return (
    <GlassCard style={styles.activityCard}>
      <TouchableOpacity
        style={styles.activityImageWrapper}
        activeOpacity={0.9}
        onPress={() => imageUri && onImagePress(item)}
        disabled={!imageUri}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.activityImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>🖼️</Text>
          </View>
        )}

        <View style={[
          styles.statusBadge,
          item && item.status === 'rejected' ? styles.statusBadgeRejected : item && item.status !== 'approved' && styles.statusBadgePending
        ]}>
          <Text style={styles.statusBadgeText}>
            {item && item.status === 'approved' ? '✔ VERIFIED' : item && (item.status === 'pending' || item.status === 'submitted') ? '⦿ PENDING' : item && item.status === 'rejected' ? '✖ REJECTED' : (item && item.status) || ''}
          </Text>
        </View>

        {photoCount > 1 ? (
          <View style={styles.moreBadge}>
            <Text style={styles.moreBadgeText}>+{photoCount - 1} more</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.activityHeader}>
        <View style={styles.activityHeaderLeft}>
          <Text style={styles.activityLocation}>{item && (item.location || 'Unknown location')}</Text>
          <Text style={styles.activitySubtext}>{item && (item.city || item.address || '')}</Text>
        </View>
        <Text style={styles.activityDate}>{activityDate ? activityDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</Text>
      </View>

      <View style={styles.activityDetailsRow}>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{item && (item.category || 'Plastic')}</Text>
        </View>
        <View style={styles.detailBlockRight}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.quantityValue}>{item && typeof item.quantity === 'number' ? `${item.quantity.toFixed(2)} kg` : item && (item.quantity || '0.00 kg')}</Text>
        </View>
      </View>
    </GlassCard>
  );
});

export default function MyActivityScreen() {
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { activities, loading } = useCitizenActivities(isFocused ? 1 : 0);
  const [selectedTab, setSelectedTab] = useState('all');

  const counts = useMemo(() => {
    const list = Array.isArray(activities) ? activities : [];
    const total = list.length;
    const approved = list.filter(a => a.status === 'approved').length;
    const pending = list.filter(a => a.status === 'pending' || a.status === 'submitted').length;
    const rejected = list.filter(a => a.status === 'rejected').length;
    return { total, approved, pending, rejected };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const list = Array.isArray(activities) ? activities : [];
    if (selectedTab === 'all') return list;
    if (selectedTab === 'approved') return list.filter(a => a.status === 'approved');
    if (selectedTab === 'pending') return list.filter(a => a.status === 'pending' || a.status === 'submitted');
    if (selectedTab === 'rejected') return list.filter(a => a.status === 'rejected');
    return list;
  }, [activities, selectedTab]);
  const [selectedImage, setSelectedImage] = React.useState(null);

  const closeImagePreview = useCallback(() => setSelectedImage(null), []);
  const handleImagePress = useCallback((item) => {
    const images = getImageUrls(item);
    if (images.length > 0) {
      setSelectedImage({ images, index: 0 });
    }
  }, []);

  const goToPreviousImage = useCallback(() => {
    setSelectedImage((current) =>
      current && current.index > 0
        ? { ...current, index: current.index - 1 }
        : current
    );
  }, []);

  const goToNextImage = useCallback(() => {
    setSelectedImage((current) =>
      current && current.index < current.images.length - 1
        ? { ...current, index: current.index + 1 }
        : current
    );
  }, []);

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>My Activities</Text>
      <Text style={styles.subtitle}>A record of your environmental impact contributions.</Text>

      {loading ? (
        <MyActivitySkeleton />
      ) : activities.length === 0 ? (
        <GlassCard>
          <Text style={styles.emptyText}>No activities found yet. Submit your first cleanup report to get started.</Text>
        </GlassCard>
      ) : (
        <>
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
              <TouchableOpacity style={[styles.tabPill, selectedTab === 'all' && styles.tabPillActive]} onPress={() => setSelectedTab('all')}>
                <Text style={[styles.tabPillText, selectedTab === 'all' && styles.tabPillTextActive]}>All ({counts.total})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabPill, selectedTab === 'approved' && styles.tabPillActive]} onPress={() => setSelectedTab('approved')}>
                <Text style={[styles.tabPillText, selectedTab === 'approved' && styles.tabPillTextActive]}>Verified ({counts.approved})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabPill, selectedTab === 'pending' && styles.tabPillActive]} onPress={() => setSelectedTab('pending')}>
                <Text style={[styles.tabPillText, selectedTab === 'pending' && styles.tabPillTextActive]}>Pending ({counts.pending})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabPill, selectedTab === 'rejected' && styles.tabPillActive]} onPress={() => setSelectedTab('rejected')}>
                <Text style={[styles.tabPillText, selectedTab === 'rejected' && styles.tabPillTextActive]}>Rejected ({counts.rejected})</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <FlatList
            data={filteredActivities}
          keyExtractor={(item) => item.id?.toString() || item._id || String(item.activityId) || String(Math.random())}
          renderItem={({ item }) => <ActivityCard item={item} styles={styles} onImagePress={handleImagePress} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        </>
      )}

      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={closeImagePreview}>
        <Pressable style={styles.modalOverlay} onPress={closeImagePreview}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>{selectedImage ? `${selectedImage.index + 1}/${selectedImage.images.length}` : ''}</Text>
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
                <Image source={{ uri: selectedImage.images[selectedImage.index] }} style={styles.modalImage} resizeMode="contain" />
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailScroll}
                >
                  {selectedImage.images.map((uri, index) => (
                    <TouchableOpacity
                      key={`${uri}-${index}`}
                      onPress={() => setSelectedImage({ ...selectedImage, index })}
                      activeOpacity={0.8}
                      style={[styles.thumbnailWrapper, selectedImage.index === index && styles.thumbnailWrapperActive]}
                    >
                      <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  title: {
    color: theme.colors.textMain,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    color: theme.colors.textMuted,
    marginBottom: 18,
    lineHeight: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  listContent: {
    paddingBottom: 16
  },
  tabBar: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
    alignItems: 'center'
  },
  tabContainer: {
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 10,
    overflow: 'hidden'
  },
  tabPill: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  tabPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  tabPillText: {
    color: theme.colors.textMuted,
    fontWeight: '700'
  },
  tabPillTextActive: {
    color: theme.colors.textMain
  },
  activityCard: {
      padding: 16,
    overflow: 'hidden'
  },
  activityImageWrapper: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14
  },
  activityImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    fontSize: 44,
    color: theme.colors.textMuted
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 128, 80, 0.95)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  statusBadgePending: {
    backgroundColor: 'rgba(234, 150, 25, 0.95)'
  },
  statusBadgeRejected: {
    backgroundColor: 'rgba(204, 40, 40, 0.95)'
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  moreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  moreBadgeText: {
    color: '#fff',
    fontSize: 12
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    paddingBottom: 12
  },
  activityHeaderLeft: {
    flex: 1,
    paddingRight: 12
  },
  activityLocation: {
    color: theme.colors.textMain,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  activitySubtext: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  activityDate: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  activityDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 18
  },
  detailBlock: {
    flex: 1
  },
  detailBlockRight: {
    alignItems: 'flex-end'
  },
  detailLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 6
  },
  detailValue: {
    color: theme.colors.textMain,
    fontWeight: '700'
  },
  quantityValue: {
    color: theme.colors.textMain,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalImage: {
    width: '100%',
    height: '80%',
    borderRadius: 20
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
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  counterBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start'
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  modalImageWrapper: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
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
    zIndex: 3
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
    zIndex: 3
  },
  modalNavArrowText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '700'
  },
  thumbnailSection: {
    marginTop: 16,
    width: '100%'
  },
  thumbnailScroll: {
    paddingVertical: 8
  },
  thumbnailWrapper: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  thumbnailWrapperActive: {
    borderColor: '#4dd0e1'
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 16
  }
});

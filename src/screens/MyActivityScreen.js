import React from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCitizenActivities } from '../services/citizenHooks';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';

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
    if (Array.isArray(source)) {
      const filtered = source.filter((value) => typeof value === 'string' && value.length > 0);
      if (filtered.length > 0) {
        return filtered;
      }
    }

    if (typeof source === 'string' && source.length > 0) {
      return [source];
    }
  }

  return [];
}

function ActivityCard({ item, styles, onImagePress }) {
  const activityDate = item.timestamp ? new Date(item.timestamp) : null;
  const imageUrls = getImageUrls(item);
  const imageUri = imageUrls[0] || null;
  const photoCount = imageUrls.length;

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
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{item.status || 'Approved'}</Text>
        </View>
        {photoCount > 1 ? (
          <View style={styles.moreBadge}>
            <Text style={styles.moreBadgeText}>+{photoCount - 1} more</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <View style={styles.activityHeader}>
        <View style={styles.activityHeaderLeft}>
          <Text style={styles.activityLocation}>{item.location || 'Unknown location'}</Text>
          <Text style={styles.activitySubtext}>{item.city || item.address || ''}</Text>
        </View>
        <Text style={styles.activityDate}>{activityDate ? activityDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</Text>
      </View>
      <View style={styles.activityDetailsRow}>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{item.category || 'Plastic'}</Text>
        </View>
        <View style={styles.detailBlockRight}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.quantityValue}>{typeof item.waste === 'number' ? `${item.waste.toFixed(2)} kg` : item.waste || '0.00 kg'}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function MyActivityScreen() {
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { activities, loading } = useCitizenActivities(isFocused ? 1 : 0);
  const [selectedImage, setSelectedImage] = React.useState(null);

  const closeImagePreview = () => setSelectedImage(null);
  const handleImagePress = (item) => {
    const images = getImageUrls(item);
    if (images.length > 0) {
      setSelectedImage({ images, index: 0 });
    }
  };

  const goToPreviousImage = () => {
    setSelectedImage((current) =>
      current && current.index > 0
        ? { ...current, index: current.index - 1 }
        : current
    );
  };

  const goToNextImage = () => {
    setSelectedImage((current) =>
      current && current.index < current.images.length - 1
        ? { ...current, index: current.index + 1 }
        : current
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>My Activities</Text>
      <Text style={styles.subtitle}>A record of your environmental impact contributions.</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activities.length === 0 ? (
        <GlassCard>
          <Text style={styles.emptyText}>No activities found yet. Submit your first cleanup report to get started.</Text>
        </GlassCard>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id?.toString() || item._id || String(item.activityId) || String(Math.random())}
          renderItem={({ item }) => <ActivityCard item={item} styles={styles} onImagePress={handleImagePress} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingTop: 44,
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
  activityCard: {
    padding: 0,
    overflow: 'hidden'
  },
  activityImageWrapper: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.surfaceAlt
  },
  activityImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    fontSize: 36,
    color: theme.colors.textMuted
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 128, 80, 0.95)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
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

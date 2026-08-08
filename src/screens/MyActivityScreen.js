import React from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCitizenActivities } from '../services/citizenHooks';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';

function ActivityCard({ item, styles }) {
  const activityDate = item.timestamp ? new Date(item.timestamp) : null;
  const imageSource =
    item.imageGatewayUrl?.[0] ||
    item.imageIpfsUrl?.[0] ||
    item.imageCid?.[0] ||
    null;

  const photoCount =
    Math.max(
      item.imageGatewayUrl?.length || 0,
      item.imageIpfsUrl?.length || 0,
      item.imageCid?.length || 0
    );
  const validImage = typeof imageSource === 'string' && imageSource.length > 0;
  const imageUri = validImage
    ? imageSource.startsWith('http')
      ? imageSource
      : imageSource.startsWith('ipfs://')
      ? imageSource.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
      : `https://ocean-cleanup-cardano.vercel.app${imageSource}`
    : null;

  return (
    <GlassCard style={styles.activityCard}>
      <View style={styles.activityImageWrapper}>
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
      </View>
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
          renderItem={({ item }) => <ActivityCard item={item} styles={styles} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  }
});

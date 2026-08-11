import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenContainer from './ScreenContainer';
import GlassCard from './GlassCard';
import Skeleton, { SkeletonRow } from './Skeleton';

/**
 * Skeleton placeholder for MyActivityScreen.
 * Mirrors: page title/subtitle → list of activity cards (image + details).
 */
const MyActivitySkeleton = memo(function MyActivitySkeleton() {
  return (
    <ScreenContainer style={styles.container}>

      {/* ── Page header ───────────────────────────────────────────── */}
      <Skeleton width={160} height={26} borderRadius={8} style={styles.mb8} />
      <Skeleton width="75%" height={13} borderRadius={6} style={styles.mb22} />

      {/* ── Activity cards ────────────────────────────────────────── */}
      {[0, 1, 2, 3].map((i) => (
        <GlassCard key={i} style={styles.card}>

          {/* Photo area */}
          <Skeleton height={160} borderRadius={0} style={styles.imageSkeleton} />

          {/* Header row */}
          <View style={styles.cardBody}>
            <SkeletonRow style={styles.headerRow}>
              <View style={styles.flex1}>
                <Skeleton width="70%" height={15} borderRadius={7} style={styles.mb8} />
                <Skeleton width="50%" height={12} borderRadius={6} />
              </View>
              <Skeleton width={64} height={12} borderRadius={6} />
            </SkeletonRow>

            {/* Details row */}
            <SkeletonRow style={styles.detailRow}>
              <View style={styles.flex1}>
                <Skeleton width={56} height={11} borderRadius={6} style={styles.mb6} />
                <Skeleton width={72} height={14} borderRadius={7} />
              </View>
              <View style={styles.detailRight}>
                <Skeleton width={56} height={11} borderRadius={6} style={styles.mb6} />
                <Skeleton width={72} height={14} borderRadius={7} />
              </View>
            </SkeletonRow>
          </View>

        </GlassCard>
      ))}

    </ScreenContainer>
  );
});

export default MyActivitySkeleton;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 32
  },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb22: { marginBottom: 22 },
  card: { padding: 0, overflow: 'hidden' },
  imageSkeleton: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  cardBody: {
    padding: 18,
    paddingBottom: 18
  },
  headerRow: {
    alignItems: 'flex-start',
    marginBottom: 14
  },
  detailRow: {
    alignItems: 'flex-start'
  },
  flex1: { flex: 1 },
  detailRight: { alignItems: 'flex-end' }
});

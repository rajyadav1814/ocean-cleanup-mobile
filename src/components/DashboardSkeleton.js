import React, { memo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import ScreenContainer from './ScreenContainer';
import GlassCard from './GlassCard';
import Skeleton, { SkeletonRow } from './Skeleton';

/**
 * Skeleton placeholder for DashboardScreen.
 * Mirrors the real layout: hero card → stats grid → badges → leaderboard → feed.
 */
const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} pointerEvents="none">

        {/* ── Hero card ─────────────────────────────────────────────── */}
        <GlassCard style={styles.heroCard}>
          <Skeleton width={90} height={11} borderRadius={6} style={styles.mb10} />
          <Skeleton height={28} borderRadius={8} style={styles.mb10} />
          <Skeleton width="70%" height={28} borderRadius={8} style={styles.mb14} />
          <Skeleton width="55%" height={13} borderRadius={6} style={styles.mb18} />
          <Skeleton width={100} height={32} borderRadius={14} style={styles.mb18} />
          <Skeleton height={52} borderRadius={16} />
        </GlassCard>

        {/* ── Stats 2×2 grid ────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <GlassCard key={i} style={styles.statCard}>
              <Skeleton width={56} height={28} borderRadius={8} style={styles.mb8} />
              <Skeleton width={72} height={12} borderRadius={6} />
            </GlassCard>
          ))}
        </View>

        {/* ── Badges ───────────────────────────────────────────────── */}
        <GlassCard>
          <Skeleton width={120} height={16} borderRadius={8} style={styles.mb8} />
          <Skeleton width="80%" height={12} borderRadius={6} style={styles.mb18} />
          <View style={styles.badgeGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.badgeTile}>
                <Skeleton width={40} height={40} borderRadius={12} style={styles.mb10} />
                <Skeleton width="80%" height={12} borderRadius={6} style={styles.mb6} />
                <Skeleton width="55%" height={10} borderRadius={6} />
              </View>
            ))}
          </View>
        </GlassCard>

        {/* ── Leaderboard ──────────────────────────────────────────── */}
        <GlassCard>
          <Skeleton width={140} height={16} borderRadius={8} style={styles.mb8} />
          <Skeleton width="65%" height={12} borderRadius={6} style={styles.mb18} />
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} style={styles.leaderRow}>
              <Skeleton width={28} height={14} borderRadius={6} />
              <View style={styles.flex1}>
                <Skeleton width="60%" height={13} borderRadius={6} style={styles.mb6} />
                <Skeleton width="35%" height={11} borderRadius={6} />
              </View>
            </SkeletonRow>
          ))}
        </GlassCard>

        {/* ── Feed ─────────────────────────────────────────────────── */}
        <GlassCard>
          <Skeleton width={130} height={16} borderRadius={8} style={styles.mb8} />
          <Skeleton width="70%" height={12} borderRadius={6} style={styles.mb18} />
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} style={styles.feedRow}>
              <Skeleton width={42} height={42} borderRadius={21} />
              <View style={styles.flex1}>
                <Skeleton width="45%" height={13} borderRadius={6} style={styles.mb6} />
                <Skeleton width="75%" height={11} borderRadius={6} style={styles.mb8} />
                <SkeletonRow>
                  <Skeleton width={50} height={10} borderRadius={6} />
                  <Skeleton width={50} height={10} borderRadius={6} />
                  <Skeleton width={50} height={10} borderRadius={6} />
                </SkeletonRow>
              </View>
              <Skeleton width={60} height={26} borderRadius={999} />
            </SkeletonRow>
          ))}
        </GlassCard>

      </ScrollView>
    </ScreenContainer>
  );
});

export default DashboardSkeleton;

const styles = StyleSheet.create({
  heroCard: { marginTop: 25, paddingBottom: 22 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: 18 },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  badgeTile: { width: '48%', marginBottom: 12 },
  leaderRow: { paddingVertical: 14, borderBottomWidth: 0 },
  feedRow: { paddingVertical: 14, alignItems: 'flex-start', borderBottomWidth: 0 },
  flex1: { flex: 1 },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb14: { marginBottom: 14 },
  mb18: { marginBottom: 18 }
});

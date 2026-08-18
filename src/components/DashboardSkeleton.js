import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenContainer from './ScreenContainer';

/**
 * Skeleton placeholder for DashboardScreen.
 * Mirrors the real layout: hero card → stats grid → badges → leaderboard → feed.
 */
const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    </ScreenContainer>
  );
});

export default DashboardSkeleton;

const styles = StyleSheet.create({
  heroCard: { marginTop: 125, paddingBottom: 22 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

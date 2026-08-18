import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenContainer from './ScreenContainer';

/**
 * Skeleton placeholder for MyActivityScreen.
 * Mirrors: page title/subtitle → list of activity cards (image + details).
 */
const MyActivitySkeleton = memo(function MyActivitySkeleton() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

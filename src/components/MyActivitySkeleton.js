import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { getCitizenTheme } from '../styles/citizenTheme';

/**
 * Loading placeholder for MyActivityScreen — matches the citizen dashboard's
 * light/dark background so there's no flash between skeleton and content.
 */
const MyActivitySkeleton = memo(function MyActivitySkeleton() {
  const { mode } = useTheme();
  const t = getCitizenTheme(mode);
  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    </Background>
  );
});

export default MyActivitySkeleton;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { memo, useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * A single skeleton "bone" with a shimmer sweep animation.
 *
 * Props:
 *  width       {number|string}  – defaults to '100%'
 *  height      {number}         – defaults to 16
 *  borderRadius{number}         – defaults to 10
 *  style       {object}         – extra container style
 */
const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 10,
  style
}) {
  const { theme } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  // Theme-aware base and highlight colors
  const baseColor = useMemo(
    () => (theme === null ? '#1a2940' : theme.colors.surfaceAlt),
    [theme]
  );
  const highlightColor = useMemo(
    () => (theme === null ? '#243550' : theme.colors.border),
    [theme]
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const animatedBg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, highlightColor]
  });

  return (
    <Animated.View
      style={[
        styles.bone,
        { width, height, borderRadius, backgroundColor: animatedBg },
        style
      ]}
    />
  );
});

export default Skeleton;

/**
 * A convenience row of skeleton bones separated by a gap.
 */
export const SkeletonRow = memo(function SkeletonRow({ children, style }) {
  return <View style={[styles.row, style]}>{children}</View>;
});

const styles = StyleSheet.create({
  bone: {
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  }
});

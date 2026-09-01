import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const WAVE_WIDTH = 600;
const SCROLL_DURATION = 9000;

// Full-width decorative wave strip along the bottom of the hero card —
// mirrors the frontend's .co-wavebar signature strip. Two copies of the
// same SVG are placed side by side and translated together so the seam
// is invisible, giving a seamless looping scroll on the native driver.
function WaveLayer({ primary, secondary, borderGlow, height }) {
  return (
    <Svg width={WAVE_WIDTH} height={height} viewBox="0 0 600 120" preserveAspectRatio="none">
      <Path d="M0,50 Q75,20 150,50 T300,50 T450,50 T600,50 L600,120 L0,120 Z" fill={primary} opacity={0.18} />
      <Path d="M0,66 Q75,90 150,66 T300,66 T450,66 T600,66 L600,120 L0,120 Z" fill={secondary} opacity={0.14} />
      <Path
        d="M0,80 Q37.5,96 75,80 T150,80 T225,80 T300,80 T375,80 T450,80 T525,80 T600,80 L600,120 L0,120 Z"
        fill={borderGlow}
        opacity={0.16}
      />
    </Svg>
  );
}

export default function WaveBar({ primary, secondary, borderGlow, height = 56 }) {
  const translateX = useRef(new Animated.Value(-WAVE_WIDTH)).current;

  useEffect(() => {
    const scroll = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 0,
          duration: SCROLL_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, { toValue: -WAVE_WIDTH, duration: 0, useNativeDriver: true }),
      ])
    );
    scroll.start();
    return () => scroll.stop();
  }, [translateX]);

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        <WaveLayer primary={primary} secondary={secondary} borderGlow={borderGlow} height={height} />
        <WaveLayer primary={primary} secondary={secondary} borderGlow={borderGlow} height={height} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    width: WAVE_WIDTH * 2,
  },
});

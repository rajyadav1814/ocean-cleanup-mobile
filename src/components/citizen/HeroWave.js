import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const SPAN = 400;
const SCROLL_DURATION = 7000;

// The wave pattern repeats every 100 viewBox units, so a 400-unit copy is
// exactly 4 periods — shifting by SPAN loops seamlessly.
function WaveGlyph({ primary, secondary, borderGlow, height }) {
  return (
    <Svg width={SPAN} height={height} viewBox="0 0 400 200" fill="none">
      <Path d="M0,150 Q50,110 100,150 T200,150 T300,150 T400,150" stroke={primary} strokeWidth={2.4} opacity={0.5} />
      <Path d="M0,175 Q50,140 100,175 T200,175 T300,175 T400,175" stroke={secondary} strokeWidth={2.4} opacity={0.35} />
      <Path d="M0,125 Q50,90 100,125 T200,125 T300,125 T400,125" stroke={borderGlow} strokeWidth={2.4} opacity={0.4} />
    </Svg>
  );
}

export default function HeroWave({ width = 170, height = 90, primary, secondary, borderGlow }) {
  const translateX = useRef(new Animated.Value(-SPAN)).current;

  useEffect(() => {
    const scroll = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 0,
          duration: SCROLL_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, { toValue: -SPAN, duration: 0, useNativeDriver: true }),
      ])
    );
    scroll.start();
    return () => scroll.stop();
  }, [translateX]);

  return (
    <View style={[styles.clip, { width, height }]}>
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        <WaveGlyph primary={primary} secondary={secondary} borderGlow={borderGlow} height={height} />
        <WaveGlyph primary={primary} secondary={secondary} borderGlow={borderGlow} height={height} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    width: SPAN * 2,
  },
});

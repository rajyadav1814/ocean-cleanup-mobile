import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Full-width decorative wave strip along the bottom of the hero card —
// mirrors the frontend's .co-wavebar signature strip (static here, since
// the web version's infinite horizontal scroll isn't worth the RN cost).
export default function WaveBar({ primary, secondary, borderGlow, height = 56 }) {
  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <Svg width="100%" height={height} viewBox="0 0 600 120" preserveAspectRatio="none">
        <Path d="M0,50 Q75,20 150,50 T300,50 T450,50 T600,50 L600,120 L0,120 Z" fill={primary} opacity={0.18} />
        <Path d="M0,66 Q75,90 150,66 T300,66 T450,66 T600,66 L600,120 L0,120 Z" fill={secondary} opacity={0.14} />
        <Path
          d="M0,80 Q37.5,96 75,80 T150,80 T225,80 T300,80 T375,80 T450,80 T525,80 T600,80 L600,120 L0,120 Z"
          fill={borderGlow}
          opacity={0.16}
        />
      </Svg>
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
});

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function HeroWave({ width = 170, height = 90, primary, secondary, borderGlow }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 200" fill="none">
      <Path d="M0,150 Q50,110 100,150 T200,150 T300,150 T400,150" stroke={primary} strokeWidth={2.4} opacity={0.5} />
      <Path d="M0,175 Q50,140 100,175 T200,175 T300,175 T400,175" stroke={secondary} strokeWidth={2.4} opacity={0.35} />
      <Path d="M0,125 Q50,90 100,125 T200,125 T300,125 T400,125" stroke={borderGlow} strokeWidth={2.4} opacity={0.4} />
    </Svg>
  );
}

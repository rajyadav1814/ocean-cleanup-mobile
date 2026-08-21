import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export default function BluemindMark({ size = 22, color = '#F2F7FA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.25" stroke={color} strokeWidth="1.4" />
      <Path d="M2.9 9.6h18.2M2.9 14.4h18.2" stroke={color} strokeWidth="1.1" opacity="0.55" />
      <Path
        d="M12 2.75c2.6 2.6 3.9 5.7 3.9 9.25S14.6 18.65 12 21.25c-2.6-2.6-3.9-5.7-3.9-9.25S9.4 5.35 12 2.75Z"
        stroke={color}
        strokeWidth="1.1"
        opacity="0.55"
      />
    </Svg>
  );
}

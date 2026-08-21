import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function WaveMark({ width = 44, height = 13, color, primary }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 136 38" fill="none">
      <Path
        d="M1 12c13-11 27-11 40 0s27 11 40 0 27-11 40 0"
        stroke={color}
        strokeWidth={1.15}
        strokeLinecap="round"
        opacity={0.8}
      />
      <Path
        d="M12 20c13-11 27-11 40 0s27 11 40 0 27-11 40 0"
        stroke={primary}
        strokeWidth={1.35}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M1 28c13-11 27-11 40 0s27 11 40 0 27-11 40 0"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.48}
      />
    </Svg>
  );
}

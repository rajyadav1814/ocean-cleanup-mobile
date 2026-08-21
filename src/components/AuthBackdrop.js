import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Line, Mask, G } from 'react-native-svg';
import { AUTH_COLORS } from '../styles/authTheme';

function SignalDot({ left, top, delay }) {
  const opacity = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.8, duration: 2750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.18, duration: 2750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.signal, { left: `${left}%`, top: `${top}%`, opacity }]}
    />
  );
}

export default function AuthBackdrop({ signals = [] }) {
  const { width, height } = Dimensions.get('window');
  const cellSize = 46;

  const lines = useMemo(() => {
    const verticals = [];
    const horizontals = [];
    for (let x = 0; x <= width + cellSize; x += cellSize) verticals.push(x);
    for (let y = 0; y <= height + cellSize; y += cellSize) horizontals.push(y);
    return { verticals, horizontals };
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glowTop" cx="82%" cy="4%" r="60%">
            <Stop offset="0%" stopColor="#17587F" stopOpacity="0.65" />
            <Stop offset="45%" stopColor="#17587F" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#17587F" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glowBottom" cx="6%" cy="98%" r="65%">
            <Stop offset="0%" stopColor="#0A4F83" stopOpacity="0.6" />
            <Stop offset="45%" stopColor="#0A4F83" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#0A4F83" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="gridFade" cx="50%" cy="36%" r="70%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="55%" stopColor="#ffffff" stopOpacity="0.65" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
          <Mask id="gridMask">
            <Rect x={0} y={0} width={width} height={height} fill="url(#gridFade)" />
          </Mask>
        </Defs>

        <Rect x={0} y={0} width={width} height={height} fill="url(#glowTop)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#glowBottom)" />

        <G mask="url(#gridMask)">
          {lines.verticals.map((x) => (
            <Line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
          ))}
          {lines.horizontals.map((y) => (
            <Line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
          ))}
        </G>
      </Svg>

      {signals.map((s, i) => (
        <SignalDot key={i} left={s.left} top={s.top} delay={s.delay || 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  signal: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AUTH_COLORS.sky,
    shadowColor: AUTH_COLORS.sky,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

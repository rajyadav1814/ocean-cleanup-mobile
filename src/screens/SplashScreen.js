import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { AUTH_COLORS, AUTH_GRADIENT, AUTH_FONTS } from '../styles/authTheme';
import AuthBackdrop from '../components/AuthBackdrop';
import BluemindMark from '../components/BluemindMark';

const SIGNALS = [
  { left: 16, top: 22, delay: 300 },
  { left: 82, top: 68, delay: 1800 },
];

// Same swell family as WaveBar, tiled twice and translated in a seamless
// horizontal loop — WaveBar stays static (it repeats on every screen), but
// a one-time splash can afford the animated version.
const WAVE_LAYERS = [
  { d: 'M0,50 Q75,20 150,50 T300,50 T450,50 T600,50 L600,160 L0,160 Z', fill: AUTH_COLORS.marine, opacity: 0.5, duration: 9000 },
  { d: 'M0,70 Q75,100 150,70 T300,70 T450,70 T600,70 L600,160 L0,160 Z', fill: AUTH_COLORS.cobalt, opacity: 0.55, duration: 7000 },
  {
    d: 'M0,92 Q37.5,110 75,92 T150,92 T225,92 T300,92 T375,92 T450,92 T525,92 T600,92 L600,160 L0,160 Z',
    fill: AUTH_COLORS.tealLight,
    opacity: 0.85,
    duration: 5000
  }
];

function WaveLayer({ d, fill, opacity, duration, width, height }) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translateX, width, duration]);

  return (
    <Animated.View style={[styles.waveLayer, { width: width * 2, height, transform: [{ translateX }] }]}>
      <Svg width={width} height={height} viewBox="0 0 600 160" preserveAspectRatio="none">
        <Path d={d} fill={fill} opacity={opacity} />
      </Svg>
      <Svg width={width} height={height} viewBox="0 0 600 160" preserveAspectRatio="none">
        <Path d={d} fill={fill} opacity={opacity} />
      </Svg>
    </Animated.View>
  );
}

export default function SplashScreen() {
  const progress = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false // JS driver for text shadow
    }).start();
  }, [progress]);

  const shadowRadius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40]
  });

  const shadowColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(111,201,196,0)', 'rgba(111,201,196,0.9)']
  });

  return (
    <LinearGradient colors={AUTH_GRADIENT} start={{ x: 0.85, y: 0 }} end={{ x: 0.15, y: 1 }} style={styles.container}>
      <AuthBackdrop signals={SIGNALS} />

      <View style={styles.center}>
        <Animated.View style={{ opacity: progress }}>
          <BluemindMark size={44} color={AUTH_COLORS.onDark} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.brandText,
            {
              opacity: progress,
              textShadowColor: shadowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: shadowRadius
            }
          ]}
        >
          BLUEMIND
        </Animated.Text>
      </View>

      <View style={styles.waveStack} pointerEvents="none">
        {WAVE_LAYERS.map((layer, i) => (
          <WaveLayer key={i} {...layer} width={screenWidth} height={160} />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    alignItems: 'center',
    gap: 14
  },
  brandText: {
    fontSize: 30,
    letterSpacing: 4,
    color: AUTH_COLORS.onDark,
    fontFamily: AUTH_FONTS.sansBold
  },
  waveStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    overflow: 'hidden'
  },
  waveLayer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    flexDirection: 'row'
  }
});

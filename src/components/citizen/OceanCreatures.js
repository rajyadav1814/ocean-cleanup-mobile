import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

function Fish({ color, size = 22 }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 40 24" fill="none">
      <Path d="M2 12 C10 2, 26 2, 34 12 C26 22, 10 22, 2 12 Z" fill={color} opacity={0.85} />
      <Path d="M34 12 L40 4 L40 20 Z" fill={color} opacity={0.85} />
      <Circle cx="10" cy="10" r="1.6" fill="#ffffff" opacity={0.9} />
    </Svg>
  );
}

function Whale({ color, size = 34 }) {
  return (
    <Svg width={size} height={size * 0.55} viewBox="0 0 64 34" fill="none">
      <Path
        d="M4 18 C4 8, 20 4, 34 6 C48 8, 58 12, 58 18 C58 24, 44 28, 28 28 C14 28, 4 26, 4 18 Z"
        fill={color}
        opacity={0.85}
      />
      <Path d="M58 18 L64 10 L60 18 L64 26 Z" fill={color} opacity={0.85} />
      <Circle cx="14" cy="14" r="1.8" fill="#ffffff" opacity={0.9} />
    </Svg>
  );
}

function Octopus({ color, size = 24 }) {
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 40 36" fill="none">
      <Circle cx="14" cy="14" r="12" fill={color} opacity={0.85} />
      <Circle cx="10" cy="11" r="1.6" fill="#ffffff" opacity={0.9} />
      <Circle cx="18" cy="11" r="1.6" fill="#ffffff" opacity={0.9} />
      <Path d="M6 22 Q4 28, 8 34" stroke={color} strokeWidth={2.4} opacity={0.75} strokeLinecap="round" />
      <Path d="M12 24 Q12 30, 14 36" stroke={color} strokeWidth={2.4} opacity={0.75} strokeLinecap="round" />
      <Path d="M18 24 Q20 30, 18 36" stroke={color} strokeWidth={2.4} opacity={0.75} strokeLinecap="round" />
      <Path d="M24 22 Q28 27, 26 33" stroke={color} strokeWidth={2.4} opacity={0.75} strokeLinecap="round" />
    </Svg>
  );
}

function Turtle({ color, size = 26 }) {
  return (
    <Svg width={size} height={size * 0.68} viewBox="0 0 44 30" fill="none">
      <Path d="M10 8 L3 3 L8 12 Z" fill={color} opacity={0.75} />
      <Path d="M10 22 L3 27 L8 18 Z" fill={color} opacity={0.75} />
      <Path d="M34 8 L41 3 L36 12 Z" fill={color} opacity={0.75} />
      <Path d="M34 22 L41 27 L36 18 Z" fill={color} opacity={0.75} />
      <Ellipse cx="22" cy="15" rx="14" ry="10" fill={color} opacity={0.85} />
      <Circle cx="22" cy="15" r="7" fill={color} opacity={0.45} />
      <Circle cx="38" cy="14" r="3.6" fill={color} opacity={0.85} />
    </Svg>
  );
}

// One creature swimming a straight loop across the hero card, with a gentle
// vertical bob layered on top so the motion reads as swimming rather than
// sliding. Runs entirely on the native driver (translate-only transforms).
function SwimmingCreature({ Icon, color, size, bottom, duration, delay, facesRight }) {
  const progress = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const swim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const wobble = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    swim.start();
    wobble.start();
    return () => {
      swim.stop();
      wobble.stop();
    };
  }, [progress, bob, duration, delay]);

  // All creatures swim left-to-right, mirroring the wave scroll direction.
  const startX = -size - 20;
  const endX = SCREEN_WIDTH + 20;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [startX, endX] });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });

  return (
    <Animated.View
      style={[
        styles.creature,
        {
          bottom,
          transform: [
            { translateX },
            { translateY },
            // Flip only artwork that's drawn facing left by default, so
            // every creature ends up facing the direction it's moving.
            { scaleX: facesRight ? 1 : -1 },
          ],
        },
      ]}
    >
      <Icon color={color} size={size} />
    </Animated.View>
  );
}

export default function OceanCreatures({ primary, secondary, borderGlow }) {
  return (
    <>
      <SwimmingCreature Icon={Fish} color={primary} size={20} bottom={34} duration={9000} delay={0} />
      <SwimmingCreature Icon={Octopus} color={secondary} size={20} bottom={16} duration={10500} delay={3600} />
      <SwimmingCreature Icon={Fish} color={secondary} size={15} bottom={12} duration={7000} delay={1800} />
      <SwimmingCreature Icon={Fish} color={borderGlow} size={17} bottom={44} duration={8000} delay={4200} />
      <SwimmingCreature Icon={Fish} color={primary} size={13} bottom={6} duration={6500} delay={5600} />
      <SwimmingCreature Icon={Turtle} color={borderGlow} size={24} bottom={22} duration={13000} delay={2600} facesRight />
      <SwimmingCreature Icon={Turtle} color={secondary} size={18} bottom={38} duration={11000} delay={7200} facesRight />
      <SwimmingCreature Icon={Whale} color={primary} size={34} bottom={4} duration={17000} delay={500} />
      <SwimmingCreature Icon={Octopus} color={secondary} size={20} bottom={16} duration={10500} delay={3600} />
    </>
  );
}

const styles = StyleSheet.create({
  creature: {
    position: 'absolute',
    left: 0,
  },
});

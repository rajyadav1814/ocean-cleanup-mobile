import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandContainer: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12
  },
  brandText: {
    color: theme.colors.primary,
    fontSize: 46,
    letterSpacing: 1.3,
    fontWeight: '800'
  }
});

export default function SplashScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const zoomSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 1300,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 1300,
          easing: Easing.inOut(Easing.exp),
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 1300,
          easing: Easing.inOut(Easing.exp),
          useNativeDriver: true
        })
      ])
    );

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true
        }),
        Animated.delay(100),
        zoomSequence
      ])
    ]).start();
  }, [opacity, scale]);

  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale }],
      opacity
    }),
    [opacity, scale]
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.brandContainer, animatedStyle]}>
        <Text style={styles.brandText}>BlueMind</Text>
      </Animated.View>
    </View>
  );
}

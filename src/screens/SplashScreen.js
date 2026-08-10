import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandText: {
    fontSize: 35,
    letterSpacing: 1.3,
    fontWeight: '500',
    color: '#7DF9FF'
  }
});

export default function SplashScreen() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Steadily increase over time (no blinking)
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false // JS driver for text shadow
    }).start();
  }, [progress]);

  const shadowRadius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60] // Glow continuously expands smoothly
  });

  const shadowColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(125, 249, 255, 0)', 'rgba(125, 249, 255, 1)']
  });

  return (
    <View style={styles.container}>
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
  );
}

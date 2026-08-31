import React, { useCallback, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

// Order the swipe moves through, left <-> right.
export const TAB_ORDER = ['Dashboard', 'MyActivity', 'Analysis', 'Submit', 'Profile'];

const SWIPE_DISTANCE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 300;
const DRAG_RESISTANCE = 0.35;
const EXIT_OFFSET = Dimensions.get('window').width * 0.3;
const EXIT_DURATION = 160;
const ENTER_DURATION = 220;

// Set right before navigate() so the screen gaining focus knows which side
// to slide in from; read once on focus and cleared immediately after.
let pendingSwipeDirection = null;

export default function SwipeableTabScreen({ children, order = TAB_ORDER, tabName }) {
  const navigation = useNavigation();
  const route = useRoute();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const direction = pendingSwipeDirection;
      pendingSwipeDirection = null;

      if (direction) {
        translateX.setValue(direction === 'left' ? EXIT_OFFSET : -EXIT_OFFSET);
        opacity.setValue(0);

        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: ENTER_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: ENTER_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        translateX.setValue(0);
        opacity.setValue(1);
      }
    }, [translateX, opacity])
  );

  const settle = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 16,
    }).start();
  };

  const exitTo = (targetTab, direction) => {
    pendingSwipeDirection = direction;

    Animated.timing(translateX, {
      toValue: direction === 'left' ? -EXIT_OFFSET : EXIT_OFFSET,
      duration: EXIT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate(targetTab);
    });

    Animated.timing(opacity, {
      toValue: 0,
      duration: EXIT_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.setValue(e.translationX * DRAG_RESISTANCE);
    })
    .onEnd((e) => {
      const currentIndex = order.indexOf(tabName || route.name);

      const swipedLeft = e.translationX < -SWIPE_DISTANCE_THRESHOLD || e.velocityX < -SWIPE_VELOCITY_THRESHOLD;
      const swipedRight = e.translationX > SWIPE_DISTANCE_THRESHOLD || e.velocityX > SWIPE_VELOCITY_THRESHOLD;

      let targetTab = null;
      let direction = null;

      if (swipedLeft && currentIndex !== -1) {
        targetTab = order[currentIndex + 1];
        direction = 'left';
      } else if (swipedRight && currentIndex !== -1) {
        targetTab = order[currentIndex - 1];
        direction = 'right';
      }

      if (targetTab) {
        exitTo(targetTab, direction);
      } else {
        settle();
      }
    });

  return (
    <GestureDetector gesture={swipe}>
      <Animated.View style={[styles.container, { transform: [{ translateX }], opacity }]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export function withSwipeNavigation(Component, { order = TAB_ORDER, tabName } = {}) {
  return function SwipeWrappedScreen(props) {
    return (
      <SwipeableTabScreen order={order} tabName={tabName}>
        <Component {...props} />
      </SwipeableTabScreen>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

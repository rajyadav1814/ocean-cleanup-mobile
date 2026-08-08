import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function ScreenContainer({ children, style }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background
  }
});

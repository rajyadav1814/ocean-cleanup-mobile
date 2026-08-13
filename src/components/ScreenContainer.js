import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ScreenContainer({ children, style }) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  container: {
    flex: 1,
    // padding: 12
    paddingHorizontal: 12,
    paddingTop: 4
  }
});

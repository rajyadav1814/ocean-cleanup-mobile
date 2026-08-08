import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';

export default function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <ScreenContainer>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
    justifyContent: 'center'
  }
});

import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { theme } from '../theme';

export default function LoadingScreen() {
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

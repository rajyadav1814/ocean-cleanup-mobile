import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function BrandButton({ title, onPress, variant = 'primary', disabled, style }) {
  const { theme } = useTheme();
  const backgroundColor = variant === 'secondary' ? 'transparent' : theme.colors.primary;
  const borderColor = variant === 'secondary' ? theme.colors.primary : 'transparent';
  const color = variant === 'secondary' ? theme.colors.primary : theme.colors.textMain;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor, borderColor, shadowColor: theme.colors.primary, opacity: disabled ? 0.65 : 1 }, style]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  text: {
    fontSize: 15,
    fontWeight: '700'
  }
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const styles = getStyles(theme);

  return (
    <ScreenContainer>
      <GlassCard>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.displayInitial || 'U'}</Text></View>
          <View>
            <Text style={styles.name}>{user?.displayName || 'Citizen'}</Text>
            <Text style={styles.role}>{user?.role || 'User'}</Text>
          </View>
        </View>
        <Text style={styles.meta}>Email: {user?.email || 'Not available'}</Text>
      </GlassCard>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'light' && styles.toggleButtonActive]}
          onPress={() => setMode('light')}
        >
          <Text style={[styles.toggleText, mode === 'light' && styles.toggleTextActive]}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'dark' && styles.toggleButtonActive]}
          onPress={() => setMode('dark')}
        >
          <Text style={[styles.toggleText, mode === 'dark' && styles.toggleTextActive]}>Dark</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={logout}>
        <Text style={styles.actionText}>Sign out</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  title: {
    color: theme.colors.textMain,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    paddingTop: 40
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: theme.colors.textMain,
    fontSize: 26,
    fontWeight: '700'
  },
  name: {
    color: theme.colors.textMain,
    fontSize: 20,
    fontWeight: '700'
  },
  role: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 3
  },
  meta: {
    color: theme.colors.textMuted,
    marginTop: 10,
    lineHeight: 20
  },
  actionButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  actionText: {
    color: '#fff',
    fontWeight: '700'
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center'
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontWeight: '700'
  },
  toggleTextActive: {
    color: theme.colors.textMain
  }
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
import { theme } from '../theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();

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

      <TouchableOpacity style={styles.actionButton} onPress={logout}>
        <Text style={styles.actionText}>Sign out</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.textMain,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16
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
  }
});

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const styles = getStyles(theme);

  const handleLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.displayInitial || 'U'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.title}>My Profile</Text>
              <Text style={styles.name}>{user?.displayName || 'Citizen'}</Text>
              <Text style={styles.role}>{user?.role || 'Community Member'}</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user?.email || 'Not available'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account</Text>
              <Text style={styles.infoValue}>Verified</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.preferenceCard}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionText}>Choose the theme that feels best for you.</Text>

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
        </GlassCard>

        <TouchableOpacity style={styles.actionButton} onPress={() => setLogoutModalVisible(true)}>
          <Text style={styles.actionText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalText}>You’ll need to sign in again to continue using your account.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleLogout}>
                <Text style={styles.confirmText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24
  },
  profileCard: {
    paddingTop: 24,
    paddingBottom: 22
  },
  preferenceCard: {
    paddingTop: 22,
    paddingBottom: 20
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14
  },
  title: {
    color: theme.colors.textMain,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4
  },
  name: {
    color: theme.colors.textMain,
    fontSize: 18,
    fontWeight: '700'
  },
  role: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 3
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700'
  },
  infoList: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  infoValue: {
    color: theme.colors.textMain,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12
  },
  sectionTitle: {
    color: theme.colors.textMain,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4
  },
  sectionText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18
  },
  toggleRow: {
    flexDirection: 'row',
    marginTop: 4
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginRight: 8
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
    color: '#ffffff'
  },
  actionButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 8, 23, 0.6)'
  },
  modalCard: {
    width: '84%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20
  },
  modalTitle: {
    color: theme.colors.textMain,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  modalText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 8
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceAlt
  },
  confirmButton: {
    backgroundColor: theme.colors.danger
  },
  cancelText: {
    color: theme.colors.textMain,
    fontWeight: '700'
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '700'
  }
});

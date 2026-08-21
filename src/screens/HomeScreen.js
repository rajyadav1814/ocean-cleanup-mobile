import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const handleLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Profile card ── */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {user?.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{user?.displayInitial || 'U'}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.displayName || 'Citizen'}</Text>
              <Text style={styles.role}>{user?.jobTitle ? user.jobTitle : user?.role || 'Community Member'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileSettings')} style={styles.editButton} activeOpacity={0.75}>
              <Ionicons name="pencil-outline" size={18} color={t.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.email || 'Not available'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color={t.success} style={{ marginRight: 4 }} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Appearance card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionText}>Choose the theme that feels best for you.</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setMode('light')} style={styles.toggleWrap}>
              {mode === 'light' ? (
                <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.toggleButton}>
                  <Ionicons name="sunny" size={17} color="#ffffff" style={{ marginBottom: 4 }} />
                  <Text style={styles.toggleTextActive}>Light</Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleButton}>
                  <Ionicons name="sunny" size={17} color={t.textMuted} style={{ marginBottom: 4 }} />
                  <Text style={styles.toggleText}>Light</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => setMode('dark')} style={styles.toggleWrap}>
              {mode === 'dark' ? (
                <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.toggleButton}>
                  <Ionicons name="moon" size={17} color="#ffffff" style={{ marginBottom: 4 }} />
                  <Text style={styles.toggleTextActive}>Dark</Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleButton}>
                  <Ionicons name="moon" size={17} color={t.textMuted} style={{ marginBottom: 4 }} />
                  <Text style={styles.toggleText}>Dark</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} activeOpacity={0.85} onPress={() => setLogoutModalVisible(true)}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={logoutModalVisible} animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalText}>You'll need to sign in again to continue using your account.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutModalVisible(false)} activeOpacity={0.85}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.confirmText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Background>
  );
}

const getStyles = (t) =>
  StyleSheet.create({
    screen: {
      flex: 1
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 28
    },
    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 20,
      overflow: 'hidden'
    },
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarImage: {
      width: '100%',
      height: '100%'
    },
    avatarText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 26
    },
    profileInfo: {
      flex: 1,
      marginLeft: 14
    },
    name: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 17,
      letterSpacing: -0.2
    },
    role: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
      marginTop: 3
    },
    editButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    infoList: {
      borderTopWidth: 1,
      borderTopColor: t.borderLight,
      paddingTop: 12
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    },
    infoLabel: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5
    },
    infoValue: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 12.5,
      flex: 1,
      textAlign: 'right',
      marginLeft: 12
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(46,158,155,0.14)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4
    },
    verifiedBadgeText: {
      color: t.success,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11
    },
    sectionTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 16,
      letterSpacing: -0.2,
      marginBottom: 4
    },
    sectionText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
      lineHeight: 18,
      marginBottom: 14
    },
    toggleRow: {
      flexDirection: 'row',
      gap: 10
    },
    toggleWrap: {
      flex: 1,
      borderRadius: 14,
      overflow: 'hidden'
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: t.surfaceHover,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.borderLight,
      alignItems: 'center',
      justifyContent: 'center'
    },
    toggleText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5
    },
    toggleTextActive: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5
    },
    signOutButton: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.35)',
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4
    },
    signOutText: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(4,18,31,0.6)',
      paddingHorizontal: 24
    },
    modalCard: {
      width: '100%',
      backgroundColor: t.overlaySurface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: t.borderLight,
      padding: 20
    },
    modalTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 18,
      marginBottom: 8
    },
    modalText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 18
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10
    },
    cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    confirmButton: {
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: t.danger
    },
    cancelText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13
    },
    confirmText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13
    }
  });

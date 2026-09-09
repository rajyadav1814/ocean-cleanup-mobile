import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';

// ─── Pure sub-components ───────────────────────────────────────────────────

const StatPill = React.memo(function StatPill({ styles, icon, color, label }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={styles.statPillText}>{label}</Text>
    </View>
  );
});

const SettingsRow = React.memo(function SettingsRow({ t, styles, icon, iconColor, iconBg, label, onPress, last, children }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.settingsRow, last && styles.settingsRowLast]}
      activeOpacity={onPress ? 0.7 : undefined}
      onPress={onPress}
    >
      <View style={[styles.settingsIconWrap, iconBg && { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor || t.primary} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      <View style={styles.settingsAccessory}>{children}</View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={t.textMuted} style={{ marginLeft: 4 }} /> : null}
    </Wrapper>
  );
});

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently';
  const accountLabel = user?.role ? user.role.replace(/_/g, ' ') : 'community member';

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
        {/* ── Cover banner + overlapping avatar ── */}
        <View style={styles.bannerWrap}>
          <LinearGradient colors={[t.secondary, t.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileSettings')}
              style={styles.bannerEditButton}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={15} color="#ffffff" />
              <Text style={styles.bannerEditText}>Edit</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.avatarRing}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{user?.displayInitial || 'U'}</Text>
              </LinearGradient>
            )}
          </View>
        </View>

        <View style={styles.identityBlock}>
          <Text style={styles.name}>{user?.displayName || 'Citizen'}</Text>
          <Text style={styles.role}>{user?.jobTitle ? user.jobTitle : user?.role || 'Community Member'}</Text>

          <View style={styles.statsRow}>
            <StatPill styles={styles} icon="person-circle-outline" color={t.primary} label={accountLabel} />
            <StatPill styles={styles} icon="time-outline" color={t.primary} label={`Since ${memberSince}`} />
            <StatPill styles={styles} icon="shield-checkmark" color={t.success} label="Verified" />
          </View>
        </View>

        {/* ── Grouped settings list ── */}
        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <View style={styles.group}>
          <SettingsRow t={t} styles={styles} icon="mail-outline" label="Email">
            <Text style={styles.settingsValue} numberOfLines={1}>
              {user?.email || 'Not available'}
            </Text>
          </SettingsRow>
          <SettingsRow
            t={t}
            styles={styles}
            icon="create-outline"
            label="Edit profile"
            onPress={() => navigation.navigate('ProfileSettings')}
            last
          />
        </View>

        <Text style={styles.groupLabel}>APPEARANCE</Text>
        <View style={styles.group}>
          <SettingsRow t={t} styles={styles} icon="contrast-outline" label="Theme" last>
            <View style={styles.segmented}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMode('light')}
                style={[styles.segmentBtn, mode === 'light' && { backgroundColor: t.primary }]}
              >
                <Ionicons name="sunny" size={13} color={mode === 'light' ? '#ffffff' : t.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMode('dark')}
                style={[styles.segmentBtn, mode === 'dark' && { backgroundColor: t.primary }]}
              >
                <Ionicons name="moon" size={13} color={mode === 'dark' ? '#ffffff' : t.textMuted} />
              </TouchableOpacity>
            </View>
          </SettingsRow>
        </View>
        <Text style={styles.groupHint}>The theme follows your mood — your data stays the same either way.</Text>

        <TouchableOpacity style={styles.signOutRow} activeOpacity={0.7} onPress={() => setLogoutModalVisible(true)}>
          <View style={[styles.settingsIconWrap, { backgroundColor: t.dangerBg }]}>
            <Ionicons name="log-out-outline" size={16} color={t.danger} />
          </View>
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
      paddingBottom: 120
    },

    // ── Banner + avatar ─────────────────────────────────────────────────
    bannerWrap: {
      marginBottom: 52
    },
    banner: {
      height: 120,
      borderRadius: 20,
      padding: 14,
      alignItems: 'flex-end'
    },
    bannerEditButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(4,18,31,0.28)',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7
    },
    bannerEditText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11.5
    },
    avatarRing: {
      position: 'absolute',
      left: 18,
      bottom: -44,
      width: 92,
      height: 92,
      borderRadius: 26,
      overflow: 'hidden',
      borderWidth: 4,
      borderColor: t.pageBg
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
      fontSize: 32
    },

    // ── Identity block ───────────────────────────────────────────────────
    identityBlock: {
      marginBottom: 24
    },
    name: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 21,
      letterSpacing: -0.3
    },
    role: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      marginTop: 3
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12
    },
    statPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    statPillText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10.5,
      textTransform: 'capitalize'
    },

    // ── Grouped settings list ────────────────────────────────────────────
    groupLabel: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10.5,
      letterSpacing: 1.2,
      marginBottom: 8,
      marginLeft: 4
    },
    group: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      marginBottom: 18,
      overflow: 'hidden'
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: t.borderLight
    },
    settingsRowLast: {
      borderBottomWidth: 0
    },
    settingsIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceHover
    },
    settingsLabel: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 13.5,
      flexShrink: 0
    },
    settingsAccessory: {
      flex: 1,
      alignItems: 'flex-end'
    },
    settingsValue: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
      textAlign: 'right'
    },
    groupHint: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      lineHeight: 16,
      marginTop: -10,
      marginBottom: 18,
      marginLeft: 4
    },

    // ── Theme segmented control ─────────────────────────────────────────
    segmented: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: t.surfaceHover,
      borderRadius: 999,
      padding: 3,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    segmentBtn: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center'
    },

    // ── Sign out ──────────────────────────────────────────────────────────
    signOutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13
    },
    signOutText: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },

    // ── Logout modal ──────────────────────────────────────────────────────
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

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';

// The web Citizen Space's community-values card. Same four values, same
// copy, same accents — on phone width they stack into rows instead of the
// four-column grid, since 166px-wide columns are unreadable here.
//
// Tints are alpha-blended (not flat hex) so they read as a soft wash over
// whichever surface sits behind them.
const VALUES = [
  { key: 'awareness', title: 'Raise Awareness', text: 'What you contribute helps build a clearer picture of what’s happening out there.',
    icon: 'megaphone-outline', color: '#3B82F6', tint: 'rgba(59,130,246,0.14)' },
  { key: 'impact', title: 'Drive Impact', text: 'Blue Mind connects what you share to real-world action, not just a database.',
    icon: 'bar-chart-outline', color: '#22A06B', tint: 'rgba(34,160,107,0.14)' },
  { key: 'trust', title: 'Build Trust', text: 'Evidence stays traceable — see what you submitted, what Blue Mind added, and what got verified.',
    icon: 'shield-outline', color: '#7C5CD6', tint: 'rgba(124,92,214,0.14)' },
  { key: 'protect', title: 'Protect Together', text: 'Cleanup, wildlife, water quality, research — every kind of contribution counts.',
    icon: 'leaf-outline', color: '#CE9A2E', tint: 'rgba(206,154,46,0.16)' },
];

const ValuesStrip = memo(function ValuesStrip({ t, style }) {
  const styles = useMemo(() => getStyles(t), [t]);
  return (
    <View style={[styles.card, style]}>
      {VALUES.map((v, i) => (
        <View key={v.key} style={[styles.row, i < VALUES.length - 1 && styles.rowDivider]}>
          <View style={[styles.icon, { backgroundColor: v.tint }]}>
            <Ionicons name={v.icon} size={17} color={v.color} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{v.title}</Text>
            <Text style={styles.text}>{v.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
});

export default ValuesStrip;

const getStyles = (t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 4,
      marginBottom: 14,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 13,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: t.borderLight,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0 },
    title: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13,
    },
    text: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12,
      lineHeight: 17.5,
      marginTop: 3,
    },
  });

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';

// The universal lifecycle loop (spec §3), same five steps as both web
// spaces: contribute → understood → connected/verified → outcome → seen.
// The web lays these out in a row separated by chevrons; a phone can't
// fit five labelled steps side by side, so it becomes a vertical rail with
// the connector drawn between markers.
const STEPS = [
  { step: 'You contribute', icon: 'send-outline' },
  { step: 'Blue Mind understands', icon: 'sparkles-outline' },
  { step: 'Others confirm or connect it', icon: 'people-outline' },
  { step: 'Something happens', icon: 'flash-outline' },
  { step: 'You see what changed', icon: 'eye-outline' },
];

const LifecycleStrip = memo(function LifecycleStrip({ t, style }) {
  const styles = useMemo(() => getStyles(t), [t]);
  return (
    <View style={[styles.card, style]}>
      {STEPS.map(({ step, icon }, i) => {
        const last = i === STEPS.length - 1;
        return (
          <View key={step} style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.marker}>
                <Ionicons name={icon} size={13} color={t.primaryHover} />
              </View>
              {!last ? <View style={styles.connector} /> : null}
            </View>
            <Text style={[styles.label, !last && styles.labelSpaced]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
});

export default LifecycleStrip;

const getStyles = (t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginBottom: 14,
    },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
    rail: { alignItems: 'center', width: 26 },
    marker: {
      width: 26,
      height: 26,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      // Same low-alpha teal StatusPill uses, so it sits correctly on
      // both the light surface and the dark theme's translucent one.
      backgroundColor: 'rgba(46,158,155,0.14)',
    },
    connector: {
      width: 2,
      flex: 1,
      minHeight: 14,
      backgroundColor: t.borderLight,
    },
    label: {
      flex: 1,
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      lineHeight: 18,
      paddingTop: 4,
    },
    labelSpaced: { paddingBottom: 12 },
  });

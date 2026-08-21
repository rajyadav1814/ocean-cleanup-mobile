import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';

const Panel = memo(function Panel({ t, kicker, title, desc, children, style }) {
  const styles = getStyles(t);
  return (
    <View style={[styles.panel, style]}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {desc ? <Text style={styles.desc}>{desc}</Text> : null}
      {children}
    </View>
  );
});

export default Panel;

const getStyles = (t) =>
  StyleSheet.create({
    panel: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
    },
    kicker: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10.5,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      opacity: 0.85,
    },
    title: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 17,
      marginTop: 4,
      letterSpacing: -0.2,
    },
    desc: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
      marginTop: 3,
      marginBottom: 14,
      lineHeight: 18,
    },
  });

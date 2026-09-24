import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';

// The Blue Mind hero, ported from the web Citizen Space (.bm-hero) so all
// three clients read as one product: same photograph, same greeting, same
// single Contribute CTA. Citizen has no export endpoint, so there is one
// button here rather than the Contributor Space's pair.
//
// Layout follows the web's OWN phone rules rather than its desktop ones:
// under 860px the web drops the left-to-right mask and lays the photograph
// behind the whole card at 22% opacity, because there is no side-by-side
// column left to protect. React Native has no mask-image, so this is both
// the faithful and the practical choice.

const BlueMindHero = memo(function BlueMindHero({ t, mode, firstName, heroUpdate, jobTitle, onContribute }) {
  const styles = useMemo(() => getStyles(t), [t]);

  return (
    <View style={styles.hero}>
      <View style={styles.top}>
        <Text style={styles.brandName} numberOfLines={1}>CITIZEN COMMUNITY</Text>
        {jobTitle ? (
          <View style={styles.jobPill}>
            <Text style={styles.jobText} numberOfLines={1}>{jobTitle}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>
          Hi {firstName}, {'\u{1F44B}'}{'\n'}
          {heroUpdate ? (
            <>
              Here{'’'}s what changed: <Text style={styles.titleAccent}>{heroUpdate}</Text>
            </>
          ) : (
            <>
              Thank you for being part of <Text style={styles.titleAccent}>blueMind.</Text>
            </>
          )}
        </Text>

        <Text style={styles.sub}>
          {heroUpdate
            ? 'You contribute, Blue Mind understands it, others confirm or connect it, and you see what changed.'
            : 'Every activity you submit helps us understand pollution patterns, raise awareness, and build a cleaner, healthier planet together.'}
        </Text>

        <TouchableOpacity activeOpacity={0.85} onPress={onContribute} style={styles.ctaWrap}>
          <LinearGradient
            colors={['#2C948B', '#12665F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Ionicons name="send" size={15} color="#FFFFFF" />
            <Text style={styles.ctaText}>CONTRIBUTE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default BlueMindHero;

const getStyles = (t) =>
  StyleSheet.create({
    hero: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 20,
      paddingHorizontal: 22,
      paddingTop: 21,
      paddingBottom: 26,
      marginBottom: 14,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    brandName: {
      flexShrink: 1,
      color: t.primaryHover,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 1.6,
    },
    jobPill: {
      backgroundColor: t.surfaceHover,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      maxWidth: 160,
    },
    jobText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 9.5,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    body: { marginTop: 26 },
    title: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 26,
      lineHeight: 33,
      letterSpacing: -0.8,
    },
    titleAccent: { color: t.primary },
    sub: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 16,
    },
    // The web gives this button the full row at <=640px; same here.
    ctaWrap: { marginTop: 22 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      height: 48,
      borderRadius: 999,
    },
    ctaText: {
      color: '#FFFFFF',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11.5,
      letterSpacing: 1.4,
    },
  });

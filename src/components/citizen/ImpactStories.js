import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';
import {
  buildStoryTimeline, primarySubject, verificationStateMeta, fmtEventDate,
} from '../../utils/eventMeta';

// "What Changed Because of You" (spec §4) — the full chain rather than its
// endpoint: you reported it → others saw the same thing → the reports were
// merged → someone acted → this much changed → it was verified.
//
// Beats with no recorded data are omitted by buildStoryTimeline rather than
// invented, so a short chain means a quiet event, never a guessed one.

const Story = memo(function Story({ story, styles, t, onOpenEvent }) {
  const subject = primarySubject(story.subjects);
  const timeline = buildStoryTimeline(story);
  const verMeta = verificationStateMeta(story.verificationState);
  const verifiedBy = story.verification?.verifierOrg || story.verification?.verifierName;

  return (
    <View style={styles.story}>
      {/* Header: what this was, where, and when it closed */}
      <View style={styles.storyHead}>
        <View style={styles.storyIcon}>
          <Ionicons name="trash-outline" size={17} color={t.primary} />
        </View>
        <View style={styles.storyHeadCopy}>
          <Text style={styles.storyTitle}>
            {story.title || `${subject?.label || 'Report'} resolved`}
          </Text>
          <Text style={styles.storyLocation} numberOfLines={2}>
            {story.locationLabel || 'Unknown location'}
            {story.closedAt ? ` · closed ${fmtEventDate(story.closedAt)}` : ''}
          </Text>
        </View>
      </View>

      {/* The chain itself */}
      <View>
        {timeline.map((beat, i) => {
          const last = i === timeline.length - 1;
          return (
            <View key={beat.key} style={styles.beat}>
              <View style={styles.beatRail}>
                {beat.outcome ? (
                  <Ionicons name="checkmark-circle" size={17} color={t.success} />
                ) : (
                  <View style={[styles.beatDot, i === 0 && { borderColor: t.primary }]} />
                )}
                {!last ? <View style={styles.beatConnector} /> : null}
              </View>
              <View style={[styles.beatBody, !last && styles.beatBodySpaced]}>
                <Text style={[styles.beatText, beat.outcome && styles.beatTextOutcome]}>
                  {beat.text}
                </Text>
                {beat.detail ? <Text style={styles.beatDetail}>{beat.detail}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer: who stood behind it, and the way in */}
      <View style={styles.storyFoot}>
        <View style={styles.storyFootVerify}>
          <Ionicons name="shield-checkmark-outline" size={13} color={verMeta.color} />
          <Text style={styles.storyFootText} numberOfLines={2}>
            {story.verification
              ? `Verified${verifiedBy ? ` by ${verifiedBy}` : ''}${story.verification.verifiedAt ? ` · ${fmtEventDate(story.verification.verifiedAt)}` : ''}`
              : verMeta.label}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onOpenEvent(story.eventId)}
          style={styles.viewChip}
        >
          <Text style={styles.viewChipText}>View full event</Text>
          <Ionicons name="chevron-forward" size={12} color={t.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const ImpactStories = memo(function ImpactStories({ t, stories, style, onOpenEvent }) {
  const styles = useMemo(() => getStyles(t), [t]);
  const list = stories || [];

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>What Changed Because of You</Text>
      <Text style={styles.desc}>What happened after you reported it.</Text>

      {list.length === 0 ? (
        <Text style={styles.empty}>
          No resolved reports yet — check back once one of your reports is addressed.
        </Text>
      ) : (
        list.map((story) => (
          <Story key={story.eventId} story={story} styles={styles} t={t} onOpenEvent={onOpenEvent} />
        ))
      )}
    </View>
  );
});

export default ImpactStories;

const getStyles = (t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
    },
    title: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 17,
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
    story: {
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    storyHead: { flexDirection: 'row', gap: 10, marginBottom: 11 },
    storyIcon: {
      width: 36, height: 36, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(46,158,155,0.14)',
    },
    storyHeadCopy: { flex: 1, minWidth: 0 },
    storyTitle: {
      color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5, lineHeight: 18,
    },
    storyLocation: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5, marginTop: 2, lineHeight: 16,
    },
    beat: { flexDirection: 'row', gap: 10 },
    beatRail: { alignItems: 'center', width: 17 },
    beatDot: {
      width: 13, height: 13, borderRadius: 999, marginTop: 3,
      borderWidth: 2, borderColor: t.borderLight, backgroundColor: t.surface,
    },
    beatConnector: { width: 2, flex: 1, minHeight: 16, backgroundColor: t.borderLight },
    beatBody: { flex: 1, minWidth: 0 },
    beatBodySpaced: { paddingBottom: 9 },
    beatText: {
      color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5, lineHeight: 17.5,
    },
    beatTextOutcome: { fontSize: 15.5, lineHeight: 21 },
    beatDetail: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11, marginTop: 1, lineHeight: 15,
    },
    storyFoot: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 8,
      marginTop: 12, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: t.borderLight,
    },
    storyFootVerify: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
    storyFootText: {
      flex: 1, color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans, fontSize: 11.5, lineHeight: 16,
    },
    // The web story card ends on a "See the full event" pill; same idea.
    viewChip: {
      flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0,
      borderWidth: 1, borderColor: t.borderLight, borderRadius: 999,
      paddingHorizontal: 11, paddingVertical: 6,
    },
    viewChipText: { color: t.primary, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 11.5 },
    empty: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5, textAlign: 'center', paddingVertical: 18, lineHeight: 18,
    },
  });

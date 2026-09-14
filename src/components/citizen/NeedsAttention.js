import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';
import { eventStateMeta, verificationStateMeta, fmtEventDate } from '../../utils/eventMeta';

// How many open reports the card shows before "Show more" is tapped. The
// count beside the title is always the true total, and expanding reveals
// every one of them — so the badge can never claim more than the card can
// actually show.
const PREVIEW = 4;

const Row = memo(function Row({ event, styles, t, last, onPress }) {
  const stateMeta = eventStateMeta(event.eventState);
  const verMeta = verificationStateMeta(event.verificationState);
  const subjectLabel = event.subjects?.map((s) => s.label).join(', ') || 'Unclassified';
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(event.eventId)}
      style={[styles.row, !last && styles.rowDivider]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name="sync-outline" size={17} color={t.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{subjectLabel}</Text>
        <View style={styles.rowMeta}>
          <Ionicons name="location-outline" size={11} color={t.textMuted} />
          <Text style={styles.rowMetaText} numberOfLines={1}>
            {event.locationLabel || 'Location unspecified'}
          </Text>
          <Text style={styles.rowMetaText}>· {fmtEventDate(event.occurredAt || event.createdAt)}</Text>
        </View>

        {/* Corroboration (spec §5): their reports were joined to yours, not
            filed as separate problems. */}
        {event.corroborationCount > 0 ? (
          <Text style={styles.rowCorrob}>
            {event.corroborationCount} other {event.corroborationCount === 1 ? 'person' : 'people'} reported this too — joined into one event.
          </Text>
        ) : null}

        <View style={styles.pills}>
          <View style={[styles.pill, { backgroundColor: `${stateMeta.color}22` }]}>
            <Text style={[styles.pillText, { color: stateMeta.color }]}>{stateMeta.label}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: verMeta.color }]}>
            <Text style={[styles.pillText, { color: '#fff' }]}>{verMeta.label}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={t.textMuted} style={styles.rowChevron} />
    </TouchableOpacity>
  );
});

const NeedsAttention = memo(function NeedsAttention({ t, events, style, onOpenEvent }) {
  const styles = useMemo(() => getStyles(t), [t]);
  const [expanded, setExpanded] = useState(false);
  const list = events || [];
  const visible = expanded ? list : list.slice(0, PREVIEW);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <View style={styles.bell}>
          <Ionicons name="notifications-outline" size={18} color={t.primary} />
          {list.length > 0 ? <View style={styles.bellDot} /> : null}
        </View>
        <View style={styles.headCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Needs Attention</Text>
            {list.length > 0 ? (
              <View style={styles.count}>
                <Ionicons name="alert-circle-outline" size={11} color={t.warning} />
                <Text style={styles.countText}>{list.length}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.desc}>Open issues from your own reports.</Text>
        </View>
      </View>

      {list.length === 0 ? (
        <Text style={styles.empty}>Nothing open right now — everything you've reported has been addressed.</Text>
      ) : (
        <>
          {visible.map((event, i, arr) => (
            <Row
              key={event.eventId}
              event={event}
              styles={styles}
              t={t}
              last={i === arr.length - 1}
              onPress={onOpenEvent}
            />
          ))}
          {/* Same show more / show less affordance as the community feed. */}
          {list.length > PREVIEW ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExpanded((v) => !v)}
              style={styles.toggle}
            >
              <Text style={styles.toggleText}>{expanded ? 'Show less' : 'Show more'}</Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={t.primary}
              />
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
});

export default NeedsAttention;

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
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
    bell: {
      width: 38, height: 38, borderRadius: 999,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(46,158,155,0.14)',
    },
    bellDot: {
      position: 'absolute', top: 1, right: 1,
      width: 8, height: 8, borderRadius: 999, backgroundColor: t.danger,
    },
    headCopy: { flex: 1, minWidth: 0 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 17,
      letterSpacing: -0.2,
    },
    count: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: 'rgba(198,130,30,0.14)',
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
    },
    countText: { color: t.warning, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 11 },
    desc: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5, marginTop: 3, lineHeight: 18,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
    rowChevron: { flexShrink: 0 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: t.borderLight },
    rowIcon: {
      width: 36, height: 36, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(46,158,155,0.14)',
    },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 13.5 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
    rowMetaText: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 11.5, flexShrink: 1 },
    rowCorrob: {
      color: t.secondary, fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11.5, marginTop: 4, lineHeight: 16,
    },
    pills: { flexDirection: 'row', gap: 6, marginTop: 7, flexWrap: 'wrap' },
    pill: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 20 },
    pillText: {
      fontFamily: CITIZEN_FONTS.sansBold, fontSize: 9.5,
      letterSpacing: 0.4, textTransform: 'uppercase',
    },
    empty: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5, textAlign: 'center', paddingVertical: 18, lineHeight: 18,
    },
    // Mirrors .feedToggle / .feedToggleText on the dashboard feed so both
    // cards expand with the same control.
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 12,
    },
    toggleText: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
    },
  });

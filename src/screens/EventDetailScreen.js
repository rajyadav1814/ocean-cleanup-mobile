import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, View, Text, TouchableOpacity, Image, Linking, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';
import { citizenApi } from '../services/api';
import {
  eventStateMeta, verificationStateMeta, primarySubjectLabel,
  buildEventStoryBeats, RELATIONSHIP_LABEL, fmtEventDate,
} from '../utils/eventMeta';

// Read-only event view, ported from the web EventDetail. A citizen sees the
// same sections the web shows them: the web page gates Plan action / Log
// what happened / Verify / Relate behind isContributor and isVerifier, both
// false for a citizen, so none of those are here either — this screen is
// the record, not a place to act on it.

const EVIDENCE_TAG = {
  photo: { icon: 'image-outline', label: 'Photo' },
  video: { icon: 'videocam-outline', label: 'Video' },
  audio: { icon: 'mic-outline', label: 'Audio' },
  document: { icon: 'document-outline', label: 'Document' },
  dataset: { icon: 'grid-outline', label: 'Dataset' },
  contributor_statement: { icon: 'chatbubble-outline', label: 'Statement' },
};

const Pill = ({ styles, label, color, solid }) => (
  <View style={[styles.pill, solid ? { backgroundColor: color } : { backgroundColor: `${color}22` }]}>
    <Text style={[styles.pillText, { color: solid ? '#fff' : color }]}>{label}</Text>
  </View>
);

const Section = ({ styles, t, icon, title, children }) => (
  <View style={styles.card}>
    <View style={styles.sectionHead}>
      <Ionicons name={icon} size={14} color={t.primary} />
      <Text style={styles.sectionLabel}>{title}</Text>
    </View>
    {children}
  </View>
);

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = useTheme();
  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const eventId = route.params?.eventId;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedExpanded, setRelatedExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!eventId) {
      setError('No event was specified.');
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    citizenApi.getEvent(eventId)
      .then((res) => {
        if (!mounted) return;
        if (res.ok && res.event) setEvent(res.event);
        else setError(res.message || 'That event could not be loaded.');
      })
      .catch(() => { if (mounted) setError('That event could not be loaded.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [eventId]);

  const openUrl = useCallback((url) => { if (url) Linking.openURL(url).catch(() => {}); }, []);

  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps = mode === 'dark'
    ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } }
    : {};

  const body = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      );
    }
    if (error || !event) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'That event could not be loaded.'}</Text>
        </View>
      );
    }

    const stateMeta = eventStateMeta(event.eventState);
    const verMeta = verificationStateMeta(event.verificationState);
    const subjectLabel = primarySubjectLabel(event.subjects, 'Report');
    const beats = buildEventStoryBeats(event);
    const relationships = event.relationships || [];
    const visibleRelated = relatedExpanded ? relationships : relationships.slice(0, 4);
    // spec §18 — place names only appear once the background reverse-geocode
    // resolves, and accuracy only when the device supplied it.
    const placeLine = [event.waterBody, event.adminArea, event.country].filter(Boolean).join(', ');
    const autoDerived = ['admin_area', 'country', 'water_body']
      .some((f) => event.locationProvenance?.[f] === 'external_enrichment');

    return (
      <>
        {/* ── Header ── */}
        <View style={styles.card}>
          <View style={styles.pillRow}>
            <Pill styles={styles} label={stateMeta.label} color={stateMeta.color} />
            <Pill styles={styles} label={verMeta.label} color={verMeta.color} solid />
          </View>
          <View style={styles.headRow}>
            <View style={styles.headIcon}>
              <Ionicons name="location" size={19} color={t.primary} />
            </View>
            <View style={styles.headCopy}>
              <Text style={styles.title}>{event.title || subjectLabel}</Text>
              <Text style={styles.headMeta}>
                {event.locationLabel || 'Location unspecified'}
                {' · '}
                {fmtEventDate(event.occurredAt || event.createdAt)}
              </Text>
              {placeLine || event.locationAccuracyM != null || event.locationCaptureMethod === 'manual_pin' ? (
                <Text style={styles.headSub}>
                  {placeLine}
                  {autoDerived ? ' (auto-derived)' : ''}
                  {event.locationAccuracyM != null ? ` · ±${Math.round(event.locationAccuracyM)}m accuracy` : ''}
                  {event.locationCaptureMethod === 'manual_pin' ? ' · manually placed' : ''}
                </Text>
              ) : null}
              {event.description ? <Text style={styles.description}>{event.description}</Text> : null}
            </View>
          </View>
        </View>

        {/* ── Story ── the narrative spine (spec §4-5) ── */}
        <Section styles={styles} t={t} icon="pulse-outline" title="WHAT CHANGED BECAUSE OF YOU">
          {beats.map((beat, i) => {
            const last = i === beats.length - 1;
            return (
              <View key={`${beat.text}-${i}`} style={styles.beat}>
                <View style={styles.beatRail}>
                  <View style={[styles.beatDot, beat.done && styles.beatDotDone]}>
                    {beat.done ? <Ionicons name="checkmark" size={10} color="#10b981" /> : null}
                  </View>
                  {!last ? <View style={styles.beatConnector} /> : null}
                </View>
                <Text style={[
                  styles.beatText,
                  !beat.done && styles.beatTextPending,
                  beat.final && styles.beatTextFinal,
                ]}>
                  {beat.text}
                </Text>
              </View>
            );
          })}
        </Section>

        {/* ── Subjects ── */}
        {event.subjects?.length > 0 ? (
          <Section styles={styles} t={t} icon="pricetags-outline" title="SUBJECTS">
            <View style={styles.chipWrap}>
              {event.subjects.map((s) => {
                const attributes = s.attributes || {};
                // The ontology's controlled vocabulary (spec §7) is worth
                // showing plainly: unlike quantity, condition/severity/hazard
                // have nowhere else on this screen to appear.
                const ontology = ['condition', 'outcome', 'severity', 'hazard']
                  .filter((k) => attributes[k])
                  .map((k) => String(attributes[k]).replace(/_/g, ' '));
                // A superseded reading stays visible as history rather than
                // disappearing — the corrected row names it (spec §7).
                const supersededBy = event.subjects.find((o) => o.correctsEventSubjectId === s.eventSubjectId);
                return (
                  <View key={s.eventSubjectId} style={[styles.chip, supersededBy && styles.chipSuperseded]}>
                    <Text style={[styles.chipLabel, supersededBy && styles.chipLabelSuperseded]}>{s.label}</Text>
                    {ontology.length > 0 ? <Text style={styles.chipOntology}>{ontology.join(' · ')}</Text> : null}
                    {s.confidence != null ? (
                      <Text style={styles.chipMeta}>{Math.round(s.confidence * 100)}%</Text>
                    ) : null}
                    <Text style={styles.chipSource}>{String(s.source || '').replace('_', ' ')}</Text>
                    {s.correctsEventSubjectId ? <Text style={styles.chipCorrected}>corrected</Text> : null}
                  </View>
                );
              })}
            </View>
          </Section>
        ) : null}

        {/* ── Measurements ── */}
        {event.measurements?.length > 0 ? (
          <Section styles={styles} t={t} icon="stats-chart-outline" title="MEASUREMENTS">
            {event.measurements.map((m, i, arr) => (
              <View key={m.measurementId} style={[styles.measureRow, i < arr.length - 1 && styles.rowDivider]}>
                <View style={styles.measureCopy}>
                  <Text style={styles.measureName}>{m.parameter.replace(/_/g, ' ')}</Text>
                  <Text style={styles.measureNote}>
                    {[m.method === 'instrument' ? (m.instrument || 'Instrument reading') : 'Informal observation', m.notes]
                      .filter(Boolean).join(' — ')}
                  </Text>
                </View>
                <Text style={styles.measureValue}>{m.value}{m.unit ? ` ${m.unit}` : ''}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {/* ── Evidence ── */}
        {event.evidence?.length > 0 ? (
          <Section styles={styles} t={t} icon="camera-outline" title="EVIDENCE">
            {event.evidence.map((ev) => {
              const tag = EVIDENCE_TAG[ev.evidenceType]
                || { icon: 'attach-outline', label: String(ev.evidenceType).replace(/_/g, ' ') };
              const caption = `${String(ev.evidenceType).replace(/_/g, ' ').toUpperCase()}-${String(ev.captureSource || 'unknown').toUpperCase()}-${fmtEventDate(ev.createdAt).toUpperCase()}`;
              return (
                <View key={ev.evidenceId} style={styles.evidenceRow}>
                  {ev.evidenceType === 'photo' && ev.gatewayUrl ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => openUrl(ev.gatewayUrl)}>
                      <Image source={{ uri: ev.gatewayUrl }} style={styles.evidenceThumb} resizeMode="cover" />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.evidenceThumb, styles.evidenceThumbPlaceholder]}>
                      <Ionicons name={tag.icon} size={24} color={t.textMuted} />
                    </View>
                  )}
                  <View style={styles.evidenceCopy}>
                    {ev.evidenceType === 'contributor_statement' && ev.metadata?.text ? (
                      <Text style={styles.evidenceQuote}>“{ev.metadata.text}”</Text>
                    ) : (
                      <Text style={styles.evidenceCaption} numberOfLines={2}>{caption}</Text>
                    )}
                    <View style={styles.evidenceTag}>
                      <Ionicons name={tag.icon} size={11} color={t.textMuted} />
                      <Text style={styles.evidenceTagText}>{tag.label}</Text>
                    </View>
                    {ev.gatewayUrl ? (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => openUrl(ev.gatewayUrl)}>
                        <Text style={styles.evidenceLink}>View full size</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Section>
        ) : null}

        {/* ── Related events ── */}
        {relationships.length > 0 ? (
          <Section styles={styles} t={t} icon="git-network-outline" title="RELATED EVENTS">
            {visibleRelated.map((r, i, arr) => {
              const otherMeta = eventStateMeta(r.otherEventState);
              return (
                <TouchableOpacity
                  key={r.relationshipId}
                  activeOpacity={0.7}
                  // push, not navigate: following a chain of related events
                  // should stack so Back walks it in reverse.
                  onPress={() => navigation.push('EventDetail', { eventId: r.otherEventId })}
                  style={[styles.relatedRow, i < arr.length - 1 && styles.rowDivider]}
                >
                  <Text style={styles.relatedText}>
                    {r.direction === 'outgoing' ? 'This ' : ''}
                    <Text style={styles.relatedStrong}>{RELATIONSHIP_LABEL[r.relationshipType] || r.relationshipType}</Text>
                    {r.direction === 'incoming' ? ' this' : ''} — {r.otherEventTitle || otherMeta.label}
                  </Text>
                  <Pill styles={styles} label={otherMeta.label} color={otherMeta.color} />
                </TouchableOpacity>
              );
            })}
            {relationships.length > 4 ? (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setRelatedExpanded((v) => !v)} style={styles.toggle}>
                <Text style={styles.toggleText}>
                  {relatedExpanded ? 'Show less' : `View all events (${relationships.length})`}
                </Text>
                <Ionicons name={relatedExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={t.primary} />
              </TouchableOpacity>
            ) : null}
          </Section>
        ) : null}
      </>
    );
  };

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={16} color={t.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {body()}
      </ScrollView>
    </Background>
  );
}

const getStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 80 },
    centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    errorText: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 13,
      textAlign: 'center', lineHeight: 19,
    },
    back: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 8 },
    backText: { color: t.primary, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 13 },

    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
    },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 13 },
    pill: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 20 },
    pillText: {
      fontFamily: CITIZEN_FONTS.sansBold, fontSize: 9.5,
      letterSpacing: 0.4, textTransform: 'uppercase',
    },
    headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    headIcon: {
      width: 42, height: 42, borderRadius: 999,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(46,158,155,0.16)',
    },
    headCopy: { flex: 1, minWidth: 0 },
    title: {
      color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 18, lineHeight: 24,
    },
    headMeta: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12, marginTop: 4, lineHeight: 17,
    },
    headSub: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11, marginTop: 4, lineHeight: 16,
    },
    description: {
      color: t.textMain, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5, marginTop: 9, lineHeight: 18,
    },

    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    sectionLabel: {
      color: t.textMuted, fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10.5, letterSpacing: 1.2,
    },

    beat: { flexDirection: 'row', gap: 11 },
    beatRail: { alignItems: 'center', width: 18 },
    beatDot: {
      width: 18, height: 18, borderRadius: 999,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.surfaceHover, borderWidth: 1, borderColor: t.borderLight,
    },
    beatDotDone: { backgroundColor: 'rgba(16,185,129,0.18)', borderWidth: 0 },
    beatConnector: { width: 2, flex: 1, minHeight: 10, backgroundColor: t.borderLight, marginVertical: 2 },
    beatText: {
      flex: 1, color: t.textMain, fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5, lineHeight: 18, paddingBottom: 14,
    },
    beatTextPending: { color: t.textMuted },
    beatTextFinal: { fontFamily: CITIZEN_FONTS.sansBold },

    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap',
      backgroundColor: t.surfaceHover, borderWidth: 1, borderColor: t.borderLight,
      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    },
    chipSuperseded: { opacity: 0.6 },
    chipLabel: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 12.5 },
    chipLabelSuperseded: { textDecorationLine: 'line-through' },
    chipOntology: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 11, fontStyle: 'italic' },
    chipMeta: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 10 },
    chipSource: {
      color: t.primary, fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 9, letterSpacing: 0.3, textTransform: 'uppercase',
    },
    chipCorrected: {
      color: '#10b981', fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 9, letterSpacing: 0.3, textTransform: 'uppercase',
    },

    rowDivider: { borderBottomWidth: 1, borderBottomColor: t.borderLight },
    measureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 11, paddingVertical: 10 },
    measureCopy: { flex: 1, minWidth: 0 },
    measureName: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 12.5, textTransform: 'capitalize' },
    measureNote: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 11, marginTop: 2, lineHeight: 15 },
    measureValue: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 15 },

    evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    evidenceThumb: { width: 76, height: 76, borderRadius: 12 },
    evidenceThumbPlaceholder: {
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.surfaceHover, borderWidth: 1, borderColor: t.borderLight,
    },
    evidenceCopy: { flex: 1, minWidth: 0 },
    evidenceQuote: { color: t.textMain, fontFamily: CITIZEN_FONTS.sans, fontSize: 12.5, fontStyle: 'italic', lineHeight: 18 },
    evidenceCaption: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 11 },
    evidenceTag: {
      flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
      borderWidth: 1, borderColor: t.borderLight, borderRadius: 999,
      paddingHorizontal: 8, paddingVertical: 2, marginTop: 6,
    },
    evidenceTagText: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 9.5 },
    evidenceLink: { color: t.primary, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 11.5, marginTop: 6 },

    relatedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 11 },
    relatedText: { flex: 1, color: t.textMain, fontFamily: CITIZEN_FONTS.sans, fontSize: 12, lineHeight: 17 },
    relatedStrong: { fontFamily: CITIZEN_FONTS.sansBold },

    toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12 },
    toggleText: { color: t.primary, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 12.5 },
  });

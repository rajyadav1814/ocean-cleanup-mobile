import React, { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../../App';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  useCitizenStats, useCitizenLeaderboard, useCitizenFeed, useCitizenStories, useMyEvents,
} from '../services/citizenHooks';
import { formatTimeAgo } from '../utils/formatTime';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';
import Panel from '../components/citizen/Panel';
import DashboardSkeleton from '../components/DashboardSkeleton';
import BlueMindHero from '../components/citizen/BlueMindHero';
import ValuesStrip from '../components/citizen/ValuesStrip';
import LifecycleStrip from '../components/citizen/LifecycleStrip';
import NeedsAttention from '../components/citizen/NeedsAttention';
import ImpactStories from '../components/citizen/ImpactStories';
import {
  eventStateMeta, verificationStateMeta, primarySubjectLabel, isNeedsAttention,
} from '../utils/eventMeta';

function memberSince(ts) {
  if (!ts) return 'recently';
  return new Date(ts).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// ─── Pure sub-components ───────────────────────────────────────────────────

const StatCard = memo(function StatCard({ t, styles, label, value, sub, amber }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, amber && { color: t.warning }]}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
});

const BadgeTile = memo(function BadgeTile({ badge, styles }) {
  const earned = badge.earned;
  return (
    <View style={[styles.badge, earned && styles.badgeEarned]}>
      <View style={[styles.badgeIcon, earned && styles.badgeIconEarned]}>
        <Text style={styles.badgeIconText}>{badge.icon || badge.title?.[0] || '?'}</Text>
      </View>
      <Text style={styles.badgeName}>{badge.title}</Text>
      <Text style={[styles.badgeStatus, earned && styles.badgeStatusEarned]}>
        {earned ? 'Earned' : badge.progressLabel || 'Locked'}
      </Text>
    </View>
  );
});

const LeaderboardRow = memo(function LeaderboardRow({ row, styles }) {
  const name = row.isMe ? 'You' : `${row.firstName || ''} ${row.lastName?.[0] ? row.lastName[0] + '.' : ''}`.trim();
  return (
    <View style={[styles.lbRow, row.isMe && styles.lbRowMe]}>
      <Text style={[styles.lbRank, row.isMe && styles.lbRankMe]}>{String(row.rank).padStart(2, '0')}</Text>
      <View style={[styles.lbAvatar, row.isMe && styles.lbAvatarMe]}>
        <Text style={[styles.lbAvatarText, row.isMe && styles.lbAvatarTextMe]}>{row.initials || name[0]}</Text>
      </View>
      <Text style={[styles.lbName, row.isMe && styles.lbNameMe]} numberOfLines={1}>{name}</Text>
      <Text style={styles.lbCount}>{row.weekReports} report{row.weekReports !== 1 ? 's' : ''}</Text>
    </View>
  );
});

const FeedRow = memo(function FeedRow({ item, t, styles }) {
  const name = `${item.firstName || ''} ${item.lastName?.[0] ? item.lastName[0] + '.' : ''}`.trim();
  // Every report is an event, and not every event is a cleanup — a wildlife
  // sighting or a water reading is described by its own subject rather than
  // as "a cleanup", which is what this said for all of them.
  const subjectLabel = primarySubjectLabel(item.subjects, 'an issue');
  const stateMeta = eventStateMeta(item.eventState);
  const verMeta = verificationStateMeta(item.verificationState);
  // Informational only — the feed reports what the community is seeing, it
  // is not a way into those events, so no press handler and no chevron.
  return (
    <View style={styles.feedRow}>
      <Text style={styles.feedTime}>{formatTimeAgo(item.submittedAt)}</Text>
      <View style={styles.feedContent}>
        <Text style={styles.feedText}>
          <Text style={styles.feedName}>{name}</Text> reported {subjectLabel.toLowerCase()}
          {item.location ? ` at ${item.location}` : ''}
        </Text>
        <View style={styles.feedMeta}>
          {item.quantity > 0 ? <Text style={styles.feedMetaText}>{item.quantity} kg</Text> : null}
          {item.volunteers > 0 ? <Text style={styles.feedMetaText}>· {item.volunteers} vol.</Text> : null}
          {/* The event model's own two axes (spec §12) rather than one
              flattened approved/pending/rejected pill: an event can be
              addressed and still unverified. */}
          <View style={[styles.feedPill, { backgroundColor: `${stateMeta.color}22` }]}>
            <Text style={[styles.feedPillText, { color: stateMeta.color }]}>{stateMeta.label}</Text>
          </View>
          <View style={[styles.feedPill, { backgroundColor: verMeta.color }]}>
            <Text style={[styles.feedPillText, { color: '#fff' }]}>{verMeta.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarClearance = TAB_BAR_HEIGHT + (insets.bottom > 0 ? insets.bottom + 8 : 8) + 24;
  const { user } = useAuth();
  const [feedExpanded, setFeedExpanded] = useState(false);
  // Opens the read-only event record. Lives in the Dashboard stack, so the
  // tab bar stays put and Back returns here.
  const openEvent = useCallback(
    (eventId) => { if (eventId) navigation.navigate('EventDetail', { eventId }); },
    [navigation]
  );
  const { mode } = useTheme();
  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const refresh = isFocused ? 1 : 0;
  const { stats, loading: statsLoading } = useCitizenStats(refresh);
  const { leaderboard, myRow, loading: leaderboardLoading } = useCitizenLeaderboard(refresh);
  const { feed, loading: feedLoading } = useCitizenFeed(6, refresh);
  const { events: myEvents, loading: eventsLoading } = useMyEvents(user?.id, refresh);
  const { stories, loading: storiesLoading } = useCitizenStories(3, refresh);
  const loading = statsLoading || leaderboardLoading || feedLoading || eventsLoading || storiesLoading;

  const s = stats || {};
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';
  const lastName = user?.lastName || '';  
  const totalReports = s.totalReports || 0;
  const isNewCitizen = totalReports === 0;
  const badges = s.badges || [];
  const earned = useMemo(() => badges.filter((b) => b.earned), [badges]);
  const lbRows = leaderboard || [];
  const showMyRow = myRow && !lbRows.some((r) => r.isMe);
  const allRows = useMemo(() => lbRows.concat(showMyRow ? [myRow] : []), [lbRows, showMyRow, myRow]);
  const sinceLabel = memberSince(s.memberSince);

  // Environmental events tied to this citizen's own reports (spec §22):
  // what's still open, separate from the community feed, which shows
  // everyone's activity rather than "what happened because of me".
  const needsAttention = useMemo(
    () => [...(myEvents || [])]
      .filter(isNeedsAttention)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [myEvents]
  );

  // Hero "what changed since you were last here" (spec §15) — the same
  // priority order the web spaces use (resolved > verified > corroborated),
  // so all three clients tell the same concrete story instead of a static
  // thank-you. Returns null when nothing qualifies, and the hero falls back
  // to its own copy rather than dressing up an absence.
  const heroUpdate = useMemo(() => {
    const list = myEvents || [];
    if (!list.length) return null;
    const byRecency = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const subjectLabelFor = (e) => e.subjects?.[0]?.label || 'issue';

    const resolved = byRecency.find((e) => e.eventState === 'addressed');
    if (resolved) return `the ${subjectLabelFor(resolved)} you reported is resolved.`;

    const verified = byRecency.find((e) => e.verificationState === 'verified');
    if (verified) return 'one of your reports was verified.';

    const corroborated = byRecency.find((e) => e.corroborationCount > 0);
    if (corroborated) {
      const n = corroborated.corroborationCount;
      return `${n} other ${n === 1 ? 'person has' : 'people have'} confirmed what you saw.`;
    }
    return null;
  }, [myEvents]);

  const statItems = useMemo(
    () => [
      { label: 'Reports', value: totalReports, sub: `since ${sinceLabel}` },
      { label: 'Waste logged', value: `${Number(s.totalKg || 0).toFixed(1)} kg`, sub: 'verified + pending' },
      {
        label: 'Badges earned',
        value: `${earned.length} / ${badges.length || 8}`,
        sub: badges.find((b) => !b.earned)?.title || 'All earned!',
        amber: true,
      },
      {
        label: 'City rank',
        value: s.cityRank ? `#${s.cityRank}` : '—',
        sub: lbRows.length ? `of ${lbRows.length} citizens` : 'not ranked yet',
      },
    ],
    [totalReports, s, sinceLabel, earned.length, badges, lbRows.length]
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarClearance }]}
      >
        {/* ── Hero ── the same Blue Mind hero the web Citizen Space uses.
            One hero for new and returning citizens alike, exactly as on
            web: only the content *below* it changes. */}
        <BlueMindHero
          t={t}
          mode={mode}
          firstName={firstName}
          heroUpdate={heroUpdate}
          jobTitle={user?.jobTitle}
          onContribute={() => navigation.navigate('Submit')}
        />

        {/* ── Community values + lifecycle ── shown to every citizen,
            including brand-new ones: they explain what the space is for,
            which is most useful before there is any data. */}
        <ValuesStrip t={t} />
        <LifecycleStrip t={t} />

        {isNewCitizen ? (
          <View style={styles.newUserCard}>
            <View style={styles.newUserIconWrap}>
              <LinearGradient
                colors={[t.primary, t.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.newUserIcon}
              >
                <Text style={styles.newUserIconText}>▣</Text>
              </LinearGradient>
            </View>

            <Text style={styles.newUserTitle}>Submit your first report to unlock your activity feed</Text>
            <Text style={styles.newUserDesc}>
              Once your first report is logged, this space fills in with the community feed, your badges, and where
              you rank among nearby citizens.
            </Text>

            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Submit')} style={styles.newUserCtaWrap}>
              <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Text style={styles.ctaText}>Submit Activity</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Stats ── */}
            <View style={styles.statsGrid}>
              {statItems.map((item) => (
                <StatCard key={item.label} t={t} styles={styles} {...item} />
              ))}
            </View>

            {/* ── Needs Attention ── the citizen's own open events ── */}
            <NeedsAttention t={t} events={needsAttention} onOpenEvent={openEvent} />

            {/* ── What Changed Because of You (spec §4) ── the full outcome
                chain, not its endpoint ── */}
            <ImpactStories t={t} stories={stories} onOpenEvent={openEvent} />

            {/* ── Community feed ── */}
            <Panel t={t} kicker="Community Feed" title="Latest reports" desc="Real-time submissions from citizens near you.">
              {feed.length === 0 ? (
                <Text style={styles.emptyText}>No reports yet — be the first!</Text>
              ) : (
                <>
                  {(feedExpanded ? feed.slice(0, 6) : feed.slice(0, 2)).map((item, i) => (
                    <FeedRow key={item.id || i} item={item} t={t} styles={styles} />
                  ))}
                  {feed.length > 2 ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setFeedExpanded((v) => !v)}
                      style={styles.feedToggle}
                    >
                      <Text style={styles.feedToggleText}>{feedExpanded ? 'Show less' : 'Show more'}</Text>
                      <Ionicons
                        name={feedExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={t.primary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </Panel>

            {/* ── Badges ── */}
            <Panel t={t} kicker="Milestones" title="Your badges" desc="Earned by reporting and hitting streaks.">
              {badges.length === 0 ? (
                <Text style={styles.emptyText}>No badges yet.</Text>
              ) : (
                <View style={styles.badgeGrid}>
                  {badges.map((badge) => (
                    <BadgeTile key={badge.id} badge={badge} styles={styles} />
                  ))}
                </View>
              )}
            </Panel>

            {/* ── Leaderboard ── */}
            <Panel t={t} kicker="This Week" title="Leaders" desc="Ranked by verified reports." style={{ marginBottom: 24 }}>
              {allRows.length === 0 ? (
                <Text style={styles.emptyText}>No citizens yet.</Text>
              ) : (
                allRows.slice(0, 6).map((row, i) => <LeaderboardRow key={row.userId || i} row={row} styles={styles} />)
              )}
            </Panel>
          </>
        )}
      </ScrollView>
    </Background>
  );
}

const getStyles = (t) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 80,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
    },
    ctaText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5,
    },
    ctaArrow: {
      color: '#ffffff',
      fontSize: 14,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    newUserCard: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 28,
      alignItems: 'center',
      marginBottom: 14,
    },
    newUserIconWrap: {
      marginBottom: 16,
    },
    newUserIcon: {
      width: 50,
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },
    newUserIconText: {
      color: '#ffffff',
      fontSize: 20,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    newUserTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 18,
      lineHeight: 24,
      textAlign: 'center',
      maxWidth: 260,
      letterSpacing: -0.2,
    },
    newUserDesc: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 20,
      maxWidth: 270,
    },
    newUserCtaWrap: {
      alignSelf: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    statCard: {
      width: '48%',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
    },
    statLabel: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 9.5,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    statValue: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 22,
      marginTop: 6,
      letterSpacing: -0.3,
    },
    statSub: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 10.5,
      marginTop: 3,
    },
    emptyText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      textAlign: 'center',
      paddingVertical: 18,
    },
    feedRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.borderLight,
    },
    feedTime: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 10.5,
      width: 46,
      flexShrink: 0,
      paddingTop: 2,
      lineHeight: 15,
    },
    feedContent: {
      flex: 1,
    },
    feedText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13.5,
      lineHeight: 19,
    },
    feedName: {
      fontFamily: CITIZEN_FONTS.sansBold,
      color: t.primaryHover,
    },
    feedMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    feedMetaText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11,
    },
    // Event-state / verification pills. Same shape as the old StatusPill,
    // but the colour is passed in per state rather than chosen from the
    // three legacy variants, so all ten event states can render.
    feedPill: {
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 20,
    },
    feedPillText: {
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 9.5,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    feedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 12,
    },
    feedToggleText: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
    },
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    badge: {
      width: '48%',
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      marginBottom: 10,
    },
    badgeEarned: {
      borderColor: 'rgba(46,158,155,0.32)',
      backgroundColor: 'rgba(46,158,155,0.08)',
    },
    badgeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: t.borderLight,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    badgeIconEarned: {
      borderColor: t.borderGlow,
    },
    badgeIconText: {
      fontSize: 15,
      color: t.textMuted,
    },
    badgeName: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11.5,
      textAlign: 'center',
      lineHeight: 15,
    },
    badgeStatus: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 9.5,
      marginTop: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    badgeStatusEarned: {
      color: t.primary,
    },
    lbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: t.borderLight,
    },
    lbRowMe: {
      backgroundColor: 'rgba(46,158,155,0.08)',
      borderRadius: 12,
      paddingHorizontal: 10,
      marginVertical: 2,
      borderBottomWidth: 0,
    },
    lbRank: {
      width: 22,
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12,
    },
    lbRankMe: {
      color: t.primary,
    },
    lbAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lbAvatarMe: {
      backgroundColor: 'rgba(46,158,155,0.14)',
      borderColor: t.borderGlow,
    },
    lbAvatarText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10,
    },
    lbAvatarTextMe: {
      color: t.primary,
    },
    lbName: {
      flex: 1,
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13.5,
    },
    lbNameMe: {
      color: t.primaryHover,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
    lbCount: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      flexShrink: 0,
    },
  });
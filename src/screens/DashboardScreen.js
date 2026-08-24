import React, { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCitizenStats, useCitizenLeaderboard, useCitizenFeed } from '../services/citizenHooks';
import { formatTimeAgo } from '../utils/formatTime';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';
import Panel from '../components/citizen/Panel';
import StatusPill from '../components/citizen/StatusPill';
import WaveMark from '../components/citizen/WaveMark';
import HeroWave from '../components/citizen/HeroWave';
import WaveBar from '../components/citizen/WaveBar';
import DashboardSkeleton from '../components/DashboardSkeleton';

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
  return (
    <View style={styles.feedRow}>
      <Text style={styles.feedTime}>{formatTimeAgo(item.submittedAt)}</Text>
      <View style={styles.feedContent}>
        <Text style={styles.feedText}>
          <Text style={styles.feedName}>{name}</Text> logged a cleanup at {item.location}
        </Text>
        <View style={styles.feedMeta}>
          {item.quantity > 0 ? <Text style={styles.feedMetaText}>{item.quantity} kg</Text> : null}
          {item.volunteers > 0 ? <Text style={styles.feedMetaText}>· {item.volunteers} vol.</Text> : null}
          <StatusPill t={t} item={item} />
        </View>
      </View>
    </View>
  );
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { mode } = useTheme();
  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const refresh = isFocused ? 1 : 0;
  const { stats, loading: statsLoading } = useCitizenStats(refresh);
  const { leaderboard, myRow, loading: leaderboardLoading } = useCitizenLeaderboard(refresh);
  const { feed, loading: feedLoading } = useCitizenFeed(6, refresh);
  const loading = statsLoading || leaderboardLoading || feedLoading;

  const s = stats || {};
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';
  const totalReports = s.totalReports || 0;
  const isNewCitizen = totalReports === 0;
  const badges = s.badges || [];
  const earned = useMemo(() => badges.filter((b) => b.earned), [badges]);
  const lbRows = leaderboard || [];
  const showMyRow = myRow && !lbRows.some((r) => r.isMe);
  const allRows = useMemo(() => lbRows.concat(showMyRow ? [myRow] : []), [lbRows, showMyRow, myRow]);
  const sinceLabel = memberSince(s.memberSince);

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
        contentContainerStyle={styles.scrollContent}
      >
        {isNewCitizen ? (
          <>
            <View style={styles.hero}>
              <WaveBar primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />

              <View style={styles.heroWaveWrap} pointerEvents="none">
                <HeroWave primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />
              </View>

              <View style={styles.heroKicker}>
                <Text style={styles.eyebrow}>CITIZEN SPACE</Text>
                <WaveMark color={t.borderGlow} primary={t.primary} />
              </View>

              <Text style={styles.h1}>
                Hi {firstName} — the coast is <Text style={styles.h1Accent}>a little cleaner</Text> because you showed up.
              </Text>
              <Text style={styles.heroSub}>
                0 reports logged since recently. Every entry feeds the community map BlueMind uses to track where
                pollution is concentrating.
              </Text>

              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Submit')} style={styles.ctaWrap}>
                <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                  <Text style={styles.ctaText}>Submit a report</Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

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
                  <Text style={styles.ctaText}>Submit a report</Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* ── Hero ── */}
            <View style={styles.hero}>
              <WaveBar primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />

              <View style={styles.heroWaveWrap} pointerEvents="none">
                <HeroWave primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />
              </View>

              <View style={styles.heroKicker}>
                <Text style={styles.eyebrow}>CITIZEN SPACE</Text>
                <WaveMark color={t.borderGlow} primary={t.primary} />
              </View>

              <Text style={styles.h1}>
                Hi {firstName} — the coast is <Text style={styles.h1Accent}>a little cleaner</Text> because you showed up.
              </Text>
              <Text style={styles.heroSub}>
                {totalReports} report{totalReports !== 1 ? 's' : ''} logged since {sinceLabel}. Every entry feeds the
                community map BlueMind uses to track where pollution is concentrating.
              </Text>

              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Submit')} style={styles.ctaWrap}>
                <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                  <Text style={styles.ctaText}>Submit a report</Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── Stats ── */}
            <View style={styles.statsGrid}>
              {statItems.map((item) => (
                <StatCard key={item.label} t={t} styles={styles} {...item} />
              ))}
            </View>

            {/* ── Community feed ── */}
            <Panel t={t} kicker="Community Feed" title="Latest reports" desc="Real-time submissions from citizens near you.">
              {feed.length === 0 ? (
                <Text style={styles.emptyText}>No reports yet — be the first!</Text>
              ) : (
                feed.slice(0, 6).map((item, i) => <FeedRow key={item.id || i} item={item} t={t} styles={styles} />)
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
                allRows.map((row, i) => <LeaderboardRow key={row.userId || i} row={row} styles={styles} />)
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
      paddingBottom: 28,
    },
    hero: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 20,
      paddingBottom: 66,
      marginBottom: 14,
    },
    heroWaveWrap: {
      position: 'absolute',
      right: -20,
      bottom: -18,
      opacity: 0.5,
    },
    heroKicker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    eyebrow: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2.2,
      opacity: 0.85,
    },
    h1: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 22,
      lineHeight: 29,
      letterSpacing: -0.3,
    },
    h1Accent: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.serifItalic,
      fontSize: 24,
    },
    heroSub: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 10,
    },
    ctaWrap: {
      marginTop: 18,
      alignSelf: 'flex-start',
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

import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, Text } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCitizenStats, useCitizenLeaderboard, useCitizenFeed } from '../services/citizenHooks';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
import BrandButton from '../components/BrandButton';

function BadgeTile({ badge, styles }) {
  const earned = badge.earned;
  return (
    <View style={[styles.badge, earned ? styles.badgeEarned : styles.badgeLocked]}>
      <View style={[styles.badgeIcon, earned && styles.badgeIconEarned]}>
        <Text style={[styles.badgeIconText, earned && styles.badgeIconTextEarned]}>{badge.icon}</Text>
      </View>
      <Text style={styles.badgeTitle}>{badge.title}</Text>
      <Text style={styles.badgeMeta}>{earned ? 'Earned' : badge.progressLabel}</Text>
    </View>
  );
}

function LeaderboardRow({ row, styles }) {
  return (
    <View style={[styles.leaderRow, row.isMe && styles.myLeaderRow]}>
      <Text style={styles.leaderPosition}>{row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] || row.rank : row.rank}</Text>
      <View style={styles.leaderNameGroup}>
        <Text style={[styles.leaderName, row.isMe && styles.myLeaderName]}>{row.isMe ? 'You' : `${row.firstName} ${row.lastName?.[0] || ''}.`}</Text>
        <Text style={styles.leaderSub}>{row.weekReports} reports</Text>
      </View>
    </View>
  );
}

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const diffSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { stats, loading: statsLoading } = useCitizenStats(isFocused ? 1 : 0);
  const { leaderboard, myRow, loading: leaderboardLoading } = useCitizenLeaderboard(isFocused ? 1 : 0);
  const { feed, loading: feedLoading } = useCitizenFeed(5, isFocused ? 1 : 0);
  const loading = statsLoading || leaderboardLoading || feedLoading;

  const firstName = user?.firstName || user?.displayName || 'there';
  const totalReports = stats?.totalReports || 0;
  const tier = stats?.tier || { label: '🌱 Newcomer' };
  const badges = stats?.badges || [];
  const earned = badges.filter((badge) => badge.earned);
  const rows = leaderboard || [];
  const showMyRow = myRow && !rows.some((r) => r.isMe);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTag}>CITIZEN SPACE</Text>
          </View>
          <Text style={styles.heroTitle}>Hi {firstName}, thanks for keeping the coast clean</Text>
          <Text style={styles.heroSubtitle}>{totalReports} reports · member since {stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently'}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={styles.tierBadge}><Text style={styles.tierBadgeText}>{tier.label}</Text></View>
          </View>
          <BrandButton title="+ Submit a Report" onPress={() => navigation.navigate('Submit')} style={styles.heroButton} />
        </GlassCard>

        {stats?.tier?.next && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Progress to next tier</Text>
            <Text style={styles.sectionSubtitle}>You need {Math.max(0, (stats.nextAt || 0) - totalReports)} more reports to unlock {stats.tier.next}.</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${stats.progressPct || 0}%` }]} />
            </View>
            <Text style={styles.progressMeta}>{stats.progressLabel}</Text>
          </GlassCard>
        )}

        <View style={styles.statsGrid}>
          {[
            { value: totalReports, label: 'Reports' },
            { value: `${Number(stats?.totalKg || 0).toFixed(1)} kg`, label: 'Waste logged' },
            { value: earned.length, label: 'Badges earned' },
            { value: stats?.cityRank ? `#${stats.cityRank}` : '—', label: 'City rank' }
          ].map((item) => (
            <GlassCard key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </GlassCard>
          ))}
        </View>

        <View style={styles.sectionWrap}>
          <GlassCard style={styles.badgesCard}>
            <Text style={styles.sectionTitle}>Your badges</Text>
            <Text style={styles.sectionSubtitle}>Earn by submitting reports and hitting milestones.</Text>
            <View style={styles.badgeGrid}>{badges.map((badge) => <BadgeTile key={badge.id} badge={badge} styles={styles} />)}</View>
          </GlassCard>

          <GlassCard style={styles.leaderboardCard}>
            <Text style={styles.sectionTitle}>This week's leaders</Text>
            <Text style={styles.sectionSubtitle}>All citizens ranked by reports</Text>
            {rows.concat(showMyRow ? [myRow] : []).map((row, index) => <LeaderboardRow key={row.userId || index} row={row} styles={styles} />)}
          </GlassCard>
        </View>

        <GlassCard>
          <Text style={styles.sectionTitle}>Community feed</Text>
          <Text style={styles.sectionSubtitle}>Latest reports from citizens</Text>
          {feed.length === 0 ? (
            <Text style={styles.emptyText}>No reports yet — be the first!</Text>
          ) : (
            feed.slice(0, 5).map((item) => {
              const statusLabel = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown';
              const wasteValue = item.quantity != null ? `${item.quantity} kg` : '0 kg';
              const timeAgo = formatTimeAgo(item.submittedAt);
              return (
                <View key={item.id} style={styles.feedItem}>
                  <View style={styles.feedAvatar}>
                    <Text style={styles.feedAvatarText}>{item.initials || `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`}</Text>
                  </View>
                  <View style={styles.feedTextContent}>
                    <Text style={styles.feedName}>{item.firstName} {item.lastName?.[0] ? `${item.lastName[0]}.` : ''}</Text>
                    <Text style={styles.feedDesc}>logged a cleanup at {item.location}</Text>
                    <View style={styles.feedSummaryRow}>
                      <Text style={styles.feedSummaryText}>{wasteValue}</Text>
                      <Text style={styles.feedSummaryText}>· {item.volunteers ?? 0} vol.</Text>
                      <Text style={styles.feedSummaryText}>· {timeAgo}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'approved' ? styles.statusBadgeApproved : styles.statusBadgePending]}>
                    <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                  </View>
                </View>
              );
            })
          )}
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  heroCard: {
    paddingBottom: 22,
    marginBottom: 16,
    marginTop: 25
  },
  heroTag: {
    color: theme.colors.secondary,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.6,
    fontSize: 12
  },
  heroTitle: {
    color: theme.colors.textMain,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 34
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20
  },
  tierBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16
  },
  tierBadgeText: {
    color: theme.colors.textMain,
    fontWeight: '700'
  },
  sectionTitle: {
    color: theme.colors.textMain,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    marginBottom: 18,
    lineHeight: 20,
    fontSize: 13
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 18
  },
  heroButton: {
    width: '100%',
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 18
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary
  },
  progressMeta: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  statCard: {
    width: '48%',
    paddingVertical: 18,
    alignItems: 'center'
  },
  statValue: {
    color: theme.colors.textMain,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center'
  },
  sectionWrap: {
    flexDirection: 'column',
    marginBottom: 16
  },
  badgesCard: {
    width: '100%'
  },
  leaderboardCard: {
    width: '100%'
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  badge: {
    width: '48%',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  badgeEarned: {
    borderColor: theme.colors.primary,
    borderWidth: 1
  },
  badgeLocked: {
    opacity: 0.65
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  badgeIconEarned: {
    backgroundColor: 'rgba(184,134,43,0.12)'
  },
  badgeIconText: {
    fontSize: 18,
    color: theme.colors.textMuted
  },
  badgeIconTextEarned: {
    color: theme.colors.primary
  },
  badgeTitle: {
    color: theme.colors.textMain,
    fontWeight: '700',
    marginBottom: 4
  },
  badgeMeta: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  leaderRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center'
  },
  myLeaderRow: {
    backgroundColor: 'rgba(14,165,233,0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  leaderPosition: {
    width: 34,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700'
  },
  leaderNameGroup: {
    flex: 1
  },
  leaderName: {
    color: theme.colors.textMain,
    fontWeight: '700'
  },
  myLeaderName: {
    color: theme.colors.primary
  },
  leaderSub: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 14
  },
  feedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center'
  },
  feedAvatarText: {
    color: theme.colors.textMain,
    fontWeight: '700'
  },
  feedTextContent: {
    flex: 1
  },
  feedName: {
    color: theme.colors.textMain,
    fontSize: 14,
    fontWeight: '700'
  },
  feedDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4
  },
  feedSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  feedSummaryText: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start'
  },
  statusBadgeApproved: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)'
  },
  statusBadgePending: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)'
  },
  statusBadgeText: {
    color: theme.colors.textMain,
    fontSize: 11,
    fontWeight: '700'
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

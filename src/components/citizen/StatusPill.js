import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';

const VARIANTS = {
  pending: (t) => ({ bg: 'rgba(198,130,30,0.14)', color: t.warning }),
  verified: (t) => ({ bg: 'rgba(46,158,155,0.14)', color: t.success }),
  rejected: (t) => ({ bg: t.dangerBg, color: t.danger }),
};

function getFeedStatus(item) {
  const value = String(item.status || item.verificationStatus || item.activityStatus || 'pending')
    .trim()
    .toLowerCase();

  if (['approved', 'verified', 'complete', 'completed'].includes(value)) {
    return { label: 'Verified', variant: 'verified' };
  }
  if (['rejected', 'declined', 'failed'].includes(value)) {
    return { label: 'Rejected', variant: 'rejected' };
  }
  if (value === 'pending' || value === 'in_review' || value === 'under_review') {
    return { label: 'Pending', variant: 'pending' };
  }
  return {
    label: value.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    variant: 'pending',
  };
}

const StatusPill = memo(function StatusPill({ t, item }) {
  const status = getFeedStatus(item);
  const { bg, color } = VARIANTS[status.variant](t);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{status.label}</Text>
    </View>
  );
});

export default StatusPill;
export { getFeedStatus };

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontFamily: CITIZEN_FONTS.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

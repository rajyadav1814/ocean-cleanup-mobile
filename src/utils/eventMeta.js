// Environmental-event vocabulary for the mobile Citizen Space.
//
// A direct port of the web app's src/apps/contributor/eventMeta.js: the two
// clients show the same events to the same person, so a state must read as
// the same label and the same colour in both. Colours are the web module's
// literal hexes rather than theme tokens for that reason — an event's state
// is not a brand accent, and it must not drift when the citizen theme does.
//
// event_state and verification_state are two independent axes (spec §11-12),
// so they get separate maps rather than one combined "status" the way the
// legacy activity pill worked.
export const EVENT_STATE_META = {
  observed:          { label: 'Observed',          color: '#8299a0' },
  corroborated:      { label: 'Corroborated',      color: '#378add' },
  needs_attention:   { label: 'Needs attention',   color: '#f59e0b' },
  action_planned:    { label: 'Action planned',    color: '#7f77dd' },
  action_underway:   { label: 'Action underway',   color: '#2E9E9B' },
  addressed:         { label: 'Addressed',         color: '#10b981' },
  reassessed:        { label: 'Reassessed',        color: '#8299a0' },
  recurring:         { label: 'Recurring',         color: '#c14f2c' },
  disputed:          { label: 'Disputed',          color: '#ef4444' },
  unable_to_verify:  { label: 'Unable to verify',  color: '#8299a0' },
};

export const VERIFICATION_STATE_META = {
  unverified:    { label: 'Unverified',   color: '#8299a0' },
  supported:     { label: 'Supported',    color: '#378add' },
  corroborated:  { label: 'Corroborated', color: '#2E9E9B' },
  verified:      { label: 'Verified',     color: '#10b981' },
};

export function eventStateMeta(state) {
  return EVENT_STATE_META[state] || EVENT_STATE_META.observed;
}

export function verificationStateMeta(state) {
  return VERIFICATION_STATE_META[state] || VERIFICATION_STATE_META.unverified;
}

// What an event is *about*, for the one-line places that can only show a
// single subject. Not subjects[0]: the list payload aggregates subjects in
// an order driven by the serialized value, so "first" is arbitrary and can
// land on the human_action subject — leaving a ghost net reading as "the
// Cleanup / removal you reported". Human action is the last resort.
const SUBJECT_PRIORITY = ['pollution_waste', 'life', 'habitat', 'water', 'conditions', 'human_action'];

export function primarySubject(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;
  for (const family of SUBJECT_PRIORITY) {
    const match = subjects.find((s) => s?.family === family);
    if (match) return match;
  }
  return subjects[0];
}

export function primarySubjectLabel(subjects, fallback = 'issue') {
  return primarySubject(subjects)?.label || fallback;
}

const IMPACT_PHRASES = {
  debris_removed_kg: (v, u) => `${v}${u ? ` ${u}` : ''} removed`,
};

export function formatImpactPhrase({ metric, value, unit }) {
  const phrase = IMPACT_PHRASES[metric];
  if (phrase) return phrase(value, unit);
  return `${value}${unit ? ` ${unit}` : ''} ${String(metric).replace(/_/g, ' ')}`;
}

export function fmtEventDate(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function fmtEventDateTime(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

// How the reporter's own first beat reads, by how they sent it in.
export const INTAKE_VERB = {
  photo_video: 'photographed',
  tell_blue_mind: 'described',
  measurement: 'measured',
  upload: 'uploaded a record of',
};

/**
 * Turns one story from /api/citizen/stories into ordered timeline beats
 * (spec §4). Every beat is backed by recorded data — anything the system
 * didn't capture is left out rather than filled in with a plausible guess,
 * so a short chain means a quiet event, never an invented one.
 */
export function buildStoryTimeline(story) {
  const beats = [];
  const subject = primarySubjectLabel(story.subjects, 'an issue');
  const verb = INTAKE_VERB[story.intakeMethod] || 'reported';

  beats.push({
    key: 'reported',
    text: `You ${verb} ${subject.toLowerCase()}`,
    detail: story.reportedAt ? fmtEventDateTime(story.reportedAt) : null,
  });

  if (story.corroboratorCount > 0) {
    beats.push({
      key: 'corroborated',
      text: `${story.corroboratorCount} other ${story.corroboratorCount === 1 ? 'person' : 'people'} reported the same thing`,
      detail: null,
    });
    beats.push({
      key: 'merged',
      text: `${story.mergedReportCount} reports merged into one event`,
      detail: 'Not filed as separate problems',
    });
  }

  if (story.action) {
    const who = story.action.actorOrg || story.action.actorName;
    beats.push({
      key: 'action',
      text: who ? `${who} acted on it` : 'An action was taken in response',
      detail: [story.action.title, story.action.actedAt ? fmtEventDate(story.action.actedAt) : null]
        .filter(Boolean).join(' · ') || null,
    });
  }

  // The outcome gets its own emphasised beat — the number the reporter
  // came back to see.
  if (story.impact?.length > 0) {
    beats.push({
      key: 'impact',
      text: story.impact.map(formatImpactPhrase).join(' · '),
      detail: null,
      outcome: true,
    });
  }

  return beats;
}

// Open issues from the citizen's own reports. 'reassessed' belongs here,
// not excluded: it is a closed report that got a fresh corroborator and is
// being looked at again (spec §11) — the opposite of settled.
export function isNeedsAttention(event) {
  return event?.eventState !== 'addressed';
}

// Relationship vocabulary, for the "Related events" list. Mirrors the web
// RELATIONSHIP_LABEL map.
export const RELATIONSHIP_LABEL = {
  corroborates: 'confirmed the same thing',
  duplicate_of: 'same as another report',
  follow_up_to: 'followed up',
  responds_to: 'answered by an action',
  removed: 'removed',
  rescued: 'rescued',
  restored: 'restored',
  verifies: 'verified another report',
  disputes: 'disputed',
  supersedes: 'replaced an earlier record',
  affects: 'affects',
  affected_by: 'affected by',
  caused_by: 'caused by',
  possibly_caused_by: 'possibly caused by',
  observed_at: 'observed at',
  predicted_to_affect: 'predicted to affect',
};

/**
 * The event-detail narrative (spec §4-5), ported from the web EventDetail:
 * what changed because of this contribution, told as a sequence instead of
 * left for the reader to reconstruct from the cards below.
 *
 * Unlike buildStoryTimeline (which reads the /stories payload), this reads
 * one full event detail, and its beats carry `done` so the chain can show
 * what has NOT happened yet rather than dead-ending on "reported".
 */
export function buildEventStoryBeats(event) {
  const beats = [];
  const relationships = event.relationships || [];
  const verifications = event.verifications || [];
  const impact = event.impact || [];

  beats.push({ text: `Reported ${fmtEventDate(event.createdAt)}.`, done: true });

  const corroborators = relationships.filter((r) => r.relationshipType === 'corroborates').length;
  if (corroborators > 0) {
    beats.push({
      text: `${corroborators} other ${corroborators === 1 ? 'person' : 'people'} reported the same thing — Blue Mind joined the reports into this one event, not ${corroborators + 1} separate problems.`,
      done: true,
    });
  }

  const actionRelationships = relationships.filter((r) => ['removed', 'rescued', 'restored'].includes(r.relationshipType));
  if (actionRelationships.length > 0) {
    const impactPhrase = impact.length > 0 ? impact.map(formatImpactPhrase).join(' · ') : null;
    beats.push({
      text: impactPhrase
        ? `Action taken: ${impactPhrase}.`
        : `Action taken — ${RELATIONSHIP_LABEL[actionRelationships[0].relationshipType] || actionRelationships[0].relationshipType}.`,
      done: true,
    });
  } else if (event.eventState === 'action_planned' || event.eventState === 'action_underway') {
    beats.push({ text: 'An action is underway in response to this.', done: true });
  }

  const verifiedEntry = verifications.find((v) => v.outcome === 'verified');
  const disputedEntry = verifications.find((v) => v.outcome === 'disputed' || v.outcome === 'unable_to_verify');
  if (verifiedEntry) {
    beats.push({ text: `Verified by a reviewer on ${fmtEventDate(verifiedEntry.createdAt)}.`, done: true });
  } else if (disputedEntry) {
    beats.push({ text: `A verifier flagged this as ${disputedEntry.outcome.replace(/_/g, ' ')} on ${fmtEventDate(disputedEntry.createdAt)}.`, done: true });
  }

  // The forward-looking beat — what hasn't happened yet, so the story never
  // dead-ends on "reported" with no sense of what comes next.
  if (event.eventState === 'addressed' && verifiedEntry) {
    beats.push({ text: 'Resolved and verified — this is what changed because of you.', done: true, final: true });
  } else if (event.eventState === 'addressed') {
    beats.push({ text: 'Marked complete — waiting on a verifier to confirm it.', done: false });
  } else if (corroborators > 0 || actionRelationships.length > 0) {
    beats.push({ text: 'Blue Mind is still tracking this — check back for what happens next.', done: false });
  } else {
    beats.push({ text: 'Still open — Blue Mind is watching for corroboration or action.', done: false });
  }

  return beats;
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { citizenApi } from '../services/api';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';
import WaveBar from '../components/citizen/WaveBar';
import SelectField from '../components/citizen/SelectField';

// ─── Constants ────────────────────────────────────────────────────────────────
// Mirrors the web app's citizen submit flow (ocean-cleanup-frontend
// SubmitActivity.jsx `visibleSteps = [1, 4, 6]`): citizens report casual
// sightings, not full cleanup drives, so only site conditions, hazards +
// evidence, and the disposal/review summary are collected.

const MAX_PHOTOS = 5;

const STEPS = [
  { key: 1, label: 'Site conditions' },
  { key: 4, label: 'Hazards and evidence' },
  { key: 6, label: 'Disposal and review' }
];

const SHORELINE_TYPES = ['Sandy beach', 'Rocky shore', 'Mangrove', 'Urban outfall', 'Riverbank'];
const TIDE_STATES = ['Low tide', 'Mid tide', 'High tide'];
const DISPOSAL_METHODS = ['Recycled', 'Landfill', 'Hazardous waste service'];

const INITIAL_FORM = {
  location: '',
  latitude: '',
  longitude: '',
  shorelineType: 'Sandy beach',
  tideState: 'Low tide',
  cleanedBefore: false,
  hazards: { medical: false, chemical: false, unstable: false },
  waste: '',
  disposalMethod: 'Recycled',
  followUp: false,
  notes: ''
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateFileName(uri, maxLen = 22) {
  if (!uri) return '';
  const name = uri.split('/').pop() || uri;
  return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
}

// ─── Pure sub-components ───────────────────────────────────────────────────

const Checkbox = React.memo(function Checkbox({ t, styles, checked, label, onToggle }) {
  return (
    <TouchableOpacity style={styles.checkboxRow} activeOpacity={0.8} onPress={onToggle}>
      <View style={[styles.checkboxBox, checked && { backgroundColor: t.primary, borderColor: t.primary }]}>
        {checked ? <Ionicons name="checkmark" size={13} color="#ffffff" /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

function PhotoGrid({ photos, onRemove, styles }) {
  if (photos.length === 0) return null;

  return (
    <View style={styles.photoSection}>
      <Text style={styles.photoCountLabel}>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} added
      </Text>

      <View style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <View key={`${photo.uri}-${index}`} style={styles.photoTile}>
            <Image source={{ uri: photo.uri }} style={styles.photoTileImage} resizeMode="cover" />
            <View style={styles.photoTileLabel}>
              <Text style={styles.photoTileLabelText} numberOfLines={1}>
                {truncateFileName(photo.uri)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.photoRemoveButton}
              onPress={() => onRemove(index)}
              activeOpacity={0.8}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Ionicons name="close" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SubmitActivityScreen() {
  const navigation = useNavigation();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex].key;

  const [form, setForm] = useState(INITIAL_FORM);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDeniedPermanently, setLocationDeniedPermanently] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isFocused && !form.latitude) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  // ─── Location ────────────────────────────────────────────────────────────

  const getCurrentLocation = useCallback(async (showMessage = false) => {
    try {
      setLocationLoading(true);
      setLocationDeniedPermanently(false);

      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!canAskAgain) {
          setLocationDeniedPermanently(true);
          setMessage('Location access is blocked. Please enable it in your device settings.');
        } else {
          setMessage('Location permission denied. Tap "Use current location" to try again.');
        }
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = currentLocation.coords;
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });

      const locationName = [address?.name, address?.street, address?.city, address?.region, address?.country]
        .filter(Boolean)
        .join(', ');

      setForm((prev) => ({
        ...prev,
        location: locationName || `Current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6)
      }));

      setMessage(showMessage ? 'Current location loaded.' : '');
    } catch (error) {
      console.error(error);
      setMessage('Unable to fetch your current location.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleLocationPress = useCallback(() => {
    if (locationDeniedPermanently) {
      Linking.openSettings();
    } else {
      getCurrentLocation(true);
    }
  }, [locationDeniedPermanently, getCurrentLocation]);

  // ─── Photos ───────────────────────────────────────────────────────────────

  const addPhotos = useCallback((newAssets) => {
    setPhotos((prev) => {
      const available = MAX_PHOTOS - prev.length;
      if (available <= 0) return prev;
      return [...prev, ...newAssets.slice(0, available)];
    });
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      setMessage(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      setMessage('Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      base64: true
    });
    if (!result.canceled && result.assets.length > 0) {
      addPhotos(result.assets);
      setMessage('');
    }
  }, [photos.length, addPhotos]);

  const handlePickImage = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      setMessage(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setMessage('Gallery permission is required.');
      return;
    }
    const remaining = MAX_PHOTOS - photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      base64: true
    });
    if (!result.canceled && result.assets.length > 0) {
      addPhotos(result.assets);
      setMessage('');
    }
  }, [photos.length, addPhotos]);

  const handleRemovePhoto = useCallback((index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Form helpers ─────────────────────────────────────────────────────────

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleHazard = useCallback((key) => {
    setForm((prev) => ({ ...prev, hazards: { ...prev.hazards, [key]: !prev.hazards[key] } }));
  }, []);

  const totalImageCount = photos.length;

  // Mirrors the web app's citizen completeness checklist — only fields a
  // citizen actually sees count toward the score.
  const completenessChecks = [Boolean(form.location), Boolean(form.waste), totalImageCount > 0, Boolean(form.notes)];
  const completenessScore = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
  );

  // ─── Navigation between steps ───────────────────────────────────────────

  const handleBack = useCallback(() => {
    setMessage('');
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    setMessage('');
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }, []);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const imageDataUrls = photos.filter((p) => p.base64).map((p) => `data:image/jpeg;base64,${p.base64}`);

      const payload = {
        organizationId: null,
        contributorId: user?.id || user?.userId || null,
        category: 'plastic',
        location: form.location,
        quantity: String(form.waste),
        volunteers: 1,
        evidenceHash: 'mock-hash',
        notes: form.notes,
        lat: form.latitude ? Number(form.latitude) : null,
        lon: form.longitude ? Number(form.longitude) : null,
        gps: form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : null,
        shorelineType: form.shorelineType,
        tideState: form.tideState,
        cleanedBefore: form.cleanedBefore,
        microplastics: 'None observed',
        bulkItems: '',
        speciesSighted: '',
        condition: 'Healthy',
        habitatStress: '',
        hazardsMedical: form.hazards.medical,
        hazardsChemical: form.hazards.chemical,
        hazardsUnstable: form.hazards.unstable,
        instrument: 'Field scale',
        disposalMethod: form.disposalMethod,
        followUp: form.followUp
      };

      if (imageDataUrls.length > 0) {
        payload.imageUrls = JSON.stringify(imageDataUrls);
      }

      const data = await citizenApi.submitReport(payload);

      if (data.ok) {
        setForm(INITIAL_FORM);
        setPhotos([]);
        setStepIndex(0);
        navigation.navigate('Dashboard');
      } else {
        setMessage(data.message || data.error || 'Unable to submit report.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, photos, user, navigation]);

  // ─── Derived values ───────────────────────────────────────────────────────

  const locationButtonDisabled = locationLoading || (!!form.latitude && !locationDeniedPermanently);

  const locationIcon = locationDeniedPermanently
    ? 'settings-outline'
    : form.latitude
    ? 'checkmark-circle-outline'
    : 'locate-outline';

  const locationButtonLabel = locationLoading
    ? 'Fetching location…'
    : locationDeniedPermanently
    ? 'Open Settings'
    : form.latitude
    ? 'Location detected'
    : 'Use current location';

  const photoLimitReached = photos.length >= MAX_PHOTOS;
  const isLastStep = stepIndex === STEPS.length - 1;

  // Each step gates the Next/Submit button on its own required field,
  // rather than letting the user advance and only finding out on tap.
  let isStepValid = true;
  let stepHint = '';
  if (step === 1 && !form.latitude) {
    isStepValid = false;
    stepHint = 'Detect a location to continue.';
  } else if (step === 4 && photos.length === 0) {
    isStepValid = false;
    stepHint = 'Add at least one photo to continue.';
  } else if (step === 6 && !form.waste.trim()) {
    // Flagged inline on the field itself (required marker) instead of a
    // bottom hint — the field sits at the top of a long step.
    isStepValid = false;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <WaveBar primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} height={40} />

              <View style={styles.titleRow}>
                <Ionicons name="paper-plane-outline" size={18} color={t.primary} style={styles.titleIcon} />
                <Text style={styles.title}>Submit Activity</Text>
              </View>
              <Text style={styles.stepMeta}>
                Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex].label}
              </Text>

              <View style={styles.progressRow}>
                {STEPS.map((s, i) => (
                  <View key={s.key} style={[styles.progressSeg, i <= stepIndex && { backgroundColor: t.primary }]} />
                ))}
              </View>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* ── Step 1: Site conditions ── */}
              {step === 1 ? (
                <View style={styles.stepBody}>
                  <Text style={styles.fieldLabel}>Location</Text>
                  <TouchableOpacity
                    style={[styles.locationButton, locationButtonDisabled && !locationDeniedPermanently && styles.locationButtonDisabled]}
                    activeOpacity={0.85}
                    onPress={handleLocationPress}
                    disabled={locationButtonDisabled}
                  >
                    <Ionicons name={locationIcon} size={18} color={t.primary} />
                    <Text style={styles.locationButtonText}>{locationButtonLabel}</Text>
                  </TouchableOpacity>

                  <View style={styles.locationInfoCard}>
                    <Text style={styles.locationInfoTitle}>📍 Detected location</Text>
                    {form.location ? <Text style={styles.locationInfoName}>{form.location}</Text> : null}
                    <Text style={styles.locationInfoText}>
                      {form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : 'Location will appear here once detected.'}
                    </Text>
                  </View>

                  <SelectField
                    t={t}
                    label="Shoreline type"
                    value={form.shorelineType}
                    options={SHORELINE_TYPES}
                    onSelect={(v) => setField('shorelineType', v)}
                    style={styles.field}
                  />
                  <SelectField
                    t={t}
                    label="Tide state"
                    value={form.tideState}
                    options={TIDE_STATES}
                    onSelect={(v) => setField('tideState', v)}
                    style={styles.field}
                  />

                  <Checkbox
                    t={t}
                    styles={styles}
                    checked={form.cleanedBefore}
                    label="This site has been cleaned before"
                    onToggle={() => setField('cleanedBefore', !form.cleanedBefore)}
                  />
                </View>
              ) : null}

              {/* ── Step 4: Hazards and evidence ── */}
              {step === 4 ? (
                <View style={styles.stepBody}>
                  <Text style={styles.fieldLabel}>Hazards observed</Text>
                  <View style={styles.hazardsGroup}>
                    <Checkbox t={t} styles={styles} checked={form.hazards.medical} label="Medical or sharps waste" onToggle={() => toggleHazard('medical')} />
                    <Checkbox t={t} styles={styles} checked={form.hazards.chemical} label="Chemical container" onToggle={() => toggleHazard('chemical')} />
                    <Checkbox t={t} styles={styles} checked={form.hazards.unstable} label="Unstable structure" onToggle={() => toggleHazard('unstable')} />
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 6 }]}>Photos (Wide site, Hazards, Before & After)</Text>
                  <View style={styles.imageButtonsRow}>
                    <TouchableOpacity
                      style={[styles.imageButton, photoLimitReached && styles.imageButtonDisabled]}
                      activeOpacity={0.8}
                      onPress={handleTakePhoto}
                      disabled={photoLimitReached}
                    >
                      <Ionicons name="camera-outline" size={22} color={photoLimitReached ? t.textMuted : t.primary} />
                      <Text style={[styles.imageButtonText, photoLimitReached && styles.imageButtonTextDisabled]}>Open Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.imageButton, photoLimitReached && styles.imageButtonDisabled]}
                      activeOpacity={0.8}
                      onPress={handlePickImage}
                      disabled={photoLimitReached}
                    >
                      <Ionicons name="images-outline" size={22} color={photoLimitReached ? t.textMuted : t.primary} />
                      <Text style={[styles.imageButtonText, photoLimitReached && styles.imageButtonTextDisabled]}>Gallery Upload</Text>
                    </TouchableOpacity>
                  </View>

                  <PhotoGrid photos={photos} onRemove={handleRemovePhoto} styles={styles} />
                </View>
              ) : null}

              {/* ── Step 6: Disposal and review ── */}
              {step === 6 ? (
                <View style={styles.stepBody}>
                  <Text style={styles.fieldLabel}>
                    Total weight collected (kg) <Text style={styles.fieldLabelRequired}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, !form.waste.trim() && styles.inputError]}
                    placeholder="e.g., 18"
                    placeholderTextColor={t.textMuted}
                    value={form.waste}
                    onChangeText={(v) => setField('waste', v)}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />

                  <SelectField
                    t={t}
                    label="Disposal method"
                    value={form.disposalMethod}
                    options={DISPOSAL_METHODS}
                    onSelect={(v) => setField('disposalMethod', v)}
                    style={styles.field}
                  />

                  <Text style={styles.fieldLabel}>
                    Notes <Text style={styles.fieldLabelMuted}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any extra details about this cleanup…"
                    placeholderTextColor={t.textMuted}
                    value={form.notes}
                    onChangeText={(v) => setField('notes', v)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  <Checkbox
                    t={t}
                    styles={styles}
                    checked={form.followUp}
                    label="This site needs follow-up"
                    onToggle={() => setField('followUp', !form.followUp)}
                  />

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Location</Text>
                      <Text style={styles.summaryValue} numberOfLines={1}>
                        {form.location || 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Weight</Text>
                      <Text style={styles.summaryValue}>{form.waste ? `${form.waste} kg` : '0 kg'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Photos attached</Text>
                      <Text style={styles.summaryValue}>{totalImageCount}</Text>
                    </View>
                  </View>

                  <Text style={styles.completenessLabel}>Data completeness</Text>
                  <View style={styles.completenessTrack}>
                    <View style={[styles.completenessFill, { width: `${completenessScore}%`, backgroundColor: t.success }]} />
                  </View>
                </View>
              ) : null}

              {!isStepValid && step !== 6 ? <Text style={styles.stepHint}>{stepHint}</Text> : null}

              {/* ── Nav buttons ── */}
              <View style={styles.navRow}>
                {stepIndex > 0 ? (
                  <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={handleBack}>
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                <TouchableOpacity
                  style={[styles.navFlex, (!isStepValid || loading) && styles.navFlexDisabled]}
                  activeOpacity={0.85}
                  onPress={isLastStep ? handleSubmit : handleNext}
                  disabled={!isStepValid || loading}
                >
                  <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextButton}>
                    <Text style={styles.nextButtonText}>
                      {isLastStep ? (loading ? 'Submitting…' : 'Submit activity') : 'Next'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Background>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (t) =>
  StyleSheet.create({
    screen: {
      flex: 1
    },
    keyboardView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 80
    },
    card: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 20
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    titleIcon: {
      marginTop: 1
    },
    title: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 19,
      letterSpacing: -0.2
    },
    stepMeta: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
      marginTop: 4
    },
    progressRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 12,
      marginBottom: 16
    },
    progressSeg: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderLight
    },
    message: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      backgroundColor: t.dangerBg,
      borderRadius: 10,
      padding: 10,
      marginBottom: 14
    },
    stepBody: {
      gap: 4
    },
    field: {
      marginBottom: 14
    },
    fieldLabel: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      marginBottom: 8
    },
    fieldLabelMuted: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans
    },
    fieldLabelRequired: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sansBold
    },
    input: {
      backgroundColor: t.surfaceHover,
      borderRadius: 12,
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: t.borderLight,
      marginBottom: 14,
      minHeight: 48
    },
    textArea: { minHeight: 84 },
    inputError: {
      borderColor: t.danger
    },

    // ── Location ──────────────────────────────────────────────────────────
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.surfaceHover,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.borderLight,
      paddingVertical: 12,
      marginBottom: 12
    },
    locationButtonDisabled: { opacity: 0.6 },
    locationButtonText: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },
    locationInfoCard: {
      backgroundColor: t.surfaceHover,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.borderLight,
      padding: 12,
      marginBottom: 14
    },
    locationInfoTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      marginBottom: 4
    },
    locationInfoName: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      marginBottom: 4,
      lineHeight: 17
    },
    locationInfoText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      lineHeight: 17
    },

    // ── Checkboxes ────────────────────────────────────────────────────────
    hazardsGroup: {
      gap: 10,
      marginBottom: 6
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    },
    checkboxBox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: t.borderLight,
      alignItems: 'center',
      justifyContent: 'center'
    },
    checkboxLabel: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13.5,
      flexShrink: 1
    },

    // ── Photo capture buttons ──────────────────────────────────────────────
    imageButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 6,
      marginBottom: 6
    },
    imageButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: t.borderLight,
      backgroundColor: t.surfaceHover,
      alignItems: 'center',
      justifyContent: 'center'
    },
    imageButtonDisabled: {
      opacity: 0.45
    },
    imageButtonText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      marginTop: 8,
      fontSize: 12,
      textAlign: 'center'
    },
    imageButtonTextDisabled: {
      color: t.textMuted
    },

    // ── Photo grid ────────────────────────────────────────────────────────
    photoSection: {
      marginTop: 14
    },
    photoCountLabel: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      textAlign: 'center',
      marginBottom: 10
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
    },
    photoTile: {
      width: '47%',
      aspectRatio: 1.3,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: t.surfaceHover
    },
    photoTileImage: {
      width: '100%',
      height: '100%'
    },
    photoTileLabel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(4,18,31,0.65)',
      paddingHorizontal: 8,
      paddingVertical: 5
    },
    photoTileLabelText: {
      color: '#fff',
      fontSize: 10,
      fontFamily: CITIZEN_FONTS.sansMedium
    },
    photoRemoveButton: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(4,18,31,0.72)',
      alignItems: 'center',
      justifyContent: 'center'
    },

    // ── Summary / completeness ───────────────────────────────────────────
    summaryCard: {
      backgroundColor: t.surfaceHover,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.borderLight,
      padding: 14,
      marginTop: 8,
      marginBottom: 14
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4
    },
    summaryLabel: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5
    },
    summaryValue: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 12
    },
    completenessLabel: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      marginBottom: 8
    },
    completenessTrack: {
      height: 6,
      backgroundColor: t.surfaceHover,
      borderRadius: 3,
      overflow: 'hidden'
    },
    completenessFill: {
      height: '100%',
      borderRadius: 3
    },

    stepHint: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 2
    },

    // ── Nav buttons ───────────────────────────────────────────────────────
    navRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 10
    },
    navFlex: {
      flex: 1
    },
    navFlexDisabled: {
      opacity: 0.5
    },
    backButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    backButtonText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },
    nextButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 999
    },
    nextButtonText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    }
  });

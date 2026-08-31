import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { citizenApi } from '../services/api';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';

// ─── Constants ──────────────────────────────────────────────────────────────
// Mirrors ocean-cleanup-frontend's QuickReport.jsx citizen flow: a fast
// alternate entry point in front of the full Submit Activity form — "Photo
// / Video" for a snapshot, "Tell Blue Mind" for a spoken or typed note.
// Both feed the same POST /api/ai/infer classifier before a shared confirm
// step submits to POST /api/activities.

const VIOLET_ACCENT = '#7f77dd';

function truncateFileName(uri, maxLen = 26) {
  if (!uri) return '';
  const name = uri.split('/').pop() || uri;
  return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Five bars per side, each looping height on its own offset so the cluster
// reads as a live waveform rather than a single synced pulse.
const WAVE_BAR_HEIGHTS = [10, 20, 14, 24, 12];

function WaveBars({ color, active }) {
  const anims = useRef(WAVE_BAR_HEIGHTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return undefined;
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 90),
          Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0, duration: 320, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, anims]);

  return (
    <View style={waveStyles.row}>
      {WAVE_BAR_HEIGHTS.map((base, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            {
              backgroundColor: color,
              height: anims[i].interpolate({ inputRange: [0, 1], outputRange: [base * 0.5, base * 1.8] })
            }
          ]}
        />
      ))}
    </View>
  );
}

function PulsingRing({ color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.18, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true })
        ])
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return <Animated.View pointerEvents="none" style={[waveStyles.pulseRing, { borderColor: color, transform: [{ scale }], opacity }]} />;
}

const waveStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  bar: {
    width: 3,
    borderRadius: 2
  },
  pulseRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2
  }
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function QuickReportScreen() {
  const navigation = useNavigation();
  const { mode: themeMode } = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const t = useMemo(() => getCitizenTheme(themeMode), [themeMode]);
  const styles = useMemo(() => getStyles(t), [t]);

  // 'choose' | 'textChoose' | 'voiceRecording' | 'text' | 'videoDescribe' | 'loading' | 'confirm'
  const [step, setStep] = useState('choose');
  const [message, setMessage] = useState('');
  const [loadingLabel, setLoadingLabel] = useState('Blue Mind is looking at this…');

  const [photoAsset, setPhotoAsset] = useState(null); // { uri, base64, mimeType }
  const [captureSource, setCaptureSource] = useState(null); // 'camera' | 'gallery'
  const [videoAsset, setVideoAsset] = useState(null); // { uri, fileName, mimeType }
  const [videoDescription, setVideoDescription] = useState('');
  const [typedText, setTypedText] = useState('');
  const [rawText, setRawText] = useState('');
  const [intakeMethod, setIntakeMethod] = useState(null); // 'photo_video' | 'tell_blue_mind'

  const [inference, setInference] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [aiEstimatedQuantity, setAiEstimatedQuantity] = useState(null);
  const [notes, setNotes] = useState('');

  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  const cameraBusyRef = useRef(false);

  useEffect(() => {
    if (step === 'confirm' && isFocused && !latitude) {
      fetchLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isFocused]);

  // ─── Reset / navigation between steps ──────────────────────────────────────

  const resetAll = useCallback(() => {
    setStep('choose');
    setMessage('');
    setPhotoAsset(null);
    setCaptureSource(null);
    setVideoAsset(null);
    setVideoDescription('');
    setTypedText('');
    setRawText('');
    setIntakeMethod(null);
    setInference(null);
    setSubjects([]);
    setQuantity('');
    setAiEstimatedQuantity(null);
    setNotes('');
    setLocation('');
    setLatitude('');
    setLongitude('');
  }, []);

  const goBack = useCallback(() => {
    setMessage('');
    if (step === 'textChoose') setStep('choose');
    else if (step === 'voiceRecording') {
      if (recorderState.isRecording) recorder.stop().catch(() => {});
      setStep('textChoose');
    } else if (step === 'text') setStep('textChoose');
    else if (step === 'videoDescribe') {
      setVideoAsset(null);
      setStep('choose');
    } else if (step === 'confirm') resetAll();
    else setStep('choose');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recorderState.isRecording]);

  // ─── Location ───────────────────────────────────────────────────────────

  const fetchLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Location permission denied. You can still submit without it.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lon } = current.coords;
      const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      const locationName = [address?.name, address?.street, address?.city, address?.region, address?.country]
        .filter(Boolean)
        .join(', ');
      setLocation(locationName || `Current location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      setLatitude(lat.toFixed(6));
      setLongitude(lon.toFixed(6));
    } catch (err) {
      console.error(err);
      setMessage('Unable to fetch your current location.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // ─── Inference ──────────────────────────────────────────────────────────

  const runInference = useCallback(async (payload, label) => {
    setLoadingLabel(label);
    setStep('loading');
    setMessage('');
    try {
      const res = await citizenApi.infer(payload);
      if (res.ok && res.inference) {
        setInference(res.inference);
        setSubjects((res.inference.subjects || []).map((s) => ({ ...s })));
        if (res.inference.quantityEstimateKg != null) {
          setQuantity(String(res.inference.quantityEstimateKg));
          setAiEstimatedQuantity(res.inference.quantityEstimateKg);
        }
        if (res.inference.transcript) setRawText(res.inference.transcript);
      } else {
        setMessage(res.error || res.message || 'Blue Mind could not analyze this — you can still fill in the details yourself.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error while analyzing — you can still fill in the details yourself.');
    } finally {
      setStep('confirm');
    }
  }, []);

  // ─── Photo / Video capture ──────────────────────────────────────────────

  const handleTakePhoto = useCallback(async () => {
    if (cameraBusyRef.current) return;
    cameraBusyRef.current = true;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        setMessage('Camera permission is required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setPhotoAsset(asset);
        setCaptureSource('camera');
        setIntakeMethod('photo_video');
        runInference({ imageBase64: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` }, 'Blue Mind is looking at this…');
      }
    } finally {
      cameraBusyRef.current = false;
    }
  }, [runInference]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setMessage('Gallery permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotoAsset(asset);
      setCaptureSource('gallery');
      setIntakeMethod('photo_video');
      runInference({ imageBase64: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` }, 'Blue Mind is looking at this…');
    }
  }, [runInference]);

  const handlePickVideo = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setMessage('Gallery permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setVideoAsset({
        uri: asset.uri,
        fileName: asset.fileName || truncateFileName(asset.uri),
        mimeType: asset.mimeType || 'video/mp4'
      });
      setIntakeMethod('photo_video');
      setCaptureSource('gallery');
      setMessage('');
      setStep('videoDescribe');
    }
  }, []);

  const handleVideoDescribeSubmit = useCallback(() => {
    const text = videoDescription.trim();
    if (!text) {
      setMessage('Add a short description so Blue Mind can classify this clip.');
      return;
    }
    setRawText(text);
    runInference({ text }, 'Blue Mind is reading this…');
  }, [videoDescription, runInference]);

  // ─── Tell Blue Mind: voice ──────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setMessage('Microphone permission is required.');
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIntakeMethod('tell_blue_mind');
      setMessage('');
      setStep('voiceRecording');
    } catch (err) {
      console.error(err);
      setMessage('Unable to start recording.');
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setMessage('Recording failed — please try again.');
        setStep('textChoose');
        return;
      }
      const base64 = await new File(uri).base64();
      await setAudioModeAsync({ allowsRecording: false });
      runInference({ audioBase64: `data:audio/m4a;base64,${base64}` }, 'BlueMind is analyzing…');
    } catch (err) {
      console.error(err);
      setMessage('Unable to process the recording.');
      setStep('textChoose');
    }
  }, [recorder, runInference]);

  const handleTextSubmit = useCallback(() => {
    const text = typedText.trim();
    if (!text) {
      setMessage('Type a note before analyzing.');
      return;
    }
    setIntakeMethod('tell_blue_mind');
    setRawText(text);
    runInference({ text }, 'Blue Mind is reading this…');
  }, [typedText, runInference]);

  // ─── Subject chips ──────────────────────────────────────────────────────

  const removeSubject = useCallback((index) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const basePayload = {
        organizationId: null,
        contributorId: user?.id || user?.userId || null,
        category: 'plastic',
        location,
        quantity: String(quantity || '0'),
        volunteers: 1,
        evidenceHash: 'mock-hash',
        notes,
        lat: latitude ? Number(latitude) : null,
        lon: longitude ? Number(longitude) : null,
        gps: latitude && longitude ? `${latitude}, ${longitude}` : null,
        aiSubjects: JSON.stringify(subjects),
        rawText,
        intakeMethod: intakeMethod || 'tell_blue_mind',
        // Mirrors the web app: only "AI inferred" if the number on screen
        // still matches what Blue Mind estimated — any edit makes it
        // user-provided, whether or not there was an estimate at all.
        quantityProvenance:
          aiEstimatedQuantity != null && Number(quantity) === Number(aiEstimatedQuantity) ? 'ai_inferred' : 'user_provided'
      };

      let data;
      if (videoAsset) {
        const form = new FormData();
        Object.entries(basePayload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) form.append(key, String(value));
        });
        form.append('mediaType', 'video');
        form.append('images', {
          uri: videoAsset.uri,
          name: videoAsset.fileName || 'clip.mp4',
          type: videoAsset.mimeType || 'video/mp4'
        });
        data = await citizenApi.submitReportForm(form);
      } else {
        const payload = { ...basePayload };
        if (captureSource) payload.captureSource = captureSource;
        if (photoAsset?.base64) {
          payload.imageUrls = JSON.stringify([`data:${photoAsset.mimeType || 'image/jpeg'};base64,${photoAsset.base64}`]);
        }
        data = await citizenApi.submitReport(payload);
      }

      if (data.ok) {
        resetAll();
        navigation.navigate('Dashboard');
      } else {
        setMessage(data.message || data.error || 'Unable to submit report.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [user, location, quantity, aiEstimatedQuantity, notes, latitude, longitude, subjects, rawText, intakeMethod, videoAsset, captureSource, photoAsset, resetAll, navigation]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const Background = themeMode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    themeMode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  const canSubmit = Boolean(quantity) && !submitting;

  return (
    <Background {...backgroundProps} style={[styles.screen, themeMode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={24}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* ── Header ── */}
            <View style={styles.headerRow}>
              {step !== 'choose' ? (
                <TouchableOpacity style={styles.backPill} activeOpacity={0.8} onPress={goBack}>
                  <Ionicons name="arrow-back" size={16} color={t.textMain} />
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity
                style={styles.detailedPill}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('DetailedForm')}
              >
                <Text style={styles.detailedPillText}>Use the detailed form instead</Text>
                <Ionicons name="chevron-forward" size={13} color={t.primary} />
              </TouchableOpacity>
            </View>

            {step === 'choose' ? (
              <>
                <Text style={styles.title}>What would you like to report?</Text>
                <Text style={styles.subtitle}>Help us keep our environment clean and healthy. Choose the best way to share what you found.</Text>

                {/* ── Photo / Video hero ── */}
                <View style={[styles.hero, { borderColor: withAlpha(t.secondary, 0.35), backgroundColor: withAlpha(t.secondary, 0.08) }]}>
                  <View style={[styles.tileIcon, { backgroundColor: withAlpha(t.secondary, 0.16) }]}>
                    <Ionicons name="camera-outline" size={20} color={t.secondary} />
                  </View>
                  <Text style={styles.heroTitle}>Photo / Video</Text>
                  <Text style={styles.heroSub}>Take or upload a clear photo or video of what you found.</Text>

                  <View style={styles.heroActions}>
                    <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: t.secondary }]} activeOpacity={0.85} onPress={handleTakePhoto}>
                      <Text style={styles.btnPrimaryText}>📷 Take a photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnOutline, { borderColor: withAlpha(t.secondary, 0.4) }]} activeOpacity={0.85} onPress={handlePickImage}>
                      <Text style={[styles.btnOutlineText, { color: t.secondary }]}>🖼 Choose from gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnOutline, { borderColor: withAlpha(t.secondary, 0.4) }]} activeOpacity={0.85} onPress={handlePickVideo}>
                      <Text style={[styles.btnOutlineText, { color: t.secondary }]}>🎥 Add a video</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.heroArt, { borderColor: withAlpha(t.secondary, 0.3) }]}>
                    <Ionicons name="image-outline" size={26} color={withAlpha(t.secondary, 0.7)} />
                    <Text style={[styles.heroArtCaption, { color: t.secondary }]}>Capture what you found</Text>
                  </View>
                </View>

                {/* ── Tell Blue Mind ── */}
                <TouchableOpacity
                  style={[styles.tile, { borderColor: withAlpha(VIOLET_ACCENT, 0.35), backgroundColor: withAlpha(VIOLET_ACCENT, 0.08) }]}
                  activeOpacity={0.85}
                  onPress={() => setStep('textChoose')}
                >
                  <View style={[styles.tileIcon, { backgroundColor: withAlpha(VIOLET_ACCENT, 0.16) }]}>
                    <Ionicons name="mic-outline" size={20} color={VIOLET_ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Tell BlueMind</Text>
                    <Text style={styles.heroSub}>Speak or type what happened, in your own words.</Text>
                  </View>
                  <View style={[styles.tileArrow, { backgroundColor: VIOLET_ACCENT }]}>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>

                {/* ── Reassurance banner ── */}
                <View style={styles.banner}>
                  <View style={styles.bannerRow}>
                    <View style={[styles.bannerIcon, { backgroundColor: t.primary }]}>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                    </View>
                    <View style={styles.bannerText}>
                      <Text style={styles.bannerTitle}>Your report helps build a cleaner, healthier future.</Text>
                      <Text style={styles.bannerSub}>All reports are reviewed and used to take real action.</Text>
                    </View>
                  </View>

                  <View style={styles.bannerDivider} />

                  <View style={styles.bannerRow}>
                    <View style={[styles.bannerIcon, { backgroundColor: t.secondary }]}>
                      <Ionicons name="people-outline" size={18} color="#fff" />
                    </View>
                    <View style={styles.bannerText}>
                      <Text style={styles.bannerTitle}>Together, we make a difference.</Text>
                      <Text style={styles.bannerSub}>Small actions today, big impact tomorrow.</Text>
                    </View>
                  </View>
                </View>

                {message ? <Text style={styles.message}>{message}</Text> : null}
              </>
            ) : null}

            {step === 'textChoose' ? (
              <View style={styles.stepCard}>
                <View style={[styles.tileIcon, { backgroundColor: withAlpha(VIOLET_ACCENT, 0.16), marginBottom: 12 }]}>
                  <Ionicons name="mic-outline" size={20} color={VIOLET_ACCENT} />
                </View>
                <Text style={styles.heroTitle}>Tell BlueMind</Text>
                <Text style={styles.heroSub}>Speak or type what happened, in your own words.</Text>

                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: VIOLET_ACCENT, marginTop: 16 }]} activeOpacity={0.85} onPress={startRecording}>
                  <Text style={styles.btnPrimaryText}>🎤 Record a voice note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: withAlpha(VIOLET_ACCENT, 0.4), marginTop: 10 }]}
                  activeOpacity={0.85}
                  onPress={() => setStep('text')}
                >
                  <Text style={[styles.btnOutlineText, { color: VIOLET_ACCENT }]}>✍️ Type a note</Text>
                </TouchableOpacity>

                {message ? <Text style={styles.message}>{message}</Text> : null}
              </View>
            ) : null}

            {step === 'voiceRecording' ? (
              <View style={styles.stepCard}>
                <View style={[styles.tileIcon, { backgroundColor: withAlpha(VIOLET_ACCENT, 0.16) }]}>
                  <Ionicons name="mic-outline" size={20} color={VIOLET_ACCENT} />
                </View>
                <Text style={styles.heroTitle}>Tell BlueMind</Text>
                <Text style={styles.heroSub}>Speak or type what happened, in your own words.</Text>

                <View style={styles.recordingPillsRow}>
                  <View style={[styles.recordingPill, { backgroundColor: VIOLET_ACCENT }]}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingPillText}>Recording… {formatDuration(recorderState.durationMillis)}</Text>
                  </View>
                  <View style={[styles.btnOutline, styles.recordingTypePill, { borderColor: withAlpha(VIOLET_ACCENT, 0.35), opacity: 0.5 }]}>
                    <Text style={[styles.btnOutlineText, { color: VIOLET_ACCENT, fontSize: 12.5 }]}>✍️ Type a note</Text>
                  </View>
                </View>

                <View style={styles.recordingStage}>
                  <WaveBars color={VIOLET_ACCENT} active={recorderState.isRecording} />

                  <View style={styles.recordingMicWrap}>
                    <PulsingRing color={VIOLET_ACCENT} />
                    <View style={[styles.recordingMicCircle, { backgroundColor: withAlpha(VIOLET_ACCENT, 0.18), borderColor: withAlpha(VIOLET_ACCENT, 0.4) }]}>
                      <Ionicons name="mic" size={26} color={VIOLET_ACCENT} />
                    </View>
                  </View>

                  <WaveBars color={VIOLET_ACCENT} active={recorderState.isRecording} />
                </View>

                <Text style={[styles.listeningTitle, { color: VIOLET_ACCENT }]}>BlueMind is listening…</Text>
                <Text style={[styles.heroSub, { textAlign: 'center' }]}>Speak clearly and we'll capture the details.</Text>

                <TouchableOpacity style={styles.stopButton} activeOpacity={0.85} onPress={stopRecording}>
                  <View style={styles.stopButtonIcon} />
                  <Text style={styles.stopButtonText}>Stop recording</Text>
                </TouchableOpacity>

                {message ? <Text style={styles.message}>{message}</Text> : null}
              </View>
            ) : null}

            {step === 'text' ? (
              <View style={styles.stepCard}>
                <Text style={styles.heroTitle}>Type a note</Text>
                <Text style={styles.heroSub}>Describe what you found, in your own words.</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { marginTop: 12 }]}
                  placeholder="e.g., Found a pile of plastic bottles near the mangrove edge…"
                  placeholderTextColor={t.textMuted}
                  value={typedText}
                  onChangeText={setTypedText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: VIOLET_ACCENT, marginTop: 12 }]} activeOpacity={0.85} onPress={handleTextSubmit}>
                  <Text style={styles.btnPrimaryText}>Analyze</Text>
                </TouchableOpacity>
                {message ? <Text style={styles.message}>{message}</Text> : null}
              </View>
            ) : null}

            {step === 'videoDescribe' ? (
              <View style={styles.stepCard}>
                <Text style={styles.heroTitle}>Describe this clip</Text>
                <Text style={styles.heroSub}>Blue Mind can't watch the video yet — a short description helps it classify what you found.</Text>
                {videoAsset ? (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam-outline" size={14} color={t.secondary} />
                    <Text style={styles.videoBadgeText} numberOfLines={1}>{videoAsset.fileName}</Text>
                  </View>
                ) : null}
                <TextInput
                  style={[styles.input, styles.textArea, { marginTop: 12 }]}
                  placeholder="e.g., A washed-up fishing net tangled on rocks near the pier…"
                  placeholderTextColor={t.textMuted}
                  value={videoDescription}
                  onChangeText={setVideoDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: t.secondary, marginTop: 12 }]} activeOpacity={0.85} onPress={handleVideoDescribeSubmit}>
                  <Text style={styles.btnPrimaryText}>Analyze</Text>
                </TouchableOpacity>
                {message ? <Text style={styles.message}>{message}</Text> : null}
              </View>
            ) : null}

            {step === 'loading' ? (
              <View style={styles.stepCard}>
                {photoAsset?.uri ? (
                  <Image source={{ uri: photoAsset.uri }} style={styles.loadingPreview} resizeMode="cover" />
                ) : null}
                <ActivityIndicator size="large" color={t.primary} style={{ marginTop: photoAsset?.uri ? 22 : 0 }} />
                <Text style={[styles.heroTitle, { textAlign: 'center', marginTop: 14 }]}>{loadingLabel}</Text>
              </View>
            ) : null}

            {step === 'confirm' ? (
              <View style={styles.stepCard}>
                {(() => {
                  const confirmAccent = intakeMethod === 'photo_video' ? t.secondary : VIOLET_ACCENT;
                  const confirmIcon = intakeMethod === 'photo_video' ? 'camera-outline' : 'mic-outline';
                  return (
                    <View style={styles.confirmHeadRow}>
                      <View style={[styles.tileIcon, { backgroundColor: withAlpha(confirmAccent, 0.16), marginBottom: 0 }]}>
                        <Ionicons name={confirmIcon} size={20} color={confirmAccent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>Review before you submit</Text>
                        <Text style={styles.heroSub}>Blue Mind's best guess — fix anything that's off before sending it in.</Text>
                      </View>
                    </View>
                  );
                })()}

                {photoAsset?.uri ? <Image source={{ uri: photoAsset.uri }} style={styles.confirmPhoto} resizeMode="cover" /> : null}

                {message ? <Text style={styles.message}>{message}</Text> : null}

                {subjects.length > 0 ? (
                  <>
                    <Text style={styles.sectionLabel}>We think this is</Text>
                    <View style={styles.chipRow}>
                      {subjects.map((s, i) => (
                        <View key={`${s.family}-${s.code}-${i}`} style={[styles.chip, { borderColor: withAlpha(t.primary, 0.3), backgroundColor: withAlpha(t.primary, 0.1) }]}>
                          <Text style={styles.chipText}>{s.label || s.code || s.family}</Text>
                          {s.confidence != null ? <Text style={styles.chipConfidence}>{Math.round(s.confidence * 100)}%</Text> : null}
                          <TouchableOpacity onPress={() => removeSubject(i)} hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                            <Ionicons name="close" size={12} color={t.textMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                {inference?.description ? <Text style={styles.quoteText}>"{inference.description}"</Text> : null}

                {rawText ? (
                  <View style={styles.confirmSection}>
                    <Text style={styles.sectionLabel}>{intakeMethod === 'tell_blue_mind' ? 'What Blue Mind heard' : 'Your report'}</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={rawText}
                      onChangeText={setRawText}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    {intakeMethod === 'tell_blue_mind' ? (
                      <Text style={styles.helperText}>Fix anything Blue Mind heard wrong before submitting.</Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.confirmSection}>
                  <Text style={styles.sectionLabel}>Location</Text>
                  <View style={styles.locationBox}>
                    <Ionicons name="location-outline" size={18} color={t.textMuted} />
                    <Text style={styles.locationBoxText} numberOfLines={1}>
                      {locationLoading ? 'Fetching location…' : location || 'Pin the cleanup site on a map'}
                    </Text>
                    <TouchableOpacity style={[styles.loadMapBtn, { borderColor: withAlpha(t.primary, 0.45) }]} activeOpacity={0.8} onPress={fetchLocation} disabled={locationLoading}>
                      <Text style={[styles.loadMapBtnText, { color: t.primary }]}>{latitude ? 'RELOAD' : 'LOAD MAP'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.confirmSection}>
                  <Text style={styles.sectionLabel}>Estimated weight (kg)</Text>
                  <TextInput
                    style={[styles.input, styles.weightInput, !quantity && styles.inputError]}
                    placeholder="0"
                    placeholderTextColor={t.textMuted}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                  {aiEstimatedQuantity != null ? (
                    <Text style={styles.helperText}>
                      {Number(quantity) === Number(aiEstimatedQuantity)
                        ? "Blue Mind's estimate — recorded as AI inferred."
                        : `Edited from Blue Mind's ${aiEstimatedQuantity}kg estimate — recorded as user provided.`}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.confirmSection}>
                  <Text style={styles.sectionLabel}>
                    Notes <Text style={styles.fieldLabelMuted}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Anything else worth mentioning…"
                    placeholderTextColor={t.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.confirmActionsRow}>
                  <TouchableOpacity style={[styles.navFlex, !canSubmit && styles.navFlexDisabled, { flex: 1 }]} activeOpacity={0.85} onPress={handleSubmit} disabled={!canSubmit}>
                    <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextButton}>
                      <Text style={styles.nextButtonText}>{submitting ? 'Submitting…' : 'Submit report'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.startOverBtn} activeOpacity={0.85} onPress={resetAll}>
                    <Text style={styles.startOverBtnText}>Start over</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Background>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function withAlpha(hex, alpha) {
  if (!hex || hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const getStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 80
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    },
    backPill: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    detailedPill: {
      marginLeft: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 999,
      paddingVertical: 7,
      paddingHorizontal: 12
    },
    detailedPillText: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11.5
    },
    title: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 21,
      letterSpacing: -0.3,
      marginBottom: 6
    },
    subtitle: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 18
    },

    // ── Hero (Photo/Video) ──────────────────────────────────────────────
    hero: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      marginBottom: 14
    },
    tileIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10
    },
    heroTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 16.5
    },
    heroSub: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
      lineHeight: 18,
      marginTop: 4
    },
    heroActions: {
      marginTop: 14,
      gap: 10
    },
    heroArt: {
      marginTop: 16,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: 14,
      paddingVertical: 22,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    },
    heroArtCaption: {
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 12
    },

    // ── Tell Blue Mind tile ─────────────────────────────────────────────
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14
    },
    tileArrow: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center'
    },

    // ── Reassurance banner ──────────────────────────────────────────────
    banner: {
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14
    },
    bannerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    bannerDivider: {
      height: 1,
      backgroundColor: t.borderLight,
      marginVertical: 14
    },
    bannerIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    bannerText: { flex: 1 },
    bannerTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13,
      lineHeight: 18
    },
    bannerSub: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 2
    },

    // ── Buttons ──────────────────────────────────────────────────────────
    btnPrimary: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      paddingVertical: 13
    },
    btnPrimaryText: {
      color: '#fff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },
    btnOutline: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      borderWidth: 1,
      paddingVertical: 13
    },
    btnOutlineText: {
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },

    // ── Step card (voice/text/video-describe/confirm) ──────────────────
    stepCard: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 18,
      padding: 18
    },
    recordingPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 16
    },
    recordingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: '#fff'
    },
    recordingPillText: {
      color: '#fff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5
    },
    recordingTypePill: {
      paddingVertical: 8,
      paddingHorizontal: 14
    },
    recordingStage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      marginTop: 26,
      marginBottom: 18
    },
    recordingMicWrap: {
      width: 92,
      height: 92,
      alignItems: 'center',
      justifyContent: 'center'
    },
    recordingMicCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center'
    },
    listeningTitle: {
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 15.5,
      textAlign: 'center',
      marginBottom: 4
    },
    stopButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'center',
      backgroundColor: 'rgba(239,68,68,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.4)',
      borderRadius: 999,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginTop: 22
    },
    stopButtonIcon: {
      width: 10,
      height: 10,
      borderRadius: 2,
      backgroundColor: '#EF4444'
    },
    stopButtonText: {
      color: '#EF4444',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },
    loadingPreview: {
      alignSelf: 'center',
      width: 150,
      height: 150,
      borderRadius: 18,
      backgroundColor: t.surfaceHover
    },
    // ── Confirm step ─────────────────────────────────────────────────────
    confirmHeadRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 14
    },
    confirmPhoto: {
      width: '100%',
      aspectRatio: 1.15,
      borderRadius: 14,
      backgroundColor: t.surfaceHover,
      marginBottom: 14
    },
    confirmSection: {
      marginBottom: 14
    },
    sectionLabel: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8
    },
    quoteText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sans,
      fontStyle: 'italic',
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 14
    },
    helperText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11,
      lineHeight: 16,
      marginTop: -6
    },
    locationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: t.borderLight,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14
    },
    locationBoxText: {
      flex: 1,
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5
    },
    loadMapBtn: {
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12
    },
    loadMapBtnText: {
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 10.5,
      letterSpacing: 1
    },
    weightInput: {
      width: 120,
      marginBottom: 8
    },
    confirmActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4
    },
    startOverBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    startOverBtnText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },

    videoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: t.surfaceHover,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 10,
      alignSelf: 'flex-start'
    },
    videoBadgeText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 12
    },

    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12
    },
    chipText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 12
    },
    chipConfidence: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 10.5
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
    inputError: { borderColor: t.danger },
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
      marginBottom: 6
    },
    locationButtonText: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 13.5
    },
    locationText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      marginBottom: 14
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

    navFlex: { marginTop: 8 },
    navFlexDisabled: { opacity: 0.5 },
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

import React, { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { citizenApi } from '../services/api';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';
import Panel from '../components/citizen/Panel';
import WaveBar from '../components/citizen/WaveBar';
import HeroWave from '../components/citizen/HeroWave';
import WaveMark from '../components/citizen/WaveMark';

const DETAIL_ICONS = {
  category: 'layers-outline',
  shorelineType: 'water-outline',
  tideState: 'time-outline',
  disposalMethod: 'trash-outline',
  estimatedKg: 'scale-outline',
  location: 'location-outline',
};

// ─── Pure sub-components ───────────────────────────────────────────────────

const SourceButton = memo(function SourceButton({ t, styles, icon, label, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.sourceBtn} onPress={onPress}>
      <View style={styles.sourceIconWrap}>
        <Ionicons name={icon} size={18} color={t.primary} />
      </View>
      <Text style={styles.sourceBtnText}>{label}</Text>
    </TouchableOpacity>
  );
});

const DetailRow = memo(function DetailRow({ t, styles, icon, label, value, last }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={16} color={t.primary} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
});

export default function AnalysisScreen() {
  const navigation = useNavigation();
  const { mode } = useTheme();
  const { user } = useAuth();
  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const chooseImage = useCallback(async (source) => {
    setMessage('');
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return setMessage('Image permission is required.');

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true });

    if (!result.canceled && result.assets?.[0]?.base64) {
      setPhoto(result.assets[0]);
      setAnalysis(null);
      setShowNotes(false);
      setNotes('');
    }
  }, []);

  const analyze = useCallback(async () => {
    if (!photo?.base64) return;
    setLoading(true);
    setMessage('');
    try {
      let detectedLocation = location;
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const address = await Location.reverseGeocodeAsync(current.coords);
        detectedLocation =
          [address?.[0]?.city, address?.[0]?.region, address?.[0]?.country].filter(Boolean).join(', ') ||
          `${current.coords.latitude.toFixed(5)}, ${current.coords.longitude.toFixed(5)}`;
        setLocation(detectedLocation);
      }
      const result = await citizenApi.analyzeImage({
        image: photo.base64,
        mimeType: photo.mimeType || 'image/jpeg',
        location: detectedLocation,
      });
      if (!result.ok) throw new Error(result.message || 'Analysis failed');
      setAnalysis(result.analysis);
    } catch (error) {
      setMessage(error.message || 'Unable to analyse this image.');
    } finally {
      setLoading(false);
    }
  }, [location, photo]);

  const submitActivity = useCallback(async () => {
    if (!analysis || !photo?.base64) return;
    setLoading(true);
    setMessage('');
    try {
      const result = await citizenApi.submitReport({
        contributorId: user?.id || user?.userId || null,
        category: analysis.category,
        location: analysis.location || location || 'Location not provided',
        quantity: String(analysis.estimatedKg || 0),
        volunteers: 1,
        evidenceHash: 'ai-analysis',
        notes,
        disposalMethod: analysis.disposalMethod || 'Recycled',
        shorelineType: analysis.shorelineType || 'Sandy beach',
        tideState: analysis.tideState || 'Mid tide',
        imageUrls: JSON.stringify([`data:${photo.mimeType || 'image/jpeg'};base64,${photo.base64}`]),
      });
      if (!result.ok) throw new Error(result.message || 'Unable to submit activity.');
      setAnalysis(null);
      setPhoto(null);
      setLocation('');
      setShowNotes(false);
      setNotes('');
      setMessage('');
      navigation.navigate('MyActivity');
    } catch (error) {
      setMessage(error.message || 'Unable to submit activity.');
    } finally {
      setLoading(false);
    }
  }, [analysis, location, navigation, notes, photo, user]);

  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <WaveBar primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />

          <View style={styles.heroWaveWrap} pointerEvents="none">
            <HeroWave primary={t.primary} secondary={t.secondary} borderGlow={t.borderGlow} />
          </View>

          <View style={styles.heroKicker}>
            <Text style={styles.eyebrow}>AI WASTE SCANNER</Text>
            <WaveMark color={t.borderGlow} primary={t.primary} />
          </View>

          <View style={styles.h1Row}>
            <Ionicons name="sparkles-outline" size={20} color={t.primary} style={styles.h1Icon} />
            <Text style={styles.h1}>
              Analyse a <Text style={styles.h1Accent}>photo.</Text>
            </Text>
          </View>
          <Text style={styles.heroSub}>
            Upload a cleanup photo and AI will identify the waste category, estimate weight, and pre-fill your
            report.
          </Text>
        </View>

        {/* ── Upload ── */}
        <Panel t={t} title="Cleanup photo" desc="Snap it fresh or pick one from your gallery.">
          <View style={styles.uploadCard}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={styles.emptyPreview}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="scan-outline" size={30} color={t.primary} />
                </View>
                <Text style={styles.emptyText}>No photo selected yet</Text>
              </View>
            )}
          </View>

          <View style={styles.sourceRow}>
            <SourceButton t={t} styles={styles} icon="camera-outline" label="Camera" onPress={() => chooseImage('camera')} />
            <SourceButton t={t} styles={styles} icon="images-outline" label="Gallery" onPress={() => chooseImage('gallery')} />
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={17} color={t.primary} />
            <Text style={styles.locationText} numberOfLines={2}>
              {location || 'Location will be detected automatically during analysis'}
            </Text>
          </View>

          <TouchableOpacity
            disabled={!photo || loading}
            onPress={analyze}
            activeOpacity={0.85}
            style={[styles.analyzeWrap, (!photo || loading) && styles.disabled]}
          >
            <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.analyzeButton}>
              <Text style={styles.analyzeText}>{loading && !analysis ? 'Analysing image…' : 'Analyse with AI'}</Text>
              {loading && !analysis ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="sparkles-outline" size={17} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>

          {message ? (
            <View style={styles.messageBox}>
              <Ionicons name="alert-circle-outline" size={15} color={t.danger} />
              <Text style={styles.message}>{message}</Text>
            </View>
          ) : null}
        </Panel>

        {/* ── Result ── */}
        {analysis ? (
          <Panel t={t} title="Analysis result" desc="Review what the AI detected before you submit.">
            <View style={styles.resultBadgeRow}>
              <View style={styles.resultBadge}>
                <Ionicons name="checkmark-circle" size={16} color={t.success} />
                <Text style={styles.resultBadgeText}>Complete</Text>
              </View>
              <Text style={styles.category}>{analysis.category}</Text>
            </View>

            {analysis.description ? <Text style={styles.description}>{analysis.description}</Text> : null}

            <View style={styles.details}>
              <DetailRow t={t} styles={styles} icon={DETAIL_ICONS.category} label="Category" value={analysis.category} />
              <DetailRow t={t} styles={styles} icon={DETAIL_ICONS.shorelineType} label="Shoreline type" value={analysis.shorelineType || 'Sandy beach'} />
              <DetailRow t={t} styles={styles} icon={DETAIL_ICONS.tideState} label="Tide state" value={analysis.tideState || 'Mid tide'} />
              <DetailRow t={t} styles={styles} icon={DETAIL_ICONS.disposalMethod} label="Disposal method" value={analysis.disposalMethod || 'Recycled'} />
              <DetailRow t={t} styles={styles} icon={DETAIL_ICONS.estimatedKg} label="Estimated weight" value={`${Number(analysis.estimatedKg || 0).toFixed(1)} kg`} />
              <DetailRow
                t={t}
                styles={styles}
                icon={DETAIL_ICONS.location}
                label="Location used"
                value={analysis.location || location || 'Location not provided'}
                last
              />
            </View>

            {!showNotes ? (
              <TouchableOpacity style={styles.primaryAction} onPress={() => setShowNotes(true)} disabled={loading} activeOpacity={0.85}>
                <Text style={styles.primaryActionText}>Next</Text>
                <Ionicons name="arrow-forward" size={17} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes about this cleanup..."
                  placeholderTextColor={t.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity style={styles.primaryAction} onPress={submitActivity} disabled={loading} activeOpacity={0.85}>
                  <Text style={styles.primaryActionText}>{loading ? 'Submitting…' : 'Submit activity'}</Text>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="paper-plane-outline" size={17} color="#fff" />}
                </TouchableOpacity>
              </View>
            )}
          </Panel>
        ) : null}
      </ScrollView>
    </Background>
  );
}

const getStyles = (t) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 100,
    },
    hero: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 20,
      paddingBottom: 30,
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
    h1Row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    h1Icon: {
      marginTop: 2,
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
      maxWidth: 300,
    },
    uploadCard: {
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 14,
      overflow: 'hidden',
    },
    preview: {
      height: 220,
      width: '100%',
    },
    emptyPreview: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 220,
    },
    emptyIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      marginBottom: 10,
    },
    emptyText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12.5,
    },
    sourceRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    sourceBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 12,
      paddingVertical: 12,
    },
    sourceIconWrap: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourceBtnText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },
    locationText: {
      flex: 1,
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 1,
    },
    analyzeWrap: {
      marginTop: 14,
    },
    disabled: {
      opacity: 0.5,
    },
    analyzeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: 12,
      paddingVertical: 14,
    },
    analyzeText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 14,
    },
    messageBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
    },
    message: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 12,
      textAlign: 'center',
    },
    resultBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(46,158,155,0.12)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    resultBadgeText: {
      color: t.success,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11,
    },
    category: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 20,
      textTransform: 'capitalize',
    },
    description: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 10,
    },
    details: {
      marginTop: 16,
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 14,
      paddingHorizontal: 14,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.borderLight,
    },
    detailRowLast: {
      borderBottomWidth: 0,
    },
    detailIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
    },
    detailCopy: {
      flex: 1,
    },
    detailLabel: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    detailValue: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 14,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    primaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.primary,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 18,
    },
    primaryActionText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 14,
    },
    notesSection: {
      marginTop: 18,
    },
    notesLabel: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      marginBottom: 8,
    },
    notesInput: {
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 12,
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 14,
      minHeight: 100,
      padding: 13,
    },
  });

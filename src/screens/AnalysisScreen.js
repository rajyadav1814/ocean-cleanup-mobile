import React, { useCallback, useMemo, useState } from 'react';
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
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return setMessage('Image permission is required.');
    const result = source === 'camera'
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
        detectedLocation = [address?.[0]?.city, address?.[0]?.region, address?.[0]?.country].filter(Boolean).join(', ') || `${current.coords.latitude.toFixed(5)}, ${current.coords.longitude.toFixed(5)}`;
        setLocation(detectedLocation);
      }
      const result = await citizenApi.analyzeImage({ image: photo.base64, mimeType: photo.mimeType || 'image/jpeg', location: detectedLocation });
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
        imageUrls: JSON.stringify([`data:${photo.mimeType || 'image/jpeg'};base64,${photo.base64}`])
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
  const backgroundProps = mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};
  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>AI WASTE SCANNER</Text>
        <Text style={styles.title}>Analyse a <Text style={styles.accent}>image.</Text></Text>
        <Text style={styles.subtitle}>Upload a photo and AI will identify the garbage category, count visible items, and estimate the weight.</Text>
        <View style={styles.uploadCard}>
          {photo ? <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" /> : <View style={styles.emptyPreview}><Ionicons name="scan-outline" size={42} color={t.primary} /><Text style={styles.emptyText}>Choose a cleanup photo</Text></View>}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => chooseImage('camera')}><Ionicons name="camera-outline" size={18} color={t.primary} /><Text style={styles.actionText}>Camera</Text></TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={() => chooseImage('gallery')}><Ionicons name="images-outline" size={18} color={t.primary} /><Text style={styles.actionText}>Gallery</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.locationRow}><Ionicons name="location-outline" size={19} color={t.primary} /><Text style={styles.location} numberOfLines={2}>{location || 'Location will be detected before analysis'}</Text></View>
        <TouchableOpacity disabled={!photo || loading} onPress={analyze} activeOpacity={0.85} style={[styles.analyzeWrap, (!photo || loading) && styles.disabled]}>
          <LinearGradient colors={[t.primary, t.secondary]} style={styles.analyzeButton}><Text style={styles.analyzeText}>{loading ? 'Analysing image...' : 'Analyse with AI'}</Text>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="sparkles-outline" size={18} color="#fff" />}</LinearGradient>
        </TouchableOpacity>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {analysis ? <View style={styles.result}><View style={styles.resultHeader}><Ionicons name="checkmark-circle" size={22} color={t.success} /><Text style={styles.resultTitle}>Analysis complete</Text></View><Text style={styles.category}>{analysis.category}</Text><Text style={styles.description}>{analysis.description}</Text><View style={styles.details}><View style={styles.detailRow}><Ionicons name="layers-outline" size={19} color={t.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>Category</Text><Text style={styles.detailValue}>{analysis.category}</Text></View></View><View style={styles.detailRow}><Ionicons name="water-outline" size={19} color={t.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>Shoreline type</Text><Text style={styles.detailValue}>{analysis.shorelineType || 'Sandy beach'}</Text></View></View><View style={styles.detailRow}><Ionicons name="time-outline" size={19} color={t.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>Tide state</Text><Text style={styles.detailValue}>{analysis.tideState || 'Mid tide'}</Text></View></View><View style={styles.detailRow}><Ionicons name="trash-outline" size={19} color={t.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>Disposal method</Text><Text style={styles.detailValue}>{analysis.disposalMethod || 'Recycled'}</Text></View></View><View style={styles.detailRow}><Ionicons name="scale-outline" size={19} color={t.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>Estimated weight</Text><Text style={styles.detailValue}>{Number(analysis.estimatedKg).toFixed(1)} kg</Text></View></View><View style={styles.detailRow}><Ionicons name="location-outline" size={19} color={t.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>Location used</Text><Text style={styles.detailValue}>{analysis.location || location || 'Location not provided'}</Text></View></View></View>{!showNotes ? <TouchableOpacity style={styles.nextAction} onPress={() => setShowNotes(true)} disabled={loading}><Text style={styles.actionButtonText}>Next</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></TouchableOpacity> : <View style={styles.notesSection}><Text style={styles.notesLabel}>Notes</Text><TextInput style={styles.notesInput} placeholder="Add notes about this cleanup..." placeholderTextColor={t.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" /><TouchableOpacity style={styles.nextAction} onPress={submitActivity} disabled={loading}><Text style={styles.actionButtonText}>{loading ? 'Submitting...' : 'Submit activity'}</Text>{loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="paper-plane-outline" size={18} color="#fff" />}</TouchableOpacity></View>}</View> : null}
      </ScrollView>
    </Background>
  );
}

const getStyles = (t) => StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 16, paddingBottom: 110 }, eyebrow: { color: t.primary, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 10, letterSpacing: 2 }, title: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansMedium, fontSize: 25, marginTop: 12 }, accent: { color: t.primary, fontFamily: CITIZEN_FONTS.serifItalic }, subtitle: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 18 }, uploadCard: { backgroundColor: t.surface, borderColor: t.borderLight, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }, preview: { height: 250, width: '100%' }, emptyPreview: { alignItems: 'center', backgroundColor: t.surfaceHover, height: 250, justifyContent: 'center' }, emptyText: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sansMedium, fontSize: 13, marginTop: 12 }, actions: { borderTopColor: t.borderLight, borderTopWidth: 1, flexDirection: 'row', gap: 10, padding: 12 }, action: { alignItems: 'center', borderColor: t.borderLight, borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 11 }, actionText: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 12 }, locationRow: { alignItems: 'center', backgroundColor: t.surface, borderColor: t.borderLight, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 9, marginTop: 12, padding: 13 }, location: { color: t.textMuted, flex: 1, fontFamily: CITIZEN_FONTS.sans, fontSize: 12, lineHeight: 17 }, analyzeWrap: { marginTop: 12 }, disabled: { opacity: 0.5 }, analyzeButton: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 9, justifyContent: 'center', padding: 14 }, analyzeText: { color: '#fff', fontFamily: CITIZEN_FONTS.sansBold, fontSize: 14 }, message: { color: t.danger, fontFamily: CITIZEN_FONTS.sans, fontSize: 12, marginTop: 10, textAlign: 'center' }, result: { backgroundColor: t.surface, borderColor: t.primary, borderRadius: 16, borderWidth: 1, marginTop: 18, padding: 18 }, resultHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 }, resultTitle: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 14 }, category: { color: t.primary, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 25, marginTop: 17, textTransform: 'capitalize' }, description: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 13, lineHeight: 19, marginTop: 5 }, details: { borderTopColor: t.borderLight, borderTopWidth: 1, gap: 14, marginTop: 18, paddingTop: 14 }, detailRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 }, detailCopy: { flex: 1 }, detailValue: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 15, marginTop: 3 }, detailLabel: { color: t.textMuted, fontFamily: CITIZEN_FONTS.sans, fontSize: 10, textTransform: 'uppercase' }, nextAction: { alignItems: 'center', backgroundColor: t.primary, borderRadius: 12, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 18, padding: 14 }, actionButtonText: { color: '#fff', fontFamily: CITIZEN_FONTS.sansBold, fontSize: 14 }, notesSection: { marginTop: 18 }, notesLabel: { color: t.textMain, fontFamily: CITIZEN_FONTS.sansBold, fontSize: 12.5, marginBottom: 8 }, notesInput: { backgroundColor: t.surfaceHover, borderColor: t.borderLight, borderRadius: 12, borderWidth: 1, color: t.textMain, fontFamily: CITIZEN_FONTS.sans, fontSize: 14, minHeight: 100, padding: 13 }
});

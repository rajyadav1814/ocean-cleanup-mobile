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
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { citizenApi } from '../services/api';
import { useCitizenOrganizations } from '../services/citizenHooks';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
import BrandButton from '../components/BrandButton';
import SelectDropdown from '../components/SelectDropdown';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Plastic', 'Glass', 'Metal', 'Mixed'];
const MAX_PHOTOS = 5;

const INITIAL_FORM = {
  location: '',
  latitude: '',
  longitude: '',
  volunteers: '',
  waste: '',
  notes: '',
  organization: '',
  category: 'Plastic'
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shorten a filename to at most maxLen chars */
function truncateFileName(uri, maxLen = 22) {
  if (!uri) return '';
  const name = uri.split('/').pop() || uri;
  return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function PhotoGrid({ photos, onRemove, styles, theme }) {
  if (photos.length === 0) return null;

  return (
    <View style={styles.photoSection}>
      {/* Count badge */}
      <Text style={styles.photoCountLabel}>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} added
      </Text>

      <View style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <View key={`${photo.uri}-${index}`} style={styles.photoTile}>
            <Image source={{ uri: photo.uri }} style={styles.photoTileImage} resizeMode="cover" />

            {/* Filename overlay at bottom */}
            <View style={styles.photoTileLabel}>
              <Text style={styles.photoTileLabelText} numberOfLines={1}>
                {truncateFileName(photo.uri)}
              </Text>
            </View>

            {/* Remove button */}
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
  const { theme } = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const styles = useMemo(() => getStyles(theme), [theme]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [photos, setPhotos] = useState([]);   // Array of image assets
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDeniedPermanently, setLocationDeniedPermanently] = useState(false);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { organizations, loading: orgLoading } = useCitizenOrganizations();

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

  /** Add new assets to the list, never exceeding MAX_PHOTOS */
  const addPhotos = useCallback((newAssets) => {
    setPhotos((prev) => {
      const available = MAX_PHOTOS - prev.length;
      if (available <= 0) return prev;
      const toAdd = newAssets.slice(0, available);
      return [...prev, ...toAdd];
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

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleOrgSelect = useCallback((value) => {
    handleFieldChange('organization', value);
  }, [handleFieldChange]);

  const handleCategorySelect = useCallback((value) => {
    setForm((prev) => ({ ...prev, category: value }));
  }, []);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const errors = {};
    if (!form.latitude) errors.location = 'Location is required. Tap the button above to detect it.';
    if (!form.volunteers.trim()) errors.volunteers = 'This field is required.';
    if (!form.waste.trim()) errors.waste = 'This field is required.';
    if (!form.organization) errors.organization = 'Please select an organization.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessage('');

    try {
      // Serialize all base64 images
      const imageDataUrls = photos
        .filter((p) => p.base64)
        .map((p) => `data:image/jpeg;base64,${p.base64}`);

      const payload = {
        organizationId: form.organization,
        contributorId: user?.id || user?.userId || 'unknown',
        category: form.category,
        location: form.location,
        quantity: String(form.waste),
        volunteers: String(form.volunteers),
        evidenceHash: 'mock-hash',
        notes: form.notes,
        lat: Number(form.latitude),
        lon: Number(form.longitude),
        gps: `${form.latitude}, ${form.longitude}`,
        timestamp: new Date().toISOString(),
        imageUrls: imageDataUrls.length > 0 ? JSON.stringify(imageDataUrls) : '[]'
      };

      const data = await citizenApi.submitReport(payload);

      if (data.ok) {
        setMessage('Report submitted successfully.');
        setForm(INITIAL_FORM);
        setPhotos([]);
      } else {
        setMessage(data.message || 'Unable to submit report.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, photos, user]);

  // ─── Derived values ───────────────────────────────────────────────────────

  const locationButtonDisabled =
    locationLoading || (!!form.latitude && !locationDeniedPermanently);

  const locationIcon = locationDeniedPermanently
    ? 'settings-outline'
    : form.latitude
    ? 'checkmark-circle-outline'
    : 'locate-outline';

  const locationIconColor =
    form.latitude && !locationDeniedPermanently
      ? theme.colors.textMuted
      : theme.colors.primary;

  const locationButtonLabel = locationLoading
    ? 'Fetching location…'
    : locationDeniedPermanently
    ? 'Open Settings'
    : form.latitude
    ? 'Location detected'
    : 'Use current location';

  const orgOptions = useMemo(
    () => organizations.map((o) => o.name || o),
    [organizations]
  );

  const photoLimitReached = photos.length >= MAX_PHOTOS;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenContainer style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <GlassCard style={styles.card}>
              <Text style={styles.title}>Log a cleanup</Text>

              {/* ── Photo capture buttons ─────────────────────────────── */}
              <View style={styles.imageButtonsRow}>
                <TouchableOpacity
                  style={[styles.imageButton, photoLimitReached && styles.imageButtonDisabled]}
                  activeOpacity={0.8}
                  onPress={handleTakePhoto}
                  disabled={photoLimitReached}
                >
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={photoLimitReached ? theme.colors.textMuted : theme.colors.primary}
                  />
                  <Text style={[styles.imageButtonText, photoLimitReached && styles.imageButtonTextDisabled]}>
                    Open Camera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imageButton, photoLimitReached && styles.imageButtonDisabled]}
                  activeOpacity={0.8}
                  onPress={handlePickImage}
                  disabled={photoLimitReached}
                >
                  <Ionicons
                    name="images-outline"
                    size={24}
                    color={photoLimitReached ? theme.colors.textMuted : theme.colors.primary}
                  />
                  <Text style={[styles.imageButtonText, photoLimitReached && styles.imageButtonTextDisabled]}>
                    Gallery Upload
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Photo grid ───────────────────────────────────────── */}
              <PhotoGrid
                photos={photos}
                onRemove={handleRemovePhoto}
                styles={styles}
                theme={theme}
              />

              {/* ── Location ─────────────────────────────────────────── */}
              <Text style={styles.fieldLabel}>Location</Text>
              {fieldErrors.location ? <Text style={styles.errorText}>{fieldErrors.location}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.locationButton,
                  locationButtonDisabled && !locationDeniedPermanently && styles.locationButtonDisabled
                ]}
                activeOpacity={0.85}
                onPress={handleLocationPress}
                disabled={locationButtonDisabled}
              >
                <Ionicons name={locationIcon} size={18} color={locationIconColor} />
                <Text
                  style={[
                    styles.locationButtonText,
                    !!form.latitude && !locationDeniedPermanently && styles.locationButtonTextDisabled
                  ]}
                >
                  {locationButtonLabel}
                </Text>
              </TouchableOpacity>

              <View style={styles.locationInfoCard}>
                <Text style={styles.locationInfoTitle}>📍 Detected location</Text>
                {form.location ? (
                  <Text style={styles.locationInfoName}>{form.location}</Text>
                ) : null}
                <Text style={styles.locationInfoText}>
                  {form.latitude && form.longitude
                    ? `${form.latitude}, ${form.longitude}`
                    : 'Location will appear here once detected.'}
                </Text>
              </View>

              {/* ── Numeric fields ───────────────────────────────────── */}
              <Text style={styles.fieldLabel}>Volunteers</Text>
              <TextInput
                style={[styles.input, fieldErrors.volunteers && styles.inputError]}
                placeholder="How many volunteers?"
                placeholderTextColor={theme.colors.textMuted}
                value={form.volunteers}
                onChangeText={(v) => handleFieldChange('volunteers', v)}
                keyboardType="numeric"
                returnKeyType="next"
              />
              {fieldErrors.volunteers ? <Text style={styles.errorText}>{fieldErrors.volunteers}</Text> : null}

              <Text style={styles.fieldLabel}>Waste (kg)</Text>
              <TextInput
                style={[styles.input, fieldErrors.waste && styles.inputError]}
                placeholder="Kg collected"
                placeholderTextColor={theme.colors.textMuted}
                value={form.waste}
                onChangeText={(v) => handleFieldChange('waste', v)}
                keyboardType="numeric"
                returnKeyType="next"
              />
              {fieldErrors.waste ? <Text style={styles.errorText}>{fieldErrors.waste}</Text> : null}

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any extra details about this cleanup..."
                placeholderTextColor={theme.colors.textMuted}
                value={form.notes}
                onChangeText={(v) => setForm((prev) => ({ ...prev, notes: v }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* ── Dropdowns ────────────────────────────────────────── */}
              <SelectDropdown
                label="Organization"
                value={form.organization}
                placeholder={orgLoading ? 'Loading organizations...' : 'Select an organization'}
                options={orgOptions}
                onSelect={handleOrgSelect}
                error={fieldErrors.organization}
                disabled={orgLoading}
              />

              <SelectDropdown
                label="Category"
                value={form.category}
                options={CATEGORIES}
                onSelect={handleCategorySelect}
              />

              {message ? <Text style={styles.message}>{message}</Text> : null}

              <BrandButton
                title={loading ? 'Submitting…' : 'Submit activity'}
                onPress={handleSubmit}
                disabled={loading}
              />
            </GlassCard>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (theme) =>
  StyleSheet.create({
    screen: {
      paddingHorizontal: 16,
      paddingBottom: 24
    },
    keyboardView: { flex: 1 },
    contentContainer: { flexGrow: 1, paddingBottom: 12 },
    card: { padding: 20 },
    title: {
      color: theme.colors.textMain,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 20
    },

    // ── Photo capture buttons ──────────────────────────────────────────────
    imageButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14
    },
    imageButton: {
      flex: 1,
      paddingVertical: 18,
      marginRight: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center'
    },
    imageButtonDisabled: {
      opacity: 0.4
    },
    imageButtonText: {
      color: theme.colors.textMain,
      fontWeight: '700',
      marginTop: 10,
      fontSize: 13,
      textAlign: 'center'
    },
    imageButtonTextDisabled: {
      color: theme.colors.textMuted
    },

    // ── Photo grid ────────────────────────────────────────────────────────
    photoSection: {
      marginBottom: 18
    },
    photoCountLabel: {
      color: theme.colors.primary,
      fontWeight: '700',
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
    },
    photoTile: {
      width: '47%',
      aspectRatio: 1.45,
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.colors.surfaceAlt
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
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: 8,
      paddingVertical: 5
    },
    photoTileLabelText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '500'
    },
    photoRemoveButton: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.65)',
      alignItems: 'center',
      justifyContent: 'center'
    },

    // ── Form fields ───────────────────────────────────────────────────────
    fieldLabel: {
      color: theme.colors.textMain,
      marginBottom: 10,
      fontWeight: '600'
    },
    input: {
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 16,
      color: theme.colors.textMain,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 14,
      minHeight: 52
    },
    textArea: { minHeight: 96 },
    inputError: {
      borderColor: '#ef4444',
      borderWidth: 1.5
    },

    // ── Location ──────────────────────────────────────────────────────────
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 12,
      marginBottom: 12
    },
    locationButtonText: {
      color: theme.colors.primary,
      fontWeight: '700',
      marginLeft: 6
    },
    locationButtonDisabled: { opacity: 0.5 },
    locationButtonTextDisabled: { color: theme.colors.textMuted },
    locationInfoCard: {
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      marginBottom: 16
    },
    locationInfoTitle: {
      color: theme.colors.textMain,
      fontWeight: '700',
      fontSize: 13,
      marginBottom: 4
    },
    locationInfoName: {
      color: theme.colors.textMain,
      fontWeight: '700',
      fontSize: 13,
      marginBottom: 4,
      lineHeight: 18
    },
    locationInfoText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18
    },

    // ── Feedback ──────────────────────────────────────────────────────────
    message: {
      color: theme.colors.primary,
      marginBottom: 14,
      fontWeight: '600'
    },
    errorText: {
      color: '#ef4444',
      fontSize: 12,
      marginTop: -8,
      marginBottom: 10,
      marginLeft: 4,
      fontWeight: '600'
    }
  });

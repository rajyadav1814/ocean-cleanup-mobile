import React, { useEffect, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { citizenApi } from '../services/api';
import { useCitizenOrganizations } from '../services/citizenHooks';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
import BrandButton from '../components/BrandButton';

export default function SubmitActivityScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const styles = getStyles(theme);
  const [form, setForm] = useState({ location: '', latitude: '', longitude: '', volunteers: '', waste: '', notes: '', organization: '', category: 'Plastic' });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDeniedPermanently, setLocationDeniedPermanently] = useState(false);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const { organizations, loading: orgLoading } = useCitizenOrganizations();
  const categories = ['Plastic', 'Glass', 'Metal', 'Mixed'];

  // Re-ask for location every time the tab comes into focus, but only if we
  // don't already have a location (avoids refetching on every tab switch).
  useEffect(() => {
    if (isFocused && !form.latitude) {
      getCurrentLocation();
    }
  }, [isFocused]);

  const getCurrentLocation = async (showMessage = false) => {
    try {
      setLocationLoading(true);
      setLocationDeniedPermanently(false);

      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!canAskAgain) {
          // Permanently denied — OS won't show the dialog again
          setLocationDeniedPermanently(true);
          setMessage('Location access is blocked. Please enable it in your device settings.');
        } else {
          // Denied but can ask again next time
          setMessage('Location permission denied. Tap "Use current location" to try again.');
        }
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
  };

  const handleTakePhoto = async () => {
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
      setPhoto(result.assets[0]);
      setMessage('Photo added.');
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setMessage('Gallery permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      base64: true
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0]);
      setMessage('Image selected.');
    }
  };

  const handleSubmit = async () => {
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
      const payload = {
        organizationId: form.organization,
        contributorId: user?.id || user?.userId || 'unknown',
        category: form.category,
        location: form.location,
        quantity: String(form.waste),
        volunteers: String(form.volunteers),
        evidenceHash: "mock-hash",
        notes: form.notes,
        lat: Number(form.latitude),
        lon: Number(form.longitude),
        gps: `${form.latitude}, ${form.longitude}`,
        timestamp: new Date().toISOString(),
        imageUrls: photo?.base64 ? JSON.stringify([`data:image/jpeg;base64,${photo.base64}`]) : "[]"
      };
      const data = await citizenApi.submitReport(payload);
      console.log(data, "==============");
      if (data.ok) {
        setMessage('Report submitted successfully.');
        setForm({ location: '', latitude: '', longitude: '', volunteers: '', waste: '', notes: '', organization: '', category: 'Plastic' });
        setPhoto(null);
      } else {
        setMessage(data.message || 'Unable to submit report.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

              <View style={styles.imageButtonsRow}>
                <TouchableOpacity style={styles.imageButton} activeOpacity={0.8} onPress={handleTakePhoto}>
                  <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.imageButtonText}>Open Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} activeOpacity={0.8} onPress={handlePickImage}>
                  <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.imageButtonText}>Gallery Upload</Text>
                </TouchableOpacity>
              </View>
              {photo ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <Text style={styles.photoLabel}>Photo added</Text>
                </View>
              ) : null}

              <Text style={styles.fieldLabel}>Location</Text>
              {fieldErrors.location ? <Text style={styles.errorText}>{fieldErrors.location}</Text> : null}

              <TouchableOpacity
                style={[styles.locationButton, (!!form.latitude && !locationDeniedPermanently) && styles.locationButtonDisabled]}
                activeOpacity={0.85}
                onPress={locationDeniedPermanently ? () => Linking.openSettings() : () => getCurrentLocation(true)}
                disabled={locationLoading || (!!form.latitude && !locationDeniedPermanently)}
              >
                <Ionicons
                  name={locationDeniedPermanently ? 'settings-outline' : form.latitude ? 'checkmark-circle-outline' : 'locate-outline'}
                  size={18}
                  color={form.latitude && !locationDeniedPermanently ? theme.colors.textMuted : theme.colors.primary}
                />
                <Text style={[styles.locationButtonText, (!!form.latitude && !locationDeniedPermanently) && styles.locationButtonTextDisabled]}>
                  {locationLoading
                    ? 'Fetching location…'
                    : locationDeniedPermanently
                    ? 'Open Settings'
                    : form.latitude
                    ? 'Location detected'
                    : 'Use current location'}
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

              <Text style={styles.fieldLabel}>Volunteers</Text>
              <TextInput
                style={[styles.input, fieldErrors.volunteers && styles.inputError]}
                placeholder="How many volunteers?"
                placeholderTextColor={theme.colors.textMuted}
                value={form.volunteers}
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, volunteers: value }));
                  if (fieldErrors.volunteers) setFieldErrors((e) => ({ ...e, volunteers: undefined }));
                }}
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
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, waste: value }));
                  if (fieldErrors.waste) setFieldErrors((e) => ({ ...e, waste: undefined }));
                }}
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
                onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Organization</Text>
              <TouchableOpacity
                style={[styles.selectInput, fieldErrors.organization && styles.inputError]}
                onPress={() => {
                  if (!orgLoading) {
                    setOrgMenuOpen(true);
                    if (fieldErrors.organization) setFieldErrors((e) => ({ ...e, organization: undefined }));
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectText, !form.organization && styles.selectPlaceholder]}>
                  {form.organization || (orgLoading ? 'Loading organizations...' : 'Select an organization')}
                </Text>
              </TouchableOpacity>
              {fieldErrors.organization ? <Text style={styles.errorText}>{fieldErrors.organization}</Text> : null}

              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setCategoryMenuOpen(true)} activeOpacity={0.8}>
                <Text style={styles.selectText}>{form.category}</Text>
              </TouchableOpacity>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              <BrandButton title={loading ? 'Submitting…' : 'Submit activity'} onPress={handleSubmit} disabled={loading} />

              <Modal transparent visible={orgMenuOpen} animationType="fade" onRequestClose={() => setOrgMenuOpen(false)}>
                <TouchableWithoutFeedback onPress={() => setOrgMenuOpen(false)}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      {orgLoading ? (
                        <Text style={styles.loadingText}>Loading organizations...</Text>
                      ) : organizations.length > 0 ? (
                        organizations.map((option) => {
                          const label = option.name || option;
                          const key = option.id ?? label;
                          return (
                            <TouchableOpacity
                              key={key}
                              style={styles.modalOption}
                              onPress={() => {
                                setForm((prev) => ({ ...prev, organization: label }));
                                setOrgMenuOpen(false);
                              }}
                            >
                              <Text style={styles.modalOptionText}>{label}</Text>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text style={styles.loadingText}>No organizations found.</Text>
                      )}
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>

              <Modal transparent visible={categoryMenuOpen} animationType="fade" onRequestClose={() => setCategoryMenuOpen(false)}>
                <TouchableWithoutFeedback onPress={() => setCategoryMenuOpen(false)}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      {categories.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.modalOption}
                          onPress={() => {
                            setForm((prev) => ({ ...prev, category: option }));
                            setCategoryMenuOpen(false);
                          }}
                        >
                          <Text style={styles.modalOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </GlassCard>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  screen: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24
  },
  keyboardView: {
    flex: 1
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 12
  },
  card: {
    padding: 20
  },
  title: {
    color: theme.colors.textMain,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20
  },
  imageButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18
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
  imageButtonText: {
    color: theme.colors.textMain,
    fontWeight: '700',
    marginTop: 10,
    fontSize: 13,
    textAlign: 'center'
  },
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
  selectInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14
  },
  selectText: {
    color: theme.colors.textMain,
    fontWeight: '600'
  },
  selectPlaceholder: {
    color: theme.colors.textMuted
  },
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
  locationButtonDisabled: {
    opacity: 0.5
  },
  locationButtonTextDisabled: {
    color: theme.colors.textMuted
  },
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
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12
  },
  smallInputWrapper: {
    flex: 1
  },
  smallLabel: {
    color: theme.colors.textMuted,
    marginBottom: 8,
    fontSize: 12
  },
  smallInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    color: theme.colors.textMain,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  modalOptionText: {
    color: theme.colors.textMain,
    fontSize: 15
  },
  loadingText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 18
  },
  photoPreview: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  photoImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 10
  },
  photoLabel: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  helpText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18
  },
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
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1.5
  }
});

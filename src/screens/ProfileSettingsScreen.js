import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authUpdateProfile } from '../services/api';
import { getCitizenTheme, CITIZEN_FONTS } from '../styles/citizenTheme';

export default function ProfileSettingsScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const { mode } = useTheme();

  const t = useMemo(() => getCitizenTheme(mode), [mode]);
  const styles = useMemo(() => getStyles(t), [t]);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    jobTitle: user?.jobTitle || '',
    yearsExperience: user?.yearsExperience ? String(user.yearsExperience) : '',
    profileImageUrl: user?.profileImageUrl || ''
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${asset.base64}`;
      setFormData((prev) => ({ ...prev, profileImageUrl: base64Image }));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profileImageUrl: '' }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'First Name and Last Name are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await authUpdateProfile({
        ...formData,
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience, 10) : null
      });

      if (res.ok) {
        await updateUser(res.user);
        Alert.alert('Success', 'Profile updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', res.message || 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const Background = mode === 'dark' ? LinearGradient : View;
  const backgroundProps =
    mode === 'dark' ? { colors: t.pageBgGradient, start: { x: 0.85, y: 0 }, end: { x: 0.15, y: 1 } } : {};

  return (
    <Background {...backgroundProps} style={[styles.screen, mode !== 'dark' && { backgroundColor: t.pageBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={t.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {formData.profileImageUrl ? (
                <Image source={{ uri: formData.profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{user?.displayInitial || 'U'}</Text>
              )}
            </View>
            <View style={styles.avatarActions}>
              <Text style={styles.avatarTitle}>Profile Picture</Text>
              <Text style={styles.avatarSubtitle}>Upload a professional photo.</Text>
              <View style={styles.avatarButtons}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.85}>
                  <Text style={styles.uploadBtnText}>Upload New</Text>
                </TouchableOpacity>
                {!!formData.profileImageUrl && (
                  <TouchableOpacity style={styles.removeBtn} onPress={removeImage} activeOpacity={0.85}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              placeholder="Enter first name"
              placeholderTextColor={t.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              placeholder="Enter last name"
              placeholderTextColor={t.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              value={formData.jobTitle}
              onChangeText={(text) => handleChange('jobTitle', text)}
              placeholder="e.g. Marine Biologist"
              placeholderTextColor={t.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              value={formData.yearsExperience}
              onChangeText={(text) => handleChange('yearsExperience', text)}
              placeholder="e.g. 5"
              placeholderTextColor={t.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={saving} style={styles.saveButtonWrap}>
          <LinearGradient colors={[t.primary, t.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveButton}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </Background>
  );
}

const getStyles = (t) =>
  StyleSheet.create({
    screen: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 14
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    headerTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 17,
      letterSpacing: -0.2
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 32
    },
    card: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 16,
      padding: 18
    },
    avatarSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20
    },
    avatarContainer: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: t.surfaceHover,
      borderWidth: 2,
      borderColor: t.borderLight,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    },
    avatarImage: {
      width: '100%',
      height: '100%'
    },
    avatarText: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 28
    },
    avatarActions: {
      marginLeft: 16,
      flex: 1
    },
    avatarTitle: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 14.5,
      marginBottom: 4
    },
    avatarSubtitle: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      marginBottom: 10
    },
    avatarButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14
    },
    uploadBtn: {
      backgroundColor: t.surfaceHover,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.borderLight
    },
    uploadBtnText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 11.5
    },
    removeBtn: {
      paddingVertical: 7
    },
    removeBtnText: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 11.5
    },
    formGroup: {
      marginBottom: 14
    },
    label: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      marginBottom: 8
    },
    input: {
      backgroundColor: t.surfaceHover,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 14
    },
    saveButtonWrap: {
      marginTop: 18
    },
    saveButton: {
      borderRadius: 16,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center'
    },
    saveButtonText: {
      color: '#ffffff',
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 14.5
    }
  });

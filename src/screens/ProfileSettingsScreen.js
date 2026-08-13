import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authUpdateProfile } from '../services/api';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';

export default function ProfileSettingsScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    jobTitle: user?.jobTitle || '',
    yearsExperience: user?.yearsExperience ? String(user.yearsExperience) : '',
    profileImageUrl: user?.profileImageUrl || ''
  });
  
  const [saving, setSaving] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${asset.base64}`;
      // In a real app we might check size here, but expo image picker handles quality
      setFormData(prev => ({ ...prev, profileImageUrl: base64Image }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImageUrl: '' }));
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
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <GlassCard style={styles.card}>
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
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadBtnText}>Upload New</Text>
                </TouchableOpacity>
                {!!formData.profileImageUrl && (
                  <TouchableOpacity style={styles.removeBtn} onPress={removeImage}>
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
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              placeholder="Enter last name"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              value={formData.jobTitle}
              onChangeText={(text) => handleChange('jobTitle', text)}
              placeholder="e.g. Marine Biologist"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              value={formData.yearsExperience}
              onChangeText={(text) => handleChange('yearsExperience', text)}
              placeholder="e.g. 5"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </GlassCard>
        
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSubmit} 
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingVertical: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: theme.colors.textMain,
    fontSize: 20,
    fontFamily: theme.fonts.syneBold,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    marginTop: 8,
    padding: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: theme.colors.textMuted,
    fontSize: 32,
    fontFamily: theme.fonts.syneBold,
  },
  avatarActions: {
    marginLeft: 16,
    flex: 1,
  },
  avatarTitle: {
    color: theme.colors.textMain,
    fontSize: 16,
    fontFamily: theme.fonts.sansBold,
    marginBottom: 4,
  },
  avatarSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fonts.sansRegular,
    marginBottom: 10,
  },
  avatarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBtn: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 12,
  },
  uploadBtnText: {
    color: theme.colors.textMain,
    fontSize: 12,
    fontFamily: theme.fonts.sansBold,
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  removeBtnText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontFamily: theme.fonts.sansMedium,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: theme.colors.textMain,
    fontSize: 14,
    fontFamily: theme.fonts.sansMedium,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.colors.textMain,
    fontFamily: theme.fonts.sansRegular,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: theme.fonts.sansBold,
  }
});

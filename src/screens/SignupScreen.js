import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authSignup } from '../services/api';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
import BrandButton from '../components/BrandButton';
import { theme } from '../theme';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
    organizationId: '',
    jobTitle: '',
    experience: '',
    walletAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.username.trim() || !form.password || !form.confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role === 'citizen' ? 'contributor' : form.role,
        jobTitle: form.jobTitle || undefined,
        experience: form.experience || undefined,
        walletAddress: form.walletAddress || undefined,
        organizationId: form.organizationId || undefined
      };

      const data = await authSignup(payload);
      if (data.ok) {
        navigation.replace('Login');
      } else {
        setError(data.message || 'Signup failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassCard>
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>Join the cleanup community and start logging reports.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.row}>
            <TextInput placeholder="First name" placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.halfInput]} value={form.firstName} onChangeText={(value) => setField('firstName', value)} />
            <TextInput placeholder="Last name" placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.halfInput]} value={form.lastName} onChangeText={(value) => setField('lastName', value)} />
          </View>
          <TextInput placeholder="Email" placeholderTextColor={theme.colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={styles.input} value={form.email} onChangeText={(value) => setField('email', value)} />
          <TextInput placeholder="Username" placeholderTextColor={theme.colors.textMuted} autoCapitalize="none" style={styles.input} value={form.username} onChangeText={(value) => setField('username', value)} />
          <TextInput placeholder="Password" placeholderTextColor={theme.colors.textMuted} secureTextEntry style={styles.input} value={form.password} onChangeText={(value) => setField('password', value)} />
          <TextInput placeholder="Confirm password" placeholderTextColor={theme.colors.textMuted} secureTextEntry style={styles.input} value={form.confirmPassword} onChangeText={(value) => setField('confirmPassword', value)} />

          <View style={styles.roleRow}>
            <TouchableOpacity style={[styles.roleButton, form.role === 'citizen' && styles.roleButtonActive]} onPress={() => setField('role', 'citizen')}>
              <Text style={[styles.roleText, form.role === 'citizen' && styles.roleTextActive]}>Citizen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, form.role === 'contributor' && styles.roleButtonActive]} onPress={() => setField('role', 'contributor')}>
              <Text style={[styles.roleText, form.role === 'contributor' && styles.roleTextActive]}>Contributor</Text>
            </TouchableOpacity>
          </View>

          <TextInput placeholder="Job title (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.jobTitle} onChangeText={(value) => setField('jobTitle', value)} />
          <TextInput placeholder="Experience (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.experience} onChangeText={(value) => setField('experience', value)} />
          <TextInput placeholder="Wallet address (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.walletAddress} onChangeText={(value) => setField('walletAddress', value)} />
          <TextInput placeholder="Organization ID (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.organizationId} onChangeText={(value) => setField('organizationId', value)} />

          <BrandButton title={loading ? 'Creating account…' : 'Create account'} onPress={handleSubmit} disabled={loading} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.textMain,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    color: theme.colors.textMuted,
    marginBottom: 18,
    lineHeight: 22
  },
  input: {
    height: 52,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textMain,
    paddingHorizontal: 16,
    marginBottom: 12
  },
  halfInput: {
    flex: 1
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16
  },
  roleButton: {
    flex: 1,
    padding: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center'
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  roleText: {
    color: theme.colors.textMuted,
    fontWeight: '700'
  },
  roleTextActive: {
    color: theme.colors.textMain
  },
  linkButton: {
    marginTop: 18,
    alignItems: 'center'
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700'
  },
  pageTitle: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center'
  },
  pageSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10
  },
  headerContainer: {
    paddingHorizontal: 18,
    marginBottom: 18
  },
  error: {
    color: theme.colors.danger,
    marginBottom: 12
  }
});

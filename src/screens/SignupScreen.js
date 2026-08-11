import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { authSignup } from '../services/api';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
import BrandButton from '../components/BrandButton';

const steps = [
  {
    key: 'account',
    title: 'Account basics',
    subtitle: 'Create your sign-in details first.'
  },
  {
    key: 'profile',
    title: 'Profile details',
    subtitle: 'Tell us a bit about who you are.'
  },
  {
    key: 'preferences',
    title: 'Preferences',
    subtitle: 'Add details to complete your profile.'
  }
];

export default function SignupScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
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
  const [step, setStep] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedForm = await AsyncStorage.getItem('@signup_form');
        const savedStep = await AsyncStorage.getItem('@signup_step');
        if (savedForm) setForm(JSON.parse(savedForm));
        if (savedStep) setStep(parseInt(savedStep, 10));
      } catch (err) {
        console.error('Failed to load signup progress', err);
      } finally {
        setIsRestoring(false);
      }
    };
    loadSavedState();
  }, []);

  useEffect(() => {
    if (isRestoring) return;
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('@signup_form', JSON.stringify(form));
        await AsyncStorage.setItem('@signup_step', step.toString());
      } catch (err) {
        console.error('Failed to save signup progress', err);
      }
    };
    saveState();
  }, [form, step, isRestoring]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const currentStep = steps[step];
  const progressPercent = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const validateStep = () => {
    if (step === 0) {
      if (!form.email.trim() || !form.username.trim() || !form.password || !form.confirmPassword) {
        setError('Please fill in your email, username, and password.');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError('Please enter your first and last name.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    setError('');
    if (!validateStep()) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    handleSubmit();
  };

  const handleBack = () => {
    setError('');
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        username: form.username,
        password: form.password,
        role: 'citizen',
        jobTitle: form.jobTitle || undefined,
        experience: form.experience || undefined,
        walletAddress: form.walletAddress || undefined,
        organizationId: form.organizationId || undefined
      };

      const data = await authSignup(payload);
      if (data.ok) {
        await AsyncStorage.removeItem('@signup_form');
        await AsyncStorage.removeItem('@signup_step');
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
  if (isRestoring) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <GlassCard style={styles.card}>
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.stepText}>{step + 1} of {steps.length}</Text>
          </View>

          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 0 ? (
            <View>
              <TextInput placeholder="Email" placeholderTextColor={theme.colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={styles.input} value={form.email} onChangeText={(value) => setField('email', value)} />
              <TextInput placeholder="Username" placeholderTextColor={theme.colors.textMuted} autoCapitalize="none" style={styles.input} value={form.username} onChangeText={(value) => setField('username', value)} />
              <TextInput placeholder="Password" placeholderTextColor={theme.colors.textMuted} secureTextEntry style={styles.input} value={form.password} onChangeText={(value) => setField('password', value)} />
              <TextInput placeholder="Confirm password" placeholderTextColor={theme.colors.textMuted} secureTextEntry style={styles.input} value={form.confirmPassword} onChangeText={(value) => setField('confirmPassword', value)} />
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <View style={styles.row}>
                <TextInput placeholder="First name" placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.halfInput]} value={form.firstName} onChangeText={(value) => setField('firstName', value)} />
                <TextInput placeholder="Last name" placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.halfInput]} value={form.lastName} onChangeText={(value) => setField('lastName', value)} />
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View>

              <TextInput placeholder="Job title (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.jobTitle} onChangeText={(value) => setField('jobTitle', value)} />
              <TextInput placeholder="Experience (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.experience} onChangeText={(value) => setField('experience', value)} />
              <TextInput placeholder="Wallet address (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.walletAddress} onChangeText={(value) => setField('walletAddress', value)} />
              {/* <TextInput placeholder="Organization ID (optional)" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={form.organizationId} onChangeText={(value) => setField('organizationId', value)} /> */}
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            {step > 0 ? (
              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleBack}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.spacer} />
            )}
            <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleNext} disabled={loading}>
              <Text style={styles.primaryButtonText}>{step === steps.length - 1 ? (loading ? 'Creating account…' : 'Create account') : 'Next'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.linkButton}>
            <Text style={{ color: theme.colors.textMuted }}>
              Already have an account?{' '}
              <Text onPress={() => navigation.navigate('Login')} style={styles.linkText}>
                Sign in
              </Text>
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20
  },
  card: {
    width: '100%'
  },
  progressWrap: {
    marginBottom: 14
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 999
  },
  stepText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  title: {
    color: theme.colors.textMain,
    fontSize: 24,
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
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: theme.colors.primary
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  secondaryButtonText: {
    color: theme.colors.textMain,
    fontWeight: '700'
  },
  spacer: {
    flex: 1
  },
  linkButton: {
    marginTop: 18,
    alignItems: 'center'
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700'
  },
  error: {
    color: theme.colors.danger,
    marginBottom: 12
  }
});

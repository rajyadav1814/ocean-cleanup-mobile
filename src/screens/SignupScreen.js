import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { authSignup } from '../services/api';
import { AUTH_COLORS, AUTH_GRADIENT, AUTH_BTN_GRADIENT, AUTH_FONTS } from '../styles/authTheme';
import AuthBackdrop from '../components/AuthBackdrop';
import BluemindMark from '../components/BluemindMark';

const SIGNALS = [
  { left: 8, top: 15, delay: 0 },
  { left: 88, top: 70, delay: 2100 },
  { left: 82, top: 18, delay: 3800 },
];

const steps = [
  {
    key: 'account',
    label: 'Account basics',
    titlePrefix: 'Account ',
    titleAccent: 'basics.',
    subtitle: 'Create your sign-in details first.'
  },
  {
    key: 'profile',
    label: 'Profile details',
    titlePrefix: 'Profile ',
    titleAccent: 'details.',
    subtitle: 'Tell us a bit about who you are.'
  },
  {
    key: 'preferences',
    label: 'Preferences',
    titlePrefix: '',
    titleAccent: 'Preferences.',
    subtitle: 'Add details to complete your profile.'
  }
];

export default function SignupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState('');

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
      <LinearGradient colors={AUTH_GRADIENT} style={styles.screen}>
        <View style={styles.restoringWrap}>
          <ActivityIndicator size="large" color={AUTH_COLORS.tealLight} />
        </View>
      </LinearGradient>
    );
  }

  const fieldStyle = (name, hasError) => [
    styles.field,
    focused === name && styles.fieldFocused,
    hasError && styles.fieldError,
  ];

  return (
    <LinearGradient colors={AUTH_GRADIENT} start={{ x: 0.85, y: 0 }} end={{ x: 0.15, y: 1 }} style={styles.screen}>
      <AuthBackdrop signals={SIGNALS} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={styles.flex}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={styles.card}>
            <View style={styles.logoRow}>
              <BluemindMark size={20} color={AUTH_COLORS.onDark} />
              <Text style={styles.logoText}>Bluemind</Text>
            </View>

            <View style={styles.stepper}>
              {steps.map((s, i) => (
                <View key={s.key} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
              ))}
            </View>

            <Text style={styles.stepLabel}>Step {step + 1} of {steps.length} — {currentStep.label}</Text>
            <Text style={styles.title}>
              {currentStep.titlePrefix}
              <Text style={styles.titleAccent}>{currentStep.titleAccent}</Text>
            </Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {step === 0 ? (
              <View>
                <View style={fieldStyle('email')}>
                  <Ionicons name="mail-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    value={form.email}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('email', value)}
                  />
                </View>
                <View style={fieldStyle('username')}>
                  <Ionicons name="person-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Username"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    autoCapitalize="none"
                    style={styles.input}
                    value={form.username}
                    onFocus={() => setFocused('username')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('username', value)}
                  />
                </View>
                <View style={fieldStyle('password')}>
                  <Ionicons name="lock-closed-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    secureTextEntry={!showPassword}
                    style={[styles.input, styles.inputWithToggle]}
                    value={form.password}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('password', value)}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={AUTH_COLORS.onDark3} />
                  </TouchableOpacity>
                </View>
                <View style={fieldStyle('confirmPassword')}>
                  <Ionicons name="lock-closed-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Confirm password"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.input, styles.inputWithToggle]}
                    value={form.confirmPassword}
                    onFocus={() => setFocused('confirmPassword')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('confirmPassword', value)}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword((v) => !v)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={AUTH_COLORS.onDark3} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {step === 1 ? (
              <View style={styles.row}>
                <View style={[fieldStyle('firstName'), styles.halfField]}>
                  <Ionicons name="person-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="First name"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    style={styles.input}
                    value={form.firstName}
                    onFocus={() => setFocused('firstName')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('firstName', value)}
                  />
                </View>
                <View style={[fieldStyle('lastName'), styles.halfField]}>
                  <Ionicons name="person-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Last name"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    style={styles.input}
                    value={form.lastName}
                    onFocus={() => setFocused('lastName')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('lastName', value)}
                  />
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              <View>
                <View style={fieldStyle('jobTitle')}>
                  <Ionicons name="briefcase-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Job title (optional)"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    style={styles.input}
                    value={form.jobTitle}
                    onFocus={() => setFocused('jobTitle')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('jobTitle', value)}
                  />
                </View>
                <View style={fieldStyle('experience')}>
                  <Ionicons name="ribbon-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Experience (optional)"
                    placeholderTextColor={AUTH_COLORS.onDark3}
                    style={styles.input}
                    value={form.experience}
                    onFocus={() => setFocused('experience')}
                    onBlur={() => setFocused('')}
                    onChangeText={(value) => setField('experience', value)}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              {step > 0 ? (
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={14} color={AUTH_COLORS.onDark2} />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.spacer} />
              )}
              <TouchableOpacity activeOpacity={0.85} onPress={handleNext} disabled={loading} style={styles.nextBtnWrap}>
                <LinearGradient colors={AUTH_BTN_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.nextBtn, loading && styles.btnDisabled]}>
                  <Text style={styles.nextBtnText}>
                    {step === steps.length - 1 ? (loading ? 'CREATING…' : 'CREATE ACCOUNT') : 'CONTINUE'}
                  </Text>
                  {!loading && <Ionicons name={step === steps.length - 1 ? 'checkmark-circle' : 'arrow-forward'} size={15} color={AUTH_COLORS.ink} />}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footRow}>
              <Text style={styles.footText}>Already have an account? </Text>
              <Text onPress={() => navigation.navigate('Login')} style={styles.footLink}>
                Sign in
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  restoringWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    paddingVertical: 32,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AUTH_COLORS.lineDark,
    backgroundColor: AUTH_COLORS.cardBg,
    padding: 24,
    overflow: 'hidden',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  logoText: {
    color: AUTH_COLORS.onDark,
    fontFamily: AUTH_FONTS.sansBold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  stepper: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  stepDot: {
    flex: 1,
    height: 3,
    borderRadius: 99,
    backgroundColor: AUTH_COLORS.lineDark,
  },
  stepDotActive: {
    backgroundColor: AUTH_COLORS.tealLight,
  },
  stepLabel: {
    color: AUTH_COLORS.onDark3,
    fontFamily: AUTH_FONTS.sansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontFamily: AUTH_FONTS.sansMedium,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  titleAccent: {
    color: '#ffffff',
    fontFamily: AUTH_FONTS.serifItalic,
    fontSize: 24,
  },
  subtitle: {
    color: AUTH_COLORS.onDark2,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 13.5,
    marginTop: 6,
    marginBottom: 8,
  },
  error: {
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: AUTH_COLORS.dangerBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.dangerBorder,
    color: AUTH_COLORS.danger,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  halfField: {
    flex: 1,
    marginTop: 0,
  },
  field: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AUTH_COLORS.lineDark,
    backgroundColor: AUTH_COLORS.fieldBg,
  },
  fieldFocused: {
    borderColor: AUTH_COLORS.cobalt,
    backgroundColor: AUTH_COLORS.fieldBgFocus,
  },
  fieldError: {
    borderColor: '#ef4444',
  },
  fieldIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    height: 50,
    color: AUTH_COLORS.onDark,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 14.5,
    paddingHorizontal: 10,
  },
  inputWithToggle: {
    paddingRight: 4,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  backBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AUTH_COLORS.lineDark,
    justifyContent: 'center',
  },
  backBtnText: {
    color: AUTH_COLORS.onDark2,
    fontFamily: AUTH_FONTS.sansMedium,
    fontSize: 13.5,
  },
  spacer: {
    flex: 0,
    width: 0,
  },
  nextBtnWrap: {
    flex: 1,
  },
  nextBtn: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.75,
  },
  nextBtnText: {
    color: AUTH_COLORS.ink,
    fontFamily: AUTH_FONTS.sansBold,
    fontSize: 12.5,
    letterSpacing: 0.8,
  },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  footText: {
    color: AUTH_COLORS.onDark2,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 13.5,
  },
  footLink: {
    color: AUTH_COLORS.sky2,
    fontFamily: AUTH_FONTS.sansBold,
    fontSize: 13.5,
  },
});

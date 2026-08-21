import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { authLogin } from '../services/api';
import { AUTH_COLORS, AUTH_GRADIENT, AUTH_BTN_GRADIENT, AUTH_FONTS } from '../styles/authTheme';
import AuthBackdrop from '../components/AuthBackdrop';
import BluemindMark from '../components/BluemindMark';

const SIGNALS = [
  { left: 12, top: 18, delay: 0 },
  { left: 86, top: 72, delay: 2100 },
  { left: 80, top: 20, delay: 3400 },
];

export default function LoginScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [focused, setFocused] = useState('');

  const handleSubmit = async () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError('');
    setLoading(true);
    try {
      const data = await authLogin(email, password);
      if (data.ok) {
        if (data.user && data.user.role !== 'citizen') {
          setError('Access denied: This app is for citizens only.');
        } else {
          await login(data.user, data.token);
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={AUTH_GRADIENT} start={{ x: 0.85, y: 0 }} end={{ x: 0.15, y: 1 }} style={styles.screen}>
      <AuthBackdrop signals={SIGNALS} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.logoRow}>
              <BluemindMark size={22} color={AUTH_COLORS.onDark} />
              <Text style={styles.logoText}>Bluemind</Text>
            </View>

            <Text style={styles.title}>
              Welcome <Text style={styles.titleAccent}>back.</Text>
            </Text>
            <Text style={styles.subtitle}>Sign in to keep mapping.</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={[styles.field, focused === 'email' && styles.fieldFocused, fieldErrors.email && styles.fieldError]}>
              <Ionicons name="mail-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor={AUTH_COLORS.onDark3}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={email}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                onChangeText={(v) => {
                  setEmail(v);
                  if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }));
                }}
              />
            </View>
            {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}

            <View style={[styles.field, focused === 'password' && styles.fieldFocused, fieldErrors.password && styles.fieldError]}>
              <Ionicons name="lock-closed-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={AUTH_COLORS.onDark3}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.inputWithToggle]}
                value={password}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                onChangeText={(v) => {
                  setPassword(v);
                  if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
                }}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={AUTH_COLORS.onDark3} />
              </TouchableOpacity>
            </View>
            {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}

            <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={loading} style={styles.btnWrap}>
              <LinearGradient colors={AUTH_BTN_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, loading && styles.btnDisabled]}>
                <Text style={styles.btnText}>{loading ? 'SIGNING IN…' : 'SIGN IN'}</Text>
                {!loading && <Ionicons name="arrow-forward" size={15} color={AUTH_COLORS.ink} />}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footRow}>
              <Text style={styles.footText}>New here? </Text>
              <Text onPress={() => navigation.navigate('Signup')} style={styles.footLink}>
                Create an account
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
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
    marginBottom: 24,
  },
  logoText: {
    color: AUTH_COLORS.onDark,
    fontFamily: AUTH_FONTS.sansBold,
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  title: {
    color: '#ffffff',
    fontFamily: AUTH_FONTS.sansMedium,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#ffffff',
    fontFamily: AUTH_FONTS.serifItalic,
    fontSize: 31,
  },
  subtitle: {
    color: AUTH_COLORS.onDark2,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 14.5,
    marginTop: 8,
    marginBottom: 6,
  },
  error: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: AUTH_COLORS.dangerBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.dangerBorder,
    color: AUTH_COLORS.danger,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 13,
  },
  field: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
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
    height: 52,
    color: AUTH_COLORS.onDark,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 15,
    paddingHorizontal: 10,
  },
  inputWithToggle: {
    paddingRight: 4,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontFamily: AUTH_FONTS.sansMedium,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  forgotLink: {
    color: AUTH_COLORS.sky2,
    fontFamily: AUTH_FONTS.sansMedium,
    fontSize: 13,
  },
  btnWrap: {
    marginTop: 18,
  },
  btn: {
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.75,
  },
  btnText: {
    color: AUTH_COLORS.ink,
    fontFamily: AUTH_FONTS.sansBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH_COLORS.lineDark,
  },
  dividerText: {
    color: AUTH_COLORS.onDark3,
    fontFamily: AUTH_FONTS.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footText: {
    color: AUTH_COLORS.onDark2,
    fontFamily: AUTH_FONTS.sans,
    fontSize: 14.5,
  },
  footLink: {
    color: AUTH_COLORS.sky2,
    fontFamily: AUTH_FONTS.sansBold,
    fontSize: 14.5,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { authRequestPasswordReset } from '../services/api';
import { AUTH_COLORS, AUTH_GRADIENT, AUTH_BTN_GRADIENT, AUTH_FONTS } from '../styles/authTheme';
import AuthBackdrop from '../components/AuthBackdrop';
import BluemindMark from '../components/BluemindMark';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await authRequestPasswordReset(normalizedEmail);
      if (data.ok) {
        setMessage('If that email exists, we sent a reset link. Check your inbox and spam folder.');
      } else {
        setError('Unable to process your request. Please try again.');
      }
    } catch (requestError) {
      console.error(requestError);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={AUTH_GRADIENT} start={{ x: 0.85, y: 0 }} end={{ x: 0.15, y: 1 }} style={styles.screen}>
      <AuthBackdrop signals={[{ left: 12, top: 18, delay: 0 }, { left: 86, top: 72, delay: 2100 }]} />
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
              <BluemindMark size={22} color={AUTH_COLORS.onDark} />
              <Text style={styles.logoText}>Bluemind</Text>
            </View>

            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={28} color={AUTH_COLORS.tealLight} />
            </View>
            <Text style={styles.title}>Reset your <Text style={styles.titleAccent}>password.</Text></Text>
            <Text style={styles.subtitle}>Enter your email and we'll send you a secure reset link.</Text>

            {message ? <Text style={styles.success}>{message}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.field}>
              <Ionicons name="mail-outline" size={16} color={AUTH_COLORS.onDark3} style={styles.fieldIcon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor={AUTH_COLORS.onDark3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                  setMessage('');
                }}
              />
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={loading} style={styles.btnWrap}>
              <LinearGradient colors={AUTH_BTN_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, loading && styles.btnDisabled]}>
                <Text style={styles.btnText}>{loading ? 'SENDING…' : 'SEND RESET LINK'}</Text>
                {!loading && <Ionicons name="arrow-forward" size={15} color={AUTH_COLORS.ink} />}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
              <Ionicons name="arrow-back" size={14} color={AUTH_COLORS.sky2} />
              <Text style={styles.backLinkText}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: AUTH_COLORS.lineDark, backgroundColor: AUTH_COLORS.cardBg, padding: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 34 },
  logoText: { color: AUTH_COLORS.onDark, fontFamily: AUTH_FONTS.sansBold, fontSize: 14.5 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(45,212,191,0.14)', borderWidth: 1, borderColor: 'rgba(111,201,196,0.45)', marginBottom: 24 },
  title: { color: '#fff', fontFamily: AUTH_FONTS.sansMedium, fontSize: 28, textAlign: 'center' },
  titleAccent: { color: AUTH_COLORS.tealLight, fontFamily: AUTH_FONTS.serifItalic, fontSize: 31 },
  subtitle: { color: AUTH_COLORS.onDark2, fontFamily: AUTH_FONTS.sans, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 8 },
  success: { marginTop: 14, padding: 11, borderRadius: 10, backgroundColor: 'rgba(45,212,191,0.12)', borderWidth: 1, borderColor: 'rgba(111,201,196,0.35)', color: AUTH_COLORS.tealLight, fontFamily: AUTH_FONTS.sans, fontSize: 13, lineHeight: 19 },
  error: { marginTop: 14, padding: 11, borderRadius: 10, backgroundColor: AUTH_COLORS.dangerBg, borderWidth: 1, borderColor: AUTH_COLORS.dangerBorder, color: AUTH_COLORS.danger, fontFamily: AUTH_FONTS.sans, fontSize: 13 },
  field: { flexDirection: 'row', alignItems: 'center', marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: AUTH_COLORS.lineDark, backgroundColor: AUTH_COLORS.fieldBg },
  fieldIcon: { marginLeft: 14 },
  input: { flex: 1, height: 52, color: AUTH_COLORS.onDark, fontFamily: AUTH_FONTS.sans, fontSize: 15, paddingHorizontal: 10 },
  btnWrap: { marginTop: 18 },
  btn: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDisabled: { opacity: 0.75 },
  btnText: { color: AUTH_COLORS.ink, fontFamily: AUTH_FONTS.sansBold, fontSize: 13, letterSpacing: 1 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  backLinkText: { color: AUTH_COLORS.sky2, fontFamily: AUTH_FONTS.sansMedium, fontSize: 13 },
});

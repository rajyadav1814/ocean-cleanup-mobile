import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authLogin } from '../services/api';
import ScreenContainer from '../components/ScreenContainer';
import GlassCard from '../components/GlassCard';
import BrandButton from '../components/BrandButton';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await authLogin(email, password);
      if (data.ok) {
        await login(data.user, data.token);
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
    <ScreenContainer>
      <View style={styles.centerContainer}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to keep the coast clean.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <BrandButton title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSubmit} disabled={loading} />

          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.linkButton}>
            <Text style={styles.linkText}>New here? Create an account</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </ScreenContainer>
  );
}

const getStyles = (theme) => StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center'
  },
  title: {
    color: theme.colors.textMain,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    color: theme.colors.textMuted,
    marginBottom: 22,
    lineHeight: 22,
    textAlign: 'center'
  },
  input: {
    height: 52,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textMain,
    paddingHorizontal: 16,
    marginBottom: 14
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
    marginTop: 6
  },
  headerContainer: {
    paddingHorizontal: 18,
    marginBottom: 24
  },
  error: {
    color: theme.colors.danger,
    marginBottom: 12,
    textAlign: 'center'
  }
});

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authVerify, authLogout, setAuthToken, clearAuthToken } from '../services/api';

const TOKEN_KEY = 'ocean-cleanup-token';
const USER_KEY = 'ocean-cleanup-user';
const AuthContext = createContext(null);

function buildDisplayName(userData) {
  return userData?.displayName
    || [userData?.firstName, userData?.lastName].filter(Boolean).join(' ').trim()
    || userData?.username
    || userData?.role
    || 'User';
}

function normalizeUser(userData) {
  if (!userData) return null;

  const displayName = buildDisplayName(userData);
  const displayInitial = (userData.displayInitial || displayName || 'U').trim().charAt(0).toUpperCase();

  return {
    ...userData,
    displayName,
    displayInitial,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          const data = await authVerify(token);
          if (data.ok && data.user && data.user.role === 'citizen') {
            const normalizedUser = normalizeUser(data.user);
            setUser(normalizedUser);
            setRole(normalizedUser.role);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
          } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
            clearAuthToken();
          }
        } catch (err) {
          console.error('Auth verification failed', err);
          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem(USER_KEY);
          clearAuthToken();
        }
      }
      setLoading(false);
    }

    bootstrapAuth();
  }, []);

  const login = async (userData, token) => {
    setAuthToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    const normalizedUser = normalizeUser(userData);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setRole(normalizedUser.role);
  };

  const logout = async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await authLogout(token);
      } catch (err) {
        console.error('Logout failed', err);
      }
    }
    clearAuthToken();
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
    setRole(null);
  };

  const value = useMemo(() => ({ user, role, login, logout, loading }), [user, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

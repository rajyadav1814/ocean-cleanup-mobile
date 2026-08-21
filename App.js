import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  useFonts,
  Syne_400Regular,
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold
} from '@expo-google-fonts/dm-sans';
import {
  DMMono_400Regular,
  DMMono_500Medium
} from '@expo-google-fonts/dm-mono';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold
} from '@expo-google-fonts/instrument-sans';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic
} from '@expo-google-fonts/instrument-serif';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { getCitizenTheme, CITIZEN_FONTS } from './src/styles/citizenTheme';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SubmitActivityScreen from './src/screens/SubmitActivityScreen';
import MyActivityScreen from './src/screens/MyActivityScreen';
import SplashScreen from './src/screens/SplashScreen';
import ProfileSettingsScreen from './src/screens/ProfileSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthTabs() {
  const { mode } = useTheme();
  const t = getCitizenTheme(mode);
  const tabBarBackground = mode === 'dark' ? t.pageBgGradient[1] : t.surface;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: tabBarBackground,
          borderTopColor: t.borderLight,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 15,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },

        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,

        tabBarLabelStyle: {
          fontFamily: CITIZEN_FONTS.sansMedium,
          fontSize: 11.5,
        },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused
              ? 'speedometer'
              : 'speedometer-outline';
          }

          if (route.name === 'Submit') {
            iconName = focused
              ? 'add-circle'
              : 'add-circle-outline';
          }

          if (route.name === 'MyActivity') {
            iconName = focused
              ? 'list'
              : 'list-outline';
          }

          if (route.name === 'Profile') {
            iconName = focused
              ? 'person'
              : 'person-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
      />

      <Tab.Screen
        name="MyActivity"
        component={MyActivityScreen}
        options={{ title: 'My Activity' }}
      />

      <Tab.Screen
        name="Submit"
        component={SubmitActivityScreen}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
      />
    </Tab.Navigator>
  );
}

function ProfileStack() {
  const { mode } = useTheme();
  const t = getCitizenTheme(mode);
  const backgroundColor = mode === 'dark' ? t.pageBgGradient[1] : t.pageBg;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
      <Stack.Screen
        name="ProfileHome"
        component={HomeScreen}
      />

      <Stack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { loading, user } = useAuth();
  const { theme, mode } = useTheme();

  const [fontsLoaded] = useFonts({
    Syne_400Regular,
    Syne_500Medium,
    Syne_600SemiBold,
    Syne_700Bold,

    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,

    DMMono_400Regular,
    DMMono_500Medium,

    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,

    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading || !fontsLoaded || showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: mode === 'dark',

        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textMain,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
      }}
    >
      {user ? (
        <AuthTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />

          <Stack.Screen
            name="Signup"
            component={SignupScreen}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <SafeAreaView
              style={{ flex: 1 }}
              edges={['top']}
            >
            <RootNavigator />
            </SafeAreaView>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SubmitActivityScreen from './src/screens/SubmitActivityScreen';
import MyActivityScreen from './src/screens/MyActivityScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import SplashScreen from './src/screens/SplashScreen';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontFamily: theme.fonts.medium, fontSize: 12 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'Dashboard') iconName = focused ? 'speedometer' : 'speedometer-outline';
          if (route.name === 'Submit') iconName = focused ? 'add-circle' : 'add-circle-outline';
          if (route.name === 'MyActivity') iconName = focused ? 'list' : 'list-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="MyActivity" component={MyActivityScreen} options={{ title: 'My Activity' }} />
      <Tab.Screen name="Submit" component={SubmitActivityScreen} />
      <Tab.Screen name="Profile" component={HomeScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loading, user } = useAuth();
  const [fontsLoaded] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_700Bold });
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 10000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading || !fontsLoaded || showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {user ? (
        <AuthTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

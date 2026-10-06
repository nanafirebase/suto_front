import { StyleSheet, Text, useColorScheme, View, StatusBar } from 'react-native';
import { useFonts } from 'expo-font'
import { useEffect, useState } from 'react';
import { ThemedText } from './components/ui/ThemedText';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthController from './configuration/navigation/AuthController';
import AppContainer, { useAppContainer } from './configuration/navigation/AppContainer';
import { Colors } from './utils/constants/Colors';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
	const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark'
    const themeColors = Colors[colorScheme === 'dark' ? 'dark' : 'light' ?? 'light']

	const [loaded, error] = useFonts({
        'Regular': require('./assets/fonts/Inter-Regular.ttf'),
        'Bold': require('./assets/fonts/Inter-Bold.ttf'),
        'Medium': require('./assets/fonts/Inter-Medium.ttf'),
        'SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
        'Italic': require('./assets/fonts/Inter-Italic.ttf'),
        'Title': require('./assets/fonts/Syne-SemiBold.ttf'),
        'Info': require('./assets/fonts/Syne-Regular.ttf')
    })

	const customLightTheme = {
		...DefaultTheme,
		colors: {
			...DefaultTheme.colors,
			background: Colors.light.background,
			text: Colors.light.text,
			primary: Colors.light.primary,
			card: Colors.light.card,
			border: Colors.light.border,
		},
	}

	const customDarkTheme = {
		...DarkTheme,
		colors: {
			...DarkTheme.colors,
			background: Colors.dark.background,
			card: Colors.dark.card,
			text: Colors.dark.text,
			primary: Colors.dark.primary,
			border: Colors.dark.border,
		},
	}

	useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);
    
    if (!loaded && !error) {
        return null
    }
	
	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: themeColors.background}}>
			<ThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
				<SafeAreaProvider>
					<NavigationContainer>
						<AppContainer>
							<AuthController />
						</AppContainer>
					</NavigationContainer>
					<StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.background} hidden={false} />
				</SafeAreaProvider>
			</ThemeProvider>
		</GestureHandlerRootView>
	)
}

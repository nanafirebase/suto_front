import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../../utils/constants/Colors';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HapticTab } from '../../../components/ui/HapticTab';
import TabBarBackground from "../../../components/ui/TabBarBackground"
import { Typography } from '../../../utils/constants/Design';
import HomeIcon from '../../../assets/svgs/HomeIcon';
import HomeNavigation from '../navigations/HomeNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileNavigation from '../navigations/ProfileNavigation';
import ProfileIcon from '../../../assets/svgs/ProfileIcon';
import MarketIcon from '../../../assets/svgs/MarketIcon';
import StoreNavigation from '../navigations/StoreNavigation';
import OperationNavigation from '../navigations/OperationNavigation';
import OperationIcon from '../../../assets/svgs/OperationIcon';
import ChatIcon from '../../../assets/svgs/ChatIcon';
import ChatNavigation from '../navigations/ChatNavigation';

const Tab = createBottomTabNavigator();

const MainStack = () => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'

    const TabNavigator = (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: themeColors.primary,
                tabBarInactiveTintColor: themeColors.tabIconDefault,
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarButton: HapticTab,
                tabBarBackground: Platform.OS === 'ios' ? () => (
                    <BlurView
                        tint={isDark ? 'dark' : 'light'} 
                        intensity={isDark ? 70 : 90} 
                        style={StyleSheet.absoluteFill}
                    />
                ) : TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderTopWidth: 0.5,
                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        elevation: 0,
                        height: 85,
                        paddingBottom: 20,
                        position: 'absolute',
                    },
                    default: {
                        backgroundColor: themeColors.card,
                        borderTopColor: themeColors.border,
                        borderTopWidth: 1,
                        height: 65,
                        paddingBottom: 8,
                        paddingTop: 5,
                        elevation: 0
                    },
                }),
                tabBarLabelStyle: {
                    fontSize: Typography.caption,
                    fontFamily: 'SemiBold',
                    marginTop: 2,
                },
                tabBarIconStyle: {
                    marginBottom: 0,
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeNavigation}
                options={{
                    tabBarIcon: ({ focused, color, size }) => (
                        <HomeIcon color={color} size={26} active={focused} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Operations"
                component={OperationNavigation}
                options={{
                    tabBarIcon: ({ focused, color, size }) => (
                        <OperationIcon color={color} size={26} active={focused} />
                    ),
                    headerShown: false,
                }}
            />
            {/* <Tab.Screen
                name="Store"
                component={StoreNavigation}
                options={{
                    tabBarIcon: ({ focused, color, size }) => (
                        <MarketIcon color={color} size={26} active={focused} />
                    ),
                    headerShown: false,
                }}
            /> */}
            <Tab.Screen
                name="Assistant"
                component={ChatNavigation}
                options={{
                    tabBarIcon: ({ focused, color, size }) => (
                        <ChatIcon color={color} size={26} active={focused} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileNavigation}
                options={{
                    tabBarIcon: ({ focused, color, size }) => (
                        <ProfileIcon color={color} size={26} active={focused} />
                    ),
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    )

    if (Platform.OS !== 'ios') {
        return <SafeAreaView style={{ flex: 1 }}>{TabNavigator}</SafeAreaView>
    }

    return TabNavigator
}

export default MainStack
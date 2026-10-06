import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { ProfileNavigationList } from '../../../utils/types/index.type';
import { useColorScheme } from 'react-native'
import { Colors } from '../../../utils/constants/Colors';
import ProfileScreen from '../../../screens/user_main/ProfileScreen';
import PermissionScreen from '../../../screens/features/users/PermissionScreen';
import ChangePasswordScreen from '../../../screens/profile/ChangePasswordScreen';
import SupportScreen from '../../../screens/profile/SupportScreen';
import BusinessSettingScreen from '../../../screens/profile/BusinessSettingScreen';

const Stack = createStackNavigator<ProfileNavigationList>();


const ProfileNavigation = () => {
    const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'

    return (
        <Stack.Navigator {...({} as any)} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }, animation: 'slide_from_right' }} initialRouteName='ProfileScreen'>
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="PermissionScreen" component={PermissionScreen} />
            <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
            <Stack.Screen name="SupportScreen" component={SupportScreen} />
            <Stack.Screen name="BusinessSettingScreen" component={BusinessSettingScreen} />
            
        </Stack.Navigator>
    )
}

export default ProfileNavigation

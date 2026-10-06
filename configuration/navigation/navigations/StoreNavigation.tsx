import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { StoreNavigationList } from '../../../utils/types/index.type';
import { useColorScheme } from 'react-native'
import { Colors } from '../../../utils/constants/Colors';
import ProfileScreen from '../../../screens/user_main/ProfileScreen';

const Stack = createStackNavigator<StoreNavigationList>();


const StoreNavigation = () => {
    const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'

    return (
        <Stack.Navigator {...({} as any)} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }, animation: 'slide_from_right' }} initialRouteName='ProfileScreen'>
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        </Stack.Navigator>
    )
}

export default StoreNavigation

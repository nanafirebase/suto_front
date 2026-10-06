import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { ChatNavigationList } from '../../../utils/types/index.type';
import { useColorScheme } from 'react-native'
import { Colors } from '../../../utils/constants/Colors';
import AISchatScreen from '../../../screens/user_main/AIChatScreen';

const Stack = createStackNavigator<ChatNavigationList>();


const ChatNavigation = () => {
    const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'

    return (
        <Stack.Navigator {...({} as any)} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }, animation: 'slide_from_right' }} initialRouteName='AISchatScreen'>
            <Stack.Screen name="AISchatScreen" component={AISchatScreen} />
        </Stack.Navigator>
    )
}

export default ChatNavigation

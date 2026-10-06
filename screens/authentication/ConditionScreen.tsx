import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type TConditionScreen = NativeStackScreenProps<RootStackParamList, "ConditionScreen">
const ConditionScreen = ({navigation}: TConditionScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const isDark = colorScheme === 'dark'

    return (
        <View>
            
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    statusBarSpacer: {
        width: '100%'
    },
    safeArea: {
        flex: 1
    }
})

export default ConditionScreen;

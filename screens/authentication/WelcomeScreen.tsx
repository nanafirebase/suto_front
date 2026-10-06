import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Image, ImageBackground, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { Spacing } from '../../utils/constants/Design';
import { ThemedText } from '../../components/ui/ThemedText';
import { getData } from '../../configuration/helpers/auth.helpers';
import { SocketIO } from '../../configuration/helpers/main.helpers';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import LottieView from 'lottie-react-native'
import { IconSymbol } from '../../components/ui/icon-symbol';


type TWelcomeScreen = NativeStackScreenProps<RootStackParamList, "WelcomeScreen">
const WelcomeScreen = ({navigation}: TWelcomeScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets()
    const animation = useRef(null)

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, } ]} /> )}
            <View style={[styles.content, { paddingTop: insets.top + 40,paddingBottom: insets.bottom + 20 }]}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <Image source={require('./../../assets/logo_rabi.png')} style={{height: 55, width: '65%', borderRadius: 10, tintColor: colorScheme === "dark" ? 'white' : 'black'}} />
                </View>
                <LottieView
                    autoPlay loop ref={animation}
                    source={require('./../../assets/lottie/orange boxes.json')}
                    style={{height: 250, width: 250, marginTop: 60, alignItems: 'center'}}
                />

                <View style={{...styles.textWrapper, marginTop: 90}}>
                    <ThemedText style={{...styles.title, color: themeColors.text}}>Grow With Total Control</ThemedText>
                    <ThemedText style={{...styles.subtitle, color: themeColors.subtleText}}>Stop toggling between disconnected apps. Unify your sales, finance, and operations under a single, high-velocity ecosystem built to eliminate friction.</ThemedText>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto'}}>
                    <TouchableOpacity style={{...styles.button, ...styles.buttonBorderLeft, marginBottom: 20, backgroundColor: themeColors.primary, width: "74.5%" }} onPress={() => navigation.navigate('RegisterScreen')}>
                        <ThemedText style={styles.buttonText}>Get Started</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={{...styles.button, ...styles.buttonBorderRight, marginBottom: insets.bottom + 20, backgroundColor: themeColors.cardShadow, width: "25%" }} onPress={() => navigation.navigate('LoginScreen')}>
                        <ThemedText style={styles.buttonText}><IconSymbol name="enter" size={20} color={themeColors.text} /></ThemedText>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    ) 
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 40,
        position: 'relative'
    },
    statusBarSpacer: {
        width: '100%'
    },
    safeArea: {
        flex: 1
    },
    spacer: {
        flex: 1,
        height: Spacing.small
    },
    content: {
        flex: 1,
    },
    textWrapper: {
        marginTop: 50,
        alignItems: 'center'
    },

    title: {
        fontSize: 22,
        fontFamily: 'SemiBold',
        textAlign: 'center',
        color: '#1a1a1a',
    },

    subtitle: {
        marginTop: 10,
        fontSize: 13,
        color: '#777',
        textAlign: 'center',
        fontFamily: 'Regular',
    },

    button: {
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 'auto',
    },

    buttonBorderLeft: {
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12
    },

    buttonBorderRight: {
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12
    },

    buttonText: {
        color: 'white',
        fontFamily: 'Bold',
        fontSize: 12,
    }
})

export default WelcomeScreen;

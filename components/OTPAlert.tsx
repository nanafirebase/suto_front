import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import React, { useEffect, useRef, useState } from "react"
import { Text, View, Animated, StatusBar, Dimensions, Easing, Platform, TouchableOpacity, useColorScheme, TextInput, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Alert } from "react-native"
import { Colors } from "../utils/constants/Colors";
import { IconSymbol } from "./ui/icon-symbol";
import { ThemedText } from "./ui/ThemedText";
import { Borders, Spacing, Typography } from "../utils/constants/Design";


const OTPAlert = ( { setShowAlert, refNumber, businessID, sessionID, onSubmit }: any ) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const animatedValue = useRef(new Animated.Value(0)).current
    const [code, setCode] = useState('')

    const slideLeftIn = [{
        translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [300, 0]
        })
    }]

    const startSlide = (toValue:number) => {
        Animated.timing(animatedValue, {
            toValue,
            duration: 400,
            useNativeDriver: true
        }).start()
    }

    const closeAlert = () => {
        startSlide(0)
        setTimeout(() => {
            setShowAlert(null)
        }, 500)
    }

    useEffect(() => {
        startSlide(1)
        // setTimeout(() => {
        //
        //     setTimeout(() => {
        //         setShowAlert(null)
        //     }, 500)
        // }, 3000)
    }, [])

    const onCodeSubmit = () => {
        if (!refNumber || !businessID || !sessionID || !code)
        if (code.length < 4) {
            Alert.alert("Error", "Please enter a valid code")
            return
        }
        onSubmit(code, { refNumber, businessID, sessionID })
    }
    
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>

            <Animated.View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', width: '100%', position: 'absolute', bottom: 0, top: 0, justifyContent: 'center', alignItems: 'center', opacity: animatedValue, zIndex:99999}}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
                    style={{ width: "100%", alignItems: "center", justifyContent: "center" }}
                >

                    <Animated.View style={{ backgroundColor: '#FFFFFF', minWidth: '90%', transform: slideLeftIn,  borderRadius:20, overflow: 'hidden'}}>
                        {
                            <View style={{ alignItems:'center',minHeight:'40%', paddingVertical:'7%', backgroundColor: '#fff', zIndex:999999999, alignSelf:'center', minWidth:'90%', borderRadius:20}}>
                                <TouchableOpacity onPress={closeAlert} style={{backgroundColor: themeColors.error, height: 40, width: 40, position: 'absolute', right: 0, top: 0, justifyContent: 'center', alignItems: 'center'}}>
                                    <IconSymbol name="xmark" size={25} color={themeColors.white} />
                                </TouchableOpacity>
                                <View style={{width:100, height:100, borderRadius:50, marginTop: 10, backgroundColor: themeColors.primary, alignItems:'center', justifyContent:'center',}}>
                                    <IconSymbol name="eye.slash" size={50} color={themeColors.white} />
                                </View>
                                <View style={{marginTop:8}}>
                                    <Text style={{ fontFamily: 'Title', fontSize:20, textAlign:'center'}}>OTP</Text>
                                    <Text style={{fontFamily: "Regular", fontSize:13, textAlign:'center'}}>Enter the 6 digits code sent to{'\n'}your phone for verification</Text>
                                </View>
                                <View style={{...styles.section, marginTop: 15, width: 230}}>
                                    <TextInput
                                        style={[styles.input,{ backgroundColor: themeColors.white, textAlign: 'center', letterSpacing: 12, borderColor: themeColors.border, color: '#000' }]}
                                        value={code}
                                        onChangeText={setCode}
                                        maxLength={6}
                                        placeholder="000000"
                                        placeholderTextColor={themeColors.subtleText}
                                        keyboardType='number-pad'
                                    />
                                </View>
                                <TouchableOpacity onPress={onCodeSubmit} style={{marginTop:'auto', marginBottom:15, width:'100%',  backgroundColor: themeColors.primary, paddingVertical:'3%', paddingHorizontal:'30%', borderRadius:10}}>
                                    <Text style={{fontFamily: 'Bold', color: '#fff', fontSize: 18, textAlign:'center' }}>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        
                    </Animated.View>
                </KeyboardAvoidingView>
            </Animated.View>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 0
    },
    sectionTitle: {
        fontSize: Typography.body,
        fontFamily: 'Medium',
        marginBottom: 3,
    },
    input: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.large,
        fontSize: Typography.small,
        marginBottom: Spacing.medium,
        fontFamily: 'Regular'
    }
})


export default OTPAlert
import React, { useEffect, useRef, useState } from "react"
import { Text, View, Animated, StatusBar, Dimensions, Easing, Platform, TouchableOpacity, useColorScheme } from "react-native"
import { Ionicons, FontAwesome5 } from "@expo/vector-icons"
import { Colors } from "../utils/constants/Colors"
import { ThemedText } from "./ui/ThemedText"


const CustomAlertJSX = ( { setShowAlertJSX, message, title }:any ) => {
    const animatedValue = useRef(new Animated.Value(0)).current
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

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
            setShowAlertJSX(null)
        }, 500)
    }

    useEffect(() => {
        startSlide(1)
    }, [])
    
    return (
        <Animated.View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', width: '100%', paddingHorizontal: 20, position: 'absolute', bottom: 0, top: 0, justifyContent: 'center', alignItems: 'center', opacity: animatedValue, zIndex:99999}}>
            <Animated.View style={{ backgroundColor: '#FFFFFF', minWidth: '90%', transform: slideLeftIn,  borderRadius:20}}>
                {
                    <View style={{ alignItems: 'stretch', minHeight:'40%', paddingHorizontal: 20, paddingVertical:'7%', backgroundColor: '#fff', zIndex:999999999, alignSelf:'center', minWidth:'90%', borderRadius:20}}>
                        <View style={{marginTop:2}}>
                            <ThemedText style={{ fontFamily: 'Bold', fontSize: 20, textAlign:'center'}}>{title}</ThemedText>
                            {message}
                        </View>
                        <TouchableOpacity onPress={closeAlert} style={{marginTop: 40, marginBottom: 15, width:'70%', alignSelf: 'center', backgroundColor:  themeColors.primary, paddingVertical: 10, paddingHorizontal: 35, borderRadius: 5}}>
                            <ThemedText style={{fontFamily: 'Bold', color: '#fff', fontSize: 12, textAlign:'center' }}>Ok</ThemedText>
                        </TouchableOpacity>
                    </View>
                }
            </Animated.View>
        </Animated.View>
    )
}


export default CustomAlertJSX
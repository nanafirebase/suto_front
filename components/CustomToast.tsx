import React, { useEffect, useRef, useState } from "react"
import { Text, View, Animated, StatusBar, Dimensions, Easing, Platform } from "react-native"
import Feather from 'react-native-vector-icons/Feather';


const CustomToast = ( { setShowToast, type, message, title }:any ) => {

    const animatedValue = useRef(new Animated.Value(0)).current

    const slideDown = [{
        translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-600, 0]
        })
    }]

    const startSlide = (toValue:number) => {
        Animated.timing(animatedValue, {
            toValue,
            duration: 700,
            useNativeDriver: true
        }).start()
    }

    const closeAlert = () => {
        setTimeout(() => {
            setShowToast(null)
        }, 500)
    }  

    useEffect(() => {
        startSlide(1)
        setTimeout(() => {
            startSlide(0)
            setTimeout(() => {
                setShowToast(null)
            }, 500)
        }, 3000)
    }, [])
    
    return (
        <Animated.View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', width: '100%', position: 'absolute', bottom: 0, top: 0, justifyContent: 'flex-start', alignItems: 'center', opacity: animatedValue, zIndex:999999999}}>

            <Animated.View style={{ backgroundColor: '#FFFFFF', width: '90%', transform: slideDown, marginTop: Platform.OS === 'ios' ? StatusBar.currentHeight && StatusBar.currentHeight + 30 : StatusBar.currentHeight && StatusBar.currentHeight + 10, borderRadius:20}}>
                {
                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 70, paddingTop: 12, backgroundColor: type === 'success' ? 'rgba(0, 128, 0, 0.9)' : type === 'error' ? 'rgba(255, 0, 0, 0.9)' : type === 'info' ? 'rgba(7, 92, 255, 0.9)' : type === 'warning' ? 'rgba(255, 176, 7, 0.9)' : 'transparent', zIndex: 999999999, alignSelf: 'center', width: '100%', borderRadius: 10, flexWrap: 'wrap' }}>
                        <View style={{ width: 50, height: 50, borderRadius:25, backgroundColor: type === 'success' ? 'rgba(0, 255, 0, 0.5)' : type === 'error' ? 'rgba(255, 0, 0, 0.5)' : type === 'info' ? 'rgba(7, 92, 255, 0.5)' : type === 'warning' ? 'rgba(255, 176, 7, 0.5)' : 'transparent', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
                            {
                                type === 'success' ? (
                                    <Feather name="check" size={25} color="#fff" />
                                ) : type === 'error' ? (
                                    <Feather name="x" size={25} color="#fff" />
                                ) : type === 'info' ? (
                                    <Feather name="info" size={25} color="#fff" />
                                ) : type === 'warning' ? (
                                    <Feather name="alert-triangle" size={25} color="#000" />
                                ) : (
                                    <Feather name="info" size={25} color="#000" />
                                )
                            }
                        </View>
                        <View style={{flexDirection:'column', marginLeft:10}}>
                            <Text style={{ fontFamily: 'Bold', fontSize:15, color: type==='success' ? '#fff' : type==='error' ? '#fff' : type==='info' ? '#fff' : '#000'}}>{title}</Text>
                            <Text style={{ fontFamily: 'Regular', fontSize:12, color: type==='success' ? '#fff' : type==='error' ? '#fff' : type==='info' ? '#fff' : '#000'}}>{message}</Text>
                        </View>
                    </View>
                }
                
            </Animated.View>
            
        </Animated.View>
    )
}




export default CustomToast
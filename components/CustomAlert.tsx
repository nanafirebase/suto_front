import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import React, { useEffect, useRef, useState } from "react"
import { Text, View, Animated, StatusBar, Dimensions, Easing, Platform, TouchableOpacity } from "react-native"


const CustomAlert = ( { setShowAlert, type, message, title }:any ) => {
    const animatedValue = useRef(new Animated.Value(0)).current

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
    
    return (
        <Animated.View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', width: '100%', position: 'absolute', bottom: 0, top: 0, justifyContent: 'center', alignItems: 'center', opacity: animatedValue, zIndex:99999}}>
        
            <Animated.View style={{ backgroundColor: '#FFFFFF', minWidth: '90%', transform: slideLeftIn,  borderRadius:20}}>
                
                {
                    <View style={{ alignItems:'center',minHeight:'40%', paddingVertical:'7%', backgroundColor: '#fff', zIndex:999999999, alignSelf:'center', minWidth:'90%', borderRadius:20}}>
                        <View style={{width:100, height:100, borderRadius:50, marginTop: 10, backgroundColor: type==='success' ? 'rgba(84, 196, 133, 0.2)' : type==='error' ? 'rgba(255, 0, 0, 0.2)' : type==='info' ? 'rgba(7, 92, 255, 0.2)' : type==='warning' ? 'rgba(255, 176, 7, 0.2)' : 'none', alignItems:'center', justifyContent:'center',}}>
                            { type==='success' ? <FontAwesome5 name="check" size={50} color={'rgba(84, 196, 133, 0.8)'} /> : type==='error' ? <Ionicons name="close" size={50} color="'rgba(232, 2, 2, 0.8)'" /> :  <FontAwesome5 name={ type==='info' ? "info" : type==='warning' ? "exclamation" : 'info' } size={50} color= { type==='info' ? 'rgba(7, 92, 255, 0.8)' : type==='warning' ? 'rgba(233, 171, 13, 0.8)' : 'none'} />}
                        </View>
                        <View style={{marginTop:8}}>
                            <Text style={{ fontFamily: 'Bold', fontSize:20, textAlign:'center'}}>{title}</Text>
                            <Text style={{fontFamily: "medium", fontSize:15, textAlign:'center'}}>{message}</Text>
                        </View>
                        <TouchableOpacity onPress={closeAlert} style={{marginTop:'auto', marginBottom:15, width:'100%',  backgroundColor: type==='success' ? 'rgba(84, 196, 133, 0.8)' : type==='error' ? 'rgba(232, 2, 2, 0.8)' : type==='info' ? 'rgba(7, 92, 255, 0.8)' : type==='warning' ? 'rgba(233, 171, 13, 0.8)' : 'none', paddingVertical:'3%', paddingHorizontal:'30%', borderRadius:10}}>
                            <Text style={{fontFamily: 'Bold', color: '#fff', fontSize: 18, textAlign:'center' }}>Ok</Text>
                        </TouchableOpacity>
                    </View>
                }
                
            </Animated.View>
            
        </Animated.View>
    )
}




export default CustomAlert
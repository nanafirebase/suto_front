import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import React, { useEffect, useRef, useState } from "react"
import { Text, View, Animated, StatusBar, Dimensions, Easing, Platform, TouchableOpacity } from "react-native"
import LottieView from 'lottie-react-native';
import { ThemedText } from "./ui/ThemedText";
import { ApiClient } from "../configuration/helpers/auth.helpers";
import { SocketIO } from "../configuration/helpers/main.helpers";
import { useAppContainer } from "../configuration/navigation/AppContainer";

const PaymentModal = ( { setShowModal, refNumber, businessID, sessionID }:any ) => {
    const animatedValue = useRef(new Animated.Value(0)).current
    const animationRef = useRef<LottieView>(null)

    const POLL_INTERVAL = 4000
    const pollRef = useRef<any>(null)
    const retriesRef = useRef(0)
    const MAX_RETRIES = 12

    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState<"pending" | "success" | "failed">("pending")
    const [message, setMessage] = useState('')

    const slideLeftIn = [
        {
            translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0]
            })
        }
    ]

    const startSlide = (toValue: number) => {
        Animated.timing(animatedValue, {
            toValue,
            duration: 400,
            useNativeDriver: true
        }).start()
    }

    const closeAlert = () => {
        startSlide(0)
        setTimeout(() => {
            setShowModal(null)
        }, 500)
    }

    const checkPayment = async () => {
        pollRef.current = setTimeout(() => {
            SocketIO.emit('verify-purchase', { sessionID: sessionID, businessID: businessID, referenceNumber: refNumber}, (response: any) => {
                // console.log("verify-purchase response:", response.status)
                if (response?.status === "success") {
                    setStatus("success")
                    setMessage(response?.message || 'Payment successful. Your subscription is now active')
                    setLoading(false)
                    setTimeout(closeAlert, 2500)
                    return
                }
                
                if (response?.status === "failed" || response?.status === "cancelled") {
                    setStatus("failed")
                    setMessage(response?.message || 'We couldn’t confirm your payment. If your account was charged, please contact support')
                    setLoading(false)
                    setTimeout(closeAlert, 2500)
                    return
                }

                retriesRef.current += 1

                if (retriesRef.current >= MAX_RETRIES) {
                    setStatus("failed")
                    setMessage('Payment confirmation is taking longer than usual. If your account was charged, your subscription will be activated automatically.')
                    setLoading(false)
                    return
                }

                setStatus("pending")
                setMessage(response?.message || 'Payment confirmation is pending')
                setLoading(true)
                checkPayment()
            })
        }, POLL_INTERVAL)
    }

    useEffect(() => {
        startSlide(1)
        if (refNumber && businessID && sessionID) {
            checkPayment()
        }
        return () => {
            if (pollRef.current) {
                clearTimeout(pollRef.current)
            }
        }
    }, [])

    
    return (
        <Animated.View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', width: '100%', position: 'absolute', bottom: 0, top: 0, justifyContent: 'center', alignItems: 'center', opacity: animatedValue, zIndex:99999}}>
            <Animated.View style={{ backgroundColor: '#FFFFFF', minWidth: '90%', transform: slideLeftIn,  borderRadius:20}}>
                {
                    <View style={{ alignItems:'center',minHeight:'40%', paddingVertical:'7%', backgroundColor: '#fff', zIndex:999999999, alignSelf:'center', minWidth:'90%', borderRadius:20}}>
                        <View style={{marginTop:8, alignItems: 'center'}}>
                            <Text style={{ fontFamily: 'Bold', fontSize:20, textAlign:'center'}}>Awaiting Confirmation</Text>
                            <Text style={{ fontFamily: 'Regular', fontSize:15, textAlign:'center'}}>For {refNumber}</Text>
                            {loading ? (
                                <LottieView
                                    ref={animationRef}
                                    source={require('../assets/lottie/loading.json')}
                                    autoPlay
                                    loop={status === 'pending'}
                                    style={{ width: 150, height: 150, alignItems: 'center' }}
                                />
                            ) : <ThemedText style={{fontFamily: 'SemiBold', fontSize: 18, color: '#147dc8', marginTop: 17, textAlign: 'center', paddingHorizontal: 50}}>{message}</ThemedText>}
                        </View>
                        {!loading && (
                            <TouchableOpacity onPress={closeAlert} style={{marginTop:'auto', marginBottom:15, width:'100%',  backgroundColor: '#147dc8', paddingVertical:'3%', paddingHorizontal:'30%', borderRadius:10}}>
                                <Text style={{fontFamily: 'Bold', color: '#fff', fontSize: 18, textAlign:'center' }}>Close</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            </Animated.View>
            
        </Animated.View>
    )
}




export default PaymentModal
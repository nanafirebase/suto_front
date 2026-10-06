import React, { useEffect, useRef, useState } from "react"
import { useAppContainer } from "./AppContainer"
import AuthStack from "./stacks/AuthStack"
import MainStack from "./stacks/MainStack"
import { SocketIO } from "../helpers/main.helpers"
import { getData } from "../helpers/auth.helpers"
import { useColorScheme, View } from "react-native"
import { ThemedText } from "../../components/ui/ThemedText"
import { Colors } from "../../utils/constants/Colors"
import BusinessStack from "./stacks/BusinessStack"
import LottieView from 'lottie-react-native'
import SplashComponent from "../../components/SplashComponent"

const AuthController = () => {
	const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
	const { isLoggedIn, isLoadingSplash, setIsLoggedIn, setSession, setUserData, setIsLoadingSplash, selectedBusiness } = useAppContainer()

	const checkSession = async () => {
		const loadingStartTime = Date.now();
		try {
			const sessionID = await getData('session')
			const userData = await getData('user_data')
			if (!sessionID) {
				setUserData(null)
				setSession(null)
				setIsLoggedIn(false)
				const elapsedTime = Date.now() - loadingStartTime;
				const remainingTime = Math.max(2000 - elapsedTime, 0);
				setTimeout(() => {
					setIsLoadingSplash(false)
				}, remainingTime)
				return
			}
	
			SocketIO.emit('authenticate-session', { sessionID: sessionID }, (response:any) => {
				// console.log("response", response)
				if (response.status == "success") {
					setUserData(userData)
					setSession(sessionID)
					setIsLoggedIn(true)
				} else {
					setUserData(null)
					setSession(null)
					setIsLoggedIn(false)
				}
				const elapsedTime = Date.now() - loadingStartTime;
				const remainingTime = Math.max(2000 - elapsedTime, 0);
				setTimeout(() => {
					setIsLoadingSplash(false)
				}, remainingTime)
			})
		} catch (error) {
			console.error("Session authentication error:", error);
            setUserData(null);
            setSession(null);
            setIsLoggedIn(false);
            const elapsedTime = Date.now() - loadingStartTime;
            const remainingTime = Math.max(2000 - elapsedTime, 0);

            setTimeout(() => {
                setIsLoadingSplash(false);
            }, remainingTime);
		}
	}

	useEffect(() => {
		checkSession()
	}, [])

	if (isLoadingSplash) {
        return <SplashComponent />
    }

    return !isLoggedIn ? <AuthStack /> : !selectedBusiness ? <BusinessStack /> : <MainStack />
}

export default AuthController
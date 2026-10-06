import LottieView from 'lottie-react-native';
import React, { Dispatch, JSX, SetStateAction, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useAppContainer } from '../configuration/navigation/AppContainer';


const SplashComponent = () => {
    const animation = useRef<LottieView>(null);
    const screenWidth = Dimensions.get('screen').width
    const screenHeight = Dimensions.get('screen').height

    return (
        <View style={{flex: 1, width: screenWidth, height: screenHeight, position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, zIndex: 9999, elevation: 9999, alignItems: 'center', justifyContent: 'center'}}>
            <LottieView
                autoPlay loop={true} ref={animation} resizeMode='cover'
                source={require('./../assets/lottie/Enca.json')}
                style={{height: screenHeight + 20, width: screenWidth}}
            />
        </View>
    )
}

const styles = StyleSheet.create({})

export default SplashComponent;
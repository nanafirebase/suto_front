import { View, useWindowDimensions, StyleSheet, Pressable, TouchableOpacity } from 'react-native'
import React, { useRef } from 'react'
import { ThemedText } from './ThemedText'
import Paginator from './Paginator'
import { slides } from '../../configuration/data/System'
import LottieView from 'lottie-react-native'

const OnboardingItem = ({ item, scrollX, onNext }: any) => {
    const { width } = useWindowDimensions()
    const animation = useRef(null)

    return (
        <View style={[styles.container, { width }]}>
            <View style={styles.animationSection}>
                <LottieView
                    autoPlay
                    loop
                    ref={animation}
                    source={item.image}
                    style={styles.animation}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.contentSection}>
                <ThemedText style={styles.title}>
                    {item.title}
                </ThemedText>

                <ThemedText style={styles.description}>
                    {item.description}
                </ThemedText>
            </View>


            {/* 3. INDICATOR + BUTTON - BOTTOM */}
            <View style={styles.bottomSection}>

                {/* Indicator */}
                <Paginator
                    data={slides}
                    scrollX={scrollX}
                />
            </View>

        </View>
    )
}

export default OnboardingItem


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 30,
        backgroundColor: '#fff',
    },
    animationSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    animation: {
        width: '85%',
        height: '85%',
    },
    contentSection: {
        flex: 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },

    title: {
        fontFamily: 'Bold',
        fontSize: 24,
        color: '#0275d8',
        textAlign: 'center',
        marginBottom: 12,
    },

    description: {
        fontFamily: 'Regular',
        fontSize: 15,
        fontWeight: '300',
        color: '#999',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    bottomSection: {
        flex: 0.35,
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 20,
    },

    button: {
        width: '100%',
        height: 52,
        borderRadius: 12,
        backgroundColor: '#0275d8',
        justifyContent: 'center',
        alignItems: 'center',
    },

    buttonText: {
        color: '#fff',
        fontFamily: 'Bold',
        fontSize: 16,
    },
})

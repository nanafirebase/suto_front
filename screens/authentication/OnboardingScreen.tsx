import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, ImageBackground, Keyboard, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { Spacing } from '../../utils/constants/Design';
import { ThemedText } from '../../components/ui/ThemedText';
import { slides } from '../../configuration/data/System';
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated"
import OnboardingItem from '../../components/ui/OnboardingItem';

const { width } = Dimensions.get('window');

type TOnboardingScreen = NativeStackScreenProps<RootStackParamList, "OnboardingScreen">
const OnboardingScreen = ({navigation}: TOnboardingScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const [currentIndex, setCurrentIndex] = useState(0)
    const scrollX = useSharedValue(0)
    const slideRef = useRef<FlatList>(null)
    const [btnText, setBTNText] = useState("Next")
    const [freezeBack, setFreezeBack] = useState(true)
    

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length) {
            setCurrentIndex(viewableItems[0].index)
        }
    }).current

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

    const scrollTo = () => {
        if (currentIndex < slides.length - 1) {
            slideRef.current?.scrollToIndex({ index: currentIndex + 1 })
            setFreezeBack(false)
        } else {
            navigation.navigate('LoginScreen')
            setFreezeBack(false)
        }
    }
    
    useEffect(() => {
        setBTNText(currentIndex < slides.length - 1 ? "Next" : "Login")
        if (slides.length > currentIndex && currentIndex !== 0) {
            setFreezeBack(false)
        } else {
            setFreezeBack(true)
        }
    }, [currentIndex])

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x
    })

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <View style={{ position: 'absolute', top: 50, right: 30, zIndex: 9999 }}>
                    <TouchableOpacity activeOpacity={0.8} onPress={()=> navigation.navigate('LoginScreen')} style={{ width: 40, height: 30 }}>
                        <ThemedText style={{fontSize: 14, textAlign: 'right'}}>Skip</ThemedText>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 2 }}>
                    <Animated.FlatList
                        data={slides}
                        renderItem={ ({ item, index }) => <OnboardingItem item={item} index={index} scrollX={scrollX} totalSlides={slides.length} /> } 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        bounces={true}
                        keyExtractor={(item:any) => item.id}
                        onScroll={scrollHandler}
                        scrollEventThrottle={16}
                        onViewableItemsChanged={viewableItemsChanged}
                        viewabilityConfig={viewConfig}
                        ref={slideRef}
                        initialNumToRender={1}
                    />
                </View>

                <View style={{flexDirection: 'row', width: '100%', paddingHorizontal: 30, justifyContent: 'space-between', position: 'absolute', bottom: 65}}>
                    <TouchableOpacity style={{...styles.button, width: '100%', height: 50, backgroundColor: themeColors.primary}} onPress={scrollTo}>
                        <Text style={styles.btnText}>{btnText}</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBarSpacer: {
        width: '100%'
    },
    safeArea: {
        flex: 1
    },
    slide: {
        width,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    description: { fontSize: 16, color: '#fff', textAlign: 'center' },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },
    btnText: {
        color: '#fff',
        fontFamily: 'Bold'
    },
})

export default OnboardingScreen;

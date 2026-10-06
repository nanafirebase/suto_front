import { useColorScheme, useWindowDimensions, View } from 'react-native'
import React from 'react'
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated'
import { Colors } from '../../utils/constants/Colors'


const Paginator = ({data, scrollX}:any) => {
    const { width } = useWindowDimensions()
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    return (
		<View style={{ flexDirection: 'row', height: 30 }}>
			{data.map((_:any, i:any) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width]
                    const dotStyle = useAnimatedStyle(() => {
                        const dotWidth = interpolate(scrollX.value, inputRange, [10, 30, 10], 'clamp');
                        const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], 'clamp');
                        return {
                            width: dotWidth,
                            opacity: opacity,
                            height: 7,
                            borderRadius: 5,
                            backgroundColor: themeColors.primary,
                            margin: 5
                        }
                    })
                    return <Animated.View style={dotStyle} key={i.toString()} />
                })}
		</View>
    )
}

export default Paginator
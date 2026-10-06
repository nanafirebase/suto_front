import { View, FlatList, Image, Dimensions, useColorScheme } from 'react-native';
import { useState } from 'react';
import { API_URL } from '../../../configuration/credentials';
import { Colors } from '../../../utils/constants/Colors';

const { width } = Dimensions.get('window');

export default function ImageCarousel({ images }: any) {
    const [activeIndex, setActiveIndex] = useState(0);
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const onScroll = (event:any) => {
        const index = Math.round(
            event.nativeEvent.contentOffset.x / width
        );
        setActiveIndex(index);
    };

    return (
        <View>
            <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                    let image = `${API_URL}${item?.path}`
                    return (
                        <View style={{ width }}>
                            {image ? <Image source={{ uri: image }} style={{ width: '100%', height: 300, borderRadius: 10 }} resizeMode="cover" /> : null}
                            <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8}} />
                        </View>
                    )
                }}
            />
            {/* Indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                {images.map((_:any, index:number) => (
                    <View key={index} style={{ width: activeIndex === index ? 20 : 8, height: 5, borderRadius: 2, backgroundColor: activeIndex === index ? themeColors.primary : themeColors.border, marginHorizontal: 4 }} />
                ))}
            </View>
        </View>
    )
}

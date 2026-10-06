import SkeletonLoading from 'expo-skeleton-loading'
import { View } from 'react-native';
import { Spacing } from '../utils/constants/Design';

const Skeleton = () => {

    return(
        <SkeletonLoading background={"#adadad"} highlight={"#ffffff"}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.small, marginTop: 10 }}>
                <View style={{ width: 100, height: 100, backgroundColor: "#adadad", borderRadius: 10 }} />

                <View style={{ flex:1, marginLeft: 10 }}>
                    <View style={{ backgroundColor: "#adadad", width: "95%", height: 20, marginBottom: 10, borderRadius: 5 }} />
                    <View style={{ backgroundColor: "#adadad", width: '60%', height: 10, borderRadius: 5 }} />
                    <View style={{ backgroundColor: "#adadad", width: '30%', height: 10, borderRadius: 5, marginTop: 6 }} />
                </View>
            </View>
        </SkeletonLoading>
    )
}

export default Skeleton
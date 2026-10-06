import { TouchableOpacity, View } from "react-native"
import { STAT_REGISTRY, StatID } from "../../../configuration/helpers/registry/dashboard.stat.registry"
import { ThemedText } from "../ThemedText"
import { HomeNavigationList } from "../../../utils/types/index.type"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

interface StatCardProps {
    id: StatID
    value: string
    themeColors: any
    navigation: any
}

export const StatCard: React.FC<StatCardProps> = ({ id, value, themeColors, navigation }) => {
    const config = STAT_REGISTRY[id]

    if (!config) return null

    return (
        <TouchableOpacity style={{
                width: config.colSpan === 1.5 ? "49%" : config.colSpan === 2 ? "66%" : config.colSpan === 3 ? "100%" : "32%",
                backgroundColor: themeColors.card,
                borderRadius: 4,
                marginBottom: 5,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderLeftWidth: 3,
                borderLeftColor: config.color
            }} onPress={() => {
                if (config.screen) {
                    navigation.navigate(config.screen);
                }
            }}
        >
            <ThemedText
                style={{
                    fontSize: 10.5,
                    fontFamily: "Bold",
                    color: config.color
                }}
            >
                {config.title}
            </ThemedText>

            <ThemedText style={{ fontSize: 11 }}>
                {value}
            </ThemedText>
        </TouchableOpacity>
    )
}

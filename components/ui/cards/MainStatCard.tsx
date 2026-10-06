import { DimensionValue, View } from "react-native"
import { STAT_REGISTRY, StatID } from "../../../configuration/helpers/registry/dashboard.stat.registry"
import { ThemedText } from "../ThemedText"

interface StatCardProps {
    id: StatID
    value: string
    themeColors: any
    width?: DimensionValue
    title?: string
}

export const MainStatCard: React.FC<StatCardProps> = ({ id, value, themeColors, width, title }) => {
    const config = STAT_REGISTRY[id]

    if (!config) return null

    const cardWidth: DimensionValue = width ?? (config.colSpan === 1.5 ? "49%" : config.colSpan === 2 ? "66%" : "32%")

    return (
        <View style={{
                width: cardWidth,
                backgroundColor: themeColors.card,
                borderRadius: 4,
                marginBottom: 5,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderLeftWidth: 3,
                borderLeftColor: config.color
            }}
        >
            <ThemedText
                style={{
                    fontSize: 10.5,
                    fontFamily: "Bold",
                    color: config.color
                }}
            >
                {title || config.title}
            </ThemedText>

            <ThemedText style={{ fontSize: 12 }}>
                {value}
            </ThemedText>
        </View>
    )
}

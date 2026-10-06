import React from "react";
import { View, Dimensions, useColorScheme } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Colors } from "../../../utils/constants/Colors";
import { ThemedText } from "../ThemedText";
import { Typography } from "../../../utils/constants/Design";

const screenWidth = Dimensions.get("window").width;

type StorageProps = {
    storageData: {
        images: number
        documents: number
    }
}

export const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B"
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let i = 0
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024
        i++
    }
    let decimals = 0
    if (i === 1) decimals = 0
    else if (i === 2) decimals = 1
    else decimals = 2
    return `${size.toFixed(decimals)} ${units[i]}`
}

const CloudStorageOverview = ({storageData}: StorageProps) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const totalStorageBytes = 1 * 1024 * 1024 * 1024
    const usedBytes = storageData.images + storageData.documents
    const freeBytes = Math.max(totalStorageBytes - usedBytes, 0)

    const data = [
        {
            name: "Photos",
            population: storageData.images,
            color: "#FF9800",
            legendFontColor: themeColors.text,
            legendFontSize: 10,
        },
        {
            name: "Documents",
            population: storageData.documents,
            color: "#9C27B0",
            legendFontColor: themeColors.text,
            legendFontSize: 10,
        },
        {
            name: "Free",
            population: freeBytes,
            color: "#4CAF50",
            legendFontColor: themeColors.text,
            legendFontSize: 10
        }
    ]

    return (
        <View>
            <ThemedText style={{fontSize: Typography.heading4, fontFamily: "Bold"}}>Cloud Storage Overview</ThemedText>
            <PieChart
                data={data}
                width={(screenWidth / 2.1)}
                height={(screenWidth / 2.1)}
                chartConfig={{
                    color: () => `rgba(0, 0, 0, 1)`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="37"
                center={[0, 0]}
                hasLegend={false}
            />
            <View style={{ marginTop: 5, marginHorizontal: 15 }}>
                {data.map((item, index) => (
                    <View
                        key={index}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 6,
                        }}
                    >
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: item.color,
                                marginRight: 8,
                            }}
                        />
                        <ThemedText style={{fontSize: 10.5}}>
                            {item.name} ({formatSize(item.population)})
                        </ThemedText>
                    </View>
                ))}
            </View>
        </View>
    )
}

export default CloudStorageOverview;

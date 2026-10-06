import React, { useMemo } from "react";
import { View, Dimensions, useColorScheme } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Colors } from "../../../utils/constants/Colors";
import { ThemedText } from "../ThemedText";
import { Typography } from "../../../utils/constants/Design";

const screenWidth = Dimensions.get("window").width;

type Props = {
    profitData?: {
        summary?: {
            revenue: number;
            cogs: number;
            grossProfit: number;
            margin: number;
            tax: number;
        };
        chart?: {
            date: string | Date;
            revenue: number;
            cogs: number;
            profit: number;
            margin: number;
            tax: number;
        }[]
    }
}

const ProfitOverview = ({ profitData }: Props) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']

    const chart = profitData?.chart || []

    const hasData = chart.length > 0

    const chartData = useMemo(() => ({
        labels: chart.map(item => new Date(item.date).getDate().toString()),
        datasets: [
            {
                data: chart.map(item => Number(item.revenue || 0)),
                color: () => "#2563EB",
                strokeWidth: 2,
            },
            {
                data: chart.map(item => Number(item.profit || 0)),
                color: () => "#22C55E",
                strokeWidth: 2,
            },
            {
                data: chart.map(item => Number(item.tax || 0)),
                color: () => "#F59E0B",
                strokeWidth: 2,
            }
        ],
        legend: ["Sales", "Profit", "Tax"]
    }), [chart])

    return (
        <View>
            <ThemedText style={{ fontSize: Typography.heading4, fontFamily: "Bold" }}>Business Monthly Performance</ThemedText>

            {hasData ? (
                <LineChart
                    data={chartData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        backgroundGradientFrom: themeColors.border,
                        backgroundGradientTo: themeColors.background,
                        decimalPlaces: 2,
                        color: () => themeColors.text,
                        labelColor: () => themeColors.subtleText,
                        propsForDots: { r: "4" },
                        propsForLabels: {
                            fontSize: 10,
                        },
                    }}
                    bezier
                    withShadow={false}
                    withInnerLines={false}
                    style={{ marginTop: 10, borderRadius: 12 }}
                />
            ) : (
                <ThemedText style={{ marginTop: 20, fontSize: 12, textAlign: "center", color: themeColors.subtleText }}>
                    No sales data
                </ThemedText>
            )}
        </View>
    );
};

export default ProfitOverview;
import React, { useMemo } from "react";
import { View, Dimensions, useColorScheme, Text } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Colors } from "../../../utils/constants/Colors";
import { ThemedText } from "../ThemedText";
import { Typography } from "../../../utils/constants/Design";

const screenWidth = Dimensions.get("window").width;

type Props = {
    paymentData?: {
        cash?: number;
        momo?: number;
    };
}

const PaymentOverview = ({ paymentData }: Props) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const momo = Number(paymentData?.momo || 0);
    const cash = Number(paymentData?.cash || 0);

    const chartData = useMemo(() => [
        {
            name: "MoMo",
            population: momo,
            color: "#147dc8",
            legendFontColor: themeColors.text,
            legendFontSize: 10,
        },
        {
            name: "Cash",
            population: cash,
            color: "#4CAF50",
            legendFontColor: themeColors.text,
            legendFontSize: 10,
        }
    ], [momo, cash, themeColors.text]);

    const hasData = momo > 0 || cash > 0

    return (
        <View>
            <ThemedText style={{fontSize: Typography.heading4, fontFamily: "Bold"}}>Payment Breakdown</ThemedText>
            {hasData ? (
                    <PieChart
                        data={chartData}
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
            ) : <ThemedText style={{ marginTop: 20, fontSize: 12, textAlign: "center", color: themeColors.subtleText }}>
                    No transaction data
                </ThemedText>
            }
            <View style={{ marginTop: 5, marginHorizontal: 15 }}>
                {chartData.map((item, index) => (
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
                            {item.name} Payment - <Text style={{ fontFamily: 'Bold'}}>{item.population}%</Text>
                        </ThemedText>
                    </View>
                ))}
            </View>
        </View>
    )
}

export default PaymentOverview;

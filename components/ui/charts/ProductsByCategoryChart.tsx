import React from "react";
import { View, Dimensions, useColorScheme, Text, ScrollView } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Colors } from "../../../utils/constants/Colors";
import { ThemedText } from "../ThemedText";
import { Typography } from "../../../utils/constants/Design";
import { generateHexColor, generateNiceHexColor, shortenText, smartAbbreviate } from "../../../configuration/helpers/main.helpers";

const screenWidth = Dimensions.get("window").width;

interface CategoryItem {
    name: string
    count: number
    color: string
}

const formatCategories = (rows?: any[]): CategoryItem[] =>
    (rows ?? []).map(item => ({
        name: item.categoryName,
        count: Number(item.total),
        color: generateHexColor()
    }))

const ProductsByCategoryChart = ({productsInCategoryData}:any) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const categories = formatCategories(productsInCategoryData)

    const totalProducts = categories.reduce((sum, item) => sum + item.count, 0);

    const data = categories.map((item) => ({
        name: item.name,
        population: item.count,
        color: item.color,
        legendFontColor: themeColors.text,
        legendFontSize: 10
    }))

    return (
        <View>
            <ThemedText style={{fontSize: Typography.heading4, fontFamily: "Bold"}}>Products by Category</ThemedText>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
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
                <View style={{ marginTop: 5, marginHorizontal: 15, maxHeight: 160 }}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {categories.map((item, index) => {
                            const percentage = ((item.count / totalProducts) * 100).toFixed(1);
                            return (
                                <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 8 }} />
                                    <ThemedText style={{ fontSize: 11 }}>
                                        {shortenText(item.name, 14)} {" "}
                                        <Text style={{ fontFamily: "Bold" }}>{item.count}</Text>{" "}
                                        ({percentage}%)
                                    </ThemedText>
                                </View>
                            )
                        })}
                    </ScrollView>
                </View>
            </View>
        </View>
    )
}

export default ProductsByCategoryChart;

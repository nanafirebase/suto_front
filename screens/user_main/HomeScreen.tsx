import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { HomeNavigationList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import CloudStorageOverview from '../../components/ui/charts/CloudStorageOverview';
import { Ionicons } from '@expo/vector-icons';
import PaymentOverview from '../../components/ui/charts/PaymentOverview';
import ProductsByCategoryChart from '../../components/ui/charts/ProductsByCategoryChart';
import { SocketIO } from '../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import { PACKAGE_STATS } from '../../configuration/helpers/registry/dashboard.stat.layout';
import { StatID } from '../../configuration/helpers/registry/dashboard.stat.registry';
import { StatCard } from '../../components/ui/cards/DashboardStatCard';
import { formatCurrency } from '../../utils/constants/Currency';
import ProfitOverview from '../../components/ui/charts/ProfitOverview';

type lowStockItemData = {
    productID: number,
    productName: string,
    baseQuantity: number,
    reorderLevel: number
}

type dashData = {
    productsInCategory: any
    productCount: number
    expiringProducts: number
    totalSalesToday: number
    transactionsToday: number
    storage: {
        images: number
        documents: number
    },
    paymentTypePercentage: {
        momo: number
        cash: number
    },
    lowStocks: {
        total: number
        items: lowStockItemData[]
    },
    profit: {
        summary: {
            revenue: number
            cogs: number
            grossProfit: number
            margin: number,
            tax: number
        }, chart: {
            date: Date | string, revenue: number, cogs: number, profit: number, margin: number, tax: number
        }[]
    }
}

type THomeScreen = NativeStackScreenProps<HomeNavigationList, "HomeScreen">
const HomeScreen = ({navigation}: THomeScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { userData, selectedBusiness, packageName, session, businessCurrency } = useAppContainer()
    const [refreshing, setRefreshing] = useState(false)
    const [dashboardData, setDashboardData] = useState<dashData>({
        productsInCategory: null,
        productCount: 0,
        expiringProducts: 0,
        totalSalesToday: 0,
        transactionsToday: 0,
        storage: {
            images: 0,
            documents: 0
        },
        paymentTypePercentage: {
            momo: 0,
            cash: 0
        },
        lowStocks: {
            total: 0,
            items: []
        },
        profit: {
            summary: {
                revenue: 0,
                cogs: 0,
                grossProfit: 0,
                margin: 0,
                tax: 0
            }, chart: []
        }
    })

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    const getUserName = () => {
        if (userData?.full_name) {
            return userData.full_name
        }
        if (userData?.email) {
            return userData.email.split('@')[0]
        }
        return 'User'
    }

    const getHomeStats = async () => {
        return new Promise<void>((resolve) => {  
            SocketIO.emit('fetch-dashboard-analytics' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
                if (response.status === "success") {
                    // console.log(response.data)
                    setDashboardData(response.data || {})
                } else {
                    Alert.alert("Error", "Error fetching analytics", response.message)
                }
                resolve()
            })
        })
    }

    useEffect(()=> {
        getHomeStats()
    }, [])

    const onRefresh = async () => {
        setRefreshing(true)
        await getHomeStats()
        setRefreshing(false)
    }

    const getDynamicValueFromDashboard = (id: StatID): string => {
        switch (id) {
            case "products":
                return dashboardData.productCount?.toString() || "0"
            case "sales-today":
                return dashboardData.totalSalesToday?.toString() || "0"
            case "transactions-today":
                return dashboardData.transactionsToday?.toString() || "0"
            case "expiring-soon":
                return dashboardData.expiringProducts?.toString() || "0"
            case "low-stocks":
                return dashboardData.lowStocks.total?.toString() || "0"
            case "gross-profit-month":
                return `${formatCurrency(Number(dashboardData.profit.summary?.grossProfit?.toFixed(2) ?? "0.00")) } (${dashboardData.profit.summary?.margin?.toFixed(2) || "0.00"}%)`
            case "revenue-month":
                return formatCurrency(Number(dashboardData.profit.summary?.revenue ?? 0))
            case "cogs-month":
                return formatCurrency(dashboardData.profit.summary?.cogs ?? 0)
            case "tax-collected":
                return formatCurrency(dashboardData.profit.summary?.tax ?? 0)
            default:
                return "0"
        }
    }

    const handleSearchPress = () => {}

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background }]}>
                    <ThemedView style={styles.headerLeft}>
                        <ThemedText style={[styles.welcomeText, { color: themeColors.subtleText }]}>{getGreeting()},</ThemedText>
                        <ThemedText style={styles.userName}>{getUserName()}</ThemedText>
                    </ThemedView>
                    <View style={styles.headerRight}>
                        {/* <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground }]}
                            onPress={()=>handleSearchPress()}
                        >
                            <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                        </TouchableOpacity> */}
                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground }]}
                            onPress={()=>navigation.navigate('AllAlertScreen')}
                        >
                            <IconSymbol name="bell.fill" size={22} color={themeColors.icon} />
                            <View style={[styles.notificationBadge, { backgroundColor: themeColors.error }]} />
                        </TouchableOpacity>
                    </View>
                </ThemedView>
                <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false} bounces={true} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} tintColor={themeColors.primary} /> }>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10}}>
                        {packageName && PACKAGE_STATS[packageName]?.map((id) => (
                            <StatCard
                                key={id}
                                id={id}
                                value={getDynamicValueFromDashboard(id)}
                                themeColors={themeColors}
                                navigation={navigation}
                            />
                        ))}
                    </View>
                    <View style={{ marginTop: 10}}>
                        {dashboardData.productsInCategory && dashboardData.productsInCategory.length > 1 ? (
                            <ProductsByCategoryChart productsInCategoryData={dashboardData.productsInCategory} />
                        ) : null}
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <ProfitOverview profitData={dashboardData.profit}  />
                    </View>
                    {/* <ThemedView style={{...styles.servicesContainer, width: '100%', maxHeight: 300, marginTop: 30}}>
                        <ThemedText style={styles.sectionTitle}>Activities Recorded Today</ThemedText>
                        <View style={[styles.tableHeader, { borderBottomColor: themeColors.border, paddingVertical: Spacing.small, paddingHorizontal: 10 }]}>
                            <Text style={[styles.th, { flex: 2, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Action</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Date</Text>
                            {Platform.OS ==="ios" && <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>By</Text>}
                        </View>
                        <View>
                            <ScrollView showsVerticalScrollIndicator={true}>
                                {recentActivity.length > 0 ? recentActivity.map((item, index) => (
                                    <View key={index} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: themeColors.border, borderLeftWidth: 3, borderLeftColor: themeColors.primary }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ flex: 2, textTransform: 'capitalize', color: themeColors.text, fontSize: 10.5 }}>{item.title}</Text>
                                            <Text style={{ flex: 1, textTransform: 'capitalize', color: themeColors.text, fontSize: 10.5 }}>{item.date}</Text>
                                            {Platform.OS ==="ios" && <Text style={{ flex: 1, textTransform: 'capitalize', color: themeColors.text, fontSize: 10.5 }}>{item.user}</Text>}
                                        </View>
                                    </View>
                                )) : (
                                    <View style={{justifyContent: 'center', alignItems: 'center', paddingVertical: 50}}>
                                        <ThemedText style={{ fontSize: 12, color: themeColors.subtleText }}>
                                            0 activity found
                                        </ThemedText>
                                    </View>
                                )}
                                <View style={{height: 100}} />
                            </ScrollView>
                        </View>
                    </ThemedView> */}

                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 30}}>
                        <CloudStorageOverview storageData={dashboardData.storage ?? { images: 0, documents: 0 }}  />
                        <PaymentOverview paymentData={dashboardData.paymentTypePercentage ?? { momo: 0, cash: 0 }}  />
                    </View>

                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusBarSpacer: {
        width: '100%',
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.screenPadding,
        paddingTop: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        zIndex: 10,
    },
    headerLeft: {
        flex: 1,
    },
    welcomeText: {
        fontSize: Typography.body,
        marginBottom: 4,
        fontFamily: 'Info'
    },
    userName: {
        fontSize: Typography.heading1,
        fontFamily: 'SemiBold'
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.medium,
        position: 'relative',
    },
    notificationBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        position: 'absolute',
        top: 12,
        right: 12,
    },
    servicesContainer: {
        width: '49%',
        maxHeight: 200,
        marginTop: 0,
        marginBottom: Spacing.sectionGap,
        overflow: 'hidden'
    },
    sectionTitle: {
        fontSize: Typography.heading4,
        fontFamily: "SemiBold",
    },
    businessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        overflow: 'hidden'
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 4,
        borderBottomWidth: 1
    },
    tableRowContainer: {
        borderBottomWidth: 1,
        borderRadius: 2,
        marginBottom: 0,
        overflow: 'hidden',
        paddingHorizontal: 5
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 0.5
    },
    th: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold',
    },
    td: {
        fontSize: Typography.small,
        fontFamily: 'Regular',
    },
})

export default HomeScreen;

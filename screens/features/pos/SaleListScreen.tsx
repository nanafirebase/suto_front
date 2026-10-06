import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { POSNavigationList } from '../../../utils/types/index.type';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { fullDate, fullDateTime, generateId, SocketIO } from '../../../configuration/helpers/main.helpers';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { API_URL } from '../../../configuration/credentials';
import { formatCurrency } from '../../../utils/constants/Currency';
import { getData } from '../../../configuration/helpers/auth.helpers';
import { useFocusEffect } from '@react-navigation/native';
import NoDatePicker from '../../../components/ui/NoDatePicker';

const computeSalePayment = (sale: any) => {
    const transactions = sale.transactions || [];
    const successfulPayments = transactions.filter((t: any) => t.status === "success");
    const paid = successfulPayments.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const total = Number(sale.totalAmount || 0) + Number(sale.taxAmount || 0);
    const due = total - paid;

    return {
        total, paid, due, isFullyPaid: due <= 0, isPartial: paid > 0 && due > 0, isDraft: paid === 0
    }
}


type TSaleListScreen = NativeStackScreenProps<POSNavigationList, "SaleListScreen">
const SaleListScreen = ({navigation, route}: TSaleListScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, businessCurrency, userBranch } = useAppContainer()

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [sales, setSales] = useState<any[]>([])
    const [summary, setSummary] = useState({
        totalSales: 0,
        totalCollected: 0,
        totalDue: 0
    })

    const [fromDate, setFromDate] = useState<Date | null>(firstDay || null)
    const [toDate, setToDate] = useState<Date | null>(lastDay || null)

    const fetchSales = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-sales' , {sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id, dateFrom: fromDate, dateTo: toDate}, (response: any) => {
            if (response.status === "success") {
                const { sales, summary } = response.data
                setSales(sales || [])
                setSummary(summary || {
                    totalSales: 0,
                    totalCollected: 0,
                    totalDue: 0
                })
                // console.log({sales, summary})
            } else {
                Alert.alert("Error", "Error fetching sales", response.message)
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchSales();
        }, [fromDate, toDate])
    );

    const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});

    const groupByDate = (salesList: any[]) => {
        return salesList.reduce((acc: any, item: any) => {
            const date = new Date(item.createdAt).toISOString().split('T')[0]
            if (!acc[date]) acc[date] = []
            acc[date].push(item)
            return acc
        }, {})
    }

    const toggleSale = (id: string) => {
        setExpandedSales(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const grouped = useMemo(() => groupByDate(sales), [sales])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} /> )}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.popToTop()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Sales History</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <View style={{...styles.summaryContainer, paddingTop: 15}}>
                        <View style={[styles.card]}>
                            <Text style={{...styles.cardLabel, color: themeColors.text}}>Select From Date</Text>
                            <NoDatePicker value={fromDate} onChange={setFromDate} placeholder="Select from date" themeColors={themeColors} defaultToToday={true} />
                        </View>

                        <View style={[styles.card]}>
                            <Text style={{...styles.cardLabel, color: themeColors.text}}>Select To Date</Text>
                            <NoDatePicker value={toDate} onChange={setToDate} placeholder="Select to date" themeColors={themeColors} defaultToToday={false} />
                        </View>

                        <View style={[styles.card]}>
                            <Text style={{...styles.cardLabel, textAlign: 'right', color: themeColors.text}}>Total Sales</Text>
                            <Text style={[styles.cardValue, { color: themeColors.text, fontFamily: 'SemiBold', fontSize: 11, textAlign: 'right' }]}>
                                {summary.totalSales || 0}
                            </Text>
                        </View>
                    </View>
                    <View style={{...styles.summaryContainer, paddingBottom: 15}}>
                        <View style={{...styles.card, width: "49%"}}>
                            <Text style={{...styles.cardLabel, color: themeColors.text}}>Outstanding Balance</Text>
                            <Text style={[styles.cardValue, { color: 'tomato', fontFamily: 'SemiBold', fontSize: 16 }]}>
                                {formatCurrency(Number(summary.totalDue > 0 ? summary.totalDue : 0 || 0), {symbol: businessCurrency?.symbol})}
                            </Text>
                        </View>
                        <View style={{...styles.card, width: "49%", alignItems: 'flex-end'}}>
                            <Text style={{...styles.cardLabel, color: themeColors.text}}>Total Payment</Text>
                            <Text style={[styles.cardValue, { color: themeColors.success, fontFamily: 'SemiBold', fontSize: 16 }]}>
                                {formatCurrency(Number(summary.totalCollected || 0), {symbol: businessCurrency?.symbol})}
                            </Text>
                        </View>
                    </View>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.medium,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>
                        {Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((date) => {
                            const items = grouped[date]

                            return (
                                <View key={date} style={{marginBottom: 20 }}>
                                    <Text style={{ fontFamily: 'SemiBold', color: themeColors.text, marginLeft: 5 }}>{new Date(date).toDateString()}</Text>
                                    <Text style={{ fontSize: 11, opacity: 0.6, fontFamily: 'Regular', color: themeColors.text, marginLeft: 5  }}>
                                        {items.length} Sale(s) recorded
                                    </Text>
                                    <View style={{ backgroundColor: themeColors.card, borderRadius: Borders.radiusSmall, overflow: 'hidden', marginTop: 10 }}>
                                        {items.map((sale: any, index: number) => {
                                            const isOpen = expandedSales[sale.id]
                                            const payment = computeSalePayment(sale)
                                            return (
                                                <View key={index}>
                                                    <TouchableOpacity onPress={() => toggleSale(sale.id)} activeOpacity={0.8} style={[ styles.paymentRow, {
                                                        borderTopWidth: index === 0 ? 0 : 0.5, borderColor: themeColors.border },
                                                    ]}>
                                                        <View style={{ flex: 1, justifyContent: 'center' }}>
                                                            <Text style={{ ...styles.refText, color: payment.isFullyPaid ? themeColors.success : payment.isPartial ? themeColors.warning : 'tomato' }}>
                                                                Sale #{sale.id.toString().slice(-6)}
                                                            </Text>
                                                            <Text style={{ fontSize: 10, opacity: 0.8, color: themeColors.subtleText, fontFamily: 'Regular', paddingTop: 4 }}>
                                                                {new Date(sale.saleDate).toLocaleTimeString()}
                                                            </Text>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end', alignSelf: 'center' }}>
                                                            <Text style={{ ...styles.amount, color: themeColors.text }}>
                                                                {formatCurrency(Number(payment.total || 0), { symbol: businessCurrency?.symbol})}
                                                            </Text>
                                                            <Text style={{ fontSize: 11, opacity: 0.9, fontFamily: 'Regular', color: payment.isFullyPaid ? themeColors.success : payment.isPartial ? themeColors.warning : themeColors.primary }}>
                                                                {payment.isFullyPaid ? "PAID" : payment.isPartial ? "PARTIAL" : "DRAFT"}
                                                            </Text>
                                                        </View>
                                                        <Text style={{ marginLeft: 20, alignSelf: 'center', color: themeColors.text }}>
                                                            {isOpen ? "▲" : "▼"}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    {isOpen && (
                                                        <View style={styles.paymentRow}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{...styles.refText, color: themeColors.text, fontFamily: 'SemiBold',}}>Customer: {sale.customerName || "Walk-inu"}</Text>
                                                                <Text style={{...styles.metaText, color: themeColors.info, fontFamily: 'Regular', paddingVertical: 5}}>Cashier: {sale.cashierName}</Text>
                                                                <Text style={{...styles.metaText, color: themeColors.warning, fontFamily: 'Regular',}}>Transactions: {sale?.transactions.length || 0}</Text>
                                                            </View>
                                                            <View style={{ alignItems: 'flex-end' }}>
                                                                <Text style={{...styles.amount, color: themeColors.success, paddingVertical: 4}}>
                                                                    Paid: {formatCurrency(Number(payment.paid || 0), { symbol: businessCurrency?.symbol })}
                                                                </Text>
                                                                <Text style={{ fontSize: 12, opacity: 0.6, color: 'tomato', fontFamily: 'SemiBold' }}>
                                                                    Debt: {formatCurrency(Number(payment.due > 0 ? payment.due : 0 || 0), { symbol: businessCurrency?.symbol })}
                                                                </Text>
                                                                {payment.due > 0 && (
                                                                    <TouchableOpacity onPress={() => navigation.navigate("PaymentScreen", { data: {
                                                                        sale_id: sale.id,
                                                                        totalTax: sale.taxAmount || 0,
                                                                        subtotal: sale.totalAmount,
                                                                        totalPaid: payment.paid,
                                                                        customer: {
                                                                            name: sale.customerName || "Walk-In",
                                                                            id: sale.customerID || null}
                                                                        }
                                                                        })} style={{ marginTop: 8 }}>
                                                                        <Text style={{ color: '#007AFF' }}>
                                                                            Record Payment
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                )}
                                                            </View>
                                                        </View>
                                                    )}
                                                    <TouchableOpacity onPress={()=> navigation.navigate('SaleDetailScreen', {data: sale})} style={{width: '100%', paddingVertical: 10, backgroundColor: themeColors.tomato}}>
                                                        <Text style={{textAlign: 'center', color: themeColors.white, fontFamily: 'SemiBold', fontSize: 12}}>View Full Detail</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )
                                        })}
                                    </View>
                                </View>
                            )
                        })}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
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
        paddingTop: 0
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold'
    },
    backButtonMain: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 0
    },
    sectionTitle: {
        fontSize: Typography.body,
        fontFamily: 'Medium',
        marginBottom: 3,
    },
    input: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.large,
        fontSize: Typography.small,
        marginBottom: Spacing.medium,
        fontFamily: 'Regular'
    },
    footer: {
        padding: Spacing.screenPadding,
        borderTopWidth: 1,
    },
    button: {
        paddingVertical: Spacing.large,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: Typography.body,
        fontFamily: 'SemiBold'
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        marginTop: 20
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
    hiddenRow: {
        paddingVertical: 20,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    hiddenText: {
        fontSize: Typography.small,
        opacity: 0.7,
        marginBottom: 4,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '49%',
        height: 40,
        justifyContent: 'center',
        borderRadius: 5
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'black',
        zIndex: 999,
    },
    closeScanner: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 18
    },
    card: {
        flex: 1,
        width: '30%',
        height: 60,
        borderRadius: 10,
        alignItems: 'stretch'
    },
    cardLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    cardValue: {
        fontSize: 16,
        fontFamily: 'SemiBold',
        marginTop: 5,
    },
    dateGroup: {
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderTopWidth: 0.5,
        borderColor: '#ddd',
    },
    refText: {
        fontSize: 13,
        fontFamily: 'SemiBold',
    },
    metaText: {
        fontSize: 13,
        opacity: 0.9,
        fontFamily: 'SemiBold'
    },
    status: {
        fontSize: 11,
        marginTop: 4,
    },
    amount: {
        fontSize: 12,
        fontFamily: 'SemiBold',
    },
    viewBtn: {
        marginTop: 6,
        fontSize: 12,
        color: '#007AFF',
    }
})

export default SaleListScreen;

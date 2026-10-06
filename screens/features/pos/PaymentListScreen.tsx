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
import { fullDate, generateId, SocketIO } from '../../../configuration/helpers/main.helpers';
import { formatCurrency } from '../../../utils/constants/Currency';
import { useFocusEffect } from '@react-navigation/native';
import NoDatePicker from '../../../components/ui/NoDatePicker';

type TransactionsState = {
    totalTransactions: number
    transactions: any[]
}

type TPaymentListScreen = NativeStackScreenProps<POSNavigationList, "PaymentListScreen">
const PaymentListScreen = ({navigation, route}: TPaymentListScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, businessCurrency, userData, userBranch } = useAppContainer();

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
    const [transactionsState, setTransactionsState] = useState<TransactionsState>({
        totalTransactions: 0,
        transactions: []
    })

    const [fromDate, setFromDate] = useState<Date | null>(firstDay || null)
    const [toDate, setToDate] = useState<Date | null>(lastDay || null)

    const fetchTransactions = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-transactions' , {sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id, dateFrom: fromDate, dateTo: toDate}, (response: any) => {
            if (response.status === "success") {
                const transactions = response.data
                setTransactionsState({
                    totalTransactions: transactions.length,
                    transactions: transactions || []
                })
            } else {
                Alert.alert("Error", "Error fetching sales", response.message)
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [fromDate, toDate])
    );

    const groupByDate = (data: any[]) => {
        return data.reduce((acc: Record<string, any[]>, item) => {
            if (!item?.createdAt) return acc
            const dateKey = new Date(item.createdAt).toISOString().split('T')[0]
            if (!acc[dateKey]) acc[dateKey] = []
            acc[dateKey].push(item)
            return acc
        }, {})
    }

    const grouped = useMemo(() => {
        return groupByDate(transactionsState.transactions)
    }, [transactionsState.transactions])

    const totalAmount = useMemo(() => {
        return transactionsState.transactions.reduce((sum: number, t: any) => {
            const amount = Number(t?.amount || 0)
            return sum + Number(amount.toFixed(2))
        }, 0)
    }, [transactionsState.transactions])

    const toggleCollapse = (date: string) => { setCollapsed(prev => ({ ...prev, [date]: !prev[date] })) }

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        const state: Record<string, boolean> = {}
        Object.keys(grouped).forEach((date) => {
            state[date] = date !== today
        })
        setCollapsed(state)
    }, [grouped])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (<View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />)}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>All Payments</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <View style={{...styles.summaryContainer, paddingTop: 15}}>
                        <View style={[styles.card]}>
                            <Text style={{...styles.cardLabel, color: themeColors.text}}>Select Date</Text>
                            <NoDatePicker value={fromDate} onChange={setFromDate} placeholder="Select from date" themeColors={themeColors} defaultToToday={true} />
                        </View>

                        <View style={[styles.card]}>
                            <Text style={{...styles.cardLabel, color: themeColors.text}}>Select Date</Text>
                            <NoDatePicker value={toDate} onChange={setToDate} placeholder="Select to date" themeColors={themeColors} defaultToToday={false} />
                        </View>

                        <View style={[styles.card]}>
                            <Text style={{...styles.cardLabel, textAlign: 'right', color: themeColors.text}}>Total Payments</Text>
                            <Text style={[styles.cardValue, { color: themeColors.text, fontFamily: 'SemiBold', fontSize: 11, textAlign: 'right' }]}>
                                {transactionsState.totalTransactions}
                            </Text>
                        </View>
                    </View>
                    <View style={{...styles.summaryContainer, paddingBottom: 15}}>
                        <View style={{...styles.card, width: "49%"}} />
                        <View style={{...styles.card, width: "49%", alignItems: 'flex-end'}}>
                            <Text style={{...styles.cardLabel, color: themeColors.text}}>Total Payment</Text>
                            <Text style={[styles.cardValue, { color: themeColors.info, fontFamily: 'SemiBold', fontSize: 16 }]}>
                                {formatCurrency(Number(totalAmount || 0), {symbol: businessCurrency.symbol})}
                            </Text>
                        </View>
                    </View>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.medium, paddingBottom:insets.bottom+100,paddingTop:10 }} showsVerticalScrollIndicator={false} bounces={false}>
                        {Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((date) => {
                            const items = grouped[date];
                            const isCollapsed = collapsed[date];
                            const dayTotal = items.reduce((acc, i) => {
                                acc.amount += Number(i.amount) || 0
                                return acc
                            }, { amount: 0 })

                            return (
                                <View key={date} style={styles.dateGroup}>
                                    <TouchableOpacity onPress={() => toggleCollapse(date)} style={[ styles.dateHeader, { backgroundColor: themeColors.subtleBackground }]}>
                                        <View>
                                            <Text style={{ fontFamily: 'SemiBold', color: themeColors.info }}>{new Date(date).toDateString()}</Text>
                                            <Text style={{ fontSize: 11, opacity: 0.6, fontFamily: 'Regular', color: themeColors.text, marginTop: 5  }}>
                                                {items.length} transaction(s) • Total Amount: {formatCurrency(dayTotal.amount, {symbol: businessCurrency.symbol})}
                                            </Text>
                                        </View>
                                        <Text style={{color: themeColors.text, fontFamily: 'Regular' }}>{isCollapsed ? '▼' : '▲'}</Text>
                                    </TouchableOpacity>
                                    {!isCollapsed && (
                                        <View>
                                            {items.map((item: any) => (
                                                <View key={item.id} style={styles.paymentRow}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{...styles.refText, color: themeColors.text, fontFamily: 'SemiBold', fontSize: 11}}>{item.reference}</Text>
                                                        <Text style={{...styles.metaText, color: themeColors.text, fontFamily: 'Regular'}}>Sale: #{item.saleID}</Text>
                                                        <Text style={[styles.status, { color: item.status === 'success' ? themeColors.success : item.status === 'cancelled' ? themeColors.error : themeColors.primary, fontFamily: 'SemiBold',}]}>
                                                            {item.status.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{...styles.refText, color: themeColors.text, fontFamily: 'SemiBold'}}>Handled by</Text>
                                                        <Text style={{...styles.metaText, color: themeColors.text, fontFamily: 'Regular'}}>{item.staffName}</Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={{...styles.amount, color: themeColors.text}}>
                                                            {formatCurrency(Number(item.amount), {symbol: businessCurrency.symbol})}
                                                        </Text>
                                                        <TouchableOpacity onPress={()=> navigation.navigate('PaymentDetailScreen', {data: item})}>
                                                            <Text style={{...styles.viewBtn, color: themeColors.primary}}>View Details</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </KeyboardAvoidingView>
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
        ...StyleSheet.absoluteFillObject,
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
        borderRadius: Borders.radiusSmall,
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
        fontFamily: 'Medium',
    },
    metaText: {
        fontSize: 11,
        opacity: 0.6,
    },
    status: {
        fontSize: 11,
        marginTop: 4,
    },
    amount: {
        fontSize: 14,
        fontFamily: 'SemiBold',
    },
    viewBtn: {
        marginTop: 6,
        fontSize: 11,
    },
})

export default PaymentListScreen;

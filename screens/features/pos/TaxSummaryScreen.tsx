import React, { useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { POSNavigationList } from '../../../utils/types/index.type';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fullDate, fullDateTime, fullDateTimeWord, fullDateWord, SocketIO } from '../../../configuration/helpers/main.helpers';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { formatCurrency } from '../../../utils/constants/Currency';
import { ThemedView } from '../../../components/ui/ThemedView';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { ThemedText } from '../../../components/ui/ThemedText';
import NoDatePicker from '../../../components/ui/NoDatePicker';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';

type TaxSummary = {
    grossSales: number
    taxableSales: number
    exemptSales: number
    totalTax: number
    refundedTax: number
    netTax: number
    invoices: number
}

type TTaxSummaryScreen = NativeStackScreenProps<POSNavigationList, "TaxSummaryScreen">
const TaxSummaryScreen = ({navigation, route}: TTaxSummaryScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const { session, selectedBusiness, businessCurrency, userBranch } = useAppContainer();

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const [fromDate, setFromDate] = useState<Date | null>(firstDay);
    const [toDate, setToDate] = useState<Date | null>(lastDay);
    const [sales, setSales] = useState<any[]>([]);
    const [expandedTaxes, setExpandedTaxes] = useState<Record<string, boolean>>({})
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchSales = () => {
        if (!selectedBusiness?.id || !userBranch.id) return;
        SocketIO.emit('fetch-sales', { sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id, dateFrom: fromDate, dateTo: toDate }, (response: any) => {
            if (response.status !== 'success') {
                Alert.alert('Error', response.message || 'Unable to fetch sales.')
                return;
            }
            setSales(response.data?.sales || []);
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchSales();
        }, [fromDate, toDate])
    )

    const toggleTax = (taxName: string) => {
        setExpandedTaxes((prev) => ({
            ...prev,
            [taxName]: !prev[taxName],
        }));
    };

    const taxData = useMemo(() => {
        const taxes: Record<string, { taxName: string; rate: number; taxableSales: number; taxCollected: number; invoiceCount: number; invoices: any[] }> = {}

        let totalSales = 0
        let grossSales = 0
        let taxableSales = 0
        let exemptSales = 0
        let totalTax = 0
        let refundedTax = 0

        for (const sale of sales) {
            grossSales += Number(sale.totalAmount || sale.taxSnapshot?.summary?.subtotal || 0);
            
            let snapshot:any = {}

            try {
                snapshot = typeof sale.taxSnapshot === "string" ? JSON.parse(sale.taxSnapshot) : sale.taxSnapshot || {}
            } catch {
                snapshot = {}
            }

            const items = snapshot.items || []
            const summary = snapshot.summary || {}
            totalSales += Number(summary.grandTotal || (Number(summary.subtotal || 0) + Number(summary.totalTax || 0)));

            let saleHasTax = false;
            for (const item of items) {
                taxableSales += Number(item.baseAmount || 0)
                if (!item.breakdown?.length) {
                    continue
                }
                saleHasTax = true
                for (const tax of item.breakdown) {
                    const key = tax.name
                    if (!taxes[key]) {
                        taxes[key] = { taxName: key, rate: Number(tax.percentage || 0), taxableSales: 0, taxCollected: 0, invoiceCount: 0, invoices: [] }
                    }
                    taxes[key].taxableSales += Number(item.baseAmount || 0)
                    taxes[key].taxCollected += Number(tax.amount || 0)
                    taxes[key].invoices.push({ sale, item, tax })
                    taxes[key].invoiceCount++
                    totalTax += Number(tax.amount || 0)
                }
            }

            if (!saleHasTax) {
                exemptSales += Number( sale.totalAmount || sale.taxSnapshot?.summary?.subtotal || 0);
            }
            if (sale.status === 'refund') {
                refundedTax += Number(sale.taxSnapshot?.summary?.totalTax || 0)
            }
        }

        const taxList = Object.values(taxes);

        taxList.forEach((tax: any) => {
            tax.averageTax = tax.invoiceCount > 0 ? tax.taxCollected / tax.invoiceCount : 0;
            tax.percentageOfTotal = totalTax > 0 ? (tax.taxCollected / totalTax) * 100 : 0;
        })

        taxList.sort((a: any, b: any) => {
            if (b.taxCollected !== a.taxCollected) {
                return b.taxCollected - a.taxCollected
            }
            return a.taxName.localeCompare(b.taxName)
        })

        return {
            summary: {
                totalSales,
                grossSales,
                taxableSales,
                exemptSales,
                totalTax,
                refundedTax,
                netTax: totalTax - refundedTax,
                invoices: sales.length,
                filingStatus: totalTax > 0 ? "Ready to File" : "No Taxable Sales"
            },
            taxes: taxList,
        };
    }, [sales])

    return (
        <View style={[styles.container, {backgroundColor: themeColors.background}]}>
            {Platform.OS === 'android' && (<View style={[styles.statusBarSpacer, {backgroundColor: themeColors.background}]} /> )}
            <View style={[styles.safeArea, {backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === 'ios' ? 85 : 0}]}>
                <ThemedView style={[styles.header, {backgroundColor: themeColors.background, borderBottomColor: themeColors.border}]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, {backgroundColor: themeColors.subtleBackground}]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>
                        Tax Centre
                    </ThemedText>
                    <TouchableOpacity style={{width:40,alignItems:'flex-end'}}>
                        <Text style={{fontSize:12,color:themeColors.primary,fontFamily:'SemiBold'}}>
                            Export
                        </Text>
                    </TouchableOpacity>
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{padding:Spacing.medium,paddingBottom:insets.bottom+100}}>
                        <View style={{flexDirection:'row',justifyContent:'space-between', marginBottom:15, paddingHorizontal: Spacing.small}}>
                            <View style={{width:'35%'}}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    From Date
                                </Text>
                                <NoDatePicker value={fromDate} onChange={setFromDate} placeholder="Select from date" themeColors={themeColors} defaultToToday={true} />
                            </View>
                            <View style={{width:'35%'}}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    To Date
                                </Text>
                                <NoDatePicker value={toDate} onChange={setToDate} placeholder="Select to date" themeColors={themeColors} defaultToToday={false} />
                            </View>
                            <View style={{width:'25%'}}>
                                <Text style={[styles.cardLabel,{color:themeColors.text, textAlign: 'right', marginBottom: 5}]}>
                                    No. Invoices
                                </Text>
                                <Text style={{textAlign: 'right', fontFamily: 'SemiBold', fontSize: 11}}>{taxData.summary.invoices}</Text>
                            </View>
                        </View>
                        <View style={{ backgroundColor:themeColors.card, borderRadius:Borders.radiusSmall, padding:15, marginBottom:20}}>
                            <Text style={{ fontSize:15, fontFamily:'SemiBold', color:themeColors.text, marginBottom:12}}>
                                Compliance Status
                            </Text>
                            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                                <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                    Status
                                </Text>
                                <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.success}}>
                                    {taxData.summary.filingStatus}
                                </Text>
                            </View>
                            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                                <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                    Filing Period
                                </Text>
                                <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.text}}>
                                    {fullDateWord(fromDate?.toISOString())} - {fullDateWord(toDate?.toISOString())}
                                </Text>
                            </View>
                            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                                <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                    Last Updated
                                </Text>
                                <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.text}}>
                                    {fullDateTime(lastUpdated?.toISOString())}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.summaryContainer}>
                            <View style={styles.card}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    Total Sales
                                </Text>
                                <Text style={[styles.cardValue,{color:themeColors.text}]}>
                                    {formatCurrency(taxData.summary.totalSales, {symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    Gross Sales
                                </Text>
                                <Text style={[styles.cardValue,{color:themeColors.text}]}>
                                    {formatCurrency(taxData.summary.grossSales,{symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    Taxable Sales
                                </Text>
                                <Text style={[styles.cardValue,{color:themeColors.text}]}>
                                    {formatCurrency(taxData.summary.taxableSales,{symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.summaryContainer, {paddingTop:15}]}>
                            <View style={{...styles.card,width:'32%'}}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    Exempt Sales
                                </Text>
                                <Text style={[styles.cardValue,{color:themeColors.error,fontSize:14}]}>
                                    {formatCurrency(taxData.summary.exemptSales,{symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                            <View style={{...styles.card, width:'32%'}}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    Total Tax
                                </Text>
                                <Text style={[styles.cardValue,{color:themeColors.warning,fontSize:14}]}>
                                    {formatCurrency(taxData.summary.totalTax,{symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                            <View style={{...styles.card,width:'32%'}}>
                                <Text style={[styles.cardLabel,{color:themeColors.text}]}>
                                    Net Tax
                                </Text>
                                <Text style={[styles.cardValue,{color:themeColors.success,fontSize:14}]}>
                                    {formatCurrency(taxData.summary.netTax,{symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                        </View>
                        <View style={{marginTop:25, marginBottom:10, paddingHorizontal: Spacing.small}}>
                            <Text style={{fontSize:15,fontFamily:'SemiBold',color:themeColors.text}}>
                                GRA Tax Summary
                            </Text>
                            <Text style={{fontSize:11,color:themeColors.subtleText,fontFamily:'Regular',marginTop:3}}>
                                Tax collected from sales transactions
                            </Text>
                        </View>
                        <View style={{backgroundColor:themeColors.card,borderRadius:Borders.radiusSmall,padding:12}}>
                            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:10}}>
                                <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                    Total Tax Collected
                                </Text>
                                <Text style={{fontSize:13,fontFamily:'SemiBold',color:themeColors.text}}>
                                    {formatCurrency(taxData.summary.totalTax,{symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                                <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                    Refunds / Adjustments
                                </Text>
                                <Text style={{fontSize:13,fontFamily:'SemiBold',color:'tomato'}}>
                                    {formatCurrency(taxData.summary.refundedTax,{symbol:businessCurrency.symbol})}
                                </Text>
                            </View>
                        </View>
                        <View style={{marginTop:25, paddingHorizontal: Spacing.small}}>
                            <Text style={{fontSize:15,fontFamily:'SemiBold',color:themeColors.text}}>
                                Tax Breakdown
                            </Text>
                            <Text style={{fontSize:11,color:themeColors.subtleText,marginTop:3}}>
                                VAT, NHIL, GETFund and other statutory taxes
                            </Text>
                        </View>
                        <View style={{marginTop:10,backgroundColor:themeColors.card,borderRadius:Borders.radiusSmall,overflow:'hidden'}}>
                            {taxData.taxes.map((tax:any,index:number) => {
                                const isOpen = expandedTaxes[tax.taxName]
                                return (
                                    <View key={tax.taxName}>
                                        <TouchableOpacity activeOpacity={0.8} onPress={() => toggleTax(tax.taxName)} style={[ styles.paymentRow, { borderTopWidth:index === 0 ? 0 : 0.5, borderColor:themeColors.border } ]} >
                                            <View style={{flex:1}}>
                                                <Text style={{fontSize:13,fontFamily:'SemiBold',color:themeColors.text}}>
                                                    {tax.taxName}
                                                </Text>
                                                <Text style={{fontSize:10,color:themeColors.subtleText,marginTop:3}}>
                                                    Rate: {tax.rate}%
                                                </Text>
                                            </View>
                                            <View style={{alignItems:'flex-end'}}>
                                                <Text style={{fontSize:13,fontFamily:'SemiBold',color:themeColors.text}}>
                                                    {formatCurrency(tax.taxCollected,{symbol:businessCurrency.symbol})}
                                                </Text>
                                                <Text style={{fontSize:10,color:themeColors.success}}>
                                                    {tax.invoices.length} Invoice(s)
                                                </Text>
                                            </View>
                                            <Text style={{marginLeft:15,color:themeColors.text}}>
                                                {isOpen ? "▲" : "▼"}
                                            </Text>
                                        </TouchableOpacity>
                                        {isOpen && (
                                            <View style={{padding:12,borderTopWidth:.5,borderColor:themeColors.border}}>
                                                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                                                    <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                                        Taxable Sales
                                                    </Text>
                                                    <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.text}}>
                                                        {formatCurrency(tax.taxableSales,{symbol:businessCurrency.symbol})}
                                                    </Text>
                                                </View>
                                                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                                                    <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                                        Tax Collected
                                                    </Text>
                                                    <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.success}}>
                                                        {formatCurrency(tax.taxCollected,{symbol:businessCurrency.symbol})}
                                                    </Text>
                                                </View>
                                                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                                                    <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                                        Average Tax / Invoice
                                                    </Text>

                                                    <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.text}}>
                                                        {formatCurrency(tax.averageTax,{symbol:businessCurrency.symbol})}
                                                    </Text>
                                                </View>

                                                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                                                    <Text style={{fontSize:12,color:themeColors.subtleText}}>
                                                        Share of Total Tax
                                                    </Text>

                                                    <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.primary}}>
                                                        {tax.percentageOfTotal.toFixed(1)}%
                                                    </Text>
                                                </View>
                                                <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.text,marginBottom:5, marginTop: 12}}>
                                                    Transactions
                                                </Text>
                                                {/* tax.invoices.slice(0,10) */}
                                                {tax.invoices.sort((a: any, b: any) => new Date(b.sale.saleDate).getTime() - new Date(a.sale.saleDate).getTime()).slice(0, 10).map((row:any,i:number) => {
                                                    const sale = row.sale
                                                    return (
                                                        <TouchableOpacity key={i} activeOpacity={0.8} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:.5, borderColor:themeColors.border }} >
                                                            <View style={{flex:1}}>
                                                                <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.text}}>
                                                                    Sale #{sale.id.toString().slice(-6)}
                                                                </Text>
                                                                <Text style={{fontSize:10,color:themeColors.subtleText,marginTop:2}}>
                                                                    {sale.customerName || "Walk-in Customer"}
                                                                </Text>
                                                                <Text style={{fontSize:10,color:themeColors.subtleText}}>
                                                                    {new Date(sale.saleDate).toLocaleDateString()}
                                                                </Text>
                                                            </View>
                                                            <View style={{alignItems:'flex-end'}}>
                                                                <Text style={{fontSize:12,fontFamily:'SemiBold',color:themeColors.text}}>
                                                                    {formatCurrency(Number(row.tax.amount || 0),{symbol:businessCurrency.symbol})}
                                                                </Text>
                                                                <Text style={{fontSize:10,color:themeColors.subtleText}}>
                                                                    {row.tax.name}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                                {tax.invoices.length > 10 && (
                                                <TouchableOpacity style={{marginTop:10}}>
                                                    <Text style={{fontSize:12,color:themeColors.primary,fontFamily:'SemiBold'}}>
                                                        View all {tax.invoices.length} transactions
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                                )
                            })}
                        </View>
                        {taxData.taxes.length === 0 && (
                            <View style={{padding:30,alignItems:'center'}}>
                                <Text style={{fontSize:13,color:themeColors.subtleText}}>
                                    No taxable sales found
                                </Text>
                            </View>
                        )}
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
        paddingHorizontal: Spacing.small
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

export default TaxSummaryScreen;

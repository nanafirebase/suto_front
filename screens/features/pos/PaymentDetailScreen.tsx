import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { POSNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { ThemedView } from '../../../components/ui/ThemedView'
import { ThemedText } from '../../../components/ui/ThemedText'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { formatCurrency } from '../../../utils/constants/Currency'

type TPaymentDetailScreen = NativeStackScreenProps<POSNavigationList, "PaymentDetailScreen">

interface iPaymentTransactionTable {
    id?:number
    businessID?:number
    branchID?:number
    saleID?:number
    cashierID?:number
    transactionType?:'subscription'|'pos'
    reference?:string
    type?:'cash'|'momo'
    confirmedManually?:'yes'|'no'
    network?:string
    accountNumber?:string
    status?:'success'|'pending'|'failed'
    amount?:number
    amountDebited?:number
    stan?:string
    rrn?:string
    externalID?:string
    internalID?:string
    terminalName?:string
    terminalLocation?:string
    merchantName?:string
    merchantTradingName?:string
    sessionID?:string|number|null
    createdAt?:string
    updatedAt?:string
    staffName?:string
}

const PaymentDetailScreen = ({navigation, route}:TPaymentDetailScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {businessCurrency} = useAppContainer()

    const payment = route.params?.data as iPaymentTransactionTable

    const formatDate = (value?:string) => {
        if (!value) return '-'

        const date = new Date(value)

        if (isNaN(date.getTime())) return value

        return date.toLocaleString('en-GB', {
            day:'2-digit',
            month:'short',
            year:'numeric',
            hour:'2-digit',
            minute:'2-digit'
        })
    }

    const statusColor = payment.status === 'success'
        ? themeColors.success
        : payment.status === 'failed'
            ? themeColors.error
            : themeColors.warning

    const DetailRow = ({label, value}: {label:string, value:any}) => {
        if (value === undefined || value === null || value === '') return null

        return (
            <View style={[styles.detailRow, {borderBottomColor:themeColors.border}]}>
                <Text style={[styles.detailLabel, {color:themeColors.subtleText}]}>
                    {label}
                </Text>

                <Text style={[styles.detailValue, {color:themeColors.text}]}>
                    {String(value)}
                </Text>
            </View>
        )
    }

    return (
        <View style={[styles.container, {backgroundColor:themeColors.background}]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, {backgroundColor:themeColors.background}]} />
            )}

            <View style={[styles.safeArea, {paddingTop:Platform.OS === 'ios' ? insets.top : 0}]}>
                <ThemedView style={[styles.header, {backgroundColor:themeColors.background, borderBottomColor:themeColors.border}]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, {backgroundColor:themeColors.subtleBackground}]}
                    >
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Payment Details
                    </ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding:8,
                        paddingBottom:insets.bottom + 40
                    }}
                >
                    <View style={[styles.amountCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                        <Text style={[styles.amountLabel, {color:themeColors.subtleText}]}>
                            Payment Amount
                        </Text>

                        <Text style={[styles.amount, {color:themeColors.text}]}>
                            {formatCurrency(Number(payment.amount || 0), {
                                symbol:businessCurrency.symbol
                            })}
                        </Text>

                        <View style={[styles.statusBadge, {backgroundColor:`${statusColor}18`}]}>
                            <View style={[styles.statusDot, {backgroundColor:statusColor}]} />

                            <Text style={[styles.statusText, {color:statusColor}]}>
                                {String(payment.status || 'pending').toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.section, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                        <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                            Payment Information
                        </Text>

                        <DetailRow label="Reference" value={payment.reference} />
                        <DetailRow label="Payment Type" value={payment.type?.toUpperCase()} />
                        <DetailRow label="Transaction Type" value={payment.transactionType?.toUpperCase()} />
                        <DetailRow label="Sale ID" value={payment.saleID ? `#${payment.saleID}` : undefined} />
                        <DetailRow label="Cashier ID" value={payment.cashierID} />
                        <DetailRow label="Confirmed Manually" value={payment.confirmedManually} />
                        <DetailRow label="Date" value={formatDate(payment.createdAt)} />
                    </View>

                    {(payment.type === 'momo' || payment.network || payment.accountNumber) && (
                        <View style={[styles.section, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                            <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                                Mobile Money
                            </Text>

                            <DetailRow label="Network" value={payment.network} />
                            <DetailRow label="Account Number" value={payment.accountNumber} />
                            <DetailRow label="Amount Debited" value={
                                payment.amountDebited !== undefined
                                    ? formatCurrency(Number(payment.amountDebited), {symbol:businessCurrency.symbol})
                                    : undefined
                            } />
                        </View>
                    )}

                    {(payment.stan || payment.rrn || payment.externalID || payment.internalID) && (
                        <View style={[styles.section, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                            <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                                Transaction Information
                            </Text>

                            <DetailRow label="STAN" value={payment.stan} />
                            <DetailRow label="RRN" value={payment.rrn} />
                            <DetailRow label="External ID" value={payment.externalID} />
                            <DetailRow label="Internal ID" value={payment.internalID} />
                        </View>
                    )}

                    {(payment.terminalName || payment.terminalLocation || payment.merchantName || payment.merchantTradingName) && (
                        <View style={[styles.section, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                            <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                                Terminal & Merchant
                            </Text>

                            <DetailRow label="Terminal" value={payment.terminalName} />
                            <DetailRow label="Terminal Location" value={payment.terminalLocation} />
                            <DetailRow label="Merchant Name" value={payment.merchantName} />
                            <DetailRow label="Trading Name" value={payment.merchantTradingName} />
                        </View>
                    )}

                    {payment.updatedAt && (
                        <Text style={[styles.updatedText, {color:themeColors.subtleText}]}>
                            Last updated {formatDate(payment.updatedAt)}
                        </Text>
                    )}
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex:1
    },
    safeArea:{
        flex:1
    },
    statusBarSpacer:{
        height:10
    },
    header:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingHorizontal:Spacing.screenPadding,
        paddingVertical:Spacing.medium,
        borderBottomWidth:1
    },
    backButton:{
        width:36,
        height:36,
        borderRadius:18,
        alignItems:'center',
        justifyContent:'center'
    },
    headerTitle:{
        fontSize:Typography.heading2,
        fontFamily:'SemiBold'
    },
    amountCard:{
        alignItems:'center',
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        padding:Spacing.large,
        marginBottom:Spacing.medium
    },
    amountLabel:{
        fontSize:12,
        marginBottom:6
    },
    amount:{
        fontSize:26,
        fontFamily:'SemiBold'
    },
    statusBadge:{
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal:10,
        paddingVertical:5,
        borderRadius:20,
        marginTop:12
    },
    statusDot:{
        width:7,
        height:7,
        borderRadius:4,
        marginRight:6
    },
    statusText:{
        fontSize:10,
        fontFamily:'SemiBold'
    },
    section:{
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        paddingHorizontal:Spacing.medium,
        marginBottom:Spacing.medium
    },
    sectionTitle:{
        fontSize:15,
        fontFamily:'SemiBold',
        paddingVertical:Spacing.medium,
        borderBottomWidth:0
    },
    detailRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingVertical:12,
        borderBottomWidth:0.5
    },
    detailLabel:{
        fontSize:12,
        flex:1
    },
    detailValue:{
        fontSize:12,
        fontFamily:'Medium',
        flex:1,
        textAlign:'right'
    },
    updatedText:{
        fontSize:11,
        textAlign:'center',
        marginTop:5
    }
})

export default PaymentDetailScreen
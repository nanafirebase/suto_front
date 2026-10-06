import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo } from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { PayrollNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { Borders, Spacing, Typography } from '../../../utils/constants/Design'
import { ThemedText } from '../../../components/ui/ThemedText'
import { IconSymbol } from '../../../components/ui/icon-symbol'

type TPayrollRunResultScreen = NativeStackScreenProps<PayrollNavigationList, "PayrollRunResultScreen">

const PayrollRunResultScreen = ({navigation, route}:TPayrollRunResultScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {selectedBusiness} = useAppContainer()

    const {
        payrollRunID,
        employeeCount,
        grossAmount,
        allowanceAmount,
        overtimeAmount,
        deductionAmount,
        taxAmount,
        netAmount
    } = route.params

    const formatAmount = (amount:number) => {
        return Number(amount || 0).toLocaleString('en-GH', {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        })
    }

    const summary = useMemo(() => [
        {
            title:"Gross Pay",
            amount:grossAmount,
            color:themeColors.text
        },
        {
            title:"Allowances",
            amount:allowanceAmount,
            color:themeColors.success || '#34C759'
        },
        {
            title:"Overtime",
            amount:overtimeAmount,
            color:themeColors.info || '#007AFF'
        },
        {
            title:"Deductions",
            amount:deductionAmount,
            color:themeColors.warning || '#FF9500'
        },
        {
            title:"Tax",
            amount:taxAmount,
            color:themeColors.error || '#FF3B30'
        }
    ], [
        grossAmount,
        allowanceAmount,
        overtimeAmount,
        deductionAmount,
        taxAmount,
        themeColors
    ])

    const goToPayroll = () => {
        navigation.popToTop()
    }

    return (
        <View style={[styles.container, {backgroundColor:themeColors.background}]}>
            {Platform.OS === 'android' && (
                <View style={[
                    styles.statusBarSpacer,
                    {
                        height:10,
                        backgroundColor:themeColors.background
                    }
                ]} />
            )}

            <View style={[
                styles.safeArea,
                {
                    backgroundColor:themeColors.background,
                    paddingTop:Platform.OS === 'ios' ? insets.top : 0
                }
            ]}>

                <View style={[
                    styles.header,
                    {
                        backgroundColor:themeColors.background,
                        borderBottomColor:themeColors.border
                    }
                ]}>
                    <View style={{width:36}} />

                    <ThemedText style={styles.headerTitle}>
                        Payroll Result
                    </ThemedText>

                    <View style={{width:36}} />
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[
                        styles.contentContainer,
                        {
                            paddingBottom:insets.bottom + 120
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >

                    <View style={styles.successContainer}>
                        <View style={[
                            styles.successIcon,
                            {
                                backgroundColor:themeColors.success
                                    ? `${themeColors.success}18`
                                    : '#34C75918'
                            }
                        ]}>
                            <IconSymbol
                                name="check"
                                size={38}
                                color={themeColors.success || '#34C759'}
                            />
                        </View>

                        <ThemedText style={styles.successTitle}>
                            Payroll Completed
                        </ThemedText>

                        <Text style={[
                            styles.successDescription,
                            {color:themeColors.subtleText}
                        ]}>
                            Payroll has been successfully processed for {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}.
                        </Text>
                    </View>

                    <View style={[
                        styles.netCard,
                        {
                            backgroundColor:themeColors.primary
                        }
                    ]}>
                        <Text style={styles.netLabel}>
                            Net Payroll
                        </Text>

                        <Text style={styles.netAmount}>
                            {formatAmount(netAmount)}
                        </Text>

                        <Text style={styles.runID}>
                            Payroll Run #{payrollRunID}
                        </Text>
                    </View>

                    <ThemedText style={[
                        styles.sectionHeading,
                        {color:themeColors.text}
                    ]}>
                        Payroll Summary
                    </ThemedText>

                    <View style={[
                        styles.summaryCard,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        {summary.map((item, index) => (
                            <View
                                key={item.title}
                                style={[
                                    styles.summaryRow,
                                    index !== summary.length - 1 && {
                                        borderBottomWidth:1,
                                        borderBottomColor:themeColors.border
                                    }
                                ]}
                            >
                                <View style={styles.summaryLabelContainer}>
                                    <View style={[
                                        styles.summaryDot,
                                        {backgroundColor:item.color}
                                    ]} />

                                    <Text style={[
                                        styles.summaryLabel,
                                        {color:themeColors.text}
                                    ]}>
                                        {item.title}
                                    </Text>
                                </View>

                                <Text style={[
                                    styles.summaryAmount,
                                    {color:themeColors.text}
                                ]}>
                                    {formatAmount(item.amount)}
                                </Text>
                            </View>
                        ))}

                        <View style={[
                            styles.totalRow,
                            {borderTopColor:themeColors.border}
                        ]}>
                            <Text style={[
                                styles.totalLabel,
                                {color:themeColors.text}
                            ]}>
                                Net Pay
                            </Text>

                            <Text style={[
                                styles.totalAmount,
                                {color:themeColors.primary}
                            ]}>
                                {formatAmount(netAmount)}
                            </Text>
                        </View>
                    </View>

                    <ThemedText style={[
                        styles.sectionHeading,
                        {color:themeColors.text}
                    ]}>
                        Payroll Information
                    </ThemedText>

                    <View style={[
                        styles.infoCard,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        <View style={styles.infoRow}>
                            <Text style={[
                                styles.infoLabel,
                                {color:themeColors.subtleText}
                            ]}>
                                Employees Processed
                            </Text>

                            <Text style={[
                                styles.infoValue,
                                {color:themeColors.text}
                            ]}>
                                {employeeCount}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={[
                                styles.infoLabel,
                                {color:themeColors.subtleText}
                            ]}>
                                Payroll Run ID
                            </Text>

                            <Text style={[
                                styles.infoValue,
                                {color:themeColors.text}
                            ]}>
                                #{payrollRunID}
                            </Text>
                        </View>

                        {selectedBusiness?.name && (
                            <View style={styles.infoRow}>
                                <Text style={[
                                    styles.infoLabel,
                                    {color:themeColors.subtleText}
                                ]}>
                                    Business
                                </Text>

                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:themeColors.text,
                                            maxWidth:'55%'
                                        }
                                    ]}
                                >
                                    {selectedBusiness.name}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={[
                        styles.notice,
                        {
                            backgroundColor:themeColors.subtleBackground
                        }
                    ]}>
                        <IconSymbol
                            name="alert"
                            size={18}
                            color={themeColors.icon}
                        />

                        <Text style={[
                            styles.noticeText,
                            {color:themeColors.subtleText}
                        ]}>
                            The payroll run has been recorded successfully. You can review the processed payroll from the payroll history.
                        </Text>
                    </View>

                </ScrollView>

                <View style={[
                    styles.footer,
                    {
                        backgroundColor:themeColors.background,
                        borderTopColor:themeColors.border,
                        paddingBottom:insets.bottom + Spacing.screenPadding
                    }
                ]}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            {backgroundColor:themeColors.primary}
                        ]}
                        onPress={goToPayroll}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={styles.buttonText}>
                            Done
                        </ThemedText>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex:1
    },
    statusBarSpacer:{
        width:'100%'
    },
    safeArea:{
        flex:1
    },
    header:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingHorizontal:Spacing.screenPadding,
        paddingVertical:Spacing.medium,
        borderBottomWidth:1
    },
    headerTitle:{
        fontSize:Typography.heading2,
        fontFamily:'SemiBold'
    },
    scrollContainer:{
        flex:1
    },
    contentContainer:{
        padding:Spacing.screenPadding
    },
    successContainer:{
        alignItems:'center',
        paddingTop:20,
        paddingBottom:25
    },
    successIcon:{
        width:76,
        height:76,
        borderRadius:38,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:15
    },
    successTitle:{
        fontSize:24,
        fontFamily:'SemiBold',
        textAlign:'center',
        marginBottom:8
    },
    successDescription:{
        fontSize:Typography.body,
        fontFamily:'Regular',
        textAlign:'center',
        lineHeight:21,
        maxWidth:320
    },
    netCard:{
        borderRadius:Borders.radiusSmall,
        padding:24,
        alignItems:'center',
        marginBottom:10
    },
    netLabel:{
        color:'#FFFFFF',
        fontSize:Typography.body,
        fontFamily:'Medium',
        opacity:0.9,
        marginBottom:8
    },
    netAmount:{
        color:'#FFFFFF',
        fontSize:32,
        fontFamily:'SemiBold'
    },
    runID:{
        color:'#FFFFFF',
        fontSize:Typography.small,
        fontFamily:'Regular',
        opacity:0.8,
        marginTop:8
    },
    sectionHeading:{
        fontSize:15,
        marginBottom:15,
        marginTop:20,
        fontFamily:'Medium'
    },
    summaryCard:{
        borderWidth:1,
        borderRadius:Borders.radiusSmall,
        overflow:'hidden'
    },
    summaryRow:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingHorizontal:16,
        paddingVertical:17
    },
    summaryLabelContainer:{
        flexDirection:'row',
        alignItems:'center'
    },
    summaryDot:{
        width:8,
        height:8,
        borderRadius:4,
        marginRight:10
    },
    summaryLabel:{
        fontSize:Typography.body,
        fontFamily:'Regular'
    },
    summaryAmount:{
        fontSize:Typography.body,
        fontFamily:'Medium'
    },
    totalRow:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingHorizontal:16,
        paddingVertical:19,
        borderTopWidth:1
    },
    totalLabel:{
        fontSize:Typography.body,
        fontFamily:'SemiBold'
    },
    totalAmount:{
        fontSize:Typography.heading2,
        fontFamily:'SemiBold'
    },
    infoCard:{
        borderWidth:1,
        borderRadius:Borders.radiusSmall,
        paddingHorizontal:16
    },
    infoRow:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingVertical:16,
        borderBottomWidth:0
    },
    infoLabel:{
        fontSize:Typography.small,
        fontFamily:'Regular'
    },
    infoValue:{
        fontSize:Typography.small,
        fontFamily:'Medium'
    },
    notice:{
        flexDirection:'row',
        alignItems:'flex-start',
        padding:15,
        borderRadius:Borders.radiusSmall,
        marginTop:20,
        gap:10
    },
    noticeText:{
        flex:1,
        fontSize:Typography.small,
        fontFamily:'Regular',
        lineHeight:19
    },
    footer:{
        paddingHorizontal:Spacing.screenPadding,
        paddingTop:Spacing.screenPadding,
        borderTopWidth:1
    },
    button:{
        paddingVertical:Spacing.large,
        borderRadius:Borders.radiusSmall,
        alignItems:'center'
    },
    buttonText:{
        color:'#FFFFFF',
        fontSize:Typography.body,
        fontFamily:'SemiBold'
    }
})

export default PayrollRunResultScreen
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { PayrollNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { ThemedText } from '../../../components/ui/ThemedText'
import { ThemedView } from '../../../components/ui/ThemedView'
import { IconSymbol } from '../../../components/ui/icon-symbol'

type TPayslipDetailsScreen = NativeStackScreenProps<PayrollNavigationList, "PayslipDetailsScreen">

type Payslip = {
    id?: string | number
    payrollRunID?: string | number
    employeeID?: string | number
    employeeFirstName?: string
    employeeLastName?: string
    firstName?: string
    lastName?: string
    phone?: string
    employeePhone?: string
    roleName?: string
    gradeName?: string
    payPeriodID?: string | number
    payPeriodName?: string | number
    payDate?: string | Date
    basicSalary?: number | string
    allowanceAmount?: number | string
    overtimeAmount?: number | string
    deductionAmount?: number | string
    taxAmount?: number | string
    grossAmount?: number | string
    netAmount?: number | string
    status?: string
    payrollRunStatus?: string
    currencyCode?: string
    currencyName?: string
}

const PayslipDetailsScreen = ({navigation, route}:TPayslipDetailsScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {selectedBusiness} = useAppContainer()

    const payslip = route.params.payslipData as Payslip

    const firstName = payslip.employeeFirstName || payslip.firstName || ""
    const lastName = payslip.employeeLastName || payslip.lastName || ""
    const employeeName = `${firstName} ${lastName}`.trim() || "Unknown Employee"

    const formatAmount = (value:any) => {
        const amount = Number(value || 0)

        return `${payslip.currencyCode || 'GHS'} ${amount.toLocaleString(undefined, {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        })}`
    }

    const formatDate = (value:any) => {
        if (!value) return "-"

        const date = new Date(value)

        if (isNaN(date.getTime())) return String(value)

        return date.toLocaleDateString('en-GB', {
            day:'2-digit',
            month:'short',
            year:'numeric'
        })
    }

    const status = payslip.status || payslip.payrollRunStatus || "processed"

    const getStatusColor = () => {
        if (status === "paid") return themeColors.success
        if (status === "cancelled") return themeColors.error
        return themeColors.primary
    }

    const Row = ({label, value, bold = false}: {label:string, value:string, bold?:boolean}) => (
        <View style={styles.row}>
            <Text style={[styles.rowLabel, {color:themeColors.subtleText}]}>
                {label}
            </Text>

            <Text style={[styles.rowValue, {color:themeColors.text}, bold && styles.boldValue]}>
                {value}
            </Text>
        </View>
    )

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
                        Payslip
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
                    <View style={[styles.employeeCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                        <View style={[styles.avatar, {backgroundColor:themeColors.subtleBackground}]}>
                            <Text style={[styles.avatarText, {color:themeColors.primary}]}>
                                {firstName.charAt(0).toUpperCase() || "E"}
                            </Text>
                        </View>

                        <View style={{flex:1}}>
                            <Text style={[styles.employeeName, {color:themeColors.text}]}>
                                {employeeName}
                            </Text>

                            <Text style={[styles.employeeMeta, {color:themeColors.subtleText}]}>
                                {payslip.roleName || "Employee"}
                                {payslip.gradeName ? ` • ${payslip.gradeName}` : ""}
                            </Text>

                            {(payslip.employeePhone || payslip.phone) && (
                                <Text style={[styles.employeePhone, {color:themeColors.subtleText}]}>
                                    {payslip.employeePhone || payslip.phone}
                                </Text>
                            )}
                        </View>

                        <View style={[styles.statusBadge, {backgroundColor:getStatusColor() + "18"}]}>
                            <Text style={[styles.statusText, {color:getStatusColor()}]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.periodCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                        <View>
                            <Text style={[styles.smallLabel, {color:themeColors.subtleText}]}>
                                Pay Period
                            </Text>

                            <Text style={[styles.periodName, {color:themeColors.text}]}>
                                {payslip.payPeriodName || "Payroll Period"}
                            </Text>
                        </View>

                        <View style={{alignItems:'flex-end'}}>
                            <Text style={[styles.smallLabel, {color:themeColors.subtleText}]}>
                                Pay Date
                            </Text>

                            <Text style={[styles.periodDate, {color:themeColors.text}]}>
                                {formatDate(payslip.payDate)}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                        Earnings
                    </Text>

                    <View style={[styles.sectionCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                        <Row
                            label="Basic Salary"
                            value={formatAmount(payslip.basicSalary)}
                        />

                        <Row
                            label="Allowances"
                            value={formatAmount(payslip.allowanceAmount)}
                        />

                        <Row
                            label="Overtime"
                            value={formatAmount(payslip.overtimeAmount)}
                        />

                        <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                        <Row
                            label="Gross Pay"
                            value={formatAmount(payslip.grossAmount)}
                            bold
                        />
                    </View>

                    <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                        Deductions
                    </Text>

                    <View style={[styles.sectionCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                        <Row
                            label="Deductions"
                            value={formatAmount(payslip.deductionAmount)}
                        />

                        <Row
                            label="Tax"
                            value={formatAmount(payslip.taxAmount)}
                        />

                        <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                        <Row
                            label="Total Deductions"
                            value={formatAmount(
                                Number(payslip.deductionAmount || 0) +
                                Number(payslip.taxAmount || 0)
                            )}
                            bold
                        />
                    </View>

                    <View style={[styles.netCard, {backgroundColor:themeColors.primary}]}>
                        <View>
                            <Text style={styles.netLabel}>
                                Net Pay
                            </Text>

                            <Text style={styles.netSubLabel}>
                                Amount payable to employee
                            </Text>
                        </View>

                        <Text style={styles.netAmount}>
                            {formatAmount(payslip.netAmount)}
                        </Text>
                    </View>

                    <View style={styles.footerInfo}>
                        <Text style={[styles.footerText, {color:themeColors.subtleText}]}>
                            Payslip ID: {payslip.id || "-"}
                        </Text>

                        {payslip.payrollRunID && (
                            <Text style={[styles.footerText, {color:themeColors.subtleText}]}>
                                Payroll Run: {payslip.payrollRunID}
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{flex:1},
    safeArea:{flex:1},
    statusBarSpacer:{height:10},
    header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.screenPadding, paddingVertical:Spacing.medium, borderBottomWidth:1},
    headerTitle:{fontSize:Typography.heading2, fontFamily:'SemiBold'},
    backButton:{width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center'},
    employeeCard:{borderWidth:1, borderRadius:Borders.radiusMedium, padding:Spacing.medium, flexDirection:'row', alignItems:'center', marginBottom:Spacing.medium},
    avatar:{width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center', marginRight:12},
    avatarText:{fontSize:20, fontFamily:'SemiBold'},
    employeeName:{fontSize:15, fontFamily:'SemiBold'},
    employeeMeta:{fontSize:11, marginTop:4},
    employeePhone:{fontSize:11, marginTop:3},
    statusBadge:{paddingHorizontal:9, paddingVertical:5, borderRadius:20, marginLeft:8},
    statusText:{fontSize:10, fontFamily:'SemiBold'},
    periodCard:{borderWidth:1, borderRadius:Borders.radiusMedium, padding:Spacing.medium, flexDirection:'row', justifyContent:'space-between', marginBottom:Spacing.medium},
    smallLabel:{fontSize:10, marginBottom:4},
    periodName:{fontSize:14, fontFamily:'SemiBold'},
    periodDate:{fontSize:13, fontFamily:'Medium'},
    sectionTitle:{fontSize:15, fontFamily:'SemiBold', marginTop:Spacing.medium, marginBottom:8},
    sectionCard:{borderWidth:1, borderRadius:Borders.radiusMedium, paddingHorizontal:Spacing.medium},
    row:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10},
    rowLabel:{fontSize:12},
    rowValue:{fontSize:12, fontFamily:'Medium'},
    boldValue:{fontFamily:'SemiBold'},
    divider:{height:1},
    netCard:{borderRadius:Borders.radiusMedium, padding:Spacing.medium, marginTop:Spacing.large, flexDirection:'row', alignItems:'center', justifyContent:'space-between'},
    netLabel:{color:'#FFFFFF', fontSize:17, fontFamily:'SemiBold'},
    netSubLabel:{color:'rgba(255,255,255,0.75)', fontSize:11, marginTop:3},
    netAmount:{color:'#FFFFFF', fontSize:18, fontFamily:'SemiBold'},
    footerInfo:{alignItems:'center', marginTop:Spacing.large},
    footerText:{fontSize:10, marginBottom:4}
})

export default PayslipDetailsScreen
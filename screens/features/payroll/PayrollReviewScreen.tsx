import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type TPayrollReviewScreen = NativeStackScreenProps<
    PayrollNavigationList,
    "PayrollReviewScreen"
>

const PayrollReviewScreen = ({navigation, route}:TPayrollReviewScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const {session} = useAppContainer()
    const insets = useSafeAreaInsets()

    const {payrollData} = route.params

    const {
        businessID,
        branchID,
        departmentID,
        employeeCategory,
        payPeriodID,
        payPeriodName,
        payDate,
        employees
    } = payrollData

    const [loading, setLoading] = useState(false)

    const employeeList = employees || []

    const formatDate = (value:string|Date) => {
        const date = new Date(value)

        if (isNaN(date.getTime())) {
            return String(value)
        }

        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getNumber = (value:any) => {
        const number = Number(value || 0)

        if (isNaN(number)) {
            return 0
        }

        return number
    }

    const formatMoney = (value:any) => {
        return getNumber(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    const getEmployeeName = (employee:any) => {
        const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim()

        return name || employee.employeeName || employee.name || "Unnamed Employee"
    }

    const getBasicSalary = (employee:any) => {
        return getNumber(
            employee.basicSalary ??
            employee.salary ??
            employee.currentSalary ??
            0
        )
    }

    const getAllowance = (employee:any) => {
        return getNumber(
            employee.allowanceAmount ??
            employee.totalAllowance ??
            employee.allowances ??
            0
        )
    }

    const getOvertime = (employee:any) => {
        return getNumber(
            employee.overtimeAmount ??
            employee.overtime ??
            0
        )
    }

    const getDeduction = (employee:any) => {
        return getNumber(
            employee.deductionAmount ??
            employee.totalDeduction ??
            employee.deductions ??
            0
        )
    }

    const getTax = (employee:any) => {
        return getNumber(
            employee.taxAmount ??
            employee.tax ??
            0
        )
    }

    const getGross = (employee:any) => {
        if (employee.grossAmount != null) {
            return getNumber(employee.grossAmount)
        }

        return (
            getBasicSalary(employee) +
            getAllowance(employee) +
            getOvertime(employee)
        )
    }

    const getNet = (employee:any) => {
        if (employee.netAmount != null) {
            return getNumber(employee.netAmount)
        }

        return (
            getGross(employee) -
            getDeduction(employee) -
            getTax(employee)
        )
    }

    const totals = useMemo(() => {
        let grossAmount = 0
        let allowanceAmount = 0
        let overtimeAmount = 0
        let deductionAmount = 0
        let taxAmount = 0
        let netAmount = 0
        let basicSalary = 0

        for (const employee of employeeList) {
            basicSalary += getBasicSalary(employee)
            allowanceAmount += getAllowance(employee)
            overtimeAmount += getOvertime(employee)
            deductionAmount += getDeduction(employee)
            taxAmount += getTax(employee)
            grossAmount += getGross(employee)
            netAmount += getNet(employee)
        }

        return {
            basicSalary,
            grossAmount,
            allowanceAmount,
            overtimeAmount,
            deductionAmount,
            taxAmount,
            netAmount
        }
    }, [employeeList])

    const onRunPayroll = () => {
        if (!businessID) {
            Alert.alert("Error", "Business is required")
            return
        }

        if (!payPeriodID) {
            Alert.alert("Error", "Pay period is required")
            return
        }

        if (!payDate) {
            Alert.alert("Error", "Pay date is required")
            return
        }

        if (!employeeList.length) {
            Alert.alert("Error", "No employees are available for this payroll")
            return
        }

        Alert.alert(
            "Run Payroll",
            `You are about to process payroll for ${employeeList.length} employee${employeeList.length === 1 ? "" : "s"}. Continue?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Run Payroll",
                    onPress: runPayroll
                }
            ]
        )
    }

    const runPayroll = () => {
        setLoading(true)

        SocketIO.emit('run-employee-payroll', { businessID, branchID: branchID || null, departmentID: departmentID || null,
            employeeCategory: employeeCategory||null, payPeriodID, payPeriodName, payDate, sessionID: session
        }, (response:any) => {
            setLoading(false)

            if (response.status !== "success") {
                Alert.alert(
                    "Payroll Error",
                    response.message || "Failed to run payroll",
                    [
                        {
                            text: "Cancel",
                            style: "cancel"
                        },
                        {
                            text: "Retry",
                            onPress: runPayroll
                        }
                    ]
                )
                return
            }

            const result = response.data

            navigation.replace("PayrollRunResultScreen", {
                payrollRunID: result.payrollRunID,
                employeeCount: result.employeeCount,
                grossAmount: result.grossAmount,
                allowanceAmount: result.allowanceAmount,
                overtimeAmount: result.overtimeAmount,
                deductionAmount: result.deductionAmount,
                taxAmount: result.taxAmount,
                netAmount: result.netAmount
            })
        })
    }

    return (
        <View style={[styles.container, {backgroundColor:themeColors.background}]}>
            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        {
                            height:10,
                            backgroundColor:themeColors.background
                        }
                    ]}
                />
            )}

            <View
                style={[
                    styles.safeArea,
                    {
                        backgroundColor:themeColors.background,
                        paddingTop:Platform.OS === 'ios' ? insets.top : 0
                    }
                ]}
            >

                <ThemedView
                    style={[
                        styles.header,
                        {
                            backgroundColor:themeColors.background,
                            borderBottomColor:themeColors.border
                        }
                    ]}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.backButtonMain,
                            {
                                backgroundColor:themeColors.subtleBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="arrow.left"
                            size={20}
                            color={themeColors.icon}
                        />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Review Payroll
                    </ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <KeyboardAvoidingView
                    style={{flex:1}}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >

                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={[
                            styles.contentContainer,
                            {
                                paddingBottom:insets.bottom + 120,
                                paddingTop:10
                            }
                        ]}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >

                        <ThemedText
                            style={[
                                styles.sectionHeading,
                                {
                                    color:themeColors.text
                                }
                            ]}
                        >
                            Payroll Information
                        </ThemedText>

                        <View
                            style={[
                                styles.infoCard,
                                {
                                    backgroundColor:themeColors.card,
                                    borderColor:themeColors.border
                                }
                            ]}
                        >
                            <View style={styles.infoRow}>
                                <Text
                                    style={[
                                        styles.infoLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Pay Period
                                </Text>

                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    {payPeriodName || "Selected Pay Period"}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text
                                    style={[
                                        styles.infoLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Pay Date
                                </Text>

                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    {formatDate(payDate)}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text
                                    style={[
                                        styles.infoLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Employees
                                </Text>

                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    {employeeList.length}
                                </Text>
                            </View>
                        </View>


                        <ThemedText
                            style={[
                                styles.sectionHeading,
                                {
                                    color:themeColors.text
                                }
                            ]}
                        >
                            Payroll Summary
                        </ThemedText>

                        <View
                            style={[
                                styles.summaryCard,
                                {
                                    backgroundColor:themeColors.card,
                                    borderColor:themeColors.border
                                }
                            ]}
                        >

                            <View style={styles.summaryRow}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Basic Salary
                                </Text>

                                <Text
                                    style={[
                                        styles.summaryValue,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    {formatMoney(totals.basicSalary)}
                                </Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Allowances
                                </Text>

                                <Text
                                    style={[
                                        styles.summaryValue,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    {formatMoney(totals.allowanceAmount)}
                                </Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Overtime
                                </Text>

                                <Text
                                    style={[
                                        styles.summaryValue,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    {formatMoney(totals.overtimeAmount)}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.summaryRow}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        {
                                            color:themeColors.text,
                                            fontFamily:"SemiBold"
                                        }
                                    ]}
                                >
                                    Gross Payroll
                                </Text>

                                <Text
                                    style={[
                                        styles.summaryValue,
                                        {
                                            color:themeColors.text,
                                            fontFamily:"SemiBold"
                                        }
                                    ]}
                                >
                                    {formatMoney(totals.grossAmount)}
                                </Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Deductions
                                </Text>

                                <Text
                                    style={[
                                        styles.summaryValue,
                                        {
                                            color:themeColors.error
                                        }
                                    ]}
                                >
                                    -{formatMoney(totals.deductionAmount)}
                                </Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Tax
                                </Text>

                                <Text
                                    style={[
                                        styles.summaryValue,
                                        {
                                            color:themeColors.error
                                        }
                                    ]}
                                >
                                    -{formatMoney(totals.taxAmount)}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.netRow}>
                                <Text
                                    style={[
                                        styles.netLabel,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    Estimated Net Payroll
                                </Text>

                                <Text
                                    style={[
                                        styles.netValue,
                                        {
                                            color:themeColors.primary
                                        }
                                    ]}
                                >
                                    {formatMoney(totals.netAmount)}
                                </Text>
                            </View>

                        </View>


                        <ThemedText
                            style={[
                                styles.sectionHeading,
                                {
                                    color:themeColors.text
                                }
                            ]}
                        >
                            Employees ({employeeList.length})
                        </ThemedText>

                        {employeeList.map((employee:any, index:number) => {

                            const basicSalary = getBasicSalary(employee)
                            const allowance = getAllowance(employee)
                            const overtime = getOvertime(employee)
                            const deduction = getDeduction(employee)
                            const tax = getTax(employee)
                            const gross = getGross(employee)
                            const net = getNet(employee)

                            return (
                                <View
                                    key={
                                        employee.id ??
                                        employee.employeeID ??
                                        index
                                    }
                                    style={[
                                        styles.employeeCard,
                                        {
                                            backgroundColor:themeColors.card,
                                            borderColor:themeColors.border
                                        }
                                    ]}
                                >

                                    <View style={styles.employeeHeader}>

                                        <View style={styles.employeeNumber}>
                                            <Text
                                                style={[
                                                    styles.employeeNumberText,
                                                    {
                                                        color:themeColors.primary
                                                    }
                                                ]}
                                            >
                                                {index + 1}
                                            </Text>
                                        </View>

                                        <View style={{flex:1}}>
                                            <Text
                                                style={[
                                                    styles.employeeName,
                                                    {
                                                        color:themeColors.text
                                                    }
                                                ]}
                                            >
                                                {getEmployeeName(employee)}
                                            </Text>

                                            {!!employee.employeeNumber && (
                                                <Text
                                                    style={[
                                                        styles.employeeSubtext,
                                                        {
                                                            color:themeColors.subtleText
                                                        }
                                                    ]}
                                                >
                                                    {employee.employeeNumber}
                                                </Text>
                                            )}

                                            {!!employee.roleName && (
                                                <Text
                                                    style={[
                                                        styles.employeeSubtext,
                                                        {
                                                            color:themeColors.subtleText
                                                        }
                                                    ]}
                                                >
                                                    {employee.roleName}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={{alignItems:'flex-end'}}>
                                            <Text
                                                style={[
                                                    styles.netSmallLabel,
                                                    {
                                                        color:themeColors.subtleText
                                                    }
                                                ]}
                                            >
                                                NET
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.netSmallValue,
                                                    {
                                                        color:themeColors.primary
                                                    }
                                                ]}
                                            >
                                                {formatMoney(net)}
                                            </Text>
                                        </View>

                                    </View>

                                    <View
                                        style={[
                                            styles.employeeDivider,
                                            {
                                                backgroundColor:themeColors.border
                                            }
                                        ]}
                                    />

                                    <View style={styles.employeeRow}>
                                        <Text
                                            style={[
                                                styles.employeeLabel,
                                                {
                                                    color:themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Basic Salary
                                        </Text>

                                        <Text
                                            style={[
                                                styles.employeeValue,
                                                {
                                                    color:themeColors.text
                                                }
                                            ]}
                                        >
                                            {formatMoney(basicSalary)}
                                        </Text>
                                    </View>

                                    <View style={styles.employeeRow}>
                                        <Text
                                            style={[
                                                styles.employeeLabel,
                                                {
                                                    color:themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Allowances
                                        </Text>

                                        <Text
                                            style={[
                                                styles.employeeValue,
                                                {
                                                    color:themeColors.text
                                                }
                                            ]}
                                        >
                                            {formatMoney(allowance)}
                                        </Text>
                                    </View>

                                    <View style={styles.employeeRow}>
                                        <Text
                                            style={[
                                                styles.employeeLabel,
                                                {
                                                    color:themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Overtime
                                        </Text>

                                        <Text
                                            style={[
                                                styles.employeeValue,
                                                {
                                                    color:themeColors.text
                                                }
                                            ]}
                                        >
                                            {formatMoney(overtime)}
                                        </Text>
                                    </View>

                                    <View style={styles.employeeRow}>
                                        <Text
                                            style={[
                                                styles.employeeLabel,
                                                {
                                                    color:themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Gross
                                        </Text>

                                        <Text
                                            style={[
                                                styles.employeeValue,
                                                {
                                                    color:themeColors.text,
                                                    fontFamily:"SemiBold"
                                                }
                                            ]}
                                        >
                                            {formatMoney(gross)}
                                        </Text>
                                    </View>

                                    <View style={styles.employeeRow}>
                                        <Text
                                            style={[
                                                styles.employeeLabel,
                                                {
                                                    color:themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Deductions
                                        </Text>

                                        <Text
                                            style={[
                                                styles.employeeValue,
                                                {
                                                    color:themeColors.error
                                                }
                                            ]}
                                        >
                                            -{formatMoney(deduction)}
                                        </Text>
                                    </View>

                                    <View style={styles.employeeRow}>
                                        <Text
                                            style={[
                                                styles.employeeLabel,
                                                {
                                                    color:themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Tax
                                        </Text>

                                        <Text
                                            style={[
                                                styles.employeeValue,
                                                {
                                                    color:themeColors.error
                                                }
                                            ]}
                                        >
                                            -{formatMoney(tax)}
                                        </Text>
                                    </View>

                                </View>
                            )
                        })}

                    </ScrollView>

                    <View
                        style={[
                            styles.footer,
                            {
                                backgroundColor:themeColors.background,
                                borderTopColor:themeColors.border
                            }
                        ]}
                    >

                        <View style={styles.footerSummary}>
                            <View>
                                <Text
                                    style={[
                                        styles.footerLabel,
                                        {
                                            color:themeColors.subtleText
                                        }
                                    ]}
                                >
                                    {employeeList.length} Employees
                                </Text>

                                <Text
                                    style={[
                                        styles.footerNetLabel,
                                        {
                                            color:themeColors.text
                                        }
                                    ]}
                                >
                                    Net Payroll
                                </Text>
                            </View>

                            <Text
                                style={[
                                    styles.footerAmount,
                                    {
                                        color:themeColors.primary
                                    }
                                ]}
                            >
                                {formatMoney(totals.netAmount)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor:loading
                                        ? themeColors.border
                                        : themeColors.primary
                                }
                            ]}
                            onPress={onRunPayroll}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                {loading ? "Processing Payroll..." : "Run Payroll"}
                            </ThemedText>
                        </TouchableOpacity>

                    </View>

                </KeyboardAvoidingView>
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

    scrollContainer:{
        flex:1
    },

    contentContainer:{
        padding:Spacing.screenPadding,
        paddingTop:0
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

    backButtonMain:{
        width:36,
        height:36,
        borderRadius:18,
        alignItems:'center',
        justifyContent:'center'
    },

    sectionHeading:{
        fontSize:15,
        marginBottom:15,
        marginTop:15,
        fontFamily:'Medium'
    },

    infoCard:{
        borderWidth:1,
        borderRadius:Borders.radiusSmall,
        padding:Spacing.medium,
        marginBottom:5
    },

    infoRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingVertical:8
    },

    infoLabel:{
        fontSize:Typography.small,
        fontFamily:'Regular'
    },

    infoValue:{
        fontSize:Typography.small,
        fontFamily:'SemiBold',
        maxWidth:'60%',
        textAlign:'right'
    },

    summaryCard:{
        borderWidth:1,
        borderRadius:Borders.radiusSmall,
        padding:Spacing.medium,
        marginBottom:5
    },

    summaryRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingVertical:8
    },

    summaryLabel:{
        fontSize:Typography.small,
        fontFamily:'Regular'
    },

    summaryValue:{
        fontSize:Typography.small,
        fontFamily:'Medium'
    },

    divider:{
        height:1,
        marginVertical:8,
        backgroundColor:'#D9D9D9'
    },

    netRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingVertical:8
    },

    netLabel:{
        fontSize:Typography.body,
        fontFamily:'SemiBold'
    },

    netValue:{
        fontSize:18,
        fontFamily:'SemiBold'
    },

    employeeCard:{
        borderWidth:1,
        borderRadius:Borders.radiusSmall,
        padding:Spacing.medium,
        marginBottom:10
    },

    employeeHeader:{
        flexDirection:'row',
        alignItems:'center'
    },

    employeeNumber:{
        width:32,
        height:32,
        borderRadius:16,
        backgroundColor:'#EEF4FF',
        alignItems:'center',
        justifyContent:'center',
        marginRight:10
    },

    employeeNumberText:{
        fontSize:Typography.small,
        fontFamily:'SemiBold'
    },

    employeeName:{
        fontSize:Typography.body,
        fontFamily:'SemiBold'
    },

    employeeSubtext:{
        fontSize:11,
        marginTop:2,
        fontFamily:'Regular'
    },

    netSmallLabel:{
        fontSize:9,
        fontFamily:'SemiBold'
    },

    netSmallValue:{
        fontSize:Typography.small,
        fontFamily:'SemiBold',
        marginTop:2
    },

    employeeDivider:{
        height:1,
        marginVertical:10
    },

    employeeRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingVertical:4
    },

    employeeLabel:{
        fontSize:Typography.small,
        fontFamily:'Regular'
    },

    employeeValue:{
        fontSize:Typography.small,
        fontFamily:'Medium'
    },

    footer:{
        padding:Spacing.screenPadding,
        borderTopWidth:1
    },

    footerSummary:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:10
    },

    footerLabel:{
        fontSize:11,
        fontFamily:'Regular'
    },

    footerNetLabel:{
        fontSize:Typography.body,
        fontFamily:'SemiBold',
        marginTop:2
    },

    footerAmount:{
        fontSize:18,
        fontFamily:'SemiBold'
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

export default PayrollReviewScreen
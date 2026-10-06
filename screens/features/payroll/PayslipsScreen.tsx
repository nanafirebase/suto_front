import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { PayrollNavigationList, BottomSheetSelectOption } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { SocketIO } from '../../../configuration/helpers/main.helpers'
import { ThemedText } from '../../../components/ui/ThemedText'
import { ThemedView } from '../../../components/ui/ThemedView'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'

type TPayslipsScreen = NativeStackScreenProps<PayrollNavigationList, "PayslipsScreen">

type Payslip = {
    id?: string | number
    payrollRunID?: string | number
    employeeID?: string | number
    employeeFirstName?: string
    employeeLastName?: string
    firstName?: string
    lastName?: string
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
}

const PayslipsScreen = ({navigation}:TPayslipsScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {selectedBusiness, session} = useAppContainer()

    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [payPeriods, setPayPeriods] = useState<BottomSheetSelectOption[]>([])
    const [selectedPayPeriod, setSelectedPayPeriod] = useState<BottomSheetSelectOption|null>(null)
    const [status, setStatus] = useState("all")
    const [loading, setLoading] = useState(false)

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState("")
    const [activeSheet, setActiveSheet] = useState<"payPeriod"|"status"|null>(null)

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["40%", "55%", "70%"], [])

    const fetchPayPeriods = async () => {
        SocketIO.emit('fetch-pay-periods', { sessionID:session, businessID:selectedBusiness.id, statusFilter: 'all' }, (response:any) => {
            if (response.status === "success") {
                setPayPeriods((response.data || []).map((item:any) => ({
                    key:item.id,
                    value:item.name || item.payPeriodName || item.period
                })))
            }
        })
    }

    const fetchPayslips = async () => {
        if (!selectedBusiness.id) return

        setLoading(true)

        SocketIO.emit('fetch-payslips', {
            sessionID:session,
            businessID:selectedBusiness.id,
            payPeriodID:selectedPayPeriod?.key,
            status:status !== "all" ? status : undefined
        }, (response:any) => {
            setLoading(false)

            if (response.status !== "success") {
                Alert.alert("Error", response.message || "Failed to load payslips")
                return
            }

            setPayslips(response.data || [])
        })
    }

    useFocusEffect(
        useCallback(() => {
            if (!selectedBusiness.id) return
            fetchPayPeriods()
            fetchPayslips()
        }, [selectedBusiness.id, selectedPayPeriod?.key, status])
    )

    const formatAmount = (value:any, currencyCode?:string) => {
        const amount = Number(value || 0)

        return `${currencyCode || 'GHS'} ${amount.toLocaleString(undefined, {
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

    const openPayPeriodSheet = () => {
        setActiveSheet("payPeriod")
        setSheetTitle("Select Pay Period")
        setSheetOptions([
            {key:"all", value:"All Periods"},
            ...payPeriods
        ])
        bottomSheetRef.current?.snapToIndex(0)
    }

    const openStatusSheet = () => {
        setActiveSheet("status")
        setSheetTitle("Select Status")
        setSheetOptions([
            {key:"all", value:"All Statuses"},
            {key:"processed", value:"Processed"},
            {key:"paid", value:"Paid"},
            {key:"cancelled", value:"Cancelled"}
        ])
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectSheetOption = (option:BottomSheetSelectOption) => {
        if (activeSheet === "payPeriod") {
            if (option.key === "all") {
                setSelectedPayPeriod(null)
            } else {
                setSelectedPayPeriod(option)
            }
        }

        if (activeSheet === "status") {
            setStatus(String(option.key))
        }

        bottomSheetRef.current?.close()
    }

    const getSelectedSheetKey = () => {
        if (activeSheet === "payPeriod") {
            return selectedPayPeriod?.key || "all"
        }

        return status
    }

    const openPayslip = (payslip:Payslip) => {
        navigation.navigate("PayslipDetailsScreen", {
            payslipData:payslip
        })
    }

    const renderPayslip = ({item}: {item:Payslip}) => {
        const firstName = item.employeeFirstName || item.firstName || ""
        const lastName = item.employeeLastName || item.lastName || ""
        const employeeName = `${firstName} ${lastName}`.trim() || "Unknown Employee"

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openPayslip(item)}
                style={[styles.card, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}
            >
                <View style={styles.cardHeader}>
                    <View style={{flex:1}}>
                        <Text style={[styles.employeeName, {color:themeColors.text}]}>
                            {employeeName}
                        </Text>

                        <Text style={[styles.employeeMeta, {color:themeColors.subtleText}]}>
                            {item.roleName || item.gradeName || "Employee"}
                            {item.roleName && item.gradeName ? ` • ${item.gradeName}` : ""}
                        </Text>
                    </View>

                    <IconSymbol name="chevron.right" size={18} color={themeColors.subtleText} />
                </View>

                <Text style={[styles.payDate, {color:themeColors.subtleText}]}>
                    {formatDate(item.payDate)}
                </Text>

                <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                <View style={styles.amountRow}>
                    <View>
                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                            Gross
                        </Text>

                        <Text style={[styles.amount, {color:themeColors.text}]}>
                            {formatAmount(item.grossAmount, item.currencyCode)}
                        </Text>
                    </View>

                    <View>
                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                            Deductions
                        </Text>

                        <Text style={[styles.amount, {color:themeColors.text}]}>
                            {formatAmount(item.deductionAmount, item.currencyCode)}
                        </Text>
                    </View>

                    <View style={{alignItems:'flex-end'}}>
                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                            Net Pay
                        </Text>

                        <Text style={[styles.netAmount, {color:themeColors.primary}]}>
                            {formatAmount(item.netAmount, item.currencyCode)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
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
                        Payslips
                    </ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <View style={{paddingHorizontal:Spacing.medium, paddingTop:Spacing.medium}}>
                    <View style={styles.filters}>
                        <TouchableOpacity
                            onPress={openPayPeriodSheet}
                            style={[styles.filter, {backgroundColor:themeColors.inputBackground, borderColor:themeColors.border}]}
                        >
                            <Text style={[styles.filterLabel, {color:themeColors.subtleText}]}>
                                Pay Period
                            </Text>

                            <Text style={[styles.filterValue, {color:themeColors.text}]}>
                                {selectedPayPeriod?.value || "All Periods"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={openStatusSheet}
                            style={[styles.filter, {backgroundColor:themeColors.inputBackground, borderColor:themeColors.border}]}
                        >
                            <Text style={[styles.filterLabel, {color:themeColors.subtleText}]}>
                                Status
                            </Text>

                            <Text style={[styles.filterValue, {color:themeColors.text}]}>
                                {status === "all" ? "All Statuses" : status}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.listHeader}>
                        <ThemedText style={styles.listTitle}>
                            {selectedPayPeriod?.value || "Payslips"}
                        </ThemedText>

                        <Text style={[styles.count, {color:themeColors.subtleText}]}>
                            {payslips.length} Payslips
                        </Text>
                    </View>
                </View>

                <FlatList
                    data={payslips}
                    keyExtractor={(item, index) => String(index)}
                    renderItem={renderPayslip}
                    refreshing={loading}
                    onRefresh={fetchPayslips}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 8,
                        paddingBottom:insets.bottom + 30
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={[styles.emptyTitle, {color:themeColors.text}]}>
                                {loading ? "Loading payslips..." : "No payslips found"}
                            </Text>

                            {!loading && (
                                <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                    Try selecting another pay period or status.
                                </Text>
                            )}
                        </View>
                    }
                />

                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    enableContentPanningGesture
                    enableHandlePanningGesture
                    enableDynamicSizing={false}
                    handleIndicatorStyle={{backgroundColor:themeColors.icon, marginTop:10}}
                    backgroundStyle={{backgroundColor:themeColors.background, borderTopWidth:1, borderTopColor:themeColors.info}}
                >
                    <ThemedText style={{fontFamily:'SemiBold', fontSize:20, marginBottom:20, textAlign:'center', marginTop:10}}>
                        {sheetTitle}
                    </ThemedText>

                    <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                        {sheetOptions.map(option => {
                            const selected = String(getSelectedSheetKey()) === String(option.key)

                            return (
                                <TouchableOpacity
                                    key={String(option.key)}
                                    activeOpacity={0.7}
                                    style={{
                                        padding:20,
                                        backgroundColor:selected ? themeColors.subtleBackground : themeColors.card,
                                        borderRadius:5,
                                        marginBottom:5,
                                        flexDirection:'row',
                                        alignItems:'center',
                                        justifyContent:'space-between'
                                    }}
                                    onPress={() => selectSheetOption(option)}
                                >
                                    <Text style={{fontSize:Typography.body, color:themeColors.text, fontFamily:"Medium"}}>
                                        {option.value}
                                    </Text>

                                    {selected && (
                                        <IconSymbol
                                            name="check"
                                            size={20}
                                            color={themeColors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )
                        })}
                    </BottomSheetScrollView>
                </BottomSheet>
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
    filters:{flexDirection:'row', justifyContent:'space-between'},
    filter:{width:'49%', borderWidth:1, borderRadius:Borders.radiusSmall, paddingHorizontal:12, paddingVertical:10},
    filterLabel:{fontSize:11, marginBottom:4},
    filterValue:{fontSize:13, fontFamily:'Medium'},
    listHeader:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:Spacing.medium},
    listTitle:{fontSize:17, fontFamily:'SemiBold'},
    count:{fontSize:12},
    card:{borderWidth:1, borderRadius:Borders.radiusMedium, padding:Spacing.medium, marginBottom:10},
    cardHeader:{flexDirection:'row', alignItems:'center'},
    employeeName:{fontSize:14, fontFamily:'SemiBold'},
    employeeMeta:{fontSize:11, marginTop:4},
    payDate:{fontSize:12, marginTop:10},
    divider:{height:1, marginVertical:Spacing.medium},
    amountRow:{flexDirection:'row', justifyContent:'space-between'},
    label:{fontSize:10, marginBottom:4},
    amount:{fontSize:11, fontFamily:'Medium'},
    netAmount:{fontSize:12, fontFamily:'SemiBold'},
    empty:{alignItems:'center', paddingTop:70, paddingHorizontal:30},
    emptyTitle:{fontSize:16, fontFamily:'SemiBold', marginBottom:6},
    emptyText:{fontSize:13, textAlign:'center', lineHeight:20}
})

export default PayslipsScreen
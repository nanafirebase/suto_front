import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { PayrollNavigationList, BottomSheetSelectOption } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { SocketIO } from '../../../configuration/helpers/main.helpers'
import { ThemedText } from '../../../components/ui/ThemedText'
import { ThemedView } from '../../../components/ui/ThemedView'
import { IconSymbol } from '../../../components/ui/icon-symbol'

type TMyPayslipsScreen = NativeStackScreenProps<PayrollNavigationList, "MyPayslipsScreen">

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
    payPeriodName?: string
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

const MyPayslipsScreen = ({navigation}:TMyPayslipsScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {selectedBusiness, session} = useAppContainer()

    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [payPeriods, setPayPeriods] = useState<BottomSheetSelectOption[]>([])
    const [selectedPayPeriod, setSelectedPayPeriod] = useState<BottomSheetSelectOption|null>(null)
    const [status, setStatus] = useState("all")
    const [loading, setLoading] = useState(false)

    const [sheetTitle, setSheetTitle] = useState("")
    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [activeSheet, setActiveSheet] = useState<"period"|"status"|null>(null)

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["40%", "55%"], [])

    const openBottomSheet = (
        type:"period"|"status",
        options:BottomSheetSelectOption[],
        title:string
    ) => {
        setActiveSheet(type)
        setSheetOptions(options)
        setSheetTitle(title)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectOption = (option:BottomSheetSelectOption) => {
        if (activeSheet === "period") {
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

    const fetchPayPeriods = async () => {
        if (!selectedBusiness.id) return

        SocketIO.emit(
            'fetch-pay-periods',
            {
                sessionID:session,
                businessID:selectedBusiness.id,
                statusFilter:'all'
            },
            (response:any) => {
                if (response.status === "success") {
                    setPayPeriods([
                        {key:"all", value:"All Periods"},
                        ...(response.data || []).map((item:any) => ({
                            key:item.id,
                            value:item.name || item.payPeriodName || item.period
                        }))
                    ])
                }
            }
        )
    }

    const fetchPayslips = async () => {
        if (!selectedBusiness.id || !selectedBusiness?.employee_id) return

        setLoading(true)

        SocketIO.emit(
            'fetch-payslips',
            {
                sessionID:session,
                businessID:selectedBusiness.id,
                payPeriodID:selectedPayPeriod?.key && selectedPayPeriod.key !== "all"
                    ? selectedPayPeriod.key
                    : undefined,
                employeeID: selectedBusiness.employee_id,
                status:status !== "all" ? status : undefined
            },
            (response:any) => {
                setLoading(false)

                if (response.status !== "success") {
                    Alert.alert(
                        "Error",
                        response.message || "Failed to load payslips"
                    )
                    return
                }

                setPayslips(response.data || [])
            }
        )
    }

    useFocusEffect(
        useCallback(() => {
            if (!selectedBusiness.id) return

            fetchPayPeriods()
            fetchPayslips()
        }, [
            selectedBusiness.id,
            selectedPayPeriod?.key,
            status
        ])
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

    const getStatusColor = (value?:string) => {
        const currentStatus = String(value || "").toLowerCase()

        if (currentStatus === "paid") return "#34C759"
        if (currentStatus === "processed") return themeColors.primary
        if (currentStatus === "cancelled") return "#FF3B30"

        return themeColors.subtleText
    }

    const openPayslip = (payslip:Payslip) => {
        navigation.navigate("PayslipDetailsScreen", {
            payslipData:payslip
        })
    }

    const renderPayslip = ({item}: {item:Payslip}) => {
        const periodName = item.payPeriodName || "Payroll"

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openPayslip(item)}
                style={[
                    styles.card,
                    {
                        backgroundColor:themeColors.card,
                        borderColor:themeColors.border
                    }
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={{flex:1}}>
                        <Text style={[
                            styles.periodName,
                            {color:themeColors.text}
                        ]}>
                            {periodName}
                        </Text>

                        <Text style={[
                            styles.payDate,
                            {color:themeColors.subtleText}
                        ]}>
                            Pay Date: {formatDate(item.payDate)}
                        </Text>
                    </View>

                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusDot,
                            {
                                backgroundColor:getStatusColor(
                                    item.status || item.payrollRunStatus
                                )
                            }
                        ]} />

                        <Text style={[
                            styles.statusText,
                            {
                                color:getStatusColor(
                                    item.status || item.payrollRunStatus
                                )
                            }
                        ]}>
                            {item.status || item.payrollRunStatus || "Processed"}
                        </Text>
                    </View>
                </View>

                <View style={[
                    styles.divider,
                    {backgroundColor:themeColors.border}
                ]} />

                <View style={styles.amountRow}>
                    <View>
                        <Text style={[
                            styles.label,
                            {color:themeColors.subtleText}
                        ]}>
                            Gross
                        </Text>

                        <Text style={[
                            styles.amount,
                            {color:themeColors.text}
                        ]}>
                            {formatAmount(
                                item.grossAmount,
                                item.currencyCode
                            )}
                        </Text>
                    </View>

                    <View>
                        <Text style={[
                            styles.label,
                            {color:themeColors.subtleText}
                        ]}>
                            Deductions
                        </Text>

                        <Text style={[
                            styles.amount,
                            {color:themeColors.text}
                        ]}>
                            {formatAmount(
                                item.deductionAmount,
                                item.currencyCode
                            )}
                        </Text>
                    </View>

                    <View style={{alignItems:'flex-end'}}>
                        <Text style={[
                            styles.label,
                            {color:themeColors.subtleText}
                        ]}>
                            Net Pay
                        </Text>

                        <Text style={[
                            styles.netAmount,
                            {color:themeColors.primary}
                        ]}>
                            {formatAmount(
                                item.netAmount,
                                item.currencyCode
                            )}
                        </Text>
                    </View>
                </View>

                <View style={styles.viewRow}>
                    <Text style={[
                        styles.viewText,
                        {color:themeColors.primary}
                    ]}>
                        View Payslip
                    </Text>

                    <IconSymbol
                        name="chevron.right"
                        size={16}
                        color={themeColors.primary}
                    />
                </View>
            </TouchableOpacity>
        )
    }

    const statusOptions:BottomSheetSelectOption[] = [
        {key:"all", value:"All Statuses"},
        {key:"processed", value:"Processed"},
        {key:"paid", value:"Paid"},
        {key:"cancelled", value:"Cancelled"}
    ]

    return (
        <View style={[
            styles.container,
            {backgroundColor:themeColors.background}
        ]}>
            {Platform.OS === 'android' && (
                <View style={[
                    styles.statusBarSpacer,
                    {backgroundColor:themeColors.background}
                ]} />
            )}

            <View style={[
                styles.safeArea,
                {
                    paddingTop:
                        Platform.OS === 'ios'
                            ? insets.top
                            : 0
                }
            ]}>
                <ThemedView style={[
                    styles.header,
                    {
                        backgroundColor:themeColors.background,
                        borderBottomColor:themeColors.border
                    }
                ]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.backButton,
                            {
                                backgroundColor:
                                    themeColors.subtleBackground
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
                        My Payslips
                    </ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <View style={{
                    paddingHorizontal:Spacing.medium,
                    paddingTop:Spacing.medium
                }}>
                    <View style={styles.filters}>
                        <TouchableOpacity
                            onPress={() => openBottomSheet(
                                "period",
                                payPeriods,
                                "Select Pay Period"
                            )}
                            style={[
                                styles.filter,
                                {
                                    backgroundColor:
                                        themeColors.inputBackground,
                                    borderColor:
                                        themeColors.border
                                }
                            ]}
                        >
                            <Text style={[
                                styles.filterLabel,
                                {color:themeColors.subtleText}
                            ]}>
                                Pay Period
                            </Text>

                            <View style={styles.filterValueRow}>
                                <Text style={[
                                    styles.filterValue,
                                    {color:themeColors.text}
                                ]}>
                                    {selectedPayPeriod?.value || "All Periods"}
                                </Text>

                                <IconSymbol
                                    name="chevron-down"
                                    size={14}
                                    color={themeColors.subtleText}
                                />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => openBottomSheet(
                                "status",
                                statusOptions,
                                "Select Status"
                            )}
                            style={[
                                styles.filter,
                                {
                                    backgroundColor:
                                        themeColors.inputBackground,
                                    borderColor:
                                        themeColors.border
                                }
                            ]}
                        >
                            <Text style={[
                                styles.filterLabel,
                                {color:themeColors.subtleText}
                            ]}>
                                Status
                            </Text>

                            <View style={styles.filterValueRow}>
                                <Text style={[
                                    styles.filterValue,
                                    {color:themeColors.text}
                                ]}>
                                    {status === "all"
                                        ? "All Statuses"
                                        : status}
                                </Text>

                                <IconSymbol
                                    name="chevron-down"
                                    size={14}
                                    color={themeColors.subtleText}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.listHeader}>
                        <ThemedText style={styles.listTitle}>
                            My Payslips
                        </ThemedText>

                        <Text style={[
                            styles.count,
                            {color:themeColors.subtleText}
                        ]}>
                            {payslips.length} Payslips
                        </Text>
                    </View>
                </View>

                <FlatList
                    data={payslips}
                    keyExtractor={(item, index) =>
                        String(index)
                    }
                    renderItem={renderPayslip}
                    refreshing={loading}
                    onRefresh={fetchPayslips}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal:8,
                        paddingBottom:insets.bottom + 30
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={[
                                styles.emptyIcon,
                                {
                                    backgroundColor:
                                        themeColors.subtleBackground
                                }
                            ]}>
                                <IconSymbol
                                    name="document-outline"
                                    size={28}
                                    color={themeColors.subtleText}
                                />
                            </View>

                            <Text style={[
                                styles.emptyTitle,
                                {color:themeColors.text}
                            ]}>
                                {loading
                                    ? "Loading payslips..."
                                    : "No payslips found"}
                            </Text>

                            {!loading && (
                                <Text style={[
                                    styles.emptyText,
                                    {color:themeColors.subtleText}
                                ]}>
                                    Your processed payslips will appear here.
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
                    handleIndicatorStyle={{
                        backgroundColor:themeColors.icon,
                        marginTop:10
                    }}
                    backgroundStyle={{
                        backgroundColor:themeColors.background,
                        borderTopWidth:1,
                        borderTopColor:themeColors.border
                    }}
                >
                    <ThemedText style={{
                        fontFamily:'SemiBold',
                        fontSize:20,
                        marginBottom:20,
                        textAlign:'center',
                        marginTop:10
                    }}>
                        {sheetTitle}
                    </ThemedText>

                    <BottomSheetScrollView
                        contentContainerStyle={{
                            paddingHorizontal:16,
                            paddingBottom:insets.bottom + 20
                        }}
                    >
                        {sheetOptions.map(option => {
                            const selected =
                                activeSheet === "period"
                                    ? (
                                        option.key === "all"
                                            ? !selectedPayPeriod
                                            : selectedPayPeriod?.key === option.key
                                    )
                                    : status === String(option.key)

                            return (
                                <TouchableOpacity
                                    key={String(option.key)}
                                    onPress={() => selectOption(option)}
                                    style={[
                                        styles.sheetOption,
                                        {
                                            backgroundColor:
                                                selected
                                                    ? themeColors.subtleBackground
                                                    : themeColors.card,
                                            borderColor:
                                                selected
                                                    ? themeColors.primary
                                                    : themeColors.border
                                        }
                                    ]}
                                >
                                    <Text style={[
                                        styles.sheetOptionText,
                                        {color:themeColors.text}
                                    ]}>
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
    backButton:{
        width:36,
        height:36,
        borderRadius:18,
        alignItems:'center',
        justifyContent:'center'
    },
    filters:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    filter:{
        width:'49%',
        borderWidth:1,
        borderRadius:Borders.radiusSmall,
        paddingHorizontal:12,
        paddingVertical:10
    },
    filterLabel:{
        fontSize:11,
        marginBottom:4
    },
    filterValueRow:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between'
    },
    filterValue:{
        fontSize:13,
        fontFamily:'Medium',
        flex:1
    },
    listHeader:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginVertical:Spacing.medium
    },
    listTitle:{
        fontSize:15,
        fontFamily:'SemiBold'
    },
    count:{
        fontSize:11
    },
    card:{
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        padding:Spacing.medium,
        marginBottom:10
    },
    cardHeader:{
        flexDirection:'row',
        alignItems:'flex-start'
    },
    periodName:{
        fontSize:14,
        fontFamily:'SemiBold'
    },
    payDate:{
        fontSize:11,
        marginTop:4
    },
    statusContainer:{
        flexDirection:'row',
        alignItems:'center',
        gap:5
    },
    statusDot:{
        width:7,
        height:7,
        borderRadius:4
    },
    statusText:{
        fontSize:11,
        fontFamily:'Medium',
        textTransform:'capitalize'
    },
    divider:{
        height:1,
        marginVertical:Spacing.medium
    },
    amountRow:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    label:{
        fontSize:10,
        marginBottom:4
    },
    amount:{
        fontSize:11,
        fontFamily:'Medium'
    },
    netAmount:{
        fontSize:12,
        fontFamily:'SemiBold'
    },
    viewRow:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'flex-end',
        marginTop:Spacing.medium,
        gap:5
    },
    viewText:{
        fontSize:12,
        fontFamily:'Medium'
    },
    empty:{
        alignItems:'center',
        paddingTop:70,
        paddingHorizontal:30
    },
    emptyIcon:{
        width:60,
        height:60,
        borderRadius:30,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:15
    },
    emptyTitle:{
        fontSize:16,
        fontFamily:'SemiBold',
        marginBottom:6
    },
    emptyText:{
        fontSize:13,
        textAlign:'center',
        lineHeight:20
    },
    sheetOption:{
        minHeight:58,
        paddingHorizontal:18,
        paddingVertical:16,
        borderRadius:Borders.radiusSmall,
        borderWidth:1,
        marginBottom:7,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between'
    },
    sheetOptionText:{
        fontSize:Typography.body,
        fontFamily:'Medium'
    }
})

export default MyPayslipsScreen
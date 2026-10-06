import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { BottomSheetSelectOption, PayrollNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { Borders, Spacing, Typography } from '../../../utils/constants/Design'
import { ThemedText } from '../../../components/ui/ThemedText'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { SocketIO } from '../../../configuration/helpers/main.helpers'

type PayrollRun = {
    id:string|number
    payPeriodID:string|number
    payPeriodName?:string
    payDate:string|Date
    employeeCount:number
    grossAmount:number
    allowanceAmount:number
    overtimeAmount:number
    deductionAmount:number
    taxAmount:number
    netAmount:number
    status:string
    branchID?:number
    departmentID?:number
    employeeCategory?:string
    createdAt?:string|Date
}

type PayRunForm = {
    payPeriod:BottomSheetSelectOption|null
    department:BottomSheetSelectOption|null
    branch:BottomSheetSelectOption|null
    employeeCategory:BottomSheetSelectOption|null
    status:BottomSheetSelectOption|null
}

type TPayRunScreen = NativeStackScreenProps<PayrollNavigationList, "PayRunScreen">

const PayRunScreen = ({navigation}:TPayRunScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const {selectedBusiness, session} = useAppContainer()
    const insets = useSafeAreaInsets()

    const [payPeriods, setPayPeriods] = useState<BottomSheetSelectOption[]>([])
    const [departments, setDepartments] = useState<BottomSheetSelectOption[]>([])
    const [branches, setBranches] = useState<BottomSheetSelectOption[]>([])
    const [employeeCategories, setEmployeeCategories] = useState<BottomSheetSelectOption[]>([])
    const [statuses, setStatuses] = useState<BottomSheetSelectOption[]>([
        {key:"all", value:"All Statuses"},
        {key:"completed", value:"Completed"},
        {key:"processing", value:"Processing"},
        {key:"failed", value:"Failed"}
    ])

    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [filterLoading, setFilterLoading] = useState(false)

    const [form, setForm] = useState<PayRunForm>({
        payPeriod:null,
        department:null,
        branch:null,
        employeeCategory:null,
        status:null
    })

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState("")
    const [activeField, setActiveField] = useState<keyof PayRunForm|null>(null)

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["40%", "50%", "75%"], [])

    const openBottomSheet = (field:keyof PayRunForm, options:BottomSheetSelectOption[], title:string) => {
        setActiveField(field)
        setSheetOptions(options)
        setSheetTitle(title)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectOption = (option:BottomSheetSelectOption) => {
        if (!activeField) return

        setForm(prev => ({
            ...prev,
            [activeField]:option
        }))

        bottomSheetRef.current?.close()
    }

    const fetchPayPeriods = async () => {
        return new Promise<void>((resolve) => {
            SocketIO.emit('fetch-pay-periods', {
                sessionID:session,
                businessID:selectedBusiness.id
            }, (response:any) => {
                if (response.status === "success") {
                    setPayPeriods([
                        {key:"all", value:"All Pay Periods"},
                        ...(response.data || []).map((item:any) => ({
                            key:item.id,
                            value:item.name || item.payPeriodName || item.period
                        }))
                    ])
                } else {
                    Alert.alert("Error", response.message || "Failed to load pay periods")
                }
                resolve()
            })
        })
    }

    const fetchDepartments = async () => {
        return new Promise<void>((resolve) => {
            SocketIO.emit('fetch-departments', {
                sessionID:session,
                businessID:selectedBusiness.id
            }, (response:any) => {
                if (response.status === "success") {
                    setDepartments([
                        {key:"all", value:"All Departments"},
                        ...(response.data || []).map((item:any) => ({
                            key:item.id,
                            value:item.name
                        }))
                    ])
                } else {
                    Alert.alert("Error", response.message || "Failed to load departments")
                }
                resolve()
            })
        })
    }

    const fetchBranches = async () => {
        return new Promise<void>((resolve) => {
            SocketIO.emit('fetch-locations', {
                sessionID:session,
                businessID:selectedBusiness.id
            }, (response:any) => {
                if (response.status === "success") {
                    setBranches([
                        {key:"all", value:"All Branches"},
                        ...(response.data || []).map((item:any) => ({
                            key:item.id,
                            value:item.name
                        }))
                    ])
                } else {
                    Alert.alert("Error", response.message || "Failed to load branches")
                }
                resolve()
            })
        })
    }

    const fetchEmployeeCategories = async () => {
        return new Promise<void>((resolve) => {
            SocketIO.emit('fetch-employee-categories', {
                sessionID:session,
                businessID:selectedBusiness.id
            }, (response:any) => {
                if (response.status === "success") {
                    setEmployeeCategories([
                        {key:"all", value:"All Employee Categories"},
                        ...(response.data || []).map((item:any) => ({
                            key:item.id,
                            value:item.name
                        }))
                    ])
                } else {
                    Alert.alert("Error", response.message || "Failed to load employee categories")
                }
                resolve()
            })
        })
    }

    const fetchPayrollRuns = useCallback(async (isRefresh = false) => {
        if (!selectedBusiness?.id) return

        if (isRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        const payPeriodID = form.payPeriod?.key && form.payPeriod.key !== "all"
            ? form.payPeriod.key
            : undefined

        const departmentID = form.department?.key && form.department.key !== "all"
            ? Number(form.department.key)
            : undefined

        const branchID = form.branch?.key && form.branch.key !== "all"
            ? Number(form.branch.key)
            : undefined

        const employeeCategory = form.employeeCategory?.key && form.employeeCategory.key !== "all"
            ? String(form.employeeCategory.key)
            : undefined

        const status = form.status?.key && form.status.key !== "all"
            ? String(form.status.key)
            : undefined

        SocketIO.emit('fetch-payroll-runs', {
            sessionID:session,
            businessID:selectedBusiness.id,
            payPeriodID,
            departmentID,
            branchID,
            employeeCategory,
            status
        }, (response:any) => {
            setLoading(false)
            setRefreshing(false)
            setFilterLoading(false)

            if (response.status !== "success") {
                Alert.alert("Error", response.message || "Failed to load payroll runs")
                return
            }

            setPayrollRuns(response.data || [])
        })
    }, [
        selectedBusiness?.id,
        session,
        form.payPeriod,
        form.department,
        form.branch,
        form.employeeCategory,
        form.status
    ])

    useEffect(() => {
        if (!selectedBusiness?.id) return

        const loadFilters = async () => {
            await Promise.all([
                fetchPayPeriods(),
                fetchDepartments(),
                fetchBranches(),
                fetchEmployeeCategories()
            ])
        }

        loadFilters()
    }, [selectedBusiness?.id])

    useEffect(() => {
        if (!selectedBusiness?.id) return
        fetchPayrollRuns()
    }, [
        selectedBusiness?.id,
        form.payPeriod,
        form.department,
        form.branch,
        form.employeeCategory,
        form.status
    ])

    const onRefresh = () => {
        fetchPayrollRuns(true)
    }

    const clearFilters = () => {
        setForm({
            payPeriod:null,
            department:null,
            branch:null,
            employeeCategory:null,
            status:null
        })
    }

    const getSelectedText = (field:keyof PayRunForm, placeholder:string) => {
        return form[field]?.value || placeholder
    }

    const formatAmount = (amount:number) => {
        return Number(amount || 0).toLocaleString('en-GH', {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        })
    }

    const formatDate = (date:string|Date) => {
        if (!date) return "-"

        const value = new Date(date)

        if (Number.isNaN(value.getTime())) return String(date)

        return value.toLocaleDateString('en-GB', {
            day:'2-digit',
            month:'short',
            year:'numeric'
        })
    }

    const getStatusColor = (status:string) => {
        switch (String(status).toLowerCase()) {
            case "completed":
                return themeColors.success || '#34C759'
            case "processing":
                return themeColors.info || '#007AFF'
            case "failed":
                return themeColors.error || '#FF3B30'
            default:
                return themeColors.subtleText
        }
    }

    const getStatusBackground = (status:string) => {
        const color = getStatusColor(status)
        return `${color}18`
    }

    const openPayrollRun = (payrollRun:PayrollRun) => {
        navigation.navigate("PayrollRunDetailsScreen", {
            payrollRunData: payrollRun
        })
    }

    const hasFilters = !!(
        form.payPeriod ||
        form.department ||
        form.branch ||
        form.employeeCategory ||
        form.status
    )

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
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.backButtonMain,
                            {backgroundColor:themeColors.subtleBackground}
                        ]}
                    >
                        <IconSymbol
                            name="arrow.left"
                            size={20}
                            color={themeColors.icon}
                        />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Pay Runs
                    </ThemedText>

                    <TouchableOpacity
                        onPress={() => {
                            setFilterLoading(true)
                            bottomSheetRef.current?.snapToIndex(0)
                            setFilterLoading(false)
                        }}
                        style={[
                            styles.filterButton,
                            {
                                backgroundColor:hasFilters
                                    ? themeColors.primary
                                    : themeColors.subtleBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="list"
                            size={19}
                            color={hasFilters ? '#FFFFFF' : themeColors.icon}
                        />
                    </TouchableOpacity>
                </View>

                <View style={[
                    styles.filterSummary,
                    {
                        backgroundColor:themeColors.background,
                        borderBottomColor:themeColors.border
                    }
                ]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterSummaryContent}
                    >
                        <TouchableOpacity
                            onPress={() => openBottomSheet(
                                "payPeriod",
                                payPeriods,
                                "Select Pay Period"
                            )}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:form.payPeriod
                                        ? themeColors.primary
                                        : themeColors.subtleBackground
                                }
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                {
                                    color:form.payPeriod
                                        ? '#FFFFFF'
                                        : themeColors.text
                                }
                            ]}>
                                {getSelectedText("payPeriod", "Pay Period")}
                            </Text>

                            <IconSymbol
                                name="chevron-down"
                                size={13}
                                color={form.payPeriod ? '#FFFFFF' : themeColors.icon}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => openBottomSheet(
                                "department",
                                departments,
                                "Select Department"
                            )}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:form.department
                                        ? themeColors.primary
                                        : themeColors.subtleBackground
                                }
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                {
                                    color:form.department
                                        ? '#FFFFFF'
                                        : themeColors.text
                                }
                            ]}>
                                {getSelectedText("department", "Department")}
                            </Text>

                            <IconSymbol
                                name="chevron-down"
                                size={13}
                                color={form.department ? '#FFFFFF' : themeColors.icon}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => openBottomSheet(
                                "branch",
                                branches,
                                "Select Branch"
                            )}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:form.branch
                                        ? themeColors.primary
                                        : themeColors.subtleBackground
                                }
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                {
                                    color:form.branch
                                        ? '#FFFFFF'
                                        : themeColors.text
                                }
                            ]}>
                                {getSelectedText("branch", "Branch")}
                            </Text>

                            <IconSymbol
                                name="chevron-down"
                                size={13}
                                color={form.branch ? '#FFFFFF' : themeColors.icon}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => openBottomSheet(
                                "employeeCategory",
                                employeeCategories,
                                "Select Employee Category"
                            )}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:form.employeeCategory
                                        ? themeColors.primary
                                        : themeColors.subtleBackground
                                }
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                {
                                    color:form.employeeCategory
                                        ? '#FFFFFF'
                                        : themeColors.text
                                }
                            ]}>
                                {getSelectedText("employeeCategory", "Category")}
                            </Text>

                            <IconSymbol
                                name="chevron-down"
                                size={13}
                                color={form.employeeCategory ? '#FFFFFF' : themeColors.icon}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => openBottomSheet(
                                "status",
                                statuses,
                                "Select Status"
                            )}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:form.status
                                        ? themeColors.primary
                                        : themeColors.subtleBackground
                                }
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                {
                                    color:form.status
                                        ? '#FFFFFF'
                                        : themeColors.text
                                }
                            ]}>
                                {getSelectedText("status", "Status")}
                            </Text>

                            <IconSymbol
                                name="chevron-down"
                                size={13}
                                color={form.status ? '#FFFFFF' : themeColors.icon}
                            />
                        </TouchableOpacity>

                        {hasFilters && (
                            <TouchableOpacity
                                onPress={clearFilters}
                                style={[
                                    styles.clearButton,
                                    {
                                        backgroundColor:themeColors.subtleBackground
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.clearButtonText,
                                    {color:themeColors.primary}
                                ]}>
                                    Clear
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="small"
                            color={themeColors.primary}
                        />

                        <Text style={[
                            styles.loadingText,
                            {color:themeColors.subtleText}
                        ]}>
                            Loading pay runs...
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={[
                            styles.contentContainer,
                            {
                                paddingBottom:insets.bottom + 40
                            }
                        ]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={themeColors.primary}
                            />
                        }
                    >

                        {payrollRuns.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <View style={[
                                    styles.emptyIcon,
                                    {
                                        backgroundColor:themeColors.subtleBackground
                                    }
                                ]}>
                                    <IconSymbol
                                        name="document-outline"
                                        size={30}
                                        color={themeColors.icon}
                                    />
                                </View>

                                <ThemedText style={styles.emptyTitle}>
                                    No Pay Runs
                                </ThemedText>

                                <Text style={[
                                    styles.emptyDescription,
                                    {color:themeColors.subtleText}
                                ]}>
                                    No payroll runs were found for the selected filters.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.resultHeader}>
                                    <ThemedText style={styles.resultTitle}>
                                        Payroll Runs
                                    </ThemedText>

                                    <Text style={[
                                        styles.resultCount,
                                        {color:themeColors.subtleText}
                                    ]}>
                                        {payrollRuns.length} {payrollRuns.length === 1 ? 'run' : 'runs'}
                                    </Text>
                                </View>

                                {payrollRuns.map((run, index) => (
                                    <TouchableOpacity
                                        key={String(run.id)}
                                        onPress={() => openPayrollRun(run)}
                                        activeOpacity={0.8}
                                        style={[
                                            styles.payrollCard,
                                            {
                                                backgroundColor:themeColors.card,
                                                borderColor:themeColors.border
                                            }
                                        ]}
                                    >
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardTitleContainer}>
                                                <ThemedText
                                                    numberOfLines={1}
                                                    style={styles.payPeriodName}
                                                >
                                                    {run.payPeriodName || `Payroll Run #${run.id}`}
                                                </ThemedText>

                                                <Text style={[
                                                    styles.payDate,
                                                    {color:themeColors.subtleText}
                                                ]}>
                                                    {formatDate(run.payDate)}
                                                </Text>
                                            </View>

                                            <View style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:getStatusBackground(run.status)
                                                }
                                            ]}>
                                                <View style={[
                                                    styles.statusDot,
                                                    {
                                                        backgroundColor:getStatusColor(run.status)
                                                    }
                                                ]} />

                                                <Text style={[
                                                    styles.statusText,
                                                    {
                                                        color:getStatusColor(run.status)
                                                    }
                                                ]}>
                                                    {String(run.status).charAt(0).toUpperCase() + String(run.status).slice(1)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={[
                                            styles.employeeCountContainer,
                                            {
                                                backgroundColor:themeColors.subtleBackground
                                            }
                                        ]}>
                                            <IconSymbol
                                                name="person"
                                                size={16}
                                                color={themeColors.icon}
                                            />

                                            <Text style={[
                                                styles.employeeCountText,
                                                {color:themeColors.text}
                                            ]}>
                                                {run.employeeCount} {run.employeeCount === 1 ? 'Employee' : 'Employees'}
                                            </Text>
                                        </View>

                                        <View style={[
                                            styles.amountsContainer,
                                            {
                                                borderTopColor:themeColors.border
                                            }
                                        ]}>
                                            <View style={styles.amountColumn}>
                                                <Text style={[
                                                    styles.amountLabel,
                                                    {color:themeColors.subtleText}
                                                ]}>
                                                    Gross
                                                </Text>

                                                <Text
                                                    numberOfLines={1}
                                                    style={[
                                                        styles.amountValue,
                                                        {color:themeColors.text}
                                                    ]}
                                                >
                                                    GHS {formatAmount(run.grossAmount)}
                                                </Text>
                                            </View>

                                            <View style={styles.amountColumn}>
                                                <Text style={[
                                                    styles.amountLabel,
                                                    {color:themeColors.subtleText}
                                                ]}>
                                                    Deductions
                                                </Text>

                                                <Text
                                                    numberOfLines={1}
                                                    style={[
                                                        styles.amountValue,
                                                        {color:themeColors.text}
                                                    ]}
                                                >
                                                    GHS {formatAmount(run.deductionAmount)}
                                                </Text>
                                            </View>

                                            <View style={styles.amountColumn}>
                                                <Text style={[
                                                    styles.amountLabel,
                                                    {color:themeColors.subtleText}
                                                ]}>
                                                    Net Pay
                                                </Text>

                                                <Text
                                                    numberOfLines={1}
                                                    style={[
                                                        styles.amountValue,
                                                        {
                                                            color:themeColors.primary,
                                                            fontFamily:'SemiBold'
                                                        }
                                                    ]}
                                                >
                                                    GHS {formatAmount(run.netAmount)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardFooter}>
                                            <Text style={[
                                                styles.runID,
                                                {color:themeColors.subtleText}
                                            ]}>
                                                Run #{run.id}
                                            </Text>

                                            <IconSymbol
                                                name="chevron.right"
                                                size={17}
                                                color={themeColors.icon}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                    </ScrollView>
                )}

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
                        borderTopColor:themeColors.info
                    }}
                >
                    <ThemedText style={styles.sheetTitle}>
                        {sheetTitle || "Select Filter"}
                    </ThemedText>

                    <BottomSheetScrollView
                        contentContainerStyle={{
                            paddingHorizontal:16,
                            paddingBottom:insets.bottom + 20
                        }}
                    >
                        {sheetOptions.map(option => {
                            const selected = form[activeField || "payPeriod"]?.key === option.key

                            return (
                                <TouchableOpacity
                                    key={String(option.key)}
                                    style={[
                                        styles.sheetOption,
                                        {
                                            backgroundColor:selected
                                                ? themeColors.primary
                                                : themeColors.card,
                                            borderColor:themeColors.border
                                        }
                                    ]}
                                    onPress={() => selectOption(option)}
                                >
                                    <Text style={[
                                        styles.sheetOptionText,
                                        {
                                            color:selected
                                                ? '#FFFFFF'
                                                : themeColors.text
                                        }
                                    ]}>
                                        {option.value}
                                    </Text>

                                    {selected && (
                                        <IconSymbol
                                            name="check"
                                            size={18}
                                            color="#FFFFFF"
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
    backButtonMain:{
        width:36,
        height:36,
        borderRadius:18,
        alignItems:'center',
        justifyContent:'center'
    },
    filterButton:{
        width:36,
        height:36,
        borderRadius:18,
        alignItems:'center',
        justifyContent:'center'
    },
    filterSummary:{
        borderBottomWidth:1
    },
    filterSummaryContent:{
        paddingHorizontal:Spacing.screenPadding,
        paddingVertical:10,
        gap:8
    },
    filterChip:{
        flexDirection:'row',
        alignItems:'center',
        gap:5,
        paddingHorizontal:12,
        paddingVertical:9,
        borderRadius:20
    },
    filterChipText:{
        fontSize:Typography.small,
        fontFamily:'Medium'
    },
    clearButton:{
        justifyContent:'center',
        paddingHorizontal:12,
        paddingVertical:9,
        borderRadius:20
    },
    clearButtonText:{
        fontSize:Typography.small,
        fontFamily:'Medium'
    },
    scrollContainer:{
        flex:1
    },
    contentContainer:{
        padding: 7
    },
    loadingContainer:{
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        gap:10
    },
    loadingText:{
        fontSize:Typography.small,
        fontFamily:'Regular'
    },
    resultHeader:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        marginBottom:12,
        marginTop: 5,
        paddingHorizontal: 10
    },
    resultTitle:{
        fontSize:15,
        fontFamily:'Medium'
    },
    resultCount:{
        fontSize:Typography.small,
        fontFamily:'Regular'
    },
    payrollCard:{
        borderWidth:1,
        borderRadius:Borders.radiusSmall,
        padding:16,
        marginBottom:10
    },
    cardHeader:{
        flexDirection:'row',
        alignItems:'flex-start',
        justifyContent:'space-between',
        marginBottom:14
    },
    cardTitleContainer:{
        flex:1,
        paddingRight:10
    },
    payPeriodName:{
        fontSize:17,
        fontFamily:'SemiBold',
        marginBottom:4
    },
    payDate:{
        fontSize:Typography.small,
        fontFamily:'Regular'
    },
    statusBadge:{
        flexDirection:'row',
        alignItems:'center',
        gap:5,
        paddingHorizontal:9,
        paddingVertical:6,
        borderRadius:20
    },
    statusDot:{
        width:6,
        height:6,
        borderRadius:3
    },
    statusText:{
        fontSize:11,
        fontFamily:'Medium'
    },
    employeeCountContainer:{
        flexDirection:'row',
        alignItems:'center',
        alignSelf:'flex-start',
        gap:7,
        paddingHorizontal:10,
        paddingVertical:7,
        borderRadius:6,
        marginBottom:15
    },
    employeeCountText:{
        fontSize:Typography.small,
        fontFamily:'Medium'
    },
    amountsContainer:{
        flexDirection:'row',
        borderTopWidth:1,
        paddingTop:15
    },
    amountColumn:{
        flex:1
    },
    amountLabel:{
        fontSize:11,
        fontFamily:'Regular',
        marginBottom:5
    },
    amountValue:{
        fontSize:Typography.small,
        fontFamily:'Medium'
    },
    cardFooter:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        marginTop:15
    },
    runID:{
        fontSize:11,
        fontFamily:'Regular'
    },
    emptyContainer:{
        alignItems:'center',
        justifyContent:'center',
        paddingTop:100,
        paddingHorizontal:30
    },
    emptyIcon:{
        width:64,
        height:64,
        borderRadius:32,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:15
    },
    emptyTitle:{
        fontSize:20,
        fontFamily:'SemiBold',
        marginBottom:7
    },
    emptyDescription:{
        textAlign:'center',
        fontSize:Typography.small,
        fontFamily:'Regular',
        lineHeight:19
    },
    sheetTitle:{
        fontFamily:'SemiBold',
        fontSize:20,
        marginBottom:20,
        textAlign:'center',
        marginTop:10
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

export default PayRunScreen
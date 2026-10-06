import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useRef, useState } from 'react'
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

type TAdminLoanListScreen = NativeStackScreenProps<PayrollNavigationList, "AdminLoanListScreen">

type Loan = {
    id?: string | number
    employeeID?: string | number
    employeeFirstName?: string
    employeeLastName?: string
    firstName?: string
    lastName?: string
    employeePhone?: string
    principal?: number | string
    loanAmount?: number | string
    loanBalance?: number | string
    loanTerm?: number | string
    interestRate?: number | string
    repaymentAmount?: number | string
    purpose?: string
    description?: string
    status?: string
    requestedAt?: string | Date
    createdAt?: string | Date
    currencyCode?: string
}

const AdminLoanListScreen = ({navigation}:TAdminLoanListScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {selectedBusiness, session} = useAppContainer()

    const [loans, setLoans] = useState<Loan[]>([])
    const [status, setStatus] = useState("pending")
    const [loading, setLoading] = useState(false)
    const [processingID, setProcessingID] = useState<string | number | null>(null)
    const [processingLoan, setProcessingLoan] = useState<{id:string|number, action:"approved"|"declined"}|null>(null)

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState("")
    const [activeFilter, setActiveFilter] = useState<"status" | null>(null)

    const bottomSheetRef = useRef<BottomSheet>(null)

    const statusOptions:BottomSheetSelectOption[] = [
        {key:"pending", value:"Pending"},
        {key:"approved", value:"Approved"},
        {key:"declined", value:"Declined"},
        {key:"completed", value:"Completed"},
        {key:"all", value:"All Loans"}
    ]

    const openBottomSheet = (options:BottomSheetSelectOption[], title:string) => {
        setSheetOptions(options)
        setSheetTitle(title)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectStatus = (option:BottomSheetSelectOption) => {
        setStatus(String(option.key))
        bottomSheetRef.current?.close()
    }

    const fetchLoans = async () => {
        if (!selectedBusiness.id) return

        setLoading(true)

        SocketIO.emit('fetch-loans', {
            sessionID:session,
            businessID:selectedBusiness.id,
            status:status !== "all" ? status : undefined
        }, (response:any) => {
            setLoading(false)

            if (response.status !== "success") {
                Alert.alert("Error", response.message || "Failed to load loans")
                return
            }

            setLoans(response.data || [])
        })
    }

    useFocusEffect(
        useCallback(() => {
            if (!selectedBusiness.id) return
            fetchLoans()
        }, [selectedBusiness.id, status])
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

    const getEmployeeName = (loan:Loan) => {
        const firstName = loan.employeeFirstName || loan.firstName || ""
        const lastName = loan.employeeLastName || loan.lastName || ""

        return `${firstName} ${lastName}`.trim() || "Unknown Employee"
    }

    const updateLoanStatus = (loan:Loan, newStatus:"approved" | "declined", endpoint: "approve-loan" | "reject-loan") => {
        const employeeName = getEmployeeName(loan)

        Alert.alert(
            newStatus === "approved" ? "Approve Loan" : "Decline Loan",
            `${newStatus === "approved" ? "Approve" : "Decline"} ${employeeName}'s loan of ${formatAmount(loan.principal || loan.loanAmount, loan.currencyCode)}?`,
            [
                {
                    text:"Cancel",
                    style:"cancel"
                },
                {
                    text:newStatus === "approved" ? "Approve" : "Decline",
                    style:newStatus === "declined" ? "destructive" : "default",
                    onPress:() => {
                        setProcessingID(loan.id ?? null)
                        SocketIO.emit(endpoint, {
                            sessionID:session,
                            businessID:selectedBusiness.id,
                            loanID:loan.id
                        }, (response:any) => {
                            setProcessingID(null)

                            if (response.status !== "success") {
                                Alert.alert("Error", response.message || "Failed to update loan")
                                return
                            }

                            setLoans(prev => prev.map(item =>
                                item.id === loan.id
                                    ? {...item, status:newStatus}
                                    : item
                            ).filter(item =>
                                status === "all" || item.status === status
                            ))
                        })
                    }
                }
            ]
        )
    }

    // const renderLoan = ({item}: {item:Loan}) => {
    //     const loanAmount = item.principal || item.loanAmount || 0
    //     const isPending = item.status === "pending"
    //     const isProcessing = processingID === item.id

    //     return (
    //         <View style={[styles.card, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
    //             <View style={styles.cardHeader}>
    //                 <View style={{flex:1}}>
    //                     <Text style={[styles.employeeName, {color:themeColors.text}]}>
    //                         {getEmployeeName(item)}
    //                     </Text>

    //                     {!!item.employeePhone && (
    //                         <Text style={[styles.meta, {color:themeColors.subtleText}]}>
    //                             {item.employeePhone}
    //                         </Text>
    //                     )}
    //                 </View>

    //                 <View style={[
    //                     styles.statusBadge,
    //                     {
    //                         backgroundColor:
    //                             item.status === "approved"
    //                                 ? "#E8F7EE"
    //                                 : item.status === "declined"
    //                                     ? "#FDECEC"
    //                                     : "#FFF4DD"
    //                     }
    //                 ]}>
    //                     <Text style={[
    //                         styles.statusText,
    //                         {
    //                             color:
    //                                 item.status === "approved"
    //                                     ? "#198754"
    //                                     : item.status === "declined"
    //                                         ? "#D32F2F"
    //                                         : "#B77900"
    //                         }
    //                     ]}>
    //                         {String(item.status || "pending").toUpperCase()}
    //                     </Text>
    //                 </View>
    //             </View>

    //             <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

    //             <View style={styles.amountRow}>
    //                 <View>
    //                     <Text style={[styles.label, {color:themeColors.subtleText}]}>
    //                         Loan Amount
    //                     </Text>

    //                     <Text style={[styles.amount, {color:themeColors.text}]}>
    //                         {formatAmount(loanAmount, item.currencyCode)}
    //                     </Text>
    //                 </View>

    //                 <View>
    //                     <Text style={[styles.label, {color:themeColors.subtleText}]}>
    //                         Balance
    //                     </Text>

    //                     <Text style={[styles.amount, {color:themeColors.text}]}>
    //                         {formatAmount(item.loanBalance, item.currencyCode)}
    //                     </Text>
    //                 </View>

    //                 <View style={{alignItems:'flex-end'}}>
    //                     <Text style={[styles.label, {color:themeColors.subtleText}]}>
    //                         Term
    //                     </Text>

    //                     <Text style={[styles.amount, {color:themeColors.text}]}>
    //                         {item.loanTerm ? `${item.loanTerm} months` : "-"}
    //                     </Text>
    //                 </View>
    //             </View>

    //             {!!(item.purpose || item.description) && (
    //                 <View style={styles.purposeContainer}>
    //                     <Text style={[styles.label, {color:themeColors.subtleText}]}>
    //                         Purpose
    //                     </Text>

    //                     <Text style={[styles.purpose, {color:themeColors.text}]}>
    //                         {item.purpose || item.description}
    //                     </Text>
    //                 </View>
    //             )}

    //             <Text style={[styles.date, {color:themeColors.subtleText}]}>
    //                 Requested {formatDate(item.requestedAt || item.createdAt)}
    //             </Text>

    //             {isPending && (
    //                 <View style={styles.actions}>
    //                     <TouchableOpacity
    //                         activeOpacity={0.8}
    //                         disabled={isProcessing}
    //                         onPress={() => updateLoanStatus(item, "declined")}
    //                         style={[styles.declineButton, {borderColor:"#D32F2F"}]}
    //                     >
    //                         <IconSymbol name="xmark" size={16} color="#D32F2F" />

    //                         <Text style={styles.declineText}>
    //                             Decline
    //                         </Text>
    //                     </TouchableOpacity>

    //                     <TouchableOpacity
    //                         activeOpacity={0.8}
    //                         disabled={isProcessing}
    //                         onPress={() => updateLoanStatus(item, "approved")}
    //                         style={[styles.approveButton, {backgroundColor:themeColors.primary}]}
    //                     >
    //                         <IconSymbol name="check" size={16} color="#FFFFFF" />

    //                         <Text style={styles.approveText}>
    //                             Approve
    //                         </Text>
    //                     </TouchableOpacity>
    //                 </View>
    //             )}
    //         </View>
    //     )
    // }
    const renderLoan = ({item}: {item:Loan}) => {
        const loanAmount = item.principal || item.loanAmount || 0
        const isPending = item.status === "pending"
        const isProcessing = processingLoan?.id === item.id
        const isApproving = isProcessing && processingLoan?.action === "approved"
        const isDeclining = isProcessing && processingLoan?.action === "declined"
    
        return (
            <View style={[styles.card, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                <View style={styles.cardHeader}>
                    <View style={{flex:1}}>
                        <Text style={[styles.employeeName, {color:themeColors.text}]}>
                            {getEmployeeName(item)}
                        </Text>
    
                        {!!item.employeePhone && (
                            <Text style={[styles.meta, {color:themeColors.subtleText}]}>
                                {item.employeePhone}
                            </Text>
                        )}
                    </View>
    
                    <View style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                item.status === "approved"
                                    ? "#E8F7EE"
                                    : item.status === "declined"
                                        ? "#FDECEC"
                                        : "#FFF4DD"
                        }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            {
                                color:
                                    item.status === "approved"
                                        ? "#198754"
                                        : item.status === "declined"
                                            ? "#D32F2F"
                                            : "#B77900"
                            }
                        ]}>
                            {String(item.status || "pending").toUpperCase()}
                        </Text>
                    </View>
                </View>
    
                <View style={[styles.divider, {backgroundColor:themeColors.border}]} />
    
                <View style={styles.amountRow}>
                    <View>
                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                            Loan Amount
                        </Text>
    
                        <Text style={[styles.amount, {color:themeColors.text}]}>
                            {formatAmount(loanAmount, item.currencyCode)}
                        </Text>
                    </View>
    
                    <View>
                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                            Balance
                        </Text>
    
                        <Text style={[styles.amount, {color:themeColors.text}]}>
                            {formatAmount(item.loanBalance, item.currencyCode)}
                        </Text>
                    </View>
    
                    <View style={{alignItems:'flex-end'}}>
                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                            Term
                        </Text>
    
                        <Text style={[styles.amount, {color:themeColors.text}]}>
                            {item.loanTerm ? `${item.loanTerm} months` : "-"}
                        </Text>
                    </View>
                </View>
    
                {!!(item.purpose || item.description) && (
                    <View style={styles.purposeContainer}>
                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                            Purpose
                        </Text>
    
                        <Text style={[styles.purpose, {color:themeColors.text}]}>
                            {item.purpose || item.description}
                        </Text>
                    </View>
                )}
    
                <Text style={[styles.date, {color:themeColors.subtleText}]}>
                    Requested {formatDate(item.requestedAt || item.createdAt)}
                </Text>
    
                {isPending && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={!!processingLoan}
                            onPress={() => updateLoanStatus(item, "declined", 'reject-loan')}
                            style={[styles.declineButton, {borderColor:"#D32F2F"}]}
                        >
                            {isDeclining ? (
                                <Text style={styles.declineText}>
                                    Declining...
                                </Text>
                            ) : (
                                <>
                                    <IconSymbol name="xmark" size={16} color="#D32F2F" />
                                    <Text style={styles.declineText}>
                                        Decline
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
    
                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={!!processingLoan}
                            onPress={() => updateLoanStatus(item, "approved", 'approve-loan')}
                            style={[styles.approveButton, {backgroundColor:themeColors.primary}]}
                        >
                            {isApproving ? (
                                <Text style={styles.approveText}>
                                    Approving...
                                </Text>
                            ) : (
                                <>
                                    <IconSymbol name="check" size={16} color="#FFFFFF" />
                                    <Text style={styles.approveText}>
                                        Approve
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
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
                        Loan Approvals
                    </ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <View style={{paddingHorizontal:Spacing.medium, paddingTop:Spacing.medium}}>
                    <TouchableOpacity
                        onPress={() => {
                            setActiveFilter("status")
                            openBottomSheet(statusOptions, "Select Loan Status")
                        }}
                        style={[styles.filter, {backgroundColor:themeColors.inputBackground, borderColor:themeColors.border}]}
                    >
                        <Text style={[styles.filterLabel, {color:themeColors.subtleText}]}>
                            Status
                        </Text>

                        <View style={styles.filterValueRow}>
                            <Text style={[styles.filterValue, {color:themeColors.text}]}>
                                {statusOptions.find(item => String(item.key) === status)?.value || "Pending"}
                            </Text>

                            <IconSymbol name="chevron-down" size={15} color={themeColors.subtleText} />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.listHeader}>
                        <ThemedText style={styles.listTitle}>
                            {statusOptions.find(item => String(item.key) === status)?.value || "Pending"} Loans
                        </ThemedText>

                        <Text style={[styles.count, {color:themeColors.subtleText}]}>
                            {loans.length} Loans
                        </Text>
                    </View>
                </View>

                <FlatList
                    data={loans}
                    keyExtractor={(item, index) => String(item.id ?? index)}
                    renderItem={renderLoan}
                    refreshing={loading}
                    onRefresh={fetchLoans}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal:8,
                        paddingBottom:insets.bottom + 30
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <IconSymbol name="check" size={42} color={themeColors.subtleText} />

                            <Text style={[styles.emptyTitle, {color:themeColors.text}]}>
                                {loading ? "Loading loans..." : "No loans found"}
                            </Text>

                            {!loading && (
                                <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                    There are no loans matching the selected status.
                                </Text>
                            )}
                        </View>
                    }
                />
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={["40%", "60%"]}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor:themeColors.background,
                    borderTopWidth:1,
                    borderTopColor:themeColors.border
                }}
                handleIndicatorStyle={{
                    backgroundColor:themeColors.icon,
                    marginTop:10
                }}
            >
                <ThemedText style={styles.sheetTitle}>
                    {sheetTitle}
                </ThemedText>

                <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:Spacing.screenPadding}}>
                    {sheetOptions.map(option => {
                        const selected = String(option.key) === status

                        return (
                            <TouchableOpacity
                                key={String(option.key)}
                                activeOpacity={0.8}
                                onPress={() => activeFilter === "status" && selectStatus(option)}
                                style={[
                                    styles.sheetOption,
                                    {
                                        backgroundColor:selected
                                            ? themeColors.subtleBackground
                                            : themeColors.card,
                                        borderColor:themeColors.border
                                    }
                                ]}
                            >
                                <Text style={[styles.sheetOptionText, {color:themeColors.text}]}>
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
    )
}

const styles = StyleSheet.create({
    container:{flex:1},
    safeArea:{flex:1},
    statusBarSpacer:{height:10},
    header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.screenPadding, paddingVertical:Spacing.medium, borderBottomWidth:1},
    headerTitle:{fontSize:Typography.heading2, fontFamily:'SemiBold'},
    backButton:{width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center'},
    filter:{borderWidth:1, borderRadius:Borders.radiusSmall, paddingHorizontal:12, paddingVertical:11},
    filterLabel:{fontSize:11, marginBottom:4},
    filterValueRow:{flexDirection:'row', alignItems:'center', justifyContent:'space-between'},
    filterValue:{fontSize:14, fontFamily:'Medium'},
    listHeader:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:Spacing.medium},
    listTitle:{fontSize:15, fontFamily:'SemiBold'},
    count:{fontSize:11},
    card:{borderWidth:1, borderRadius:Borders.radiusMedium, padding:Spacing.medium, marginBottom:10},
    cardHeader:{flexDirection:'row', alignItems:'center'},
    employeeName:{fontSize:15, fontFamily:'SemiBold'},
    meta:{fontSize:11, marginTop:4},
    statusBadge:{paddingHorizontal:9, paddingVertical:5, borderRadius:12},
    statusText:{fontSize:9, fontFamily:'SemiBold'},
    divider:{height:1, marginVertical:Spacing.medium},
    amountRow:{flexDirection:'row', justifyContent:'space-between'},
    label:{fontSize:10, marginBottom:4},
    amount:{fontSize:12, fontFamily:'SemiBold'},
    purposeContainer:{marginTop:Spacing.medium},
    purpose:{fontSize:13, lineHeight:19},
    date:{fontSize:11, marginTop:Spacing.medium},
    actions:{flexDirection:'row', gap:8, marginTop:Spacing.medium},
    declineButton:{flex:1, borderWidth:1, borderRadius:Borders.radiusSmall, paddingVertical:11, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6},
    declineText:{fontSize:13, color:"#D32F2F", fontFamily:'SemiBold'},
    approveButton:{flex:1, borderRadius:Borders.radiusSmall, paddingVertical:11, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6},
    approveText:{fontSize:13, color:"#FFFFFF", fontFamily:'SemiBold'},
    empty:{alignItems:'center', paddingTop:70, paddingHorizontal:30},
    emptyTitle:{fontSize:16, fontFamily:'SemiBold', marginTop:12, marginBottom:6},
    emptyText:{fontSize:13, textAlign:'center', lineHeight:20},
    sheetTitle:{fontSize:20, fontFamily:'SemiBold', textAlign:'center', marginTop:10, marginBottom:20},
    sheetOption:{minHeight:55, borderWidth:1, borderRadius:Borders.radiusSmall, marginBottom:8, paddingHorizontal:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between'},
    sheetOptionText:{fontSize:14, fontFamily:'Medium'}
})

export default AdminLoanListScreen

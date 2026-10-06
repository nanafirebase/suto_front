import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo, useState } from 'react'
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import { PayrollNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { ThemedText } from '../../../components/ui/ThemedText'
import { ThemedView } from '../../../components/ui/ThemedView'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { formatCurrency } from '../../../utils/constants/Currency'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'

type TPayrollRunDetailsScreen = NativeStackScreenProps<PayrollNavigationList, "PayrollRunDetailsScreen">

type PayrollItem = {
    id?: string | number
    payrollRunID?: string | number
    employeeID?: string | number
    employeeFirstName?: string
    employeeLastName?: string
    firstName?: string
    lastName?: string
    employeePhone?: string
    roleName?: string
    gradeName?: string
    basicSalary?: number | string
    salary?: number | string
    overtimeAmount?: number | string
    allowanceAmount?: number | string
    deductionAmount?: number | string
    taxAmount?: number | string
    grossAmount?: number | string
    netAmount?: number | string
    status?: string
    currencyName?: string
    currencyCode?: string
}

type PayrollRun = {
    id?: string | number
    payrollRunID?: string | number
    businessID: number
    branchID?: number
    departmentID?: number
    employeeCategory?: string
    payPeriodID: string | number
    payPeriodName?: string | number
    payDate: string | Date
    employeeCount: number
    grossAmount: number
    allowanceAmount: number
    overtimeAmount: number
    deductionAmount: number
    taxAmount: number
    netAmount: number
    status: string
    sessionID?: string | number
    items?: PayrollItem[]
}

const PayrollRunDetailsScreen = ({navigation, route}:TPayrollRunDetailsScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const isDark = colorScheme === 'dark';
    const { businessCurrency } = useAppContainer()
    const payrollRun = route.params.payrollRunData
    
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [search, setSearch] = useState("")

    const items = payrollRun.items || []

    const filteredItems = useMemo(() => {
        if (!search.trim()) return items

        const value = search.trim().toLowerCase()

        return items.filter((item:any) => {
            const name = `${item.employeeFirstName || item.firstName || ''} ${item.employeeLastName || item.lastName || ''}`.toLowerCase()
            const phone = String(item.employeePhone || '').toLowerCase()
            const role = String(item.roleName || '').toLowerCase()
            const grade = String(item.gradeName || '').toLowerCase()

            return name.includes(value) || phone.includes(value) || role.includes(value) || grade.includes(value)
        })
    }, [items, search])

    const formatDate = (value:any) => {
        if (!value) return '-'

        const date = new Date(value)

        if (isNaN(date.getTime())) return String(value)

        return date.toLocaleDateString('en-GB', {
            day:'2-digit',
            month:'short',
            year:'numeric'
        })
    }

    const getStatusColor = () => {
        switch (String(payrollRun.status || '').toLowerCase()) {
            case 'completed':
                return '#34C759'
            case 'processing':
                return '#FF9500'
            case 'failed':
                return '#FF3B30'
            case 'cancelled':
                return '#8E8E93'
            default:
                return themeColors.subtleText
        }
    }

    const renderItem = ({item}: {item:PayrollItem}) => {
        const firstName = item.employeeFirstName || item.firstName || ''
        const lastName = item.employeeLastName || item.lastName || ''
        const name = `${firstName} ${lastName}`.trim() || 'Unknown Employee'

        return (
            <View style={[styles.employeeCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                <View style={styles.employeeHeader}>
                    <View style={{flex:1}}>
                        <Text style={[styles.employeeName, {color:themeColors.text}]}>
                            {name}
                        </Text>

                        <Text style={[styles.employeeMeta, {color:themeColors.subtleText}]}>
                            {item.roleName || item.gradeName || 'Employee'}
                        </Text>
                    </View>

                    <View style={[styles.itemStatus, {backgroundColor:item.status === 'processed' ? '#34C75915' : '#FF950015'}]}>
                        <Text style={{color:item.status === 'processed' ? '#34C759' : '#FF9500', fontSize:12, fontFamily:'Medium'}}>
                            {item.status || 'processed'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                <View style={styles.amountRow}>
                    <View style={styles.amountColumn}>
                        <Text style={[styles.amountLabel, {color:themeColors.subtleText}]}>
                            Basic Salary
                        </Text>
                        <Text style={[styles.amountValue, {color:themeColors.text}]}>
                            {formatCurrency(Number(item.basicSalary ?? item.salary), businessCurrency.symbol)}
                        </Text>
                    </View>

                    <View style={styles.amountColumn}>
                        <Text style={[styles.amountLabel, {color:themeColors.subtleText}]}>
                            Allowance
                        </Text>
                        <Text style={[styles.amountValue, {color:themeColors.text}]}>
                            {formatCurrency(Number(item.allowanceAmount), businessCurrency.symbol)}
                        </Text>
                    </View>

                    <View style={styles.amountColumn}>
                        <Text style={[styles.amountLabel, {color:themeColors.subtleText}]}>
                            Overtime
                        </Text>
                        <Text style={[styles.amountValue, {color:themeColors.text}]}>
                            {formatCurrency(Number(item.overtimeAmount), businessCurrency.symbol)}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountRow}>
                    <View style={styles.amountColumn}>
                        <Text style={[styles.amountLabel, {color:themeColors.subtleText}]}>
                            Deductions
                        </Text>
                        <Text style={[styles.amountValue, {color:themeColors.text}]}>
                            {formatCurrency(Number(item.deductionAmount), businessCurrency.symbol)}
                        </Text>
                    </View>
                    <View style={styles.amountColumn}>
                        <Text style={[styles.amountLabel, {color:themeColors.subtleText}]}>
                            Tax
                        </Text>
                        <Text style={[styles.amountValue, {color:themeColors.text}]}>
                            {formatCurrency(Number(item.taxAmount), businessCurrency.symbol)}
                        </Text>
                    </View>

                    <View style={styles.amountColumn}>
                        <Text style={[styles.amountLabel, {color:themeColors.subtleText}]}>
                            Gross
                        </Text>
                        <Text style={[styles.amountValue, {color:themeColors.text}]}>
                            {formatCurrency(Number(item.grossAmount), businessCurrency.symbol)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.netRow, {backgroundColor:themeColors.subtleBackground}]}>
                    <Text style={[styles.netLabel, {color:themeColors.subtleText}]}>
                        Net Pay
                    </Text>

                    <Text style={[styles.netValue, {color:themeColors.text}]}>
                        {formatCurrency(Number(item.netAmount), businessCurrency.symbol)}
                    </Text>
                </View>
            </View>
        )
    }

    return (
        <View style={[styles.container, {backgroundColor:themeColors.background}]}>
            {Platform.OS === 'android' && ( <View style={[styles.statusBarSpacer, {height:10, backgroundColor:themeColors.background}]} />)}

            <View style={[styles.safeArea, {paddingTop:Platform.OS === 'ios' ? insets.top : 0}]}>
                <ThemedView style={[styles.header, {backgroundColor:themeColors.background, borderBottomColor:themeColors.border}]}>
                    {isSearchVisible ? ( <View style={styles.searchHeaderContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => { setIsSearchVisible(false); setSearch('') }}>
                            <IconSymbol name="arrow.left" size={22} color={themeColors.text} />
                        </TouchableOpacity>
                        <View style={[ styles.searchInputContainer, { backgroundColor: themeColors.inputBackground } ]} >
                            <IconSymbol name="magnifyingglass" size={18} color={themeColors.subtleText} />
                            <TextInput
                                style={[styles.searchInputField, { color: themeColors.text }]}
                                placeholder="Search employees"
                                placeholderTextColor={themeColors.subtleText}
                                value={search}
                                onChangeText={setSearch}
                                autoFocus
                            />
                        </View>
                    </View> ) : (
                        <>
                            <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    style={[styles.backButton, {backgroundColor:themeColors.subtleBackground}]}
                                >
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                            </TouchableOpacity>

                            <ThemedText style={styles.headerTitle}>
                                Payroll Details
                            </ThemedText>

                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} onPress={() => setIsSearchVisible(true)} >
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                            </View>
                    </>
                    )}
                </ThemedView>
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item, index) => String(item.id || item.employeeID || index)}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding:8,
                        paddingBottom:insets.bottom + 40
                    }}
                    ListHeaderComponent={
                        <>
                            <View style={[styles.summaryCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                                <View style={styles.periodHeader}>
                                    <View style={{flex:1}}>
                                        <Text style={[styles.periodName, {color:themeColors.text}]}>
                                            {payrollRun.payPeriodName || 'Payroll'}
                                        </Text>

                                        <Text style={[styles.payDate, {color:themeColors.subtleText}]}>
                                            {formatDate(payrollRun.payDate)}
                                        </Text>
                                    </View>

                                    <View style={[styles.statusBadge, {backgroundColor:`${getStatusColor()}15`}]}>
                                        <View style={[styles.statusDot, {backgroundColor:getStatusColor()}]} />
                                        <Text style={[styles.statusText, {color:getStatusColor()}]}>
                                            {payrollRun.status || 'Unknown'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                                <View style={styles.employeeCountRow}>
                                    <Text style={[styles.employeeCountLabel, {color:themeColors.subtleText}]}>
                                        Employees
                                    </Text>

                                    <Text style={[styles.employeeCountValue, {color:themeColors.text}]}>
                                        {payrollRun.employeeCount || items.length}
                                    </Text>
                                </View>

                                <View style={styles.summaryGrid}>
                                    <View style={styles.summaryBox}>
                                        <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                            Gross
                                        </Text>
                                        <Text style={[styles.summaryValue, {color:themeColors.text}]}>
                                            {formatCurrency(Number(payrollRun.grossAmount), businessCurrency.symbol)}
                                        </Text>
                                    </View>

                                    <View style={styles.summaryBox}>
                                        <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                            Allowances
                                        </Text>
                                        <Text style={[styles.summaryValue, {color:themeColors.text}]}>
                                            {formatCurrency(Number(payrollRun.allowanceAmount), businessCurrency.symbol)}
                                        </Text>
                                    </View>

                                    <View style={styles.summaryBox}>
                                        <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                            Overtime
                                        </Text>
                                        <Text style={[styles.summaryValue, {color:themeColors.text}]}>
                                            {formatCurrency(Number(payrollRun.overtimeAmount), businessCurrency.symbol)}
                                        </Text>
                                    </View>

                                    <View style={styles.summaryBox}>
                                        <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                            Deductions
                                        </Text>
                                        <Text style={[styles.summaryValue, {color:themeColors.text}]}>
                                            {formatCurrency(Number(payrollRun.deductionAmount), businessCurrency.symbol)}
                                        </Text>
                                    </View>

                                    <View style={styles.summaryBox}>
                                        <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                            Tax
                                        </Text>
                                        <Text style={[styles.summaryValue, {color:themeColors.text}]}>
                                            {formatCurrency(Number(payrollRun.taxAmount), businessCurrency.symbol)}
                                        </Text>
                                    </View>

                                    <View style={[styles.summaryBox, styles.netSummaryBox, {backgroundColor:themeColors.subtleBackground}]}>
                                        <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                            Net Pay
                                        </Text>
                                        <Text style={[styles.netSummaryValue, {color:themeColors.text}]}>
                                            {formatCurrency(Number(payrollRun.netAmount), businessCurrency.symbol)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.employeeSectionHeader}>
                                <ThemedText style={styles.sectionTitle}>
                                    Employees
                                </ThemedText>

                                <Text style={[styles.employeeTotal, {color:themeColors.subtleText}]}>
                                    {filteredItems.length} of {items.length}
                                </Text>
                            </View>


                            {items.length === 0 && (
                                <View style={styles.emptyContainer}>
                                    <Text style={[styles.emptyTitle, {color:themeColors.text}]}>
                                        No payroll items
                                    </Text>

                                    <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                        There are no employee payroll records attached to this payroll run.
                                    </Text>
                                </View>
                            )}
                        </>
                    }
                    ListEmptyComponent={
                        search.trim() && items.length > 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyTitle, {color:themeColors.text}]}>
                                    No employees found
                                </Text>

                                <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                    Try searching with a different employee name, phone, role or grade.
                                </Text>
                            </View>
                        ) : null
                    }
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{flex:1},
    safeArea:{flex:1},
    statusBarSpacer:{width:'100%'},
    header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.screenPadding, paddingVertical:Spacing.medium, borderBottomWidth:1},
    headerTitle:{fontSize:Typography.heading2, fontFamily:'SemiBold'},
    backButton:{width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center'},
    summaryCard:{borderWidth:1, borderRadius:Borders.radiusMedium, padding:Spacing.medium},
    periodHeader:{flexDirection:'row', alignItems:'center'},
    periodName:{fontSize:15, fontFamily:'SemiBold'},
    payDate:{fontSize:Typography.small, marginTop:4},
    statusBadge:{flexDirection:'row', alignItems:'center', paddingHorizontal:10, paddingVertical:6, borderRadius:20},
    statusDot:{width:7, height:7, borderRadius:4, marginRight:6},
    statusText:{fontSize:11, fontFamily:'SemiBold', textTransform:'capitalize'},
    divider:{height:1, marginVertical:Spacing.medium},
    employeeCountRow:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:Spacing.small},
    employeeCountLabel:{fontSize:Typography.small},
    employeeCountValue:{fontSize:13, fontFamily:'SemiBold'},
    summaryGrid:{flexDirection:'row', flexWrap:'wrap', gap:2},
    summaryBox:{width:'32%', padding:5},
    summaryLabel:{fontSize:11, marginBottom:5},
    summaryValue:{fontSize:12, fontFamily:'SemiBold'},
    netSummaryBox:{borderRadius:Borders.radiusSmall},
    netSummaryValue:{fontSize:13, fontFamily:'SemiBold'},
    employeeSectionHeader:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:Spacing.large, marginBottom:Spacing.medium},
    sectionTitle:{fontSize:15, fontFamily:'SemiBold'},
    employeeTotal:{fontSize:12},
    searchBox:{height:46, borderWidth:1, borderRadius:Borders.radiusSmall, flexDirection:'row', alignItems:'center', paddingHorizontal:12, marginBottom:Spacing.medium},
    searchText:{fontSize:Typography.small, marginLeft:8},
    employeeCard:{borderWidth:1, borderRadius:Borders.radiusMedium, padding:Spacing.medium, marginBottom:10},
    employeeHeader:{flexDirection:'row', alignItems:'center'},
    employeeName:{fontSize:15, fontFamily:'SemiBold'},
    employeeMeta:{fontSize:11, marginTop:4},
    itemStatus:{paddingHorizontal:8, paddingVertical:5, borderRadius:12},
    amountRow:{flexDirection:'row', marginBottom:8},
    amountColumn:{width:'32%'},
    amountLabel:{fontSize:11, marginBottom:4},
    amountValue:{fontSize:12, fontFamily:'Medium'},
    netRow:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, borderRadius:Borders.radiusSmall, marginTop:4},
    netLabel:{fontSize:11, fontFamily:'Medium'},
    netValue:{fontSize:14, fontFamily:'SemiBold'},
    emptyContainer:{alignItems:'center', justifyContent:'center', paddingVertical:40},
    emptyTitle:{fontSize:16, fontFamily:'SemiBold', marginBottom:6},
    emptyText:{fontSize:13, textAlign:'center', lineHeight:20, maxWidth:300},
    input: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.large,
        fontSize: Typography.small,
        marginBottom: Spacing.medium,
        fontFamily: 'Regular'
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
    },
    searchHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 0,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.medium,
        borderRadius: Borders.radiusMedium,
    },
    searchInputField: {
        flex: 1,
        fontSize: Typography.body,
        marginLeft: Spacing.small,
        fontFamily: 'Regular',
        paddingVertical: 12
    },
})

export default PayrollRunDetailsScreen
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import { PayrollNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { Borders, Spacing, Typography } from '../../../utils/constants/Design'
import { ThemedView } from '../../../components/ui/ThemedView'
import { ThemedText } from '../../../components/ui/ThemedText'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { SocketIO } from '../../../configuration/helpers/main.helpers'
import { useFocusEffect } from '@react-navigation/native'

type TLoanListScreen = NativeStackScreenProps<PayrollNavigationList, 'LoanListScreen'>

const LoanListScreen = ({ navigation }: TLoanListScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, can, userData } = useAppContainer()

    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [data, setData] = useState<any[]>([])

    const canManageLoan = can('user.user.create_update')

    const fetchLoans = useCallback(() => {
        if (!selectedBusiness?.employee_id || !selectedBusiness?.id) return

        setLoading(true)

        SocketIO.emit('fetch-loans', {
            sessionID: session,
            businessID: selectedBusiness.id,
            employeeID: selectedBusiness.employee_id
        }, (response: any) => {
            // console.log({response})
            setLoading(false)

            if (response.status === 'success') {
                setData(response.data || [])
            } else {
                Alert.alert('Error', response.message || 'Unable to load your loans')
            }
        })
    }, [session, selectedBusiness?.id, userData?.employeeID])

    useEffect(() => {
        fetchLoans()
    }, [fetchLoans])

    useFocusEffect(
        useCallback(() => {
            fetchLoans();
        }, [selectedBusiness?.id, selectedBusiness.employee_id])
    );

    const handleDelete = (loanID: string | number) => {
        Alert.alert('Remove Loan Application', 'Are you sure you want to remove this loan application?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    SocketIO.emit('delete-loan', {
                        sessionID: session,
                        businessID: selectedBusiness.id,
                        loanID
                    }, (response: any) => {
                        if (response.status === 'success') {
                            Alert.alert('Success', response.message || 'Loan application removed successfully')
                            fetchLoans()
                        } else {
                            Alert.alert('Error', response.message || 'Unable to remove loan application')
                        }
                    })
                }
            }
        ])
    }

    const filteredData = data.filter(item => {
        const search = searchQuery.trim().toLowerCase()
        if (!search) return true

        return [
            item.loanTypeName,
            item.description,
            item.status
        ].some(value => String(value || '').toLowerCase().includes(search))
    })

    const statusColor = (status: string) => {
        switch (status) {
            case 'approved':
            case 'active':
                return themeColors.success
            case 'rejected':
                return themeColors.error
            case 'inactive':
                return themeColors.subtleText
            default:
                return themeColors.warning
        }
    }

    const formatStatus = (status: string) => {
        if (!status) return 'PENDING'
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const formatAmount = (amount: any) => {
        return Number(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />}

            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    {isSearchVisible ? (
                        <View style={styles.searchHeaderContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={() => { setIsSearchVisible(false); setSearchQuery('') }}>
                                <IconSymbol name="arrow.left" size={22} color={themeColors.text} />
                            </TouchableOpacity>

                            <View style={[styles.searchInputContainer, { backgroundColor: themeColors.inputBackground }]}>
                                <IconSymbol name="magnifyingglass" size={18} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.searchInputField, { color: themeColors.text }]}
                                    placeholder="Search loans"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                            </TouchableOpacity>

                            <ThemedText style={styles.headerTitle}>My Loans</ThemedText>

                            <View style={styles.headerRight}>
                                <TouchableOpacity
                                    style={[styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground }]}
                                    onPress={() => setIsSearchVisible(true)}
                                >
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>

                                {canManageLoan && (
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('LoanFormScreen', { data: null })}
                                        style={[styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground }]}
                                    >
                                        <IconSymbol name="plus" size={22} color={themeColors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </ThemedView>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + Spacing.screenPadding }]}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredData.length > 0 ? filteredData.map((item, index) => {
                        const color = statusColor(item.status)
                        const canEdit = item.status === 'pending' && canManageLoan

                        return (
                            <View key={item.id || index} style={[styles.loanCard, { backgroundColor: themeColors.card, borderLeftColor: color }]}>
                                <View style={styles.cardTop}>
                                    <View style={styles.cardTitleContainer}>
                                        <Text style={[styles.loanName, { color: themeColors.text }]}>
                                            {item.loanTypeName || 'Loan Application'}
                                        </Text>

                                        <Text style={[styles.description, { color: themeColors.subtleText }]} numberOfLines={2}>
                                            {item.description || 'No description provided'}
                                        </Text>
                                    </View>

                                    <View style={[styles.statusBadge, { backgroundColor: color }]}>
                                        <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
                                    </View>
                                </View>

                                <View style={[styles.detailsRow, { borderTopColor: themeColors.border }]}>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: themeColors.subtleText }]}>Principal</Text>
                                        <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                            {formatAmount(item.principal)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: themeColors.subtleText }]}>Balance</Text>
                                        <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                            {formatAmount(item.loanBalance)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: themeColors.subtleText }]}>Term</Text>
                                        <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                            {item.loanTerm ?? 0}
                                        </Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: themeColors.subtleText }]}>Interest</Text>
                                        <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                            {item.interestRate ?? 0}%
                                        </Text>
                                    </View>
                                </View>

                                {canEdit && (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('LoanFormScreen', { data: item })}
                                            style={[styles.smallAction, { backgroundColor: themeColors.tabIconDefault }]}
                                        >
                                            <IconSymbol name="pencil" size={16} color={themeColors.white} />
                                            <Text style={styles.smallActionText}>Edit</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleDelete(item.id)}
                                            style={[styles.smallAction, { backgroundColor: themeColors.error }]}
                                        >
                                            <IconSymbol name="trash" size={16} color="#FFFFFF" />
                                            <Text style={styles.smallActionText}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )
                    }) : (
                        <ThemedText style={[styles.emptyText, { color: themeColors.subtleText }]}>
                            {isLoading ? 'Loading your loans...' : searchQuery ? 'No matching loans found' : 'You do not have any loan applications yet'}
                        </ThemedText>
                    )}
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    statusBarSpacer: { width: '100%', height: 10 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.medium, borderBottomWidth: 1 },
    backButtonMain: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.small },
    content: { flex: 1 },
    contentContainer: { padding: Spacing.small },
    searchHeaderContainer: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    backButton: { alignItems: 'center', justifyContent: 'center', marginRight: Spacing.medium, width: 40, height: 40 },
    searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.medium, borderRadius: Borders.radiusMedium },
    searchInputField: { flex: 1, fontSize: Typography.body, marginLeft: Spacing.small, fontFamily: 'Regular', paddingVertical: 12 },
    loanCard: { borderRadius: Borders.radiusSmall, overflow: 'hidden', borderLeftWidth: 3, marginBottom: 6, padding: Spacing.large },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    cardTitleContainer: { flex: 1, paddingRight: Spacing.small },
    loanName: { fontSize: 14, fontFamily: 'SemiBold', marginBottom: 5 },
    description: { fontSize: Typography.small, fontFamily: 'Regular' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Borders.radiusSmall, marginLeft: 8 },
    statusText: { color: '#FFFFFF', fontSize: 9, fontFamily: 'SemiBold' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.large, paddingTop: Spacing.medium, borderTopWidth: 0.5 },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 10, fontFamily: 'Regular', marginBottom: 3 },
    detailValue: { fontSize: 12, fontFamily: 'SemiBold' },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.medium, gap: 6 },
    smallAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Borders.radiusSmall, gap: 5 },
    smallActionText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'SemiBold' },
    emptyText: { textAlign: 'center', marginTop: 50, paddingHorizontal: Spacing.large }
})

export default LoanListScreen
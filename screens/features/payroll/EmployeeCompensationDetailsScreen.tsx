import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { PayrollNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { Borders, Spacing, Typography } from '../../../utils/constants/Design'
import { ThemedText } from '../../../components/ui/ThemedText'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { SocketIO } from '../../../configuration/helpers/main.helpers'
import { formatCurrency } from '../../../utils/constants/Currency'

type TScreen = NativeStackScreenProps<PayrollNavigationList, "EmployeeCompensationDetailsScreen">

interface Compensation {
    id?: string|number
    businessID?: string|number
    employeeID?: string|number
    type?: 'salary'|'wage'
    salary?: number
    wageRate?: number
    wagePeriod?: string
    currencyID?: string|number
    source?: string
    sourceID?: string|number
    effectiveFrom?: string
    effectiveTo?: string
    description?: string
    status?: string
    firstName?: string
    lastName?: string
}

const EmployeeCompensationDetailsScreen = ({ navigation, route }: TScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const { session, selectedBusiness, businessCurrency } = useAppContainer()
    const data = route.params?.data as Compensation

    const amount = data?.type === 'salary' ? Number(data.salary || 0) : Number(data.wageRate || 0)
    const period = data?.type === 'salary' ? 'Monthly' : data?.wagePeriod ? `Per ${data.wagePeriod}` : 'Wage'

    const deleteRecord = () => {
        Alert.alert('Remove Compensation', 'Are you sure you want to remove this compensation record?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    SocketIO.emit('delete-employee-compensation', {
                        businessID: selectedBusiness.id,
                        compensationID: data.id,
                        sessionID: session
                    }, (response: any) => {
                        if (response.status === 'success') {
                            navigation.goBack()
                        } else {
                            Alert.alert('Error', response.message || 'Failed to remove compensation')
                        }
                    })
                }
            }
        ])
    }

    const row = (label: string, value: string|number|undefined) => (
        <View style={styles.row}>
            <Text style={[styles.label, { color: themeColors.subtleText }]}>{label}</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>{value === undefined || value === '' ? '-' : value}</Text>
        </View>
    )

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: themeColors.subtleBackground }]}>
                    <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>Compensation Details</ThemedText>
                <TouchableOpacity onPress={() => navigation.navigate("EmployeeCompensationFormScreen", { data })} style={[styles.editButton, { backgroundColor: themeColors.primary }]}>
                    <IconSymbol name="pencil" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: Spacing.screenPadding, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.employeeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={[styles.avatar, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="person" size={24} color={themeColors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.employeeName}>{data?.firstName || ''} {data?.lastName || ''}</ThemedText>
                        <Text style={[styles.subText, { color: themeColors.subtleText }]}>Employee #{data?.employeeID || '-'}</Text>
                    </View>
                    <View style={[styles.status, { backgroundColor: data?.status === 'active' ? '#DCFCE7' : '#F3F4F6' }]}>
                        <Text style={{ color: data?.status === 'active' ? '#15803D' : '#6B7280', fontSize: 11 }}>{data?.status || 'inactive'}</Text>
                    </View>
                </View>

                <View style={[styles.amountCard, { backgroundColor: themeColors.subtleBackground }]}>
                    <Text style={[styles.amountLabel, { color: themeColors.subtleText }]}>{data?.type === 'salary' ? 'Monthly Salary' : 'Wage Rate'}</Text>
                    <Text style={[styles.amount, { color: themeColors.primary }]}>{formatCurrency(amount, { symbol: businessCurrency.symbol })}</Text>
                    <Text style={[styles.period, { color: themeColors.subtleText }]}>{period}</Text>
                </View>

                <View style={[styles.section, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
                    <ThemedText style={styles.sectionTitle}>Compensation</ThemedText>
                    {row('Type', data?.type === 'salary' ? 'Salary' : 'Wage')}
                    {data?.type === 'wage' && row('Wage Period', data.wagePeriod)}
                    {row('Currency', businessCurrency.symbol)}
                    {row('Source', data?.source)}
                </View>

                <View style={[styles.section, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
                    <ThemedText style={styles.sectionTitle}>Effective Period</ThemedText>
                    {row('Effective From', data?.effectiveFrom)}
                    {row('Effective To', data?.effectiveTo || 'Ongoing')}
                </View>

                {data?.description ? (
                    <View style={[styles.section, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
                        <ThemedText style={styles.sectionTitle}>Description</ThemedText>
                        <Text style={[styles.description, { color: themeColors.subtleText }]}>{data.description}</Text>
                    </View>
                ) : null}

                <TouchableOpacity onPress={deleteRecord} style={[styles.deleteButton, { borderColor: '#EF4444' }]}>
                    <IconSymbol name="trash" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>Remove Compensation</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.screenPadding, borderBottomWidth: 1 },
    backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    editButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    employeeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Borders.radiusSmall, padding: 15, marginBottom: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    employeeName: { fontSize: Typography.body, fontFamily: 'SemiBold' },
    subText: { fontSize: 12, marginTop: 3 },
    status: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
    amountCard: { alignItems: 'center', borderRadius: Borders.radiusSmall, padding: 20, marginBottom: 12 },
    amountLabel: { fontSize: 12 },
    amount: { fontSize: 26, fontFamily: 'Bold', marginTop: 4 },
    period: { fontSize: 12, marginTop: 3 },
    section: { borderWidth: 1, borderRadius: Borders.radiusSmall, padding: 15, marginBottom: 12 },
    sectionTitle: { fontSize: Typography.body, fontFamily: 'SemiBold', marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
    label: { fontSize: 12 },
    value: { fontSize: 13, fontFamily: 'Medium', maxWidth: '60%', textAlign: 'right' },
    description: { fontSize: 13, lineHeight: 20 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: Borders.radiusSmall, paddingVertical: 13, marginTop: 5 },
    deleteText: { color: '#EF4444', fontFamily: 'SemiBold', marginLeft: 7 }
})

export default EmployeeCompensationDetailsScreen
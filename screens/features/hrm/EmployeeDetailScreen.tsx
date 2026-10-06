import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { HRMNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type TEmployeeDetailScreen = NativeStackScreenProps<HRMNavigationList, "EmployeeDetailScreen">

const EmployeeDetailScreen = ({navigation, route}: TEmployeeDetailScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness } = useAppContainer();

    const { data } = route.params

    const [employee, setEmployee] = useState<any>(data || null)
    const [isLoading, setLoading] = useState(false)

    const paymentMethods = [
        {key: 'bank', value: 'Bank'},
        {key: 'mobile_money', value: 'Mobile Money'},
    ]
    const mobileMoneyProviders = [
        {key: 'telecel', value: 'Telecel'},
        {key: 'mtn', value: 'MTN'},
        {key: 'airtel_tigo', value: 'Airtel Tigo'},
    ]

    const fetchEmployee = async () => {
        if (!data?.id || !selectedBusiness.id) {
            return
        }

        setLoading(true)

        SocketIO.emit('fetch-employee', {
            sessionID: session,
            businessID: selectedBusiness.id,
            hiddenID: data.id
        }, (response: any) => {
            setLoading(false)

            if (response.status === "success") {
                setEmployee(response.data)
            } else {
                Alert.alert("Error", response.message || "Error fetching employee")
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchEmployee()
        }, [data?.id])
    )

    const fullName = [
        employee?.firstName,
        employee?.lastName
    ].filter(Boolean).join(' ')

    const initials = [
        employee?.firstName?.charAt(0),
        employee?.lastName?.charAt(0)
    ].filter(Boolean).join('').toUpperCase()

    const paymentMethodS = paymentMethods.find((item:any) => String(item.key) === String(employee.paymentMethod)) || null
    const mobileMoneyProviderS = mobileMoneyProviders.find((item:any) => String(item.key) === String(employee.bankName)) || null
    const momoProvider = paymentMethodS?.key === "mobile_money" ? mobileMoneyProviderS?.value : employee.bankName

    const formatDate = (value?: string) => {
        if (!value) return 'Not provided'

        const date = new Date(value)

        if (isNaN(date.getTime())) {
            return value
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatDateTime = (value?: string) => {
        if (!value) return 'Not provided'

        const date = new Date(value)

        if (isNaN(date.getTime())) {
            return value
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const displayValue = (value:any, name?:string) => {
        if (value === undefined || value === null || value === '') {
            return (`${name ? `${name} ` : ''}not provided`)
        }
        return String(value)
    }

    const DetailItem = ({ label, value, width = '100%' }: { label:string, value:any, width?:any }) => (
        <View style={[styles.detailItem, { width }]}>
            <Text style={[styles.detailLabel, { color: themeColors.subtleText }]}>
                {label}
            </Text>
            <Text style={[styles.detailValue, { color: themeColors.text }]}>
                {displayValue(value)}
            </Text>
        </View>
    )

    const Section = ({ title, children }: { title:string, children:React.ReactNode }) => (
        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderLeftColor: themeColors.primary }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    {title}
                </Text>
            </View>
            <View style={styles.sectionBody}>
                {children}
            </View>
        </View>
    )

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />
            )}

            <View style={[
                styles.safeArea,
                {
                    backgroundColor: themeColors.background,
                    paddingTop: Platform.OS === 'ios' ? insets.top : 0,
                    paddingBottom: Platform.OS === 'ios' ? 85 : 0
                }
            ]}>

                <ThemedView style={[
                    styles.header,
                    {
                        backgroundColor: themeColors.background,
                        borderBottomColor: themeColors.border
                    }
                ]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.backButtonMain,
                            { backgroundColor: themeColors.subtleBackground }
                        ]}
                    >
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Employee Details
                    </ThemedText>
                    <View style={{flexDirection: 'row'}}>
                        <TouchableOpacity
                            onPress={() => {}}
                            style={[
                                styles.backButtonMain,
                                { backgroundColor: themeColors.subtleBackground }
                            ]}
                        >
                            <IconSymbol name="print" size={19} color={themeColors.icon} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EmployeeFormScreen', {data: data})}
                            style={[
                                styles.backButtonMain,
                                { backgroundColor: themeColors.subtleBackground, marginLeft: 5 }
                            ]}
                        >
                            <IconSymbol name="pencil" size={19} color={themeColors.icon} />
                        </TouchableOpacity>
                    </View>
                </ThemedView>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[
                        styles.contentContainer,
                        { paddingBottom: insets.bottom + 100 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >

                    <View style={[
                        styles.profileCard,
                        {
                            backgroundColor: themeColors.card,
                            borderColor: themeColors.border, borderLeftColor: themeColors.primary
                        }
                    ]}>

                        <View style={[
                            styles.photoContainer,
                            {
                                backgroundColor: themeColors.subtleBackground,
                                borderColor: themeColors.border
                            }
                        ]}>
                            {employee?.photo ? (
                                <Image
                                    source={{ uri: employee.photo }}
                                    style={styles.photo}
                                />
                            ) : (
                                <Text style={[
                                    styles.initials,
                                    { color: themeColors.primary }
                                ]}>
                                    {initials || '?'}
                                </Text>
                            )}
                        </View>

                        <View style={styles.profileInformation}>
                            <Text style={[
                                styles.employeeName,
                                { color: themeColors.text }
                            ]}>
                                {fullName || 'Employee'}
                            </Text>

                            {employee?.otherNames ? (
                                <Text style={[
                                    styles.otherNames,
                                    { color: themeColors.subtleText }
                                ]}>
                                    {employee.otherNames}
                                </Text>
                            ) : null}

                            <Text style={[
                                styles.employeeDesignation,
                                { color: themeColors.primary }
                            ]}>
                                {displayValue(employee?.designation_name, 'Designation')}
                            </Text>

                            <View style={styles.profileMeta}>
                                <View style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            employee?.status === 'active'
                                                ? '#E8F5E9'
                                                : themeColors.subtleBackground
                                    }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        {
                                            color:
                                                employee?.status === 'active'
                                                    ? '#2E7D32'
                                                    : themeColors.subtleText
                                        }
                                    ]}>
                                        {displayValue(employee?.status)}
                                    </Text>
                                </View>

                                {employee?.employeeType ? (
                                    <Text style={[
                                        styles.employeeType,
                                        { color: themeColors.subtleText }
                                    ]}>
                                        {employee.emp_type_name}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </View>

                    <Section title="Personal Information">
                        <View style={styles.row}>
                            <DetailItem
                                label="First Name"
                                value={employee?.firstName}
                                width="48%"
                            />
                            <DetailItem
                                label="Last Name"
                                value={employee?.lastName}
                                width="48%"
                            />
                        </View>

                        <View style={styles.row}>
                            <DetailItem
                                label="Other Names"
                                value={employee?.otherNames}
                                width="48%"
                            />
                            <DetailItem
                                label="Gender"
                                value={employee?.gender}
                                width="48%"
                            />
                        </View>

                        <View style={styles.row}>
                            <DetailItem
                                label="Date of Birth"
                                value={formatDate(employee?.dob)}
                                width="48%"
                            />
                            <DetailItem
                                label="Phone"
                                value={employee?.phone}
                                width="48%"
                            />
                        </View>

                        <DetailItem
                            label="Email"
                            value={employee?.email}
                        />
                    </Section>

                    <Section title="Employment Information">
                        <View style={styles.row}>
                            <DetailItem
                                label="Employee Type"
                                value={employee?.emp_type_name}
                                width="48%"
                            />
                            <DetailItem
                                label="Employee Category"
                                value={employee?.emp_cat_name}
                                width="48%"
                            />
                        </View>

                        <View style={styles.row}>
                            <DetailItem
                                label="Department"
                                value={employee?.department_name}
                                width="48%"
                            />
                            <DetailItem
                                label="Designation"
                                value={employee?.designation_name}
                                width="48%"
                            />
                        </View>

                        <DetailItem
                            label="Location / Branch"
                            value={employee?.location_name}
                        />
                    </Section>

                    <Section title="Business Information">
                        <View style={styles.row}>
                            <DetailItem
                                label="Business"
                                value={employee?.business_name}
                                width="48%"
                            />
                            <DetailItem
                                label="Branch"
                                value={employee?.location_name}
                                width="48%"
                            />
                        </View>

                        <View style={styles.row}>
                            <DetailItem
                                label="Employee ID"
                                value={employee?.id}
                                width="48%"
                            />
                            <DetailItem
                                label="Business ID"
                                value={employee?.businessID}
                                width="48%"
                            />
                        </View>
                    </Section>

                    <Section title="Employee Bank Information">
                        <View style={styles.row}>
                            <DetailItem
                                label="Payment Method"
                                value={paymentMethodS?.value}
                                width="48%"
                            />
                            <DetailItem
                                label="Bank / Network"
                                value={momoProvider}
                                width="48%"
                            />
                        </View>

                        <View style={styles.row}>
                            <DetailItem
                                label="Account Name"
                                value={employee.accountName}
                                width="48%"
                            />
                            <DetailItem
                                label="Account Number"
                                value={employee?.accountNumber}
                                width="48%"
                            />
                        </View>
                        {employee?.bankBranch ? (
                            <View style={styles.row}>
                                
                                <DetailItem
                                    label="Bank Branch"
                                    value={employee.bankBranch}
                                    width="48%"
                                />
                            </View>
                        ) : null}
                    </Section>

                    <Section title="System Record Information">
                        <View style={styles.row}>
                            <DetailItem
                                label="Created By"
                                value={employee?.createdByName}
                                width="48%"
                            />
                            <DetailItem
                                label="Joined At"
                                value={formatDateTime(employee?.createdAt)}
                                width="48%"
                            />
                        </View>

                        <View style={styles.row}>
                            
                            <DetailItem
                                label="Last Updated"
                                value={formatDateTime(employee?.lastUpdatedAt)}
                                width="48%"
                            />
                        </View>
                    </Section>

                    <View style={[
                        styles.printFooter,
                        { borderTopColor: themeColors.border }
                    ]}>
                        <Text style={[
                            styles.printFooterText,
                            { color: themeColors.subtleText }
                        ]}>
                            Employee Profile
                        </Text>

                        <Text style={[
                            styles.printFooterText,
                            { color: themeColors.subtleText }
                        ]}>
                            {fullName}
                        </Text>
                    </View>

                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusBarSpacer: {
        width: '100%',
        height: 10,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 7,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold'
    },
    backButtonMain: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCard: {
        borderWidth: 1,
        borderRadius: Borders.radiusMedium,
        padding: Spacing.large,
        marginBottom: Spacing.medium,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 2
    },
    photoContainer: {
        width: 92,
        height: 92,
        borderRadius: 46,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginRight: Spacing.large,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    initials: {
        fontSize: 30,
        fontFamily: 'Bold',
    },
    profileInformation: {
        flex: 1,
    },
    employeeName: {
        fontSize: 22,
        fontFamily: 'Bold',
        marginBottom: 2,
    },
    otherNames: {
        fontSize: Typography.small,
        fontFamily: 'Regular',
        marginBottom: 4,
    },
    employeeDesignation: {
        fontSize: Typography.body,
        fontFamily: 'SemiBold',
        marginBottom: Spacing.small,
    },
    profileMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: Spacing.small,
        paddingVertical: 4,
        borderRadius: Borders.radiusSmall,
        marginRight: Spacing.small,
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'SemiBold',
        textTransform: 'capitalize',
    },
    employeeType: {
        fontSize: Typography.small,
        fontFamily: 'Regular',
    },
    section: {
        borderWidth: 1,
        borderRadius: Borders.radiusMedium,
        marginBottom: Spacing.medium,
        overflow: 'hidden',
        borderLeftWidth: 2
    },
    sectionHeader: {
        paddingHorizontal: Spacing.large,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontSize: Typography.body,
        fontFamily: 'SemiBold',
    },
    sectionBody: {
        padding: Spacing.large,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        marginBottom: Spacing.large,
    },
    detailLabel: {
        fontSize: 10,
        fontFamily: 'Medium',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    detailValue: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold',
        lineHeight: 18,
    },
    printFooter: {
        borderTopWidth: 1,
        paddingTop: Spacing.medium,
        marginTop: Spacing.small,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    printFooterText: {
        fontSize: 9,
        fontFamily: 'Regular',
    },
})

export default EmployeeDetailScreen;
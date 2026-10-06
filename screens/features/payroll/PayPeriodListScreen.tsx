import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedText } from '../../../components/ui/ThemedText';
import { ThemedView } from '../../../components/ui/ThemedView';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

type TPayPeriodListScreen = NativeStackScreenProps<PayrollNavigationList, "PayPeriodListScreen">

type PayPeriodFetch = {
    year: BottomSheetSelectOption | null;
    status: BottomSheetSelectOption | null
}

const PayPeriodListScreen = ({navigation}: TPayPeriodListScreen) => {

    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const currentYear = new Date().getFullYear()

    const yearOptions:BottomSheetSelectOption[] = [
        {
            key: String(currentYear - 2),
            value: String(currentYear - 2)
        },
        {
            key: String(currentYear - 1),
            value: String(currentYear - 1)
        },
        {
            key: String(currentYear),
            value: String(currentYear)
        },
        {
            key: String(currentYear + 1),
            value: String(currentYear + 1)
        },
        {
            key: String(currentYear + 2),
            value: String(currentYear + 2)
        }
    ]

    const statusOptions:BottomSheetSelectOption[] = [
        {
            key: 'active',
            value: 'Active'
        },
        {
            key: 'inactive',
            value: 'Inactive'
        }
    ]
    
    const [form, setForm] = useState<PayPeriodFetch>({
        year: { key: yearOptions[2].key, value: yearOptions[2].value },
        status: { key: statusOptions[0].key, value: statusOptions[0].key }
    });

    const {
        selectedBusiness,
        session
    } = useAppContainer()

    const insets = useSafeAreaInsets();

    const [payPeriods, setPayPeriods] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "55%", "75%"], []);

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState('');
    const [activeField, setActiveField] = useState<keyof PayPeriodFetch | null>(null);

    const openBottomSheet = (field:keyof PayPeriodFetch, options:BottomSheetSelectOption[], title:string) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const selectOption = (option:BottomSheetSelectOption) => {
        if (activeField) {
            setForm(prev => ({ ...prev, [activeField]: option }));
        }

        bottomSheetRef.current?.close();
    };

    const fetchPayPeriods = async () => {

        if (!selectedBusiness.id) return

        setLoading(true)

        SocketIO.emit('fetch-pay-periods', {
            sessionID: session,
            businessID: selectedBusiness.id,
            year: form.year?.key,
            statusFilter: form.status?.key
        }, (response:any) => {

            setLoading(false)

            if (response.status === "success") {

                setPayPeriods(
                    response.data || []
                )

            } else {

                Alert.alert(
                    "Error",
                    response.message || "Failed to fetch pay periods"
                )
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchPayPeriods()
        }, [
            selectedBusiness.id,
            form.year?.key,
            form.status?.key
        ])
    )

    const formatDate = (date:string) => {

        if (!date) return ''

        const value = new Date(date)

        return value.toLocaleDateString(
            'en-US',
            {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }
        )
    }

    const getStatusColor = (status:string) => {

        if (status === 'open') {
            return themeColors.success
        }

        if (status === 'processing') {
            return themeColors.warning
        }

        if (status === 'paid') {
            return themeColors.primary
        }

        if (status === 'closed') {
            return themeColors.subtleText
        }

        if (status === 'inactive') {
            return themeColors.subtleText
        }

        return themeColors.error
    }

    const handleDeletePayPeriod = (period:any) => {

        Alert.alert(
            "Delete Pay Period",
            `Are you sure you want to delete "${period.name || 'Pay Period'}"?\n\nThe pay period will be removed and will no longer be used for payroll.`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {

                        SocketIO.emit(
                            'delete-pay-period',
                            {
                                sessionID: session,
                                businessID: selectedBusiness.id,
                                hiddenID: period.id
                            },
                            (response:any) => {

                                if (response.status === "success") {

                                    Alert.alert(
                                        "Deleted",
                                        "Pay period has been moved to inactive."
                                    )

                                    fetchPayPeriods()

                                } else {

                                    Alert.alert(
                                        "Error",
                                        response.message || "Failed to delete pay period"
                                    )
                                }
                            }
                        )
                    }
                }
            ]
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>

            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        {
                            backgroundColor: themeColors.background
                        }
                    ]}
                />
            )}

            <View
                style={[
                    styles.safeArea,
                    {
                        paddingTop: Platform.OS === 'ios'
                            ? insets.top
                            : 0
                    }
                ]}
            >

                <ThemedView
                    style={[
                        styles.header,
                        {
                            backgroundColor: themeColors.background,
                            borderBottomColor: themeColors.border
                        }
                    ]}
                >

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.backButtonMain,
                            {
                                backgroundColor: themeColors.subtleBackground
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
                        Pay Periods
                    </ThemedText>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("PayPeriodSetupScreen")}
                        style={[
                            styles.backButtonMain,
                            {
                                backgroundColor: themeColors.subtleBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="plus"
                            size={20}
                            color={themeColors.icon}
                        />
                    </TouchableOpacity>

                </ThemedView>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[
                        styles.contentContainer,
                        {
                            paddingBottom: insets.bottom + 30
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                >

                    <View style={{padding: 10}}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>
                                    Pay Year ( <Text style={{ fontFamily: 'Italic', fontSize: 12, color: themeColors.error }}>Required</Text> )
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}
                                    onPress={() => openBottomSheet('year', yearOptions, 'Select Year')}
                                >
                                    <Text style={{ color: form.year ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                        {form.year?.value || 'Select Year'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>
                                    Status ( <Text style={{ fontFamily: 'Italic', fontSize: 12, color: themeColors.error }}>Required</Text> )
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}
                                    onPress={() => openBottomSheet('status', statusOptions, 'Select Year')}
                                >
                                    <Text style={{ color: form.status ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                        {form.status?.value || 'Select Status'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {payPeriods.length === 0 && !loading ? (

                        <View style={styles.emptyContainer}>

                            <View
                                style={[
                                    styles.emptyIcon,
                                    {
                                        backgroundColor: themeColors.subtleBackground
                                    }
                                ]}
                            >
                                <IconSymbol
                                    name="calendar"
                                    size={30}
                                    color={themeColors.subtleText}
                                />
                            </View>

                            <ThemedText style={styles.emptyTitle}>
                                No {form.status?.key === 'active' ? 'Active' : 'Inactive'} Pay Periods
                            </ThemedText>

                            <Text
                                style={[
                                    styles.emptyText,
                                    {
                                        color: themeColors.subtleText
                                    }
                                ]}
                            >
                                There are no {form.status?.key} pay periods for {form.year?.key}.
                            </Text>

                            {form.status?.key === 'active' && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("PayPeriodSetupScreen")}
                                    style={[
                                        styles.createButton,
                                        {
                                            backgroundColor: themeColors.primary
                                        }
                                    ]}
                                >
                                    <Text style={styles.createButtonText}>
                                        Set Up Payroll
                                    </Text>
                                </TouchableOpacity>
                            )}

                        </View>

                    ) : (

                        payPeriods.map((period:any) => (

                            <TouchableOpacity
                                key={period.id}
                                activeOpacity={0.8}
                                style={[
                                    styles.periodCard,
                                    {
                                        backgroundColor: themeColors.card,
                                        borderColor: themeColors.border,
                                        borderLeftColor:
                                            period.status === 'inactive'
                                                ? themeColors.subtleText
                                                : themeColors.primary,
                                        opacity:
                                            period.status === 'inactive'
                                                ? 0.75
                                                : 1
                                    }
                                ]}
                            >

                                <View style={styles.periodTop}>

                                    <View
                                        style={[
                                            styles.periodIcon,
                                            {
                                                backgroundColor:
                                                    period.status === 'inactive'
                                                        ? themeColors.subtleText
                                                        : themeColors.primary
                                            }
                                        ]}
                                    >
                                        <IconSymbol
                                            name="calendar"
                                            size={19}
                                            color={themeColors.white}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            flex: 1,
                                            marginLeft: 10
                                        }}
                                    >

                                        <ThemedText style={styles.periodName}>
                                            {period.name || 'Pay Period'}
                                        </ThemedText>

                                        <Text
                                            style={[
                                                styles.frequency,
                                                {
                                                    color: themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            {period.frequency
                                                ? `${period.frequency.charAt(0).toUpperCase()}${period.frequency.slice(1)}`
                                                : ''
                                            }
                                        </Text>

                                    </View>

                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor:
                                                    `${getStatusColor(period.status)}20`
                                            }
                                        ]}
                                    >

                                        <View
                                            style={[
                                                styles.statusDot,
                                                {
                                                    backgroundColor:
                                                        getStatusColor(period.status)
                                                }
                                            ]}
                                        />

                                        <Text
                                            style={{
                                                color: getStatusColor(period.status),
                                                fontSize: 11,
                                                fontFamily: 'Medium'
                                            }}
                                        >
                                            {period.status
                                                ?.charAt(0)
                                                .toUpperCase() +
                                                period.status?.slice(1)
                                            }
                                        </Text>

                                    </View>

                                    {period.status !== 'inactive' && (

                                        <TouchableOpacity
                                            onPress={() => handleDeletePayPeriod(period)}
                                            style={[
                                                styles.deleteButton,
                                                {
                                                    backgroundColor:
                                                        `${themeColors.error}15`
                                                }
                                            ]}
                                        >
                                            <IconSymbol
                                                name="trash"
                                                size={17}
                                                color={themeColors.error}
                                            />
                                        </TouchableOpacity>

                                    )}

                                </View>

                                <View
                                    style={[
                                        styles.dateContainer,
                                        {
                                            borderTopColor: themeColors.border
                                        }
                                    ]}
                                >

                                    <View style={{ flex: 1 }}>

                                        <Text
                                            style={[
                                                styles.label,
                                                {
                                                    color: themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Period
                                        </Text>

                                        <Text
                                            style={[
                                                styles.value,
                                                {
                                                    color: themeColors.text
                                                }
                                            ]}
                                        >
                                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                        </Text>

                                    </View>

                                    <View
                                        style={{
                                            alignItems: 'flex-end'
                                        }}
                                    >

                                        <Text
                                            style={[
                                                styles.label,
                                                {
                                                    color: themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Pay Date
                                        </Text>

                                        <Text
                                            style={[
                                                styles.value,
                                                {
                                                    color:
                                                        period.status === 'inactive'
                                                            ? themeColors.subtleText
                                                            : themeColors.primary
                                                }
                                            ]}
                                        >
                                            {formatDate(period.payDate)}
                                        </Text>

                                    </View>

                                </View>

                            </TouchableOpacity>

                        ))
                    )}

                </ScrollView>
                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    enableContentPanningGesture
                    enableHandlePanningGesture
                    enableDynamicSizing={false}
                    handleIndicatorStyle={{ backgroundColor: themeColors.icon, marginTop: 10 }}
                    backgroundStyle={{ backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.info }}
                >
                    <ThemedText style={{ fontFamily: 'SemiBold', fontSize: 20, marginBottom: 20, textAlign: 'center', marginTop: 10 }}>
                        {sheetTitle || 'Select Option'}
                    </ThemedText>

                    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {sheetOptions.map(option => (
                            <TouchableOpacity
                                key={option.key}
                                style={{ padding: 20, backgroundColor: themeColors.card, borderRadius: 5, marginBottom: 5 }}
                                onPress={() => selectOption({ key: option.key, value: option.value })}
                            >
                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <Text style={{ fontSize: Typography.body, color: themeColors.text, fontFamily: "Medium" }}>
                                        {option.value}
                                    </Text>
                                    {activeField && form[activeField]?.key === option.key && (
                                        <IconSymbol
                                            name="check"
                                            size={20}
                                            color={themeColors.primary}
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </BottomSheetScrollView>
                </BottomSheet>
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

    scrollContainer: {
        flex: 1,
    },

    contentContainer: {
        padding: Spacing.small,
        paddingTop: 6,
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

    filterContainer: {
        marginBottom: 8,
        paddingVertical: 5,
    },

    filterLabel: {
        fontSize: 10,
        fontFamily: 'SemiBold',
        marginBottom: 6,
        marginLeft: 2,
    },

    periodCard: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 14,
        marginBottom: 5,
        borderLeftWidth: 3
    },

    periodTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    periodIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },

    periodName: {
        fontSize: Typography.body,
        fontFamily: 'SemiBold',
    },

    frequency: {
        fontSize: 11,
        fontFamily: 'Regular',
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 12,
    },

    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5,
    },

    deleteButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 7,
    },

    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        marginTop: 12,
        paddingTop: 12,
    },

    label: {
        fontSize: 10,
        fontFamily: 'Regular',
        marginBottom: 3,
    },

    value: {
        fontSize: 12,
        fontFamily: 'Medium',
    },

    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 30,
    },

    emptyIcon: {
        width: 65,
        height: 65,
        borderRadius: 33,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },

    emptyTitle: {
        fontSize: 18,
        fontFamily: 'SemiBold',
        marginBottom: 5,
    },

    emptyText: {
        fontSize: 13,
        fontFamily: 'Regular',
        textAlign: 'center',
        lineHeight: 19,
    },

    createButton: {
        marginTop: 20,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: Borders.radiusSmall,
    },

    createButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: 'SemiBold',
    },

    section: {
        marginBottom: 0
    },
    sectionTitle: {
        fontSize: Typography.body,
        fontFamily: 'Medium',
        marginBottom: 3,
    },

    input: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.large,
        fontSize: Typography.small,
        marginBottom: Spacing.medium,
        fontFamily: 'Regular'
    },

})

export default PayPeriodListScreen
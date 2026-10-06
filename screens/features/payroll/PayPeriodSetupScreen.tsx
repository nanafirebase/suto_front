import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { fullDateWord, SocketIO } from '../../../configuration/helpers/main.helpers';
import DatePickerField from '../../../components/ui/DatePickerField';

type TPayPeriodSetupScreen = NativeStackScreenProps<PayrollNavigationList, "PayPeriodSetupScreen">

type PayPeriodForm = {
    frequency: BottomSheetSelectOption | null;
    payDay: BottomSheetSelectOption | null
}

type PayPeriodPreview = {
    startDate: Date;
    endDate: Date;
    payDate: Date;
}

const PayPeriodSetupScreen = ({navigation}: TPayPeriodSetupScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { selectedBusiness, session } = useAppContainer();
    const insets = useSafeAreaInsets();

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const [form, setForm] = useState<PayPeriodForm>({
        frequency: { key: 'monthly', value: 'Monthly' },
        payDay: { key: 'last_day', value: 'Last day of month' }
    });

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState('');
    const [activeField, setActiveField] = useState<string | null>(null);
    const [previewPeriods, setPreviewPeriods] = useState<PayPeriodPreview[]>([]);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "55%", "75%"], []);

    const frequencyOptions:BottomSheetSelectOption[] = [
        { key: 'monthly', value: 'Monthly' },
        { key: 'weekly', value: 'Weekly' },
        { key: 'biweekly', value: 'Bi-weekly' }
    ];

    const payDayOptions:BottomSheetSelectOption[] = [
        { key: 'last_day', value: 'Last day of month' },
        { key: '1', value: '1st of month' },
        { key: '15', value: '15th of month' },
        { key: '20', value: '20th of month' },
        { key: '25', value: '25th of month' },
        { key: '28', value: '28th of month' },
        { key: '29', value: '29th of month' },
        { key: '30', value: '30th of month' },
        { key: '31', value: '31st of month' }
    ];

    const openBottomSheet = (field:string, options:BottomSheetSelectOption[], title:string) => {
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

    const normalizeDate = (date:Date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    const getLastDay = (year:number, month:number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getPayDate = (year:number, month:number, payDay:string):Date => {
        const lastDayOfMonth = getLastDay(year, month);

        if (payDay === 'last_day') {
            return new Date(
                year,
                month,
                lastDayOfMonth
            );
        }

        const selectedPayDay = Number(payDay);

        if (!selectedPayDay || selectedPayDay < 1) {
            return new Date(
                year,
                month,
                lastDayOfMonth
            );
        }

        const actualPayDay = Math.min(
            selectedPayDay,
            lastDayOfMonth
        );

        return new Date(
            year,
            month,
            actualPayDay
        );
    };

    const formatDate = (date:Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const generateMonthlyPeriods = ( start:Date, end:Date, payDay:string ):PayPeriodPreview[] => {
        const periods:PayPeriodPreview[] = [];

        const selectedStartDate = normalizeDate(start);
        const selectedEndDate = normalizeDate(end);

        let periodStart = new Date(selectedStartDate);

        while (periodStart <= selectedEndDate) {
            const year = periodStart.getFullYear();
            const month = periodStart.getMonth();

            /*
             * The period boundary is based ONLY on the selected
             * start/end dates and the monthly calendar.
             *
             * Pay Day does NOT control periodEnd.
             */
            let periodEnd = new Date(
                year,
                month + 1,
                0
            );

            periodEnd = normalizeDate(periodEnd);

            /*
             * Never allow the generated period to go beyond
             * the user's selected End Date.
             */
            if (periodEnd > selectedEndDate) {
                periodEnd = new Date(selectedEndDate);
            }

            /*
             * Pay Date is completely independent from periodEnd.
             *
             * Example:
             * Start: Aug 1
             * End: Aug 29
             * Pay Day: 28
             *
             * periodEnd = Aug 29
             * payDate   = Aug 28
             */
            const payDate = getPayDate(
                year,
                month,
                payDay
            );

            periods.push({
                startDate: new Date(periodStart),
                endDate: new Date(periodEnd),
                payDate: new Date(payDate)
            });

            /*
             * Move to the next calendar month.
             *
             * This does NOT use payDate.
             */
            periodStart = new Date(
                year,
                month + 1,
                1
            );

            periodStart = normalizeDate(periodStart);
        }

        return periods;
    };

    const generateWeeklyPeriods = (
        start:Date,
        end:Date
    ):PayPeriodPreview[] => {
        const periods:PayPeriodPreview[] = [];

        const selectedStartDate = normalizeDate(start);
        const selectedEndDate = normalizeDate(end);

        let periodStart = new Date(selectedStartDate);

        while (periodStart <= selectedEndDate) {
            let periodEnd = new Date(periodStart);

            periodEnd.setDate(
                periodEnd.getDate() + 6
            );

            periodEnd = normalizeDate(periodEnd);

            if (periodEnd > selectedEndDate) {
                periodEnd = new Date(selectedEndDate);
            }

            /*
             * Weekly pay date is the end of the weekly period.
             *
             * It does not modify periodEnd.
             */
            const payDate = new Date(periodEnd);

            periods.push({
                startDate: new Date(periodStart),
                endDate: new Date(periodEnd),
                payDate: new Date(payDate)
            });

            periodStart = new Date(periodEnd);

            periodStart.setDate(
                periodStart.getDate() + 1
            );

            periodStart = normalizeDate(periodStart);
        }

        return periods;
    };

    const generateBiweeklyPeriods = (
        start:Date,
        end:Date
    ):PayPeriodPreview[] => {
        const periods:PayPeriodPreview[] = [];

        const selectedStartDate = normalizeDate(start);
        const selectedEndDate = normalizeDate(end);

        let periodStart = new Date(selectedStartDate);

        while (periodStart <= selectedEndDate) {
            let periodEnd = new Date(periodStart);

            periodEnd.setDate(
                periodEnd.getDate() + 13
            );

            periodEnd = normalizeDate(periodEnd);

            if (periodEnd > selectedEndDate) {
                periodEnd = new Date(selectedEndDate);
            }

            /*
             * Bi-weekly pay date is the end of the period.
             */
            const payDate = new Date(periodEnd);

            periods.push({
                startDate: new Date(periodStart),
                endDate: new Date(periodEnd),
                payDate: new Date(payDate)
            });

            periodStart = new Date(periodEnd);

            periodStart.setDate(
                periodStart.getDate() + 1
            );

            periodStart = normalizeDate(periodStart);
        }

        return periods;
    };

    const generatePreview = useCallback(() => {
        if (!startDate || !endDate || !form.frequency) {
            setPreviewPeriods([]);
            return;
        }

        const selectedStartDate = normalizeDate(startDate);
        const selectedEndDate = normalizeDate(endDate);

        if (selectedStartDate > selectedEndDate) {
            setPreviewPeriods([]);
            return;
        }

        let periods:PayPeriodPreview[] = [];
        if (form.frequency.key === 'monthly') {
            periods = generateMonthlyPeriods(
                selectedStartDate,
                selectedEndDate,
                String(form.payDay?.key) || 'last_day'
            );
        }

        if (form.frequency.key === 'weekly') {
            periods = generateWeeklyPeriods(
                selectedStartDate,
                selectedEndDate
            );
        }

        if (form.frequency.key === 'biweekly') {
            periods = generateBiweeklyPeriods(
                selectedStartDate,
                selectedEndDate
            );
        }

        /*
         * Safety check:
         *
         * Every preview period MUST have:
         * - startDate
         * - endDate
         * - payDate
         *
         * This prevents fullDateWord(undefined) from
         * accidentally displaying today's date.
         */
        const validPeriods = periods.filter(period =>
            period.startDate instanceof Date &&
            !isNaN(period.startDate.getTime()) &&
            period.endDate instanceof Date &&
            !isNaN(period.endDate.getTime()) &&
            period.payDate instanceof Date &&
            !isNaN(period.payDate.getTime())
        );

        setPreviewPeriods(validPeriods);
    }, [
        startDate,
        endDate,
        form.frequency,
        form.payDay
    ]);

    useEffect(() => {
        generatePreview();
    }, [generatePreview]);

    const onGeneratePayPeriods = async () => {
        if (!selectedBusiness.id) {
            Alert.alert("Error", "No business selected");
            return;
        }

        if (!startDate || !endDate) {
            Alert.alert("Error", "Start date and end date are required");
            return;
        }

        const selectedStartDate = normalizeDate(startDate);
        const selectedEndDate = normalizeDate(endDate);

        if (selectedStartDate > selectedEndDate) {
            Alert.alert("Error", "Start date cannot be after end date");
            return;
        }

        if (!form.frequency?.key) {
            Alert.alert("Error", "Please select a pay frequency");
            return;
        }

        if (!form.payDay?.key) {
            Alert.alert("Error", "Please select a pay day");
            return;
        }

        if (previewPeriods.length === 0) {
            Alert.alert("Error", "No pay periods could be generated");
            return;
        }

        /*
         * Send the actual generated payDate.
         *
         * Do NOT calculate payDate again here.
         */
        const periods = previewPeriods.map(item => ({
            startDate: item.startDate,
            endDate: item.endDate,
            payDate: item.payDate
        }));

        const formData = {
            sessionID: session,
            businessID: selectedBusiness.id,
            frequency: form.frequency.key,
            payDay: form.payDay.key,
            startDate: selectedStartDate,
            endDate: selectedEndDate,
        }

        SocketIO.emit('add-update-pay-period', formData, (response:any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message, [
                    { text: "OK", onPress: () => navigation.goBack() }
                ])
            } else {
                Alert.alert("Error", response.message || "Failed to generate pay periods");
            }
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { height: 10, backgroundColor: themeColors.background }]} />
            )}

            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>Pay Period Setup</ThemedText>

                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <ThemedText style={{ ...styles.sectionTitle, fontSize: 15, marginBottom: 15, color: themeColors.text }}>
                            Pay Period Details
                        </ThemedText>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>
                                Pay Frequency ( <Text style={{ fontFamily: 'Italic', fontSize: 12, color: themeColors.error }}>Required</Text> )
                            </ThemedText>

                            <TouchableOpacity
                                style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}
                                onPress={() => openBottomSheet('frequency', frequencyOptions, 'Select Pay Frequency')}
                            >
                                <Text style={{ color: form.frequency ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.frequency?.value || 'Select Pay Frequency'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>
                                    Start Date ( <Text style={{ fontFamily: 'Italic', fontSize: 12, color: themeColors.error }}>Required</Text> )
                                </ThemedText>

                                <DatePickerField
                                    value={startDate}
                                    onChange={setStartDate}
                                    placeholder="Select start date"
                                    themeColors={themeColors}
                                />
                            </View>

                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>
                                    End Date ( <Text style={{ fontFamily: 'Italic', fontSize: 12, color: themeColors.error }}>Required</Text> )
                                </ThemedText>

                                <DatePickerField
                                    value={endDate}
                                    onChange={setEndDate}
                                    placeholder="Select end date"
                                    themeColors={themeColors}
                                />
                            </View>
                        </View>

                        {form.frequency?.key === 'monthly' && (
                            <View style={styles.section}>
                                <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>
                                    Pay Day
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}
                                    onPress={() => openBottomSheet('payDay', payDayOptions, 'Select Pay Day')}
                                >
                                    <Text style={{ color: themeColors.text, fontSize: Typography.small }}>
                                        {form.payDay?.value || 'Select Pay Day'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <ThemedText style={{ ...styles.sectionTitle, fontSize: 15, marginBottom: 15, marginTop: 15, color: themeColors.text }}>
                            Period Preview
                        </ThemedText>

                        {startDate && endDate && startDate <= endDate ? (
                            <View style={[styles.previewContainer, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
                                {previewPeriods.map((period, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.previewItem,
                                            {
                                                borderBottomColor: themeColors.border,
                                                borderBottomWidth: index === previewPeriods.length - 1 ? 0 : 1
                                            }
                                        ]}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontFamily: 'SemiBold', fontSize: Typography.body, color: themeColors.text }}>
                                                {period.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </Text>

                                            <Text style={{ fontFamily: 'Regular', fontSize: Typography.small, color: themeColors.subtleText, marginTop: 3 }}>
                                                {formatDate(period.startDate)} → {formatDate(period.endDate)}
                                            </Text>
                                        </View>

                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontFamily: 'Regular', fontSize: 10, color: themeColors.subtleText }}>
                                                Pay Date
                                            </Text>

                                            <Text style={{ fontFamily: 'SemiBold', fontSize: 11, color: themeColors.primary, marginTop: 2 }}>
                                                {formatDate(period.payDate)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}

                                <Text style={{ fontFamily: 'Italic', fontSize: 11, color: themeColors.subtleText, marginTop: 10 }}>
                                    {previewPeriods.length} pay period{previewPeriods.length === 1 ? '' : 's'} will be created.
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.emptyPreview, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
                                <IconSymbol name="calendar" size={24} color={themeColors.subtleText} />

                                <Text style={{ color: themeColors.subtleText, fontSize: Typography.small, fontFamily: 'Regular', marginTop: 8, textAlign: 'center' }}>
                                    Select a start date and end date to preview your pay periods.
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor: !startDate || !endDate || previewPeriods.length === 0
                                        ? themeColors.border
                                        : themeColors.primary
                                }
                            ]}
                            onPress={onGeneratePayPeriods}
                            disabled={!startDate || !endDate || previewPeriods.length === 0}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                Generate Pay Periods
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

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
                                <Text style={{ fontSize: Typography.body, color: themeColors.text, fontFamily: "Medium" }}>
                                    {option.value}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusBarSpacer: {
        width: '100%',
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.screenPadding,
        paddingTop: 10
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
    previewContainer: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: Spacing.medium,
        marginBottom: 10
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    periodNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10
    },
    emptyPreview: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    footer: {
        padding: Spacing.screenPadding,
        borderTopWidth: 1,
    },
    button: {
        paddingVertical: Spacing.large,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: Typography.body,
        fontFamily: 'SemiBold'
    },
});

export default PayPeriodSetupScreen;
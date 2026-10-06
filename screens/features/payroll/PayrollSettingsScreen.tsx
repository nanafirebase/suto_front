import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type TPayrollSettingsScreen = NativeStackScreenProps<PayrollNavigationList, "PayrollSettingsScreen">

type SettingsOption = {
    key: string
    value: string
}

const payFrequencyOptions: SettingsOption[] = [
    { key: 'weekly', value: 'Weekly' },
    { key: 'biweekly', value: 'Bi-weekly' },
    { key: 'monthly', value: 'Monthly' },
]

const periodClosingOptions: SettingsOption[] = [
    { key: 'last_day', value: 'Last day of period' },
    { key: 'specific_day', value: 'Specific day' },
]

const payDateOptions: SettingsOption[] = [
    { key: 'period_closing', value: 'Period closing date' },
    { key: 'specific_day', value: 'Specific day' },
]

const PayrollSettingsScreen = ({ navigation }: TPayrollSettingsScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness } = useAppContainer();

    const [defaultPayFrequency, setDefaultPayFrequency] = useState('monthly');
    const [defaultPeriodClosing, setDefaultPeriodClosing] = useState('last_day');
    const [defaultPayDate, setDefaultPayDate] = useState('period_closing');
    const [defaultPayDateDay, setDefaultPayDateDay] = useState('');

    const [defaultWorkingHours, setDefaultWorkingHours] = useState('8');
    const [proratePartialPeriods, setProratePartialPeriods] = useState(true);

    const [enableOvertime, setEnableOvertime] = useState(false);
    const [overtimeRate, setOvertimeRate] = useState('1.5');

    const [deductLateMinutes, setDeductLateMinutes] = useState(false);
    const [deductAbsence, setDeductAbsence] = useState(true);
    const [allowNegativePayroll, setAllowNegativePayroll] = useState(false);

    const [generatePayslipsAutomatically, setGeneratePayslipsAutomatically] = useState(true);
    const [requirePayrollApproval, setRequirePayrollApproval] = useState(false);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [sheetOptions, setSheetOptions] = useState<SettingsOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState('');
    const [activeField, setActiveField] = useState<string | null>(null);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "55%", "75%"], []);

    const openBottomSheet = (field: string, options: SettingsOption[], title: string) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const selectOption = (option: SettingsOption) => {
        if (activeField === 'defaultPayFrequency') setDefaultPayFrequency(option.key);
        if (activeField === 'defaultPeriodClosing') setDefaultPeriodClosing(option.key);
        if (activeField === 'defaultPayDate') setDefaultPayDate(option.key);
        bottomSheetRef.current?.close();
    };

    const getOptionValue = (options: SettingsOption[], key: string) => options.find(option => option.key === key)?.value || '';

    const fetchPayrollSettings = async () => {
        if (!selectedBusiness?.id) return;

        setLoading(true);

        SocketIO.emit('fetch-payroll-settings', { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            setLoading(false);

            if (response.status === "success") {
                const settings = response.data;
                if (!settings) return;

                setDefaultPayFrequency(settings.defaultPayFrequency || 'monthly');
                setDefaultPeriodClosing(settings.defaultPeriodClosing || 'last_day');
                setDefaultPayDate(settings.defaultPayDate || 'period_closing');
                setDefaultPayDateDay(settings.defaultPayDateDay !== null && settings.defaultPayDateDay !== undefined ? String(settings.defaultPayDateDay) : '');
                setDefaultWorkingHours(settings.defaultWorkingHours !== null && settings.defaultWorkingHours !== undefined ? String(settings.defaultWorkingHours) : '8');
                setProratePartialPeriods(Boolean(settings.proratePartialPeriods));
                setEnableOvertime(Boolean(settings.enableOvertime));
                setOvertimeRate(settings.overtimeRate !== null && settings.overtimeRate !== undefined ? String(settings.overtimeRate) : '1.5');
                setDeductLateMinutes(Boolean(settings.deductLateMinutes));
                setDeductAbsence(Boolean(settings.deductAbsence));
                setAllowNegativePayroll(Boolean(settings.allowNegativePayroll));
                setGeneratePayslipsAutomatically(Boolean(settings.generatePayslipsAutomatically));
                setRequirePayrollApproval(Boolean(settings.requirePayrollApproval));
            } else {
                Alert.alert("Error", response.message || "Failed to fetch payroll settings");
            }
        });
    };

    useFocusEffect(
        useCallback(() => {
            fetchPayrollSettings();
        }, [selectedBusiness?.id])
    );

    const onSaveSettings = async () => {
        if (!selectedBusiness?.id) {
            Alert.alert("Error", "No business selected");
            return;
        }

        const workingHours = Number(defaultWorkingHours);
        const overtime = Number(overtimeRate);
        const payDateDay = defaultPayDateDay ? Number(defaultPayDateDay) : undefined;

        if (!defaultPayFrequency || !defaultPeriodClosing || !defaultPayDate) {
            Alert.alert("Error", "Please complete the payroll frequency and date settings");
            return;
        }

        if (!workingHours || workingHours <= 0 || workingHours > 24) {
            Alert.alert("Error", "Default working hours must be between 1 and 24");
            return;
        }

        if (defaultPayDate === 'specific_day' && (!payDateDay || payDateDay < 1 || payDateDay > 31)) {
            Alert.alert("Error", "Please enter a valid pay date day between 1 and 31");
            return;
        }

        if (enableOvertime && (!overtime || overtime <= 0)) {
            Alert.alert("Error", "Overtime rate must be greater than zero");
            return;
        }

        setSaving(true);

        const formData = {
            sessionID: session,
            businessID: selectedBusiness.id,
            defaultPayFrequency,
            defaultPeriodClosing,
            defaultPayDate,
            defaultPayDateDay: payDateDay,
            defaultWorkingHours: workingHours,
            proratePartialPeriods,
            deductLateMinutes,
            deductAbsence,
            allowNegativePayroll,
            enableOvertime,
            overtimeRate: overtime,
            generatePayslipsAutomatically,
            requirePayrollApproval
        };

        SocketIO.emit('add-update-payroll-settings', formData, (response: any) => {
            setSaving(false);

            if (response.status === "success") {
                Alert.alert("Success", response.message || "Payroll settings saved successfully");
            } else {
                Alert.alert("Error", response.message || "Failed to save payroll settings", [
                    { text: "Retry", onPress: () => onSaveSettings() },
                    { text: "Cancel", style: "cancel" }
                ], { cancelable: true });
            }
        });
    };

    const ToggleRow = ({ title, description, value, onChange }: { title: string, description?: string, value: boolean, onChange: (value: boolean) => void }) => {
        return (
            <View style={[styles.toggleRow, { borderBottomColor: themeColors.border }]}>
                <View style={styles.toggleTextContainer}>
                    <ThemedText style={[styles.toggleTitle, { color: themeColors.text }]}>{title}</ThemedText>
                    {description && <ThemedText style={[styles.toggleDescription, { color: themeColors.subtleText }]}>{description}</ThemedText>}
                </View>
                <TouchableOpacity activeOpacity={0.8} onPress={() => onChange(!value)} style={[styles.toggle, { backgroundColor: value ? themeColors.primary : themeColors.border }]}>
                    <View style={[styles.toggleCircle, { backgroundColor: '#FFFFFF', transform: [{ translateX: value ? 18 : 2 }] }]} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={[styles.statusBarSpacer, { height: 10, backgroundColor: themeColors.background }]} />}

            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Payroll Settings</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false} bounces={false}>

                        <ThemedText style={[styles.sectionHeading, { color: themeColors.text }]}>General Payroll</ThemedText>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={[styles.label, { color: themeColors.subtleText }]}>Default Pay Frequency</ThemedText>
                                <TouchableOpacity style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('defaultPayFrequency', payFrequencyOptions, 'Select Pay Frequency')}>
                                    <Text style={[styles.inputText, { color: themeColors.text }]}>{getOptionValue(payFrequencyOptions, defaultPayFrequency)}</Text>
                                    <IconSymbol name="chevron.right" size={18} color={themeColors.subtleText} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={[styles.label, { color: themeColors.subtleText }]}>Period Closing</ThemedText>
                                <TouchableOpacity style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('defaultPeriodClosing', periodClosingOptions, 'Select Period Closing')}>
                                    <Text style={[styles.inputText, { color: themeColors.text }]}>{getOptionValue(periodClosingOptions, defaultPeriodClosing)}</Text>
                                    <IconSymbol name="chevron.right" size={18} color={themeColors.subtleText} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={[styles.label, { color: themeColors.subtleText }]}>Pay Date</ThemedText>
                            <TouchableOpacity style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('defaultPayDate', payDateOptions, 'Select Pay Date')}>
                                <Text style={[styles.inputText, { color: themeColors.text }]}>{getOptionValue(payDateOptions, defaultPayDate)}</Text>
                                <IconSymbol name="chevron.right" size={18} color={themeColors.subtleText} />
                            </TouchableOpacity>
                        </View>

                        {defaultPayDate === 'specific_day' && (
                            <View style={styles.section}>
                                <ThemedText style={[styles.label, { color: themeColors.subtleText }]}>Pay Date Day</ThemedText>
                                <TextInput style={[styles.textInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]} placeholder="e.g. 25" placeholderTextColor={themeColors.subtleText} keyboardType="numeric" value={defaultPayDateDay} onChangeText={setDefaultPayDateDay} maxLength={2} />
                            </View>
                        )}

                        <ThemedText style={[styles.sectionHeading, { color: themeColors.text }]}>Working Hours</ThemedText>

                        <View style={styles.section}>
                            <ThemedText style={[styles.label, { color: themeColors.subtleText }]}>Default Working Hours</ThemedText>
                            <TextInput style={[styles.textInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]} placeholder="8" placeholderTextColor={themeColors.subtleText} keyboardType="decimal-pad" value={defaultWorkingHours} onChangeText={setDefaultWorkingHours} />
                        </View>

                        <ThemedText style={[styles.sectionHeading, { color: themeColors.text }]}>Pay Rules</ThemedText>

                        <ToggleRow title="Prorate Partial Periods" description="Calculate salary proportionally when an employee works part of a pay period." value={proratePartialPeriods} onChange={setProratePartialPeriods} />

                        <ToggleRow title="Deduct Late Minutes" description="Deduct pay when an employee arrives late based on recorded attendance." value={deductLateMinutes} onChange={setDeductLateMinutes} />

                        <ToggleRow title="Deduct Absence" description="Deduct pay for unpaid absence from the employee's salary." value={deductAbsence} onChange={setDeductAbsence} />

                        <ToggleRow title="Allow Negative Payroll" description="Allow deductions to exceed the employee's payable amount." value={allowNegativePayroll} onChange={setAllowNegativePayroll} />

                        <ThemedText style={[styles.sectionHeading, { color: themeColors.text }]}>Overtime</ThemedText>

                        <ToggleRow title="Enable Overtime" description="Allow overtime to be included in payroll calculations." value={enableOvertime} onChange={setEnableOvertime} />

                        {enableOvertime && (
                            <View style={styles.section}>
                                <ThemedText style={[styles.label, { color: themeColors.subtleText }]}>Overtime Rate</ThemedText>
                                <View style={[styles.rateInputContainer, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
                                    <TextInput style={[styles.rateInput, { color: themeColors.text }]} placeholder="1.5" placeholderTextColor={themeColors.subtleText} keyboardType="decimal-pad" value={overtimeRate} onChangeText={setOvertimeRate} />
                                    <Text style={[styles.rateSuffix, { color: themeColors.subtleText }]}>× hourly rate</Text>
                                </View>
                            </View>
                        )}

                        <ThemedText style={[styles.sectionHeading, { color: themeColors.text }]}>Payslips</ThemedText>

                        <ToggleRow title="Generate Payslips Automatically" description="Automatically create payslips when payroll processing is completed." value={generatePayslipsAutomatically} onChange={setGeneratePayslipsAutomatically} />

                        <ThemedText style={[styles.sectionHeading, { color: themeColors.text }]}>Payroll Approval</ThemedText>

                        <ToggleRow title="Require Payroll Approval" description="Require payroll to be approved before it can be finalized." value={requirePayrollApproval} onChange={setRequirePayrollApproval} />

                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border, paddingBottom: insets.bottom + Spacing.screenPadding }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: saving || loading ? themeColors.border : themeColors.primary }]} onPress={onSaveSettings} disabled={saving || loading} activeOpacity={0.8}>
                            <ThemedText style={styles.buttonText}>{saving ? 'Saving Settings...' : 'Save Settings'}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose enableContentPanningGesture enableHandlePanningGesture enableDynamicSizing={false} handleIndicatorStyle={{ backgroundColor: themeColors.icon, marginTop: 10 }} backgroundStyle={{ backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.info }}>
                    <ThemedText style={[styles.sheetTitle, { color: themeColors.text }]}>{sheetTitle || 'Select Option'}</ThemedText>

                    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
                        {sheetOptions.map(option => (
                            <TouchableOpacity key={option.key} style={[styles.sheetOption, { backgroundColor: themeColors.card }]} onPress={() => selectOption(option)}>
                                <Text style={[styles.sheetOptionText, { color: themeColors.text }]}>{option.value}</Text>

                                {((activeField === 'defaultPayFrequency' && defaultPayFrequency === option.key) || (activeField === 'defaultPeriodClosing' && defaultPeriodClosing === option.key) || (activeField === 'defaultPayDate' && defaultPayDate === option.key)) && (
                                    <IconSymbol name="check" size={18} color={themeColors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    statusBarSpacer: { width: '100%' },
    safeArea: { flex: 1 },
    scrollContainer: { flex: 1 },
    contentContainer: { padding: Spacing.screenPadding, paddingTop: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.medium, borderBottomWidth: 1 },
    backButtonMain: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    sectionHeading: { fontSize: 15, fontFamily: 'SemiBold', marginTop: 10, marginBottom: 12 },
    section: { marginBottom: 5 },
    label: { fontSize: Typography.body, fontFamily: 'Regular', marginBottom: 4 },
    input: { minHeight: 52, borderWidth: 1, borderRadius: Borders.radiusSmall, paddingHorizontal: Spacing.medium, marginBottom: Spacing.medium, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inputText: { fontSize: Typography.small, fontFamily: 'Regular' },
    textInput: { minHeight: 52, borderWidth: 1, borderRadius: Borders.radiusSmall, paddingHorizontal: Spacing.medium, paddingVertical: Spacing.medium, fontSize: Typography.small, fontFamily: 'Regular', marginBottom: Spacing.medium },
    rateInputContainer: { minHeight: 52, borderWidth: 1, borderRadius: Borders.radiusSmall, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.medium, marginBottom: Spacing.medium },
    rateInput: { flex: 1, fontSize: Typography.small, fontFamily: 'Regular', paddingVertical: 12 },
    rateSuffix: { fontSize: Typography.small, fontFamily: 'Regular', marginLeft: 5 },
    toggleRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, marginBottom: 5 },
    toggleTextContainer: { flex: 1, paddingRight: 20 },
    toggleTitle: { fontSize: Typography.body, fontFamily: 'Regular', marginBottom: 3 },
    toggleDescription: { fontSize: Typography.small, fontFamily: 'Regular', lineHeight: 18 },
    toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
    toggleCircle: { width: 20, height: 20, borderRadius: 10, position: 'absolute' },
    footer: { padding: Spacing.screenPadding, borderTopWidth: 1 },
    button: { paddingVertical: Spacing.large, borderRadius: Borders.radiusSmall, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: Typography.body, fontFamily: 'SemiBold' },
    sheetTitle: { fontFamily: 'SemiBold', fontSize: 20, marginBottom: 20, textAlign: 'center', marginTop: 10 },
    sheetOption: { padding: 20, borderRadius: 5, marginBottom: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sheetOptionText: { fontSize: Typography.body, fontFamily: 'Regular' },
});

export default PayrollSettingsScreen;
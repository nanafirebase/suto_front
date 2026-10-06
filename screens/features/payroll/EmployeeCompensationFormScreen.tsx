import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import DatePickerField from '../../../components/ui/DatePickerField';
import { useFocusEffect } from '@react-navigation/native';

type CompensationSource = 'individual'|'role'|'grade'
type CompensationType = 'salary'|'wage'
type WageRateType = 'fixed'|'percentage'
type WagePeriod = 'hourly'|'daily'|'weekly'|'monthly'|'per_service'

type CompensationForm = {
    source: BottomSheetSelectOption|null
    sourceItem: BottomSheetSelectOption|null
    type: BottomSheetSelectOption|null
    wageRateType: BottomSheetSelectOption|null
    wagePeriod: BottomSheetSelectOption|null
    currency: BottomSheetSelectOption|null
}

type TEmployeeCompensationFormScreen = NativeStackScreenProps<PayrollNavigationList, "EmployeeCompensationFormScreen">

const EmployeeCompensationFormScreen = ({navigation, route}: TEmployeeCompensationFormScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const { selectedBusiness, session, businessCurrency } = useAppContainer()
    const insets = useSafeAreaInsets()
    const { data } = route.params

    const [salary, setSalary] = useState("")
    const [wageRate, setWageRate] = useState("")
    const [effectiveFrom, setEffectiveFrom] = useState<Date|null>(null)
    const [effectiveTo, setEffectiveTo] = useState<Date|null>(null)
    const [description, setDescription] = useState("")

    const [employees, setEmployees] = useState<BottomSheetSelectOption[]>([])
    const [roles, setRoles] = useState<BottomSheetSelectOption[]>([])
    const [grades, setGrades] = useState<BottomSheetSelectOption[]>([])

    const [form, setForm] = useState<CompensationForm>({
        source: null,
        sourceItem: null,
        type: null,
        wageRateType: null,
        wagePeriod: null,
        currency: null
    })

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState("")
    const [activeField, setActiveField] = useState<keyof CompensationForm|null>(null)

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["40%", "50%", "75%"], [])

    const sourceOptions: BottomSheetSelectOption[] = [
        { key: "individual", value: "Individual Employee" },
        { key: "role", value: "Role" },
        { key: "grade", value: "Grade" }
    ]

    const typeOptions: BottomSheetSelectOption[] = [
        { key: "salary", value: "Salary" },
        { key: "wage", value: "Wage" }
    ]

    const wageRateTypeOptions: BottomSheetSelectOption[] = [
        { key: "fixed", value: "Fixed Amount" },
        { key: "percentage", value: "Percentage" }
    ]

    const wagePeriodOptions: BottomSheetSelectOption[] = [
        { key: "hourly", value: "Hourly" },
        { key: "daily", value: "Daily" },
        { key: "weekly", value: "Weekly" },
        { key: "monthly", value: "Monthly" },
        { key: "per_service", value: "Per Service" }
    ]

    const openBottomSheet = (field: keyof CompensationForm, options: BottomSheetSelectOption[], title: string) => {
        setActiveField(field)
        setSheetOptions(options)
        setSheetTitle(title)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const isEdit = !!data?.id

    const toDate = (value:any) =>
        value ? new Date(value) : null

    const makeOption = (key:any, value:any):BottomSheetSelectOption => ({
        key,
        value: String(value ?? "")
    })

    useEffect(() => {
        if (!data) return
    
        const source = data.source as CompensationSource
        const type = data.type as CompensationType
    
        let sourceItem:BottomSheetSelectOption|null = null
    
        if (source === "individual") {
            sourceItem = makeOption(
                data.employeeID,
                `${data.employeeFirstName || ""} ${data.employeeLastName || ""}${data.employeePhone ? ` (${data.employeePhone})` : ""}`.trim()
            )
        }
    
        if (source === "role") {
            sourceItem = makeOption(data.sourceID, data.roleName)
        }
    
        if (source === "grade") {
            sourceItem = makeOption(data.sourceID, data.gradeName)
        }
    
        setForm({
            source: makeOption(
                source,
                source === "individual"
                    ? "Individual Employee"
                    : source === "role"
                        ? "Role"
                        : "Grade"
            ),
            sourceItem,
            type: makeOption(
                type,
                type === "salary" ? "Salary" : "Wage"
            ),
            wageRateType: data.wageRateType
                ? makeOption(
                    data.wageRateType,
                    data.wageRateType === "fixed"
                        ? "Fixed Amount"
                        : "Percentage"
                )
                : null,
            wagePeriod: data.wagePeriod
                ? makeOption(
                    data.wagePeriod,
                    data.wagePeriod === "per_service"
                        ? "Per Service"
                        : data.wagePeriod.charAt(0).toUpperCase() + data.wagePeriod.slice(1)
                )
                : null,
            currency: data.currencyID
                ? makeOption(data.currencyID, data.currencyName)
                : null
        })
    
        setSalary(data.salary != null ? String(data.salary) : "")
        setWageRate(data.wageRate != null ? String(data.wageRate) : "")
        setEffectiveFrom(toDate(data.effectiveFrom))
        setEffectiveTo(toDate(data.effectiveTo))
        setDescription(data.description || "")
    }, [data])

    const selectOption = (option: BottomSheetSelectOption) => {
        if (activeField === "source") {
            setForm(prev => ({ ...prev, source: option, sourceItem: null }))
        } else if (activeField === "type") {
            setForm(prev => ({ ...prev, type: option, wageRateType: null, wagePeriod: null }))
            if (option.key === "salary") setWageRate("")
            else setSalary("")
        } else if (activeField) {
            setForm(prev => ({ ...prev, [activeField]: option }))
        }
        bottomSheetRef.current?.close()
    }

    const fetchEmployees = async () => {
        SocketIO.emit('fetch-employees', { sessionID: session, businessID: selectedBusiness.id }, (response:any) => {
            if (response.status === "success") {
                setEmployees((response.data || []).map((item:any) => ({
                    key: item.id,
                    value: `${item.firstName || ''} ${item.lastName || ''}${item.phone ? ` (${item.phone})` : ''}`.trim()
                })))
            } else Alert.alert("Error", "Error fetching employees", response.message)
        })
    }

    const fetchRoles = async () => {
        SocketIO.emit('fetch-roles', { sessionID: session, businessID: selectedBusiness.id }, (response:any) => {
            if (response.status === "success") {
                setRoles((response.data || []).map((item:any) => ({ key: item.id, value: `${item.name || ''}` })))
            } else Alert.alert("Error", "Error fetching roles", response.message)
        })
    }

    const fetchGrades = async () => {
        SocketIO.emit('fetch-grades', { sessionID: session, businessID: selectedBusiness.id }, (response:any) => {
            if (response.status === "success") {
                setGrades((response.data || []).map((item:any) => ({ key: item.id, value: `${item.name || ''}` })))
            } else Alert.alert("Error", "Error fetching grades", response.message)
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchEmployees()
            fetchRoles()
            fetchGrades()
        }, [])
    )

    const getSourceOptions = () => {
        if (form.source?.key === "individual") return employees
        if (form.source?.key === "role") return roles
        if (form.source?.key === "grade") return grades
        return []
    }

    const getSourceTitle = () => {
        if (form.source?.key === "individual") return "Select Employee"
        if (form.source?.key === "role") return "Select Role"
        if (form.source?.key === "grade") return "Select Grade"
        return "Select Source"
    }

    const isValid = useMemo(() => {
        if (!selectedBusiness.id || !form.source?.key || !form.sourceItem?.key || !form.type?.key || !businessCurrency.currencyID || !effectiveFrom) return false

        if (form.type.key === "salary" && (!salary || Number(salary) < 0)) return false

        if (form.type.key === "wage" && (!wageRate || Number(wageRate) < 0 || !form.wageRateType?.key || !form.wagePeriod?.key)) return false

        if (form.wageRateType?.key === "percentage" && Number(wageRate) > 100) return false

        if (effectiveTo && effectiveFrom && effectiveTo < effectiveFrom) return false

        return true
    }, [selectedBusiness.id, form, salary, wageRate, effectiveFrom, effectiveTo])

    const onSaveCompensation = async () => {
        if (!selectedBusiness.id) {
            Alert.alert("Error", "No business selected")
            return
        }

        if (!form.source?.key || !form.sourceItem?.key) {
            Alert.alert("Error", "Compensation source is required")
            return
        }

        if (!form.type?.key) {
            Alert.alert("Error", "Compensation type is required")
            return
        }

        if (!businessCurrency.currencyID) {
            Alert.alert("Error", "Currency is required")
            return
        }

        if (!effectiveFrom) {
            Alert.alert("Error", "Effective from date is required")
            return
        }

        if (form.type.key === "salary" && (!salary || Number(salary) < 0)) {
            Alert.alert("Error", "A valid salary amount is required")
            return
        }

        if (form.type.key === "wage") {
            if (!wageRate || Number(wageRate) < 0 || !form.wageRateType?.key || !form.wagePeriod?.key) {
                Alert.alert("Error", "Wage rate, rate type and wage period are required")
                return
            }

            if (form.wageRateType.key === "percentage" && Number(wageRate) > 100) {
                Alert.alert("Error", "Percentage wage rate cannot exceed 100%")
                return
            }
        }

        if (effectiveTo && effectiveTo < effectiveFrom) {
            Alert.alert("Error", "Effective to date cannot be before effective from date")
            return
        }

        const source = form.source.key as CompensationSource
        const type = form.type.key as CompensationType

        const formData = {
            sessionID: session,
            businessID: selectedBusiness.id,
            compensationID: isEdit ? data.id : undefined,
            employeeID: source === "individual" ? form.sourceItem.key : null,
            source,
            sourceID: source === "individual" ? null : form.sourceItem.key,
            type,
            salary: type === "salary" ? Number(salary) : undefined,
            wageRate: type === "wage" ? Number(wageRate) : undefined,
            wageRateType: type === "wage" ? form.wageRateType?.key as WageRateType : undefined,
            wagePeriod: type === "wage" ? form.wagePeriod?.key as WagePeriod : undefined,
            currencyID: businessCurrency.currencyID,
            effectiveFrom,
            effectiveTo,
            description
        }

        SocketIO.emit('add-update-employee-compensation', formData, (response:any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message)
                if (isEdit) navigation.goBack()
                else clearForm()
            } else {
                Alert.alert("Error", response.message || "Failed to save compensation", [
                    { text: "Retry", onPress: () => onSaveCompensation() },
                    { text: "Cancel", style: "cancel" }
                ], { cancelable: true })
            }
        })
    }

    const clearForm = () => {
        setSalary("")
        setWageRate("")
        setEffectiveFrom(null)
        setEffectiveTo(null)
        setDescription("")
        setForm({ source: null, sourceItem: null, type: null, wageRateType: null, wagePeriod: null, currency: null })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={[styles.statusBarSpacer, { height: 10, backgroundColor: themeColors.background }]} />}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{isEdit ? "Edit Compensation" : "Compensation Form"}</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <ThemedText style={styles.sectionHeading}>Compensation Source</ThemedText>

                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Source ( <Text style={styles.required}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('source', sourceOptions, 'Select Compensation Source')}>
                                <Text style={{ color: form.source ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>{form.source?.value || 'Select Source'}</Text>
                            </TouchableOpacity>
                        </View>

                        {form.source?.key && (
                            <View style={styles.section}>
                                <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>
                                    {form.source.key === "individual" ? "Employee" : form.source.key === "role" ? "Role" : "Grade"} ( <Text style={styles.required}>Required</Text> )
                                </ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('sourceItem', getSourceOptions(), getSourceTitle())}>
                                    <Text style={{ color: form.sourceItem ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }} numberOfLines={1}>{form.sourceItem?.value || getSourceTitle()}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <ThemedText style={styles.sectionHeading}>Compensation Details</ThemedText>

                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Compensation Type ( <Text style={styles.required}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('type', typeOptions, 'Select Compensation Type')}>
                                <Text style={{ color: form.type ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>{form.type?.value || 'Select Compensation Type'}</Text>
                            </TouchableOpacity>
                        </View>

                        {form.type?.key === "salary" && (
                            <View style={styles.section}>
                                <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Salary Amount ( <Text style={styles.required}>Required</Text> )</ThemedText>
                                <TextInput style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]} placeholder="5000.00" placeholderTextColor={themeColors.subtleText} keyboardType="decimal-pad" value={salary} onChangeText={setSalary} />
                            </View>
                        )}

                        {form.type?.key === "wage" && (
                            <>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ ...styles.section, width: '49%' }}>
                                        <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Wage Rate ( <Text style={styles.required}>Required</Text> )</ThemedText>
                                        <TextInput style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]} placeholder="30" placeholderTextColor={themeColors.subtleText} keyboardType="decimal-pad" value={wageRate} onChangeText={setWageRate} />
                                    </View>
                                    <View style={{ ...styles.section, width: '49%' }}>
                                        <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Rate Type ( <Text style={styles.required}>Required</Text> )</ThemedText>
                                        <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('wageRateType', wageRateTypeOptions, 'Select Wage Rate Type')}>
                                            <Text style={{ color: form.wageRateType ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>{form.wageRateType?.value || 'Select Rate Type'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Wage Period ( <Text style={styles.required}>Required</Text> )</ThemedText>
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('wagePeriod', wagePeriodOptions, 'Select Wage Period')}>
                                        <Text style={{ color: form.wagePeriod ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>{form.wagePeriod?.value || 'Select Period'}</Text>
                                    </TouchableOpacity>
                                </View>

                                {form.wagePeriod?.key === "per_service" && (
                                    <Text style={{ color: themeColors.subtleText, fontSize: 11, marginTop: -8, marginBottom: 12 }}>
                                        For percentage rates, the percentage is applied to the value of each service.
                                    </Text>
                                )}
                            </>
                        )}

                        <ThemedText style={styles.sectionHeading}>Effective Period</ThemedText>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Effective From ( <Text style={styles.required}>Required</Text> )</ThemedText>
                                <DatePickerField value={effectiveFrom} onChange={setEffectiveFrom} placeholder="Select date" themeColors={themeColors} defaultToToday={true} />
                            </View>
                            <View style={{ ...styles.section, width: '49%' }}>
                                <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Effective To</ThemedText>
                                <DatePickerField value={effectiveTo} onChange={setEffectiveTo} placeholder="Select date" themeColors={themeColors} defaultToToday={false} />
                                <Text style={{ fontFamily: 'Italic', fontSize: 11, color: themeColors.error, marginLeft: 5 }}>Leave blank if currently effective</Text>
                            </View>
                        </View>

                        <ThemedText style={styles.sectionHeading}>Additional Information</ThemedText>

                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Description</ThemedText>
                            <TextInput multiline numberOfLines={4} style={[styles.textArea, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]} placeholder="Add compensation description" placeholderTextColor={themeColors.subtleText} value={description} onChangeText={setDescription} textAlignVertical="top" />
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: isValid ? themeColors.primary : themeColors.border }]} onPress={onSaveCompensation} disabled={!isValid} activeOpacity={0.8}>
                            <ThemedText style={styles.buttonText}>{isEdit ? "Update Compensation" : "Save Compensation"}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose enableContentPanningGesture enableHandlePanningGesture enableDynamicSizing={false} handleIndicatorStyle={{ backgroundColor: themeColors.icon, marginTop: 10 }} backgroundStyle={{ backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.info }}>
                    <ThemedText style={{ fontFamily: 'SemiBold', fontSize: 20, marginBottom: 20, textAlign: 'center', marginTop: 10 }}>{sheetTitle || 'Select Option'}</ThemedText>
                    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {sheetOptions.map(option => (
                            <TouchableOpacity key={option.key} style={{ padding: 20, backgroundColor: themeColors.card, borderRadius: 5, marginBottom: 5 }} onPress={() => selectOption({ key: option.key, value: option.value })}>
                                <Text style={{ fontSize: Typography.body, color: themeColors.text, fontFamily: "Medium" }}>{option.value}</Text>
                            </TouchableOpacity>
                        ))}
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    statusBarSpacer: { width: '100%' },
    safeArea: { flex: 1 },
    scrollContainer: { flex: 1 },
    contentContainer: { padding: Spacing.screenPadding, paddingTop: 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.medium, borderBottomWidth: 1 },
    headerTitle: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    backButtonMain: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    section: { marginBottom: 0 },
    sectionHeading: { fontSize: 15, marginBottom: 15, marginTop: 15, color: '#000', fontFamily: 'Medium' },
    sectionTitle: { fontSize: Typography.body, fontFamily: 'Medium', marginBottom: 3 },
    required: { fontFamily: 'Italic', fontSize: 12, color: '#FF3B30' },
    input: { borderWidth: 1, borderRadius: Borders.radiusSmall, paddingHorizontal: Spacing.medium, paddingVertical: Spacing.large, fontSize: Typography.small, marginBottom: Spacing.medium, fontFamily: 'Regular' },
    textArea: { borderWidth: 1, borderRadius: Borders.radiusSmall, paddingHorizontal: Spacing.medium, paddingVertical: Spacing.medium, fontSize: Typography.small, marginBottom: Spacing.medium, minHeight: 100, fontFamily: 'Regular' },
    footer: { padding: Spacing.screenPadding, borderTopWidth: 1 },
    button: { paddingVertical: Spacing.large, borderRadius: Borders.radiusSmall, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: Typography.body, fontFamily: 'SemiBold' }
})

export default EmployeeCompensationFormScreen;
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
import DatePickerField from '../../../components/ui/DatePickerField';
import { useFocusEffect } from '@react-navigation/native';
import { fullDate, SocketIO } from '../../../configuration/helpers/main.helpers';

type PayrollForm = {
    department: BottomSheetSelectOption|null
    branch: BottomSheetSelectOption|null
    employeeCategory: BottomSheetSelectOption|null
    payPeriod: BottomSheetSelectOption|null
}

type TRunPayrollScreen = NativeStackScreenProps<PayrollNavigationList, "RunPayrollScreen">

const RunPayrollScreen = ({navigation}:TRunPayrollScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const {selectedBusiness, session} = useAppContainer()
    const insets = useSafeAreaInsets()

    const [payDate, setPayDate] = useState<Date|null>(new Date())
    const [departments, setDepartments] = useState<BottomSheetSelectOption[]>([])
    const [employeeCategoryOptions, setEmployeeCategoryOptions] = useState<BottomSheetSelectOption[]>([])
    const [branches, setBranches] = useState<BottomSheetSelectOption[]>([])
    const [payPeriods, setPayPeriods] = useState<BottomSheetSelectOption[]>([])


    const [form, setForm] = useState<PayrollForm>({
        department: null,
        branch: null,
        employeeCategory: null,
        payPeriod: null
    })

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState("")
    const [activeField, setActiveField] = useState<keyof PayrollForm|null>(null)
    const [loading, setLoading] = useState(false)

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["40%", "50%", "75%"], [])


    const openBottomSheet = (field:keyof PayrollForm, options:BottomSheetSelectOption[], title:string) => {
        setActiveField(field)
        setSheetOptions(options)
        setSheetTitle(title)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectOption = (option:BottomSheetSelectOption) => {
        if (!activeField) return

        setForm(prev => ({
            ...prev,
            [activeField]: option
        }))

        bottomSheetRef.current?.close()
    }

    const fetchDepartments = async () => {
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
                Alert.alert("Error", response.message || "Error fetching departments")
            }
        })
    }

    const fetchBranches = async () => {
        SocketIO.emit('fetch-locations', {
            sessionID:session,
            businessID:selectedBusiness.id
        }, (response:any) => {
            if (response.status === "success") {
                setBranches([
                    {key:"all", value:"All Locations"},
                    ...(response.data || []).map((item:any) => ({
                        key:item.id,
                        value:item.name
                    }))
                ])
            } else {
                Alert.alert("Error", response.message || "Error fetching locations")
            }
        })
    }

    const fetchEmployeeCategory = async () => {
        SocketIO.emit('fetch-employee-categories', { sessionID:session, businessID:selectedBusiness.id }, (response:any) => {
            if (response.status === "success") {
                setEmployeeCategoryOptions((response.data || []).map((item:any) => ({
                    key:item.id,
                    value: item.name
                })))
            } else {
                Alert.alert("Error", response.message || "Error fetching employee category")
            }
        })
    }

    const fetchPayPeriods = async () => {
        SocketIO.emit('fetch-pay-periods', { sessionID:session, businessID:selectedBusiness.id }, (response:any) => {
            if (response.status === "success") {
                setPayPeriods((response.data || []).map((item:any) => ({
                    key:item.id,
                    value: item.name || item.payPeriodName || item.period,
                    dependantValue: item.payDate
                })))
            } else {
                Alert.alert("Error", response.message || "Error fetching pay periods")
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            if (!selectedBusiness.id) return
            fetchDepartments()
            fetchBranches()
            fetchPayPeriods()
            fetchEmployeeCategory()
        }, [selectedBusiness.id])
    )

    const isValid = useMemo(() => {
        return !!selectedBusiness.id && !!form.payPeriod?.key && !!payDate
    }, [selectedBusiness.id, form.payPeriod, payDate])

    const onContinue = async () => {
        if (!selectedBusiness.id) {
            Alert.alert("Error", "No business selected")
            return
        }

        if (!form.payPeriod?.key) {
            Alert.alert("Error", "Pay period is required")
            return
        }

        if (!payDate) {
            Alert.alert("Error", "Pay date is required")
            return
        }

        setLoading(true)

        const branchID = form.branch?.key && form.branch.key !== "all" ? form.branch.key : undefined
        const departmentID = form.department?.key && form.department.key !== "all" ? form.department.key : undefined
        const employeeCategory = form.employeeCategory?.key && form.employeeCategory.key !== "all" ? form.employeeCategory.key : undefined

        SocketIO.emit('fetch-applicable-employees', { sessionID:session, businessID:selectedBusiness.id, branchID,
            departmentID, employeeCategory, payPeriodID:form.payPeriod.key, payDate
        }, (response:any) => {
            setLoading(false)

            if (response.status !== "success") {
                Alert.alert("Error", response.message || "Failed to load payroll employees")
                return
            }

            if (!response.data || !response.data.length) {
                Alert.alert("No Employees", "No employees were found for the selected payroll filters")
                return
            }

            if (!form.payPeriod?.key) {
                Alert.alert("Error", "Pay period is required")
                return
            }

            navigation.navigate("PayrollReviewScreen", {
                payrollData: {
                    businessID: selectedBusiness.id,
                    branchID: form.branch?.key ? Number(form.branch.key) : undefined,
                    departmentID: form.department?.key ? Number(form.department.key) : undefined,
                    employeeCategory: form.employeeCategory?.key ? String(form.employeeCategory.key) : undefined,
                    payPeriodID: form.payPeriod.key,
                    payPeriodName: form.payPeriod.value,
                    payDate: String(payDate),
                    sessionID: session,
                    employees: response.data || []
                }
            })
        })
    }

    const getSelectedText = (field:keyof PayrollForm, placeholder:string) => {
        return form[field]?.value || placeholder
    }

    useEffect(()=> {
        if (!form.payPeriod?.dependantValue) {
            setPayDate(null)
            return
        }
        setPayDate(new Date(form.payPeriod.dependantValue))
    }, [form.payPeriod?.key])

    return (
        <View style={[styles.container, {backgroundColor:themeColors.background}]}>
            {Platform.OS === 'android' && <View style={[styles.statusBarSpacer, {height:10, backgroundColor:themeColors.background}]} />}

            <View style={[styles.safeArea, {backgroundColor:themeColors.background, paddingTop:Platform.OS === 'ios' ? insets.top : 0}]}>
                <ThemedView style={[styles.header, {backgroundColor:themeColors.background, borderBottomColor:themeColors.border}]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, {backgroundColor:themeColors.subtleBackground}]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>Run Payroll</ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.contentContainer, {paddingBottom:insets.bottom + 100, paddingTop:10}]} showsVerticalScrollIndicator={false} bounces={false}>

                        <ThemedText style={{...styles.sectionHeading, color: themeColors.text}}>Payroll Period</ThemedText>

                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={[styles.sectionTitle, {color:themeColors.subtleText}]}>
                                    Pay Period ( <Text style={styles.required}>Required</Text> )
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, {justifyContent:'center', backgroundColor:themeColors.inputBackground, borderColor:themeColors.border}]}
                                    onPress={() => openBottomSheet("payPeriod", payPeriods, "Select Pay Period")}
                                >
                                    <Text style={{color:form.payPeriod ? themeColors.text : themeColors.subtleText, fontSize:Typography.small}}>
                                        {getSelectedText("payPeriod", "Select Pay Period")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={[styles.sectionTitle, {color:themeColors.subtleText}]}>
                                    Pay Date ( <Text style={styles.required}>Required</Text> )
                                </ThemedText>

                                <DatePickerField
                                    value={payDate}
                                    onChange={setPayDate}
                                    placeholder="Select pay date"
                                    themeColors={themeColors}
                                    defaultToToday={true}
                                />
                            </View>
                        </View>


                        <ThemedText style={{...styles.sectionHeading, color: themeColors.text}}>Payroll Filters</ThemedText>

                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={[styles.sectionTitle, {color:themeColors.subtleText}]}>
                                    Department
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, {justifyContent:'center', backgroundColor:themeColors.inputBackground, borderColor:themeColors.border}]}
                                    onPress={() => openBottomSheet("department", departments, "Select Department")}
                                >
                                    <Text style={{color:form.department ? themeColors.text : themeColors.subtleText, fontSize:Typography.small}}>
                                        {getSelectedText("department", "All Departments")}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={[styles.sectionTitle, {color:themeColors.subtleText}]}>
                                    Location / Branch
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, {justifyContent:'center', backgroundColor:themeColors.inputBackground, borderColor:themeColors.border}]}
                                    onPress={() => openBottomSheet("branch", branches, "Select Location / Branch")}
                                >
                                    <Text style={{color:form.branch ? themeColors.text : themeColors.subtleText, fontSize:Typography.small}}>
                                        {getSelectedText("branch", "All Branches")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, {color:themeColors.subtleText}]}>
                                Employee Category
                            </ThemedText>

                            <TouchableOpacity
                                style={[styles.input, {justifyContent:'center', backgroundColor:themeColors.inputBackground, borderColor:themeColors.border}]}
                                onPress={() => openBottomSheet("employeeCategory", [{key:"all", value:"All Employee Categories"}, ...employeeCategoryOptions], "Select Employee Category")}
                            >
                                <Text style={{color:form.employeeCategory ? themeColors.text : themeColors.subtleText, fontSize:Typography.small}}>
                                    {getSelectedText("employeeCategory", "All Employee Categories")}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>

                    <View style={[styles.footer, {backgroundColor:themeColors.background, borderTopColor:themeColors.border}]}>
                        <TouchableOpacity
                            style={[styles.button, {backgroundColor:isValid && !loading ? themeColors.primary : themeColors.border}]}
                            onPress={onContinue}
                            disabled={!isValid || loading}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                {loading ? "Loading..." : "Continue"}
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
                    handleIndicatorStyle={{backgroundColor:themeColors.icon, marginTop:10}}
                    backgroundStyle={{backgroundColor:themeColors.background, borderTopWidth:1, borderTopColor:themeColors.info}}
                >
                    <ThemedText style={{fontFamily:'SemiBold', fontSize:20, marginBottom:20, textAlign:'center', marginTop:10}}>
                        {sheetTitle || "Select Option"}
                    </ThemedText>

                    <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                        {sheetOptions.map(option => (
                            <TouchableOpacity
                                key={option.key}
                                style={{padding:20, backgroundColor:themeColors.card, borderRadius:5, marginBottom:5}}
                                onPress={() => selectOption({key:option.key, value:option.value, dependantValue: option.dependantValue ?? null})}
                            >
                                <Text style={{fontSize:Typography.body, color:themeColors.text, fontFamily:"Medium"}}>
                                    {option.value}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{flex:1},
    statusBarSpacer:{width:'100%'},
    safeArea:{flex:1},
    scrollContainer:{flex:1},
    contentContainer:{padding:Spacing.screenPadding, paddingTop:0},
    header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.screenPadding, paddingVertical:Spacing.medium, borderBottomWidth:1},
    headerTitle:{fontSize:Typography.heading2, fontFamily:'SemiBold'},
    backButtonMain:{width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center'},
    section:{marginBottom:0},
    sectionHeading:{fontSize:15, marginBottom:15, marginTop:15, color:'#000', fontFamily:'Medium'},
    sectionTitle:{fontSize:Typography.body, fontFamily:'Medium', marginBottom:3},
    required:{fontFamily:'Italic', fontSize:12, color:'#FF3B30'},
    input:{borderWidth:1, borderRadius:Borders.radiusSmall, paddingHorizontal:Spacing.medium, paddingVertical:Spacing.large, fontSize:Typography.small, marginBottom:Spacing.medium, fontFamily:'Regular'},
    footer:{padding:Spacing.screenPadding, borderTopWidth:1},
    button:{paddingVertical:Spacing.large, borderRadius:Borders.radiusSmall, alignItems:'center'},
    buttonText:{color:'#FFFFFF', fontSize:Typography.body, fontFamily:'SemiBold'}
})

export default RunPayrollScreen
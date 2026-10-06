import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, HomeNavigationList, HRMNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { genderOptions } from '../../../configuration/data/System'
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import DatePickerField from '../../../components/ui/DatePickerField';
import { useFocusEffect } from '@react-navigation/native';

type EmployeeForm = {
    gender: BottomSheetSelectOption | null;
    department: BottomSheetSelectOption | null;
    employeeType: BottomSheetSelectOption | null;
    employeeCategory: BottomSheetSelectOption | null;
    // shift: BottomSheetSelectOption | null;
    paymentMethod: BottomSheetSelectOption | null;
    designation: BottomSheetSelectOption | null;
    location: BottomSheetSelectOption | null;
    mobileMoneyProvider: BottomSheetSelectOption | null;
}

type TEmployeeFormScreen = NativeStackScreenProps<HRMNavigationList, "EmployeeFormScreen">
const EmployeeFormScreen = ({navigation, route}: TEmployeeFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const { selectedBusiness, session, userBranch } = useAppContainer() 
    const insets = useSafeAreaInsets();
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [otherNames, setOtherNames] = useState("")
    const [dob, setDOB] = useState<Date | null>(null);
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [employmentDate, setEmploymentDate] = useState<Date | null>(null);
    const [employmentEndDate, setEmploymentEndDate] = useState<Date | null>(null);
    const [employmentTypes, setEmploymentTypes] = useState([])
    const [employmentCategory, setEmploymentCategory] = useState([])
    const [departments, setDepartments] = useState([])
    const [designations, setDesignations] = useState([])
    const [branches, setBranches] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const { data } = route.params

    const [form, setForm] = useState<EmployeeForm>({
        gender: null,
        department: null,
        employeeType: null,
        employeeCategory: null,
        // shift: null,
        designation: null,
        paymentMethod: null,
        mobileMoneyProvider: null,
        location: null,
        // role: null
    })

    const paymentMethods = [
        {key: 'bank', value: 'Bank'},
        {key: 'mobile_money', value: 'Mobile Money'},
    ]
    const mobileMoneyProviders = [
        {key: 'telecel', value: 'Telecel'},
        {key: 'mtn', value: 'MTN'},
        {key: 'airtel_tigo', value: 'Airtel Tigo'},
    ]

    const [bankName, setBankName] = useState("")
    const [accountName, setAccountName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [bankBranch, setBankBranch] = useState("")

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState<string>('')
    const [activeField, setActiveField] = useState<string | null>(null)

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["40%", "50%", "75%"], [])

    const openBottomSheet = (field: keyof typeof form, options: BottomSheetSelectOption[], title: string) => {
        setActiveField(field)
        setSheetOptions(options)
        setSheetTitle(title)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectOption = (option: BottomSheetSelectOption) => {
        if (activeField) {
            setForm(prev => ({ ...prev, [activeField]: option }))
        }
        bottomSheetRef.current?.close()
    }

    const fetchEmploymentTypes = async () => {
        SocketIO.emit('fetch-employee-types' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name}`
                }))
                setEmploymentTypes(simplified)
            } else {
                Alert.alert("Error", "Error fetching employment types", response.message)
            }
        })
    }

    const fetchEmployeeCategory = async () => {
        SocketIO.emit('fetch-employee-categories' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name}`
                }))
                setEmploymentCategory(simplified)
            } else {
                Alert.alert("Error", "Error fetching employee category", response.message)
            }
        })
    }

    const fetchDepartments = async () => {
        SocketIO.emit('fetch-departments' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name}`
                }))
                setDepartments(simplified)
            } else {
                Alert.alert("Error", "Error fetching departments", response.message)
            }
        })
    }

    const fetchDesignations = async (departmentKey:string|number) => {
        SocketIO.emit('fetch-designations' , { sessionID: session, businessID: selectedBusiness.id, departmentID: departmentKey }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name} (${item.departmentName || ''})`
                }))
                setDesignations(simplified)
            } else {
                Alert.alert("Error", "Error fetching designations", response.message)
            }
        })
    }

    const fetchBranches = async () => {
        SocketIO.emit('fetch-locations' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name || ''} ( ${item.country_name || ''} )`
                }))
                const selectedBranch = simplified.find((item:any) => String(item.key) === String(userBranch.id)) || null
                setForm(prev => ({
                    ...prev,
                    location: selectedBranch,
                }))
                setBranches(simplified)
            } else {
                Alert.alert("Error", "Error fetching branches", response.message)
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchEmploymentTypes()
            fetchEmployeeCategory()
            fetchDepartments()
            fetchBranches()
        }, [])
    )

    useEffect(() => {
        if (!data) return
    
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setOtherNames(data.otherNames || '')
        setDOB(data.dob ? new Date(data.dob) : null)
        setEmail(data.email || '')
        setPhone(data.phone || '')
        setEmploymentDate(data.employmentStartDate ? new Date(data.employmentStartDate) : null)
        setEmploymentEndDate(data.employeeEndDate ? new Date(data.employeeEndDate) : null)
    
        setBankName(data.bankName || '')
        setBankBranch(data.bankBranch || '')
        setAccountName(data.accountName || '')
        setAccountNumber(data.accountNumber || '')

        const Gender = genderOptions.find((item:any) => String(item.key) === String(data.gender)) || null
        const employeeC = employmentCategory.find((item:any) => String(item.key) === String(data.employeeCategory)) || null
        const employeeT = employmentTypes.find((item:any) => String(item.key) === String(data.employeeType)) || null
        const departmentS = departments.find((item:any) => String(item.key) === String(data.departmentID)) || null
        const designationS = designations.find((item:any) => String(item.key) === String(data.designationID)) || null
        const paymentMethodS = paymentMethods.find((item:any) => String(item.key) === String(data.paymentMethod)) || null
        const mobileMoneyProviderS = mobileMoneyProviders.find((item:any) => String(item.key) === String(data.bankName)) || null
        const branchS = branches.find((item:any) => String(item.key) === String(data.locationID)) || null
        setForm(prev => ({
            ...prev,
            gender: Gender,
            employeeCategory: employeeC,
            employeeType: employeeT,
            department: departmentS,
            designation: designationS,
            paymentMethod: paymentMethodS,
            mobileMoneyProvider: data.paymentMethod === 'mobile_money' ? mobileMoneyProviderS : data.bankName,
            location: branchS
        }))
    }, [data, employmentCategory, employmentTypes, departments, designations, branches])

    useEffect(()=> {
        if (!form.department?.key) return
        fetchDesignations(form.department?.key)
    }, [form.department?.key])

    const onSaveEmployee = async () => {
        setIsLoading(true)
        try {
            if (!selectedBusiness.id) {
                Alert.alert("Error", "No business selected")
                return
            }
            if (!firstName || !lastName || !form.gender?.key || !phone || !dob || !employmentDate || !form.location?.key) {
                Alert.alert("Error", "Some fields are required")
                return
            }
    
            if (form.paymentMethod?.key === 'bank' && (!bankName || !bankBranch || !accountName || !accountNumber)) {
                Alert.alert("Error", "Please complete all bank details")
                return
            }
            
            if (form.paymentMethod?.key === 'mobile_money' && (!form.mobileMoneyProvider?.key || !accountName || !accountNumber)) {
                Alert.alert("Error", "Please complete all mobile money details")
                return
            }
    
            const formData = { sessionID: session, businessID: selectedBusiness.id, firstName, lastName, otherNames, gender: form.gender?.key,
                dob, phone, email, employeeType: form.employeeType?.key, employeeCategory: form.employeeCategory?.key,
                departmentID: form.department?.key, designationID: form.designation?.key, locationID: form.location?.key,
                employmentStartDate: employmentDate, employeeEndDate: employmentEndDate, paymentMethod: form.paymentMethod?.key,
                bankName: form.paymentMethod?.key === 'bank' ? bankName : form.mobileMoneyProvider?.key, bankBranch: form.paymentMethod?.key === 'bank' ? bankBranch : null,
                accountName: accountName, accountNumber, hiddenID: data?.id
            }
    
            SocketIO.emit('add-update-employee', formData, (response:any) => {
                if (response.status === "success") {
                    Alert.alert("Success", response.message)
                    clearForm()
                } else {
                    Alert.alert("Error", response.message || "Failed to add employee", [
                        { text: "Retry", onPress: () => onSaveEmployee() },
                        { text: "Cancel", style: "cancel" },
                    ],
                    { cancelable: true })
                }
            })
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    const clearForm = () => {
        setFirstName('')
        setLastName('')
        setOtherNames('')
        setDOB(null)
        setEmail('')
        setPhone('')
        setForm({
            employeeType: null,
            employeeCategory: null,
            department: null,
            designation: null,
            gender: null,
            location: null,
            paymentMethod: null,
            mobileMoneyProvider: null
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Staff Registration Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <ThemedText style={{...styles.sectionTitle, fontSize: 15, marginBottom: 15, color: themeColors.text, marginTop: 10}}>Basic Information</ThemedText>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>First Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <TextInput
                                    numberOfLines={1}
                                    style={[styles.input, {
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border,
                                        color: themeColors.text
                                    }]}
                                    placeholder="Frank"
                                    placeholderTextColor={themeColors.subtleText}
                                    keyboardType="default"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Last Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <TextInput
                                    numberOfLines={1}
                                    style={[styles.input, {
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border,
                                        color: themeColors.text
                                    }]}
                                    placeholder="Yeboah"
                                    placeholderTextColor={themeColors.subtleText}
                                    keyboardType="default"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>
                        </View>
                        
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Other Names</ThemedText>
                            <TextInput
                                numberOfLines={1}
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text
                                }]}
                                placeholder="Kweku"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                                value={otherNames}
                                onChangeText={setOtherNames}
                            />
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Gender ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('gender', genderOptions, 'Select Gender')}>
                                    <Text style={{ color: form.gender ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                        {form.gender?.value || 'Select Gender'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Date Of Birth ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <DatePickerField value={dob} onChange={setDOB} placeholder="Select date" themeColors={themeColors} />
                            </View>
                        </View>
                        <ThemedText style={{...styles.sectionTitle, fontSize: 15, marginBottom: 15, marginTop: 15, color: themeColors.text}}>Contact Information</ThemedText>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '39%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Phone ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <TextInput
                                    numberOfLines={1}
                                    style={[styles.input, {
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border,
                                        color: themeColors.text
                                    }]}
                                    placeholder="059*******88"
                                    placeholderTextColor={themeColors.subtleText}
                                    keyboardType="numeric"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                            <View style={{...styles.section, width: '59%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Email Address</ThemedText>
                                <TextInput
                                    numberOfLines={1}
                                    style={[styles.input, {
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border,
                                        color: themeColors.text
                                    }]}
                                    placeholder="frank****@gmail.com"
                                    placeholderTextColor={themeColors.subtleText}
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>
                        <ThemedText style={{...styles.sectionTitle, fontSize: 15, marginBottom: 15, marginTop: 15, color: themeColors.text}}>Organization And Work Details</ThemedText>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Employment Type</ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('employeeType', employmentTypes, 'Select Employment Type')}>
                                    <Text style={{ color: form.employeeType ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }} numberOfLines={1}>
                                        {form.employeeType?.value || 'Select Employment Types'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Employee Category</ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('employeeCategory', employmentCategory, 'Select Employee Category')}>
                                    <Text style={{ color: form.employeeCategory ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }} numberOfLines={1}>
                                        {form.employeeCategory?.value || 'Select Employee Category'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Department</ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('department', departments, 'Select Department')}>
                                    <Text style={{ color: form.department ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }} numberOfLines={1}>
                                        {form.department?.value || 'Select Department'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Designation</ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('designation', designations, 'Select Designation')}>
                                    <Text style={{ color: form.designation ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }} numberOfLines={1}>
                                        {form.designation?.value || 'Select Designation'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Business Branch</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('location', branches, 'Select Business Branch')}>
                                <Text style={{ color: form.location ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.location?.value || 'Select Location'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Employment Date ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <DatePickerField value={employmentDate} onChange={setEmploymentDate} placeholder="Select date" themeColors={themeColors} defaultToToday={true} />
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>End Date <TouchableOpacity onPress={()=> setEmploymentEndDate(null)}><Text style={{fontFamily: 'SemiBold', fontSize: 11, color: themeColors.error}}> -(  Clear )- </Text></TouchableOpacity> </ThemedText>
                                <DatePickerField value={employmentEndDate} onChange={setEmploymentEndDate} placeholder="Select date" themeColors={themeColors} defaultToToday={false} />
                                <Text style={{fontFamily: 'Italic', fontSize: 11, color: themeColors.error, marginLeft: 5}}>Leave blank if still working here</Text>
                            </View>
                        </View>
                        <ThemedText style={{...styles.sectionTitle, fontSize: 15, marginBottom: 15, marginTop: 15, color: themeColors.text}}>Employee Bank Details</ThemedText>
                        <View style={{...styles.section}}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Employment Type</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('paymentMethod', paymentMethods, 'Select Payment Method')}>
                                <Text style={{ color: form.paymentMethod ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }} numberOfLines={1}>
                                    {form.paymentMethod?.value || 'Select Payment Method'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {form.paymentMethod?.key && (
                            <>
                                {form.paymentMethod?.key === 'bank' && (
                                    <View style={styles.section}>
                                        <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>
                                            Bank Name
                                        </ThemedText>

                                        <TextInput
                                            style={[styles.input, {
                                                backgroundColor: themeColors.inputBackground,
                                                borderColor: themeColors.border,
                                                color: themeColors.text
                                            }]}
                                            placeholder="e.g. GCB Bank"
                                            placeholderTextColor={themeColors.subtleText}
                                            value={bankName}
                                            onChangeText={setBankName}
                                        />
                                    </View>
                                )}

                                {form.paymentMethod?.key === 'mobile_money' && (
                                    <View style={styles.section}>
                                        <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>
                                            Mobile Money Provider
                                        </ThemedText>
                                        <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('mobileMoneyProvider', mobileMoneyProviders, 'Select Mobile Money Provider')}>
                                            <Text style={{ color: form.mobileMoneyProvider ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }} numberOfLines={1}>
                                                {form.mobileMoneyProvider?.value || 'Select Mobile Money Provider'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <View style={{...styles.section, width: '49%'}}>
                                        <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>
                                            Account Name
                                        </ThemedText>

                                        <TextInput
                                            style={[styles.input, {
                                                backgroundColor: themeColors.inputBackground,
                                                borderColor: themeColors.border,
                                                color: themeColors.text
                                            }]}
                                            placeholder="Account holder name"
                                            placeholderTextColor={themeColors.subtleText}
                                            value={accountName}
                                            onChangeText={setAccountName}
                                        />
                                    </View>

                                    <View style={{...styles.section, width: '49%'}}>
                                        <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>
                                            {form.paymentMethod?.key === 'bank'
                                                ? 'Account Number'
                                                : 'Mobile Money Number'}
                                        </ThemedText>

                                        <TextInput
                                            style={[styles.input, {
                                                backgroundColor: themeColors.inputBackground,
                                                borderColor: themeColors.border,
                                                color: themeColors.text
                                            }]}
                                            placeholder={
                                                form.paymentMethod?.key === 'bank'
                                                    ? 'Account number'
                                                    : '059*******88'
                                            }
                                            placeholderTextColor={themeColors.subtleText}
                                            keyboardType="numeric"
                                            value={accountNumber}
                                            onChangeText={setAccountNumber}
                                        />
                                    </View>
                                </View>

                                {form.paymentMethod?.key === 'bank' && (
                                    <View style={styles.section}>
                                        <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>
                                            Bank Branch
                                        </ThemedText>

                                        <TextInput
                                            style={[styles.input, {
                                                backgroundColor: themeColors.inputBackground,
                                                borderColor: themeColors.border,
                                                color: themeColors.text
                                            }]}
                                            placeholder="e.g. Accra Main Branch"
                                            placeholderTextColor={themeColors.subtleText}
                                            value={bankBranch}
                                            onChangeText={setBankBranch}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>
                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: !firstName || !lastName || !form.gender?.key || !dob || !phone || !employmentDate || !form.location?.key ? themeColors.border : themeColors.primary }]}
                            onPress={onSaveEmployee}
                            disabled={!firstName || !lastName || !form.gender?.key || !dob || !phone || !employmentDate || !form.location?.key}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                Save Employee Data
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose enableContentPanningGesture enableHandlePanningGesture enableDynamicSizing={false} handleIndicatorStyle={{ backgroundColor: themeColors.icon, marginTop: 10 }} backgroundStyle={{backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.info}}>
                    <ThemedText style={{fontFamily: 'SemiBold', fontSize: 20, marginBottom: 20, textAlign: 'center', marginTop: 10}}>{sheetTitle || 'Select Option'}</ThemedText>
                    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {sheetOptions.map(option => (
                            <TouchableOpacity key={option.key} style={{ padding: 20, backgroundColor: themeColors.card, borderRadius: 5, marginBottom: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} onPress={() => selectOption({key: option.key, value: option.value})}>
                                <Text style={{ fontSize: Typography.body, color: themeColors.text, fontFamily: "Regular" }}>{option.value}</Text>
                                {form[activeField as keyof EmployeeForm]?.key === option.key && (
                                    <IconSymbol name="check" size={20} color={themeColors.primary} />
                                )}
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
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.screenPadding,
        paddingTop: 0
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
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
})


export default EmployeeFormScreen;

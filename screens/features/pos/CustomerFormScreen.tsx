import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { POSNavigationList } from '../../../utils/types/index.type';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { BottomSheetSelectOption } from './NewSaleScreen';
import { customerTypeList } from '../../../configuration/data/System';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

type FormState = {
    type: BottomSheetSelectOption | null
}

type TCustomerFormScreen = NativeStackScreenProps<POSNavigationList, "CustomerFormScreen">
const CustomerFormScreen = ({navigation, route}: TCustomerFormScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { data } = route.params || {}
    const { session, selectedBusiness } = useAppContainer()

    const [name, setName] = useState(data?.customerName || '')
    const [code, setCode] = useState(data?.customerCode || '')
    const [phone, setPhone] = useState(data?.phoneNumber || '')
    const [email, setEmail] = useState(data?.email || '')
    const [address, setAddress] = useState(data?.address || '')
    const [taxNumber, setTaxNumber] = useState(data?.taxNumber || '')

    const [form, setForm] = useState<FormState>({
        type: null
    })

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState<string>('');
    const [activeField, setActiveField] = useState<keyof FormState | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "50%", "75%"], []);

    const openBottomSheet = (field: keyof FormState, options: BottomSheetSelectOption[], title: string) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    }

    const selectOption = (option: BottomSheetSelectOption) => {
        if(activeField) setForm(prev => ({ ...prev, [activeField]: option }));
        bottomSheetRef.current?.close();
    }

    useEffect(()=> {
        const selectedType = customerTypeList.find((item:any) => item.key === data.customerType) || null
        setForm(prev => ({
            ...prev,
            type: selectedType
        }))
    }, [])

    const handleSave = () => {
        if(!name) {
            Alert.alert("Note", "Customer Name is required")
            return
        }
        try {
            const formData = {
                customerName: name, customerCode: code, phone, email, address, customerType: form.type?.key,
                taxNumber, sessionID: session, businessID: selectedBusiness.id, hiddenID: data?.id
            }
            SocketIO.emit('add-update-customer', formData, (response: any) => {
                if (response.status === 'success') {
                    Alert.alert('Success', response.message)
                } else {
                    Alert.alert("Error", response.message || "Failed to add customer", [
                        { text: "Retry", onPress: () => handleSave() },
                        { text: "Cancel", style: "cancel" },
                    ],
                    { cancelable: true })
                }
            })
        } catch (error:any) {
            Alert.alert('Error', error.message)
        }
    }
    
    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />
            )}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Customer Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.screenPadding,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>

                        <View style={{ marginBottom: 3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Customer Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor:themeColors.inputBackground, borderColor:themeColors.border, color:themeColors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Customer Name"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <View style={{ marginBottom: 3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Supplier Type ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=>openBottomSheet('type', customerTypeList, 'Select Customer Type')}>
                                <Text style={{color:form.type?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.type?.value||'Select type'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Unique Code ( <Text style={{fontFamily: 'Regular', fontSize: 10, color: themeColors.error}}>Please leave black to auto generate.</Text> ) </ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                placeholder="Enter code"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                                value={code}
                                onChangeText={setCode}
                            />
                        </View>

                        <View style={{ marginBottom: 3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Phone</ThemedText>
                            <TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground, borderColor:themeColors.border, color:themeColors.text }]} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={themeColors.subtleText} keyboardType="phone-pad"/>
                        </View>
                        <View style={{ marginBottom: 3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Email</ThemedText>
                            <TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground, borderColor:themeColors.border, color:themeColors.text }]} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={themeColors.subtleText} keyboardType="email-address"/>
                        </View>
                        <View style={{ marginBottom: 3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Address</ThemedText>
                            <TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground, borderColor:themeColors.border, color:themeColors.text }]} value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor={themeColors.subtleText} keyboardType="default"/>
                        </View>
                        <View style={{ marginBottom: 3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Ghana Card No. | TIN No.</ThemedText>
                            <TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground, borderColor:themeColors.border, color:themeColors.text }]} value={taxNumber} onChangeText={setTaxNumber} placeholder="-" placeholderTextColor={themeColors.subtleText} keyboardType="default"/>
                        </View>
                    </ScrollView>
                    <View style={{ padding:Spacing.screenPadding, borderTopWidth:1, borderTopColor:themeColors.border, backgroundColor:themeColors.background }}>
                        <TouchableOpacity style={{ paddingVertical:Spacing.large, borderRadius:Borders.radiusSmall, alignItems:'center', backgroundColor:name?themeColors.primary:themeColors.border }} onPress={handleSave} disabled={!name}>
                            <ThemedText style={{ color:'#fff', fontSize:Typography.body, fontFamily:'SemiBold' }}>Save Customer</ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                    <ThemedText style={{fontFamily:'SemiBold',fontSize:20,marginBottom:20,textAlign:'center',marginTop:10}}>{sheetTitle||'Select Option'}</ThemedText>
                    <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                        {sheetOptions.map(option=>(
                            <TouchableOpacity key={option.key} style={{padding:20,backgroundColor:themeColors.card,borderRadius:5,marginBottom:5}} onPress={()=>selectOption({key:option.key,value:option.value})}>
                                <Text style={{fontSize:Typography.body,color:themeColors.text,fontFamily:'Medium'}}>{option.value}</Text>
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
    label:{ fontSize:Typography.body, fontFamily:'Medium', marginBottom:3 },
    input:{ borderWidth:1, borderRadius:Borders.radiusSmall, paddingHorizontal:Spacing.medium, paddingVertical:Spacing.large, fontSize:Typography.small, marginBottom:Spacing.small, fontFamily:'Regular' },
    sectionTitle: {
        fontSize: Typography.body,
        fontFamily: 'Medium',
        marginBottom: 3,
    }
})

export default CustomerFormScreen
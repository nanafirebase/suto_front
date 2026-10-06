import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { fullDate, SocketIO } from '../../../configuration/helpers/main.helpers';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { supplierTypes } from '../../../configuration/data/System';
import { formatCurrency } from '../../../utils/constants/Currency';
import DatePickerField from '../../../components/ui/DatePickerField';

type FormState = {
    stock: BottomSheetSelectOption | null,
    supplier: BottomSheetSelectOption | null,
    currency: BottomSheetSelectOption | null
}

type TStockInFormScreen = NativeStackScreenProps<InventoryNavigationList, "StockInFormScreen">
const StockInFormScreen = ({navigation, route}: TStockInFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { data } = route.params || {};
    const { session, selectedBusiness, businessCurrency, userBranch } = useAppContainer();

    const [referenceNumber, setReferenceNumber] = useState(data?.referenceNumber || '');
    const [invoiceDate, setInvoiceDate] = useState<Date | null>(data?.invoiceDate || null);
    const [totalAmount, setTotalAmount] = useState(data?.totalAmount?.toString() || '');
    const [exchangeRate, setExchangeRate] = useState(data?.exchangeRate?.toString() || '');
    const [remarks, setRemarks] = useState(data?.remarks || '')
    const [supplierList, setSupplierList] = useState<any[]>([])
    const [stockLocations, setStockLocations] = useState<any[]>([])
    const [currencyList, setCurrencyList] = useState<any[]>([])

    const fetchCurrencyRateList = async () => {
        SocketIO.emit('fetch-currency-rates' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: `${item.currencyID}**${item.rate}`,
                    value: `${item.name} ( ${item.symbol} )`
                }))
                if (businessCurrency) {
                    const exists = simplified.some((c: any) => c.key.startsWith(`${businessCurrency.id}**`))
                    if (!exists) {
                        simplified.unshift({
                            key: `${businessCurrency.currencyID}**1`,
                            value: `${businessCurrency.name} (${businessCurrency.symbol})`
                        })
                    }
                }
                setCurrencyList(simplified)
                if (!data?.id && simplified.length === 1) {
                    setForm(prev => ({
                        ...prev,
                        currency: simplified[0]
                    }))
                    // console.log(simplified[0])
                }
            } else {
                Alert.alert("Error", "Error fetching currency rates", response.message)
            }
        })
    }

    const fetchStockLocation = async () => {
        SocketIO.emit('fetch-stock-locations' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name || 'No Name'}`
                }))
                setStockLocations(simplified)
            } else {
                Alert.alert("Error", "Error fetching stock locations", response.message)
            }
        })
    }

    const fetchSupplier = async () => {
        SocketIO.emit('fetch-suppliers' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.supplier_name || ''} ( ${supplierTypes.find((itemS:any) => itemS.key === item.supplier_type)?.value || ''} ) - ${item.phone || 'Phone number not set'}`
                }))
                setSupplierList(simplified)
            } else {
                Alert.alert("Error", "Error fetching product category", response.message)
            }
        })
    }

    useEffect(()=> {
        fetchStockLocation()
        fetchSupplier()
        fetchCurrencyRateList()
    }, [])

    const [form, setForm] = useState<FormState>({
        stock: null,
        supplier: null,
        currency: null
    })

    useEffect(()=> {
        if (!form.currency) return
        let rate = String(form.currency.key).split('**')[1]
        const baseAmount = Number(rate || 1) * totalAmount || 0
        setExchangeRate(formatCurrency(baseAmount, {showSymbol: false}).toString())
    }, [form.currency, totalAmount])

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

    const clearForm = () => {
        setForm({
            stock: null,
            supplier: null,
            currency: null
        })
        setTotalAmount('')
        setReferenceNumber('')
        setInvoiceDate(null)
        setExchangeRate('')
        setRemarks('')
        navigation.navigate('StockInListScreen')
    }

    const handleSave = async () => {
        if(!selectedBusiness.id || !form.stock?.key || !referenceNumber || !form.currency?.key || !userBranch.id) {
            Alert.alert("Error", "Please fill all required fields.")
            return
        }
        const payload = {
            stockID: form.stock.key,
            supplierID: form.supplier?.key,
            referenceNumber,
            invoiceDate: fullDate(invoiceDate?.toISOString()),
            amount: parseFloat(totalAmount) || 0,
            currencyID: String(form.currency?.key).split('**')[0],
            remarks,
            businessID: selectedBusiness.id,
            branchID: userBranch.id,
            sessionID: session,
            hiddenID: data?.id
        }
        SocketIO.emit('add-update-stock-in', payload, (response:any)=>{
            if(response.status==="success") {
                Alert.alert("Success", response.message)
                clearForm()
            } else Alert.alert("Error", response.message || "Failed to save")
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS==='android' && <View style={{height:10,backgroundColor:themeColors.background}} />}
            <View style={[styles.safeArea,{paddingTop: Platform.OS==='ios'?insets.top:0,paddingBottom:Platform.OS==="ios"?85:0}]}>
                <ThemedView style={[styles.header,{backgroundColor:themeColors.background,borderBottomColor:themeColors.border}]}>
                    <TouchableOpacity onPress={()=>navigation.goBack()} style={[styles.backButtonMain,{backgroundColor:themeColors.subtleBackground}]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Stock In Form</ThemedText>
                    <View style={{width:36}} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.screenPadding,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Stock Location <Text style={{color:themeColors.error}}>(Required)</Text></ThemedText>
                                <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=>openBottomSheet('stock', stockLocations, 'Select Stock Location')}>
                                    <Text style={{color:form.stock?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.stock?.value||'Select stock location'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Supplier </ThemedText>
                                <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=>openBottomSheet('supplier', supplierList, 'Select Supplier')}>
                                    <Text style={{color:form.supplier?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.supplier?.value||'Select supplier'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Reference Number <Text style={{color:themeColors.error}}>(Required)</Text></ThemedText>
                            <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={referenceNumber} onChangeText={setReferenceNumber} placeholder="Reference Number" placeholderTextColor={themeColors.subtleText} />
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Invoice Date <Text style={{color:themeColors.error}}>(Required)</Text></ThemedText>
                                <DatePickerField value={invoiceDate} onChange={setInvoiceDate} placeholder="Select date" themeColors={themeColors} defaultToToday={true} />
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Currency</ThemedText>
                                <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=>openBottomSheet('currency',currencyList, 'Select Currency')}>
                                    <Text style={{color:form.currency?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.currency?.value||'Select currency'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Total Amount  <Text style={{color:themeColors.error}}>(Required)</Text></ThemedText>
                                <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={totalAmount} onChangeText={setTotalAmount} placeholder="Total Amount" keyboardType="numeric" placeholderTextColor={themeColors.subtleText} />
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>FX Amount</ThemedText>
                                <TextInput readOnly={true} style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={exchangeRate} onChangeText={setExchangeRate} placeholder="Exchange Rate" keyboardType="numeric" placeholderTextColor={themeColors.subtleText} />
                            </View>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Remarks</ThemedText>
                            <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text,height:120,textAlignVertical:'top'}]} multiline value={remarks} onChangeText={setRemarks} placeholder="Remarks" placeholderTextColor={themeColors.subtleText} />
                        </View>
                    </ScrollView>
                    <View style={[styles.footer,{backgroundColor:themeColors.background,borderTopColor:themeColors.border}]}>
                        <TouchableOpacity style={[styles.button,{backgroundColor:(!form.stock||!referenceNumber||!invoiceDate||!totalAmount)?themeColors.border:themeColors.primary}]} onPress={handleSave} disabled={!form.stock||!referenceNumber||!invoiceDate||!totalAmount} activeOpacity={0.8}>
                            <ThemedText style={styles.buttonText}>Save Record</ThemedText>
                        </TouchableOpacity>
                    </View>
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
                </KeyboardAvoidingView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{flex:1},
    safeArea:{flex:1},
    scrollContainer:{flex:1},
    header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.screenPadding,paddingVertical:Spacing.medium,borderBottomWidth:1},
    backButtonMain:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
    headerTitle:{fontSize:Typography.heading2,fontFamily:'SemiBold'},
    section:{marginBottom:0},
    sectionTitle:{fontSize:Typography.body,fontFamily:'Medium',marginBottom:3},
    input:{borderWidth:1,borderRadius:Borders.radiusSmall,paddingHorizontal:Spacing.medium,paddingVertical:Spacing.large,fontSize:Typography.small,marginBottom:Spacing.medium,fontFamily:'Regular'},
    footer:{padding:Spacing.screenPadding,borderTopWidth:1},
    button:{paddingVertical:Spacing.large,borderRadius:Borders.radiusSmall,alignItems:'center'},
    buttonText:{color:'#FFFFFF',fontSize:Typography.body,fontFamily:'SemiBold'},
})

export default StockInFormScreen;

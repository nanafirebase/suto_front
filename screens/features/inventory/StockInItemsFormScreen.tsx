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
import { fullDate, fullDateTime, generateBatchNumber, SocketIO } from '../../../configuration/helpers/main.helpers';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { supplierTypes } from '../../../configuration/data/System';
import { formatCurrency } from '../../../utils/constants/Currency';
import DatePickerField from '../../../components/ui/DatePickerField';

type FormState = {
    productID: BottomSheetSelectOption | null
    uomID: BottomSheetSelectOption | null
}

type StockItem = {
    hiddenID?: number|null,
    id: number,
    name: string,
    quantity: number,
    productUOMID: string | number | undefined,
    costPrice: number,
    total: number
    batchNumber?: string
    expiryDate?: Date|null
    manufacturedDate?: Date|null
    productID?: string | number
    uomID?:string | number

    isLocal?: boolean;
}

type TStockInItemsFormScreen = NativeStackScreenProps<InventoryNavigationList, "StockInItemsFormScreen">
const StockInItemsFormScreen = ({navigation, route}: TStockInItemsFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { data } = route.params || {};
    const { session, selectedBusiness } = useAppContainer();

    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [productList, setProductList] = useState<any[]>([])
    const [id, setID] = useState('')
    const [quantity, setQuantity] = useState('')
    const [costPrice, setCostPrice] = useState('')
    const [totalAmount, setTotalAmount] = useState(0)
    const [batchNumber, setBatchNumber] = useState('')
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [manufacturedDate, setManufacturedDate] = useState<Date | null>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [uomList, setUomList] = useState<BottomSheetSelectOption[]>([])
    const [editingItemId, setEditingItemId] = useState<number | null>(null)
    const [deletedItems, setDeletedItems] = useState<number[]>([]);
    const [selectedUOM, setSelectionUOM] = useState('')

    const [form, setForm] = useState<FormState>({
        productID: null,
        uomID: null
    })

    const fetchProductList = async () => {
        SocketIO.emit('fetch-products' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: `${item.id}`,
                    value: `${item.name}`
                }))
                setProductList(simplified)
            } else {
                Alert.alert("Error", "Error fetching products", response.message)
            }
        })
    }

    const fetchStockIn = async () => {
        if (!data?.id) return
        SocketIO.emit('fetch-stock-items', { sessionID: session, businessID: selectedBusiness.id, stockInID: data.id }, (response: any) => {
            if (response.status === "success") {
                const mappedData: StockItem[] = (response.data || []).map((item: any) => ({
                    id: item.stockInItemID,
                    hiddenID: item.stockInItemID,
                    isLocal: false,
                    name: item.productName,
                    quantity: Number(item.quantity) || 0,
                    productID: item.productID,
                    productUOMID: item.productUOMID,
                    costPrice: Number(item.costPrice) || 0,
                    total: Number( Number(item.quantity) || 0) * Number(Number(item.costPrice) || 0),
                    batchNumber: item.batchNumber,
                    expiryDate: fullDate(item.expiryDate),
                    manufacturedDate: fullDate(item.manufactureDate)
                }))
                setStockItems(mappedData)
            } else {
                Alert.alert("Error", response.message || "Failed to fetch stock-in records");
            }
        })
    }

    const fetchUOMList = async () => {
        if (!form.productID?.key) return
        SocketIO.emit('fetch-uoms', { sessionID: session, businessID: selectedBusiness.id, productID: form.productID?.key }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: `${item.id}`,
                    value: `${item.name} `
                }))
                setUomList(simplified)
                if (selectedUOM) {
                    const uomS = simplified.find((UOMSItem:any) => String(UOMSItem.key) === String(selectedUOM)) || null
                    setForm(prev => ({
                        ...prev,
                        uomID: uomS
                    }))
                }
            } else {
                Alert.alert("Error", "Error fetching UoMs", response.message)
            }
        })
    }

    useEffect(()=> {
        fetchProductList()
        fetchStockIn();
        fetchUOMList()
    }, [])

    useEffect(()=> {
        fetchUOMList()
        setForm(prev => ({
            ...prev,
            uomID: null
        }))
        if (form.productID?.key) {
            setBatchNumber(generateBatchNumber(Number(form.productID?.key) || 0))
        }
    }, [form.productID?.key])

    useEffect(()=>{
        let total = stockItems.reduce((sum,item)=>sum+item.total,0)
        setTotalAmount(total)
    },[stockItems])

    const clearForm = () => {
        setForm({
            productID: null,
            uomID: null
        })
        setQuantity('')
        setCostPrice('')
        setBatchNumber('')
        setExpiryDate(null)
        setManufacturedDate(null)
        setEditingItemId(null)
        setDeletedItems([])
    }

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState<string>('');
    const [activeField, setActiveField] = useState<keyof FormState | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "50%", "75%"], [0]);

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

    const handleAddItem = () => {
        if(!form.productID) {
            Alert.alert("Error", "Select a product");
            return;
        }
        if(!quantity || Number(quantity)<=0){ Alert.alert("Error","Enter valid quantity"); return }
        if(!costPrice || Number(costPrice)<0){ Alert.alert("Error","Enter valid cost price"); return }

        const payload = {
            quantity: Number(quantity),
            costPrice: Number(costPrice),
            total: Number(quantity) * Number(costPrice),
            batchNumber,
            expiryDate,
            manufacturedDate
        };
    
        if (editingItemId) {
            setStockItems(prev => prev.map(item => item.id === editingItemId ? { ...item, ...payload } : item ))
            clearForm()
            return
        }

        const item: StockItem = {
            id: Number(form.productID?.key),
            name: String(form.productID?.value),
            quantity: Number(quantity),
            productUOMID: form.uomID?.key || undefined,
            costPrice: Number(costPrice),
            total: Number(quantity) * Number(costPrice),
            batchNumber: batchNumber,
            expiryDate,
            manufacturedDate,
            isLocal: true
        }

        setStockItems(prev=> [...prev, item])
    }

    const handleRemoveItem = (item: StockItem) => {
        if (item.isLocal) {
            setStockItems(prev => prev.filter(row => row.id !== item.id));
            return;
        }
    
        Alert.alert(
            "Delete Item",
            "Are you sure you want to remove this item?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setDeletedItems(prev => [ ...prev, item.id ]);
                        setStockItems(prev => prev.filter( row => row.id !== item.id ));
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        const newItems = stockItems.filter(item => item.isLocal);
        const updatedItems = stockItems.filter(item => !item.isLocal);

        if(stockItems.length === 0){
            Alert.alert("Cannot Confirm", "Add at least one product before confirming")
            return
        }
        const payload = {
            hiddenID: updatedItems.length ? data?.id : null,
            stockInID: data?.id,
            businessID: selectedBusiness.id,
            newItems,
            updatedItems,
            deletedItems,
            sessionID: session
        }
        SocketIO.emit('add-update-stock', payload, (response:any)=>{
            if(response.status==="success") {
                Alert.alert("Success", response.message)
                navigation.goBack()
            } else {
                Alert.alert("Error", response.message || "Failed to save")
            }
        })
    }

    const handleFill = async (item: any) => {
        setEditingItemId(item.id)
        setQuantity(String(item.quantity))
        setCostPrice(String(item.costPrice))
        setBatchNumber(String(item.batchNumber))
        setExpiryDate(item.expiryDate ? item.expiryDate : null)
        setManufacturedDate(item.manufacturedDate ? item.manufacturedDate : null)
        let productS
        if (item.id) {
            productS = productList.find((productSItem:any) => String(productSItem.key) === String(item.id)) || null
        } else {
            productS = productList.find((productSItem:any) => String(productSItem.key) === String(item.productID)) || null
        }
        setForm(prev => ({
            ...prev,
            productID: productS
        }))
        setSelectionUOM(item.productUOMID)
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS==='android' && <View style={{height:10,backgroundColor:themeColors.background}} />}
            <View style={[styles.safeArea,{paddingTop: Platform.OS==='ios'?insets.top:0,paddingBottom:Platform.OS==="ios"?85:0}]}>
                <ThemedView style={[styles.header,{backgroundColor:themeColors.background,borderBottomColor:themeColors.border}]}>
                    <TouchableOpacity onPress={()=>navigation.goBack()} style={[styles.backButtonMain,{backgroundColor:themeColors.subtleBackground}]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Stock In Items</ThemedText>
                    <View style={{width:36}} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.screenPadding,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '70%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Product <Text style={{color:themeColors.error}}>*</Text></ThemedText>
                                <TouchableOpacity disabled={editingItemId ? true : false} style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=>openBottomSheet('productID', productList, 'Select Product')}>
                                    <Text style={{color:form.productID?themeColors.text:themeColors.subtleText,fontSize:Typography.small, opacity: editingItemId ? 0.5 : 1}}>{form.productID?.value || 'Select Product'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{...styles.section, width: '28%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>UoM <Text style={{color:themeColors.error}}>*</Text></ThemedText>
                                <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=>openBottomSheet('uomID', uomList, 'Select UOM')}>
                                    <Text style={{color:form.uomID?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.uomID?.value || 'Select UOM'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Quantity <Text style={{color:themeColors.error}}>*</Text></ThemedText>
                                <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="Quantity" placeholderTextColor={themeColors.subtleText} />
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Cost Price <Text style={{color:themeColors.error}}>*</Text></ThemedText>
                                <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" placeholder="Cost Price" placeholderTextColor={themeColors.subtleText} />
                            </View>
                        </View>
                        <View style={{...styles.section, width: '100%'}}>
                            <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Batch Number</ThemedText>
                            <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={batchNumber} onChangeText={setBatchNumber} placeholder="Batch Number" placeholderTextColor={themeColors.subtleText}/>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Manufactured Date</ThemedText>
                                {/* <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={manufacturedDate} onChangeText={setManufacturedDate} placeholder="YYYY-MM-DD" placeholderTextColor={themeColors.subtleText}/> */}
                                <DatePickerField value={manufacturedDate} onChange={setManufacturedDate} placeholder="Select date" themeColors={themeColors} defaultToToday={true} />
                            </View>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Expiry Date</ThemedText>
                                {/* <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" placeholderTextColor={themeColors.subtleText}/> */}
                                <DatePickerField value={expiryDate} onChange={setExpiryDate} placeholder="Select date" themeColors={themeColors} defaultToToday={false} />
                            </View>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <TouchableOpacity style={[styles.button,{backgroundColor:themeColors.error, width: '20%'}]} onPress={clearForm} activeOpacity={0.8}>
                                <ThemedText style={styles.buttonText}>Clear</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button,{backgroundColor:themeColors.primary, width: '78%'}]} onPress={handleAddItem} activeOpacity={0.8}>
                                <ThemedText style={styles.buttonText}>{editingItemId ? "Update Item" : "Add Item"}</ThemedText>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.tableHeader, { borderBottomColor: themeColors.border }]}>
                            <Text style={[styles.th, { flex: 2, color: themeColors.subtleText }]}>Product</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText }]}>Cost</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText }]}>Qty</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText }]}>Total</Text>
                            <View style={{ width: 30 }} />
                        </View>
                        <View style={{ marginTop: 0 }}>
                            {stockItems.length > 0 ? stockItems.map((item: any, index: number) => {
                                const expanded = expandedRow === item.id
                                return (
                                    <TouchableOpacity activeOpacity={0.8} key={index} onPress={()=> handleFill(item)} style={[styles.tableRowContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border } ]}>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.td, { flex: 2, color: themeColors.text }]} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>
                                                {formatCurrency(item.costPrice, {symbol: data.currency_symbol})}
                                            </Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>{item.quantity}</Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>
                                                {formatCurrency(item.total, {symbol: data.currency_symbol})}
                                            </Text>
                                            <TouchableOpacity onPress={() => setExpandedRow(expanded ? null : item.id)}>
                                                <IconSymbol name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={themeColors.icon} />
                                            </TouchableOpacity>
                                        </View>
                                        {expanded && (
                                            <View style={styles.hiddenRow}>
                                                <View style={{flexDirection: 'column'}}>
                                                    {item.batchNumber && (
                                                        <Text style={{...styles.hiddenText, color: themeColors.text}}>Batch: {item.batchNumber}</Text>
                                                    )}
                                                    {item.manufacturedDate && (
                                                        <Text style={{...styles.hiddenText, color: themeColors.text}}>Manufactured: {fullDate(item.manufacturedDate)}</Text>
                                                    )}
                                                    {item.expiryDate && (
                                                        <Text style={{...styles.hiddenText, color: themeColors.text}}>Expiry: {fullDate(item.expiryDate)}</Text>
                                                    )}
                                                </View>
                                                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveItem(item)}>
                                                    <IconSymbol name="trash" size={16} color={themeColors.error} />
                                                    <Text style={{ color: themeColors.error, marginLeft: 6, fontSize: 11 }}>Remove</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )
                            }) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 10, marginBottom: 20, fontSize: 13}}>No item added</ThemedText>}
                        </View>
                        <View style={{flexDirection:'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View style={{flexDirection: 'column', marginTop:20, marginBottom: 20}}>
                                <View style={{ alignItems:'flex-start'}}>
                                    <ThemedText style={{color:themeColors.text,fontFamily:'SemiBold',fontSize: 13}}>Amount on Invoice </ThemedText>
                                </View>
                                <View style={{ alignItems:'flex-start'}}>
                                    <ThemedText style={{fontFamily:'SemiBold',fontSize: 14, color: themeColors.error}}>{formatCurrency(Number(data.totalAmountBase) || 0, {symbol: data.business_currency_symbol})} ( {formatCurrency(Number(data.totalAmount) || 0, {symbol: data.invoice_currency_symbol})} )</ThemedText>
                                </View>
                            </View>
                            <View style={{flexDirection: 'column', marginTop:20, marginBottom: 20}}>
                                <View style={{alignItems:'flex-end'}}>
                                    <ThemedText style={{color:themeColors.text,fontFamily:'SemiBold',fontSize: 13}}>Total</ThemedText>
                                </View>
                                <View style={{ alignItems:'flex-end'}}>
                                    <ThemedText style={{fontFamily:'SemiBold',fontSize: 14, color: themeColors.primary}}>{formatCurrency(totalAmount, {symbol: data.business_currency_symbol})}</ThemedText>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.footer,{backgroundColor:themeColors.background,borderTopColor:themeColors.border}]}>
                            <TouchableOpacity style={[styles.button,{backgroundColor:(!stockItems)?themeColors.border:themeColors.primary}]} onPress={handleSave} disabled={!stockItems} activeOpacity={0.8}>
                                <ThemedText style={styles.buttonText}>Save Record</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                    <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                        <ThemedText style={{fontFamily:'SemiBold',fontSize:20,marginBottom:20,textAlign:'center',marginTop:10}}>{sheetTitle||'Select Option'}</ThemedText>
                        <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                            {sheetOptions.length > 0 ? sheetOptions.map(option=>(
                                <TouchableOpacity key={option.key} style={{padding:20,backgroundColor:themeColors.card,borderRadius:5,marginBottom:5}} onPress={()=>selectOption({key:option.key,value:option.value})}>
                                    <Text style={{fontSize:Typography.body,color:themeColors.text,fontFamily:'Medium'}}>{option.value}</Text>
                                </TouchableOpacity>
                            )) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No records found</ThemedText>}
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
    footer:{paddingVertical:Spacing.screenPadding,borderTopWidth:1},
    button:{paddingVertical:Spacing.large,borderRadius:Borders.radiusSmall,alignItems:'center'},
    buttonText:{color:'#FFFFFF',fontSize:Typography.body,fontFamily:'SemiBold'},
    card:{borderRadius:2,overflow:'hidden',borderBottomWidth:0.09,borderLeftWidth:3,padding:Spacing.medium,marginBottom:Spacing.medium},
    cardRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
    // footerDesc:{padding:Spacing.screenPadding,borderTopWidth:1}
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        marginTop: 20
    },
    tableRowContainer: {
        borderBottomWidth: 1,
        borderRadius: 2,
        marginBottom: 0,
        overflow: 'hidden',
        paddingHorizontal: 5
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 0.5
    },
    th: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold',
    },
    td: {
        fontSize: Typography.small,
        fontFamily: 'Regular',
    },
    hiddenRow: {
        paddingVertical: 20,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    hiddenText: {
        fontSize: Typography.small,
        opacity: 0.7,
        marginBottom: 4,
    },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
})

export default StockInItemsFormScreen;

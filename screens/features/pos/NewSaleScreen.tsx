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
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { generateId, shortenText, SocketIO } from '../../../configuration/helpers/main.helpers';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { API_URL } from '../../../configuration/credentials';
import { formatCurrency } from '../../../utils/constants/Currency';

export type BottomSheetSelectOption = {
    key: string | number;
    value: string | number;
    image?: any
    price?: number
    uomName?: string
    taxGroupID?: number
    isTaxInclusive?: boolean
}

interface SaleItem {
    id: string
    productID: number
    productName: string
    productUOMID: number
    uomName: string
    price: number
    quantity: number
    total: number
    taxGroupID?: number | null
    isTaxInclusive?: boolean
}

type FormState = {
    productID: BottomSheetSelectOption | null
    uomID: BottomSheetSelectOption | null
    customerID: BottomSheetSelectOption | null
}

type Tax = {
    id: number
    taxName: string
    percentage: number
    calculationType: 'simple' | 'compound'
    order: number
}

const round = (value: number, decimals = 2) => {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals)
}

const normalizeTaxes = (taxes: Tax[]) => {
    return taxes.map(t => ({ ...t, percentage: Number(t.percentage)})).sort((a, b) => a.order - b.order)
}

const computeFactor = (taxes: Tax[]) => {
    let factor = 1
    taxes.forEach(tax => {
        const rate = Number(tax.percentage) / 100
        if (tax.calculationType === 'simple') {
            factor += rate
        } else {
            factor += rate * factor
        }
    })
    return factor
}

const calculateItem = (item: SaleItem, taxesRaw: Tax[]) => {
    const taxes = normalizeTaxes(taxesRaw)
    let base = 0
    let runningTax = 0
    let breakdown: any[] = []
    if (item.isTaxInclusive) {
        const factor = computeFactor(taxes)
        base = item.total / factor
    } else {
        base = item.price * item.quantity
    }
    base = round(base)
    taxes.forEach(tax => {
        const rate = Number(tax.percentage) / 100
        const taxableAmount = tax.calculationType === 'compound' ? base + runningTax : base

        const taxAmount = round(taxableAmount * rate)
        runningTax += taxAmount
        breakdown.push({
            id: tax.id,
            name: tax.taxName,
            percentage: Number(tax.percentage),
            amount: taxAmount
        })
    })
    let total = item.isTaxInclusive ? item.total : round(base + runningTax)
    const expectedTax = round(total - base)
    const diff = round(expectedTax - runningTax)
    if (Math.abs(diff) > 0 && breakdown.length > 0) {
        breakdown[breakdown.length - 1].amount = round(
            breakdown[breakdown.length - 1].amount + diff
        )
        runningTax = round(runningTax + diff)
    }
    return {
        baseAmount: base,
        taxAmount: runningTax,
        totalAmount: total,
        breakdown
    }
}

type TNewSaleScreen = NativeStackScreenProps<POSNavigationList, "NewSaleScreen">
const NewSaleScreen = ({navigation, route}: TNewSaleScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, businessCurrency, userData, userBranch } = useAppContainer();
    // console.log({session, selectedBusiness, businessCurrency, userData, userBranch})
    const [products, setProducts] = useState<any[]>([])
    const [productUOMs, setProductUOMs] = useState<any[]>([])
    const [quantity, setQuantity] = useState<string>('1')
    const [editQuantity, setEditQuantity] = useState<string>('')
    const [cart, setCart] = useState<SaleItem[]>([])
    const [expandedRow, setExpandedRow] = useState<number | null>(null)
    const [pendingUomID, setPendingUomID] = useState<string | null>(null);
    const [taxMap, setTaxMap] = useState<Record<number, Tax[]>>({})
    const [processing, setProcessing] = useState(false);

    const [permission, requestPermission] = useCameraPermissions()
    const [scannerVisible, setScannerVisible] = useState(false);
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<CameraView>(null)
    const [customersList, setCustomersList] = useState<any[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission()
        }
    }, [permission])

    const [form, setForm] = useState<FormState>({
        productID: null,
        uomID: null,
        customerID: null
    })
 
    const loadTaxes = async () => {
        SocketIO.emit('fetch-full-tax-configuration', { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const { taxes, taxGroups, taxGroupItems } = response.data
                const map: Record<number, Tax[]> = {}
                taxGroups.forEach((group: any) => {
                    const items = taxGroupItems.filter((i: any) => i.taxGroupID === group.id).sort((a: any, b: any) => a.order - b.order)
                    map[group.id] = items.map((item: any) => {
                        const tax = taxes.find((t: any) => t.id === item.taxID)
                        return {
                            id: tax.id,
                            taxName: tax.taxName,
                            percentage: tax.percentage,
                            calculationType: tax.calculationType as 'simple' | 'compound',
                            order: item.order
                        }
                    })
                })
                setTaxMap(map)
            }
        })
    }

    const fetchCustomers = async () => {
        SocketIO.emit('fetch-customers' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const data = response.data || []
                const simplified = data.map((item: any) => ({
                    key: item.id,
                    value: `${item.customerName || 'No Name'}`
                }))
                setCustomersList(simplified || [])
                const walkInCustomer = simplified.find((c:any) => c.value.toLowerCase() === 'walk-in')
                if (walkInCustomer) {
                    setForm(prev => ({
                        ...prev,
                        customerID: walkInCustomer
                    }))
                }
            } else {
                Alert.alert("Error", "Error fetching customers", response.message)
            }
        })
    }
    
    useEffect(() => {
        if (selectedBusiness?.id) {
            loadTaxes()
            fetchCustomers()
        }
    }, [selectedBusiness.id])

    const fetchProductList = async () => {
        SocketIO.emit('fetch-products' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: `${item.id}`,
                    value: `${item.name}`,
                    image: item.images ? JSON.parse(item.images || '[]')[0] : null,
                    taxGroupID: item.taxGroupID
                }))
                setProducts(simplified)
            } else {
                Alert.alert("Error", "Error fetching products", response.message)
            }
        })
    }

    const fetchUOMList = async () => {
        if (!form.productID?.key) return
        SocketIO.emit('fetch-uoms', { sessionID: session, businessID: selectedBusiness.id, productID: form.productID?.key }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: `${item.id}`,
                    value: `${item.name}\nSelling Price: ${item.sellingPrice}\nConversion Rate: ${Number(item.conversionRate)}`,
                    price: Number(item.sellingPrice),
                    uomName: item.shortCode,
                    isTaxInclusive: item.isTaxInclusive
                }))
                setProductUOMs(simplified)
                if (simplified.length === 1) {
                    const onlyUom = simplified[0]
                    setForm(prev => ({
                        ...prev,
                        uomID: {
                            key: onlyUom.key,
                            value: onlyUom.value,
                            price: onlyUom.price,
                            uomName: onlyUom.uomName,
                            isTaxInclusive: onlyUom.isTaxInclusive
                        }
                    }))
                }
            } else {
                Alert.alert("Error", "Error fetching UoMs", response.message)
            }
        })
    }

    const fetchProductWithBarCode = async (barcode:string) => {
        if (!barcode) return
        SocketIO.emit('fetch-product-by-barcode', { sessionID: session, businessID: selectedBusiness.id, barcode: barcode }, (response: any) => {
            if (response.status === "success") {
                const selectedProduct = products.find((item:any) => String(item.key) === String(response.data.productID)) || null
                setPendingUomID(String(response.data.id))
                setForm(prev => ({
                    ...prev,
                    productID: selectedProduct || null,
                    uomID: null
                }))
            }  else {
                Alert.alert("Error", "Error fetching product with barcode", response.message)
            }
        })
    }

    useEffect(()=> {
        fetchProductList()
    }, [])

    useEffect(()=> {
        fetchUOMList()
        setForm(prev => ({
            ...prev,
            uomID: null
        }))
        setForm(prev => ({...prev, uomID: null}))
    }, [form.productID?.key])

    useEffect(() => {
        if (!pendingUomID || productUOMs.length === 0) return
        const matched = productUOMs.find((uom: any) => String(uom.key) === String(pendingUomID))
        if (matched) {
            setForm(prev => ({
                ...prev,
                uomID: matched,
            }))
        }
        setPendingUomID(null)
    }, [productUOMs])

    useEffect(()=> {
        setQuantity('')
    }, [form.productID?.key, form.uomID?.key])

    const amount = (form.uomID?.price ?? 0) * Number(quantity || 0)

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState<string>('')
    const [activeField, setActiveField] = useState<keyof FormState | null>(null)
    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["50%", "75%"], [0])

    const openBottomSheet = (field: keyof FormState, options: BottomSheetSelectOption[], title: string) => {
        setActiveField(field)
        setSheetOptions(options)
        setSheetTitle(title)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectOption = (option: BottomSheetSelectOption) => {
        if(activeField) setForm(prev => ({ ...prev, [activeField]: option }));
        bottomSheetRef.current?.close();
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        setScannerVisible(false)
        await fetchProductWithBarCode(data)
    }

    const handleAddItem = () => {
        if(!form.productID?.key || !form.uomID?.key || !form.uomID?.uomName) {
            Alert.alert("Error", "Select a product and uom")
            return
        }

        if(!quantity || Number(quantity)<=0){ Alert.alert("Error","Enter valid quantity"); return }
        let amount = Number(form.uomID?.price || 0) * Number(quantity || 1)
        if(!amount || Number(amount)<0){ Alert.alert("Error","Please make your your product selling price is updated"); return }

        const item: SaleItem = {
            id: generateId(),
            productID: Number(form.productID?.key),
            productName: String(form.productID?.value),
            productUOMID: Number(form.uomID?.key),
            uomName: form.uomID?.uomName,
            price: Number(form.uomID.price || 0),
            quantity: Number(quantity),
            total: Number(quantity) * Number(form.uomID.price || 0),
            taxGroupID: Number(form.productID.taxGroupID) || null,
            isTaxInclusive: form.uomID?.isTaxInclusive ?? false
        }

        setCart((prev)=> [...prev, item])
        setForm(prev => ({
            ...prev,
            productID: null,
            uomID: null,
        }))
        setQuantity('')
        setProductUOMs([])
        setPendingUomID(null)
    }

    const handleRemoveItem = (id:string) => {
        setCart(prev=>prev.filter((item:any) => item.id!==id ))
    }

    const handleUpdateItem = (id: string, price: number) => {
        const qty = Number(editQuantity);
        if (!qty || qty <= 0) {
            Alert.alert('Error', 'Enter a valid quantity');
            return;
        }
        setCart(prev =>
            prev.map(item =>
                item.id === id ? {
                    ...item,
                    quantity: qty,
                    total: qty * price
                }
                : item
            )
        )
        setExpandedRow(null);
        setEditQuantity('');
    }

    const clearSale = () => {
        setCart([])
        setForm(prev => ({
            ...prev,
            productID: null,
            uomID: null,
        }))
        setQuantity("")
        setEditQuantity("")
        setExpandedRow(null)
        setProductUOMs([])
        setPendingUomID(null)
    }

    const summary = useMemo(() => {
        let subtotalRaw = 0
        let totalTaxRaw = 0
        let grandTotalRaw = 0
    
        const taxAgg: Record<number, any> = {}
    
        cart.forEach(item => {
            const taxes = taxMap[item.taxGroupID ?? -1] || []
    
            const result = calculateItem(item, taxes)
    
            subtotalRaw += result.baseAmount
            totalTaxRaw += result.taxAmount
            grandTotalRaw += result.totalAmount
    
            result.breakdown.forEach(tax => {
                if (taxAgg[tax.id]) {
                    taxAgg[tax.id].amount += tax.amount
                } else {
                    taxAgg[tax.id] = {
                        id: tax.id,
                        name: tax.name,
                        percentage: tax.percentage,
                        amount: tax.amount
                    }
                }
            })
        })
    
        let subtotal = round(subtotalRaw)
        let totalTax = round(totalTaxRaw)
        let grandTotal = round(grandTotalRaw)
    
        // 🔥 FINAL RECONCILIATION (CRITICAL)
        const expectedTax = round(grandTotal - subtotal)
        const diff = round(expectedTax - totalTax)
    
        if (Math.abs(diff) > 0) {
            const keys = Object.keys(taxAgg).map(Number)
    
            if (keys.length > 0) {
                const lastKey = keys[keys.length - 1]
                const last = taxAgg[lastKey]
    
                if (last) {
                    last.amount = round(last.amount + diff)
                }
            }
    
            totalTax = round(totalTax + diff)
        }
    
        const breakdown = Object.values(taxAgg).map(t => ({
            ...t,
            amount: round(t.amount)
        }))
    
        return {
            subtotal,
            totalTax,
            grandTotal,
            breakdown
        }
    }, [cart, taxMap])

    const saveSale = async () => {
        if (!session || !selectedBusiness.id || !userData?.id) {
            Alert.alert("Error", "Missing required fields")
            return
        }
        if (!cart.length) {
            Alert.alert("Error", "Please add items to checkout")
            return
        }
        const formData = {
            items: cart, total: Number(summary.subtotal), totalTax: Number(summary.totalTax || 0), grandTotal: Number(summary.grandTotal),
            sessionID: session, businessID: selectedBusiness.id, currencyID: businessCurrency.currencyID, customerID: form.customerID?.key, 
            remarks: '', branchID: userBranch.id ?? null
        }
        SocketIO.emit('save-sale', formData, (response: any) => {
            if (response.status === "success") {
                const { saleID } = response.data
                Alert.alert("Success", response.message, [
                    { text: "Record Payment", onPress: () => {
                        const paymentData = {
                            sale_id: saleID,
                            totalTax: Number(summary.totalTax || 0),
                            subtotal: Number(summary.subtotal),
                            totalPaid: 0,
                            customer: {
                                name: form.customerID?.value || "Walk-In",
                                id: form.customerID?.key || null
                            }
                        }
                        clearSale()
                        navigation.navigate("PaymentScreen", {
                            data: paymentData
                        })
                    } },
                    { text: "Not Yet", onPress: () => clearSale(), style: "cancel" }
                ],
                { cancelable: true })
            } else {
                if (response.data) {
                    Alert.alert("Error", response.data.map((item:any) =>
                        `${shortenText(item.productName, 7)} (Qty: ${item.requested} | In-Stock: ${item.available} | Short ${item.shortage})`
                    ).join("\n-----o-----o-----o-----o-----o-----o-----o-----o-----o-----\n"), [
                        { text: "Retry", onPress: () => saveSale() },
                        { text: "Cancel", style: "cancel" },
                    ],
                    { cancelable: true })
                    return
                }
                Alert.alert("Error", response.message || "Failed to save sale", [
                    { text: "Retry", onPress: () => saveSale() },
                    { text: "Cancel", style: "cancel" },
                ],
                { cancelable: true })
            }
        })
    }

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return sheetOptions;
        return sheetOptions.filter(option =>
            String(option.value).toLowerCase().includes(search.toLowerCase())
        )
    }, [search, sheetOptions])

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
                    <ThemedText style={styles.headerTitle}>New Sale Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.screenPadding,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{...styles.section}}>
                            <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Customer ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=> openBottomSheet('customerID', customersList, 'Select Customer')}>
                                <Text style={{color:form.customerID?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.customerID?.value || 'Select Customer'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View style={{...styles.section, width: '83%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Product ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=> openBottomSheet('productID', products, 'Select Product')}>
                                    <Text style={{color:form.productID?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.productID?.value || 'Select Product'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{...styles.section, width: '15%', alignItems: 'flex-end', marginTop: 10}}>
                                <TouchableOpacity onPress={() => setScannerVisible(true)}>
                                    <IconSymbol name='barcode' size={45} color={themeColors.subtleText} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {productUOMs.length > 0 ? <ThemedText style={{fontFamily: 'SemiBold', fontSize: 13}}>Select UOM ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText> : null}
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'}}>
                            {productUOMs.length > 0 ? productUOMs.map((item:any, index:number)=> {
                                const isSelected = Number(item.key) === Number(form.uomID?.key)
                                return (
                                    <TouchableOpacity key={index} onPress={()=> setForm(prev => ({...prev, uomID: {key: item.key, value: item.value, price: item.price, uomName: item.uomName, isTaxInclusive: item.isTaxInclusive}}))} style={{width: '100%', height: 70, backgroundColor: themeColors.card, alignItems: 'center', marginBottom: 5, paddingHorizontal: 10, borderRadius: 7, flexDirection: 'row'}}>
                                        <IconSymbol name='disk' size={23} color={isSelected ? themeColors.success : themeColors.subtleText} />
                                        <Text style={{color: themeColors.text, fontSize: 12, marginLeft: 10}}>{item.value}</Text>
                                    </TouchableOpacity>
                                )
                            }): null}
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View style={{...styles.section, width: '55%'}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText, fontSize: 12}}>Quantity ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={quantity} onChangeText={setQuantity} keyboardType='decimal-pad' placeholder="Quantity" placeholderTextColor={themeColors.subtleText} />
                            </View>
                            <View style={{...styles.section, width: '40%', alignItems: 'flex-end', marginBottom: 5}}>
                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText, marginBottom: 10, fontSize: 12}}>Amount ({businessCurrency?.symbol || 'GHC'})</ThemedText>
                                <ThemedText style={{ fontFamily: 'SemiBold', fontSize: 25, marginBottom: Spacing.medium }}>
                                    {formatCurrency(amount, {symbol: businessCurrency?.symbol})}
                                </ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleAddItem} style={{width: 150, height: 40, borderRadius: 5, marginTop: 5, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end'}}>
                            <ThemedText style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.white}}>Add to list</ThemedText>
                        </TouchableOpacity>
                        <View style={[styles.tableHeader, { borderBottomColor: themeColors.border, paddingVertical: Spacing.screenPadding, paddingHorizontal: 10 }]}>
                            <Text style={[styles.th, { flex: 2, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Product</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Price</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Qty</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Amount</Text>
                            <View style={{ width: 30 }} />
                        </View>
                        <View style={{ marginTop: 0 }}>
                            {cart.length > 0 ? cart.map((item: any, index: number) => {
                                const expanded = expandedRow === item.id
                                const liveQuantity = Number(editQuantity || item.quantity);
                                const liveTotal = liveQuantity * item.price;
                                return (
                                    <View key={index} style={[styles.tableRowContainer, { paddingHorizontal: 10, backgroundColor: themeColors.card, borderColor: themeColors.border } ]}>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.td, { flex: 1.7, color: themeColors.text, paddingRight: 10 }]} numberOfLines={1}>
                                                {item.productName}
                                            </Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>
                                                {formatCurrency(item.price, {symbol: businessCurrency?.symbol})}
                                            </Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>{item.quantity}</Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>
                                                {formatCurrency(item.total, {symbol: businessCurrency?.symbol})}
                                            </Text>
                                            <TouchableOpacity onPress={() => {
                                                if (expanded) {
                                                    setExpandedRow(null);
                                                    setEditQuantity('');
                                                } else {
                                                    setExpandedRow(item.id);
                                                    setEditQuantity(item.quantity.toString());
                                                }
                                            }}>
                                                <IconSymbol name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={themeColors.icon} />
                                            </TouchableOpacity>
                                        </View>
                                        {expanded && (
                                            <View style={styles.hiddenRow}>
                                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                                    <View style={{ width: '49%' }}>
                                                        <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Quantity</ThemedText>
                                                        <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} placeholder="Quantity" value={editQuantity} onChangeText={setEditQuantity} keyboardType="decimal-pad" placeholderTextColor={themeColors.subtleText}/>
                                                    </View>
                                                    <View style={{ width: '49%' }}>
                                                        <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Total Amount</ThemedText>
                                                        <TextInput editable={false} style={[styles.input,{backgroundColor:themeColors.border,borderColor:themeColors.border,color:themeColors.text}]}
                                                        value={formatCurrency(liveTotal || 0, {
                                                            symbol: businessCurrency?.symbol
                                                        })}
                                                        placeholder="Total" placeholderTextColor={themeColors.subtleText}/>
                                                    </View>
                                                </View>
                                                <View style={{flexDirection: 'row', marginTop: 5, justifyContent: 'space-between'}}>
                                                    <TouchableOpacity style={{...styles.btn, backgroundColor: themeColors.primary}} onPress={() => handleUpdateItem(item.id, item.price)}>
                                                        <IconSymbol name="check" size={16} color={themeColors.white} />
                                                        <Text style={{ color: themeColors.white, marginLeft: 6, fontFamily: 'Regular', fontSize: 13 }}>Update</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={{...styles.btn, backgroundColor: themeColors.error}} onPress={() => handleRemoveItem(item.id)}>
                                                        <IconSymbol name="trash" size={16} color={themeColors.white} />
                                                        <Text style={{ color: themeColors.white, marginLeft: 6, fontFamily: 'Regular', fontSize: 13 }}>Remove</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )
                            }) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 10, marginBottom: 20, fontSize: 13}}>No item added</ThemedText>}
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <View style={{flexDirection: 'column', marginTop:20, marginBottom: 20}}>
                                <View style={{ alignItems:'flex-end'}}>
                                    <ThemedText style={{color:themeColors.text,fontFamily:'SemiBold',fontSize: 13}}>Sub Total ({businessCurrency?.code})</ThemedText>
                                </View>
                                <View style={{ alignItems:'flex-end'}}>
                                    <ThemedText style={{fontFamily:'SemiBold',fontSize: 18, color: themeColors.primary}}>{formatCurrency(Number(summary.subtotal) || 0, {symbol: businessCurrency?.symbol})}</ThemedText>
                                </View>
                            </View>
                        </View>
                        <View style={{ marginTop: 0, width: '70%', alignSelf: 'flex-end' }}>
                            {summary.breakdown.length > 0 ? summary.breakdown.map((item, index) => {
                                return (
                                    <View key={index} style={[styles.tableRowContainer, {borderBottomColor: themeColors.border}]}>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.subtleText }]}>{item.name}</Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.subtleText, textAlign: 'center' }]}>{item.percentage}%</Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.error, textAlign: 'right' }]}>
                                                {formatCurrency(item.amount, { symbol: businessCurrency?.symbol })}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            }) : (
                                <ThemedText style={{ textAlign: 'center', marginTop: 10 }}>
                                    No tax applied
                                </ThemedText>
                            )}
                            <View style={{...styles.tableRow, paddingHorizontal: 5, borderColor: themeColors.border}}>
                                <Text style={[styles.td, { flex: 2, color: themeColors.text, fontFamily: 'SemiBold' }]}>
                                    Total Tax
                                </Text>
                                <Text style={[styles.td, { flex: 1, color: themeColors.error, textAlign: 'right', fontFamily: 'SemiBold' }]}>
                                    {formatCurrency(summary.totalTax, { symbol: businessCurrency?.symbol })}
                                </Text>
                            </View>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <View style={{flexDirection: 'column', marginTop:40, marginBottom: 20}}>
                                <View style={{ alignItems:'flex-end'}}>
                                    <ThemedText style={{color:themeColors.text,fontFamily:'SemiBold',fontSize: 20}}>Grand Total ({businessCurrency?.code})</ThemedText>
                                </View>
                                <View style={{ alignItems:'flex-end', marginTop: 10}}>
                                    <ThemedText style={{fontFamily:'SemiBold',fontSize: 25, color: themeColors.error}}>{formatCurrency(Number(summary.grandTotal || 0), {symbol: businessCurrency?.symbol})}</ThemedText>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.button, { marginTop: 30, backgroundColor: (!cart.length) ? themeColors.border : themeColors.success}]}
                            onPress={saveSale} disabled={!cart.length} activeOpacity={0.8}>
                            <ThemedText style={styles.buttonText}>
                                Save and Record Payment
                            </ThemedText>
                        </TouchableOpacity>
                    </ScrollView>
                    <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                        <ThemedText style={{fontFamily:'SemiBold',fontSize:20,marginBottom:20,textAlign:'center',marginTop:10}}>{sheetTitle || 'Select Option'}</ThemedText>
                        <TextInput style={[styles.input,{marginHorizontal: 16, backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={search} onChangeText={setSearch} keyboardType='default' placeholder="Search..." placeholderTextColor={themeColors.subtleText} />
                        <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                            {filteredOptions.length > 0 ? filteredOptions.map(option=>(
                                <TouchableOpacity key={option.key} style={{padding:10,backgroundColor:themeColors.card,borderRadius:5,marginBottom:5, flexDirection: 'row', alignItems: 'center'}} onPress={()=>selectOption(option)}>
                                    {option.image ? <Image source={{ uri: `${API_URL}${option.image?.path}` }} style={{height: 40, width: 40, marginRight: 20, borderRadius: 10}} /> : <Image source={require('./../../../assets/no-image.png')} style={{height: 40, width: 40, marginRight: 20, borderRadius: 10}} />}
                                    <Text style={{fontSize:Typography.body,color:themeColors.text,fontFamily:'Medium'}}>{option.value}</Text>
                                </TouchableOpacity>
                            )) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No records found</ThemedText>}
                        </BottomSheetScrollView>
                    </BottomSheet>
                    {scannerVisible && permission?.granted && (
                        <View style={styles.scannerOverlay}>
                            <CameraView
                                style={StyleSheet.absoluteFillObject}
                                ref={cameraRef}
                                facing={facing}
                                barcodeScannerSettings={{
                                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'code128'],
                                }}
                                onBarcodeScanned={handleBarCodeScanned}
                                enableTorch={true}
                            />
                            <TouchableOpacity style={styles.closeScanner} onPress={() => setScannerVisible(false)}>
                                <Text style={{ color: '#fff', fontSize: 16 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </KeyboardAvoidingView>
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
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    hiddenText: {
        fontSize: Typography.small,
        opacity: 0.7,
        marginBottom: 4,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '49%',
        height: 40,
        justifyContent: 'center',
        borderRadius: 5
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
        zIndex: 999,
    },
    closeScanner: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
    }
})

export default NewSaleScreen
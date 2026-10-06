import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { API_URL } from '../../../configuration/credentials';
import { formatCurrency } from '../../../utils/constants/Currency';
// import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

interface LabelItem {
    id: string
    productName: string
    uomName: string
    price: number
    quantity: number
    sku: string
}

export type BottomSheetSelectOption = {
    key: string | number;
    value: string | number;
    image?: any
    price?: number
    uomName?: string
    taxGroupID?: number
}

const generateId = () => Math.random().toString(36).substring(2, 10)

type TLabelScreen = NativeStackScreenProps<InventoryNavigationList, "LabelScreen">
const LabelScreen = ({navigation, route}: TLabelScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    // const { data } = route.params
    const { session, selectedBusiness, businessCurrency } = useAppContainer()

    const [products, setProducts] = useState<BottomSheetSelectOption[]>([])
    const [uoms, setUOMs] = useState<BottomSheetSelectOption[]>([])
    const [selectedItems, setSelectedItems] = useState<LabelItem[]>([])
    const [search, setSearch] = useState('')
    const previewData:any = {
        name: "Milk",
        uom: "Bottle",
        price: 12.5,
        sku: "SKU12345",
    }

    const [form, setForm] = useState({
        product: null as BottomSheetSelectOption | null,
        uom: null as BottomSheetSelectOption | null
    })
    
    const bottomSheetRef = useRef<BottomSheet>(null)
    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [activeField, setActiveField] = useState<'product' | 'uom' | null>(null)

    const snapPoints = useMemo(() => ["60%", "75%"], [0])

    const fetchProducts = () => {
        SocketIO.emit('fetch-products', { sessionID: session, businessID: selectedBusiness.id }, (res:any)=>{
            if(res.status==="success"){
                const mapped = res.data.map((p:any)=>({
                    key: p.id,
                    value: p.name,
                    taxGroupID: p.taxGroupID
                }))
                setProducts(mapped)
            }
        })
    }

    const fetchUOMs = () => {
        if(!form.product?.key) return
    
        SocketIO.emit('fetch-uoms', { sessionID: session, businessID: selectedBusiness.id, productID: form.product.key }, (res:any)=>{
            if(res.status==="success"){
                const mapped = res.data.map((u:any)=>({
                    key: u.id,
                    value: `${u.name} - ₵${u.sellingPrice}`,
                    price: Number(u.sellingPrice),
                    uomName: u.shortCode
                }))
                setUOMs(mapped)
        
                if(mapped.length === 1){
                    setForm(prev => ({ ...prev, uom: mapped[0] }))
                }
            }
        })
    }

    useEffect(()=>{ fetchProducts() }, [])
    useEffect(()=>{ fetchUOMs() }, [form.product?.key])

    const openSheet = (field: 'product' | 'uom', options: BottomSheetSelectOption[]) => {
        setActiveField(field)
        setSheetOptions(options)
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectOption = (opt: BottomSheetSelectOption) => {
        if(activeField){
            setForm(prev => ({ ...prev, [activeField]: opt }))
        }
        bottomSheetRef.current?.close()
    }

    const addLabel = () => {
        if(!form.product || !form.uom){
            Alert.alert("Error", "Select product and UOM")
            return
        }
    
        const item: LabelItem = {
            id: generateId(),
            productName: String(form.product.value),
            uomName: String(form.uom.uomName),
            price: Number(form.uom.price),
            quantity: 1,
            sku: `${form.product.key}-${form.uom.key}`
        }
        setSelectedItems(prev => [...prev, item])
        setForm({ product: null, uom: null })
        setUOMs([])
    }
    
    const updateQty = (id:string, delta:number) => {
        setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
    }
    
    const removeItem = (id:string) => {
        setSelectedItems(prev => prev.filter(i => i.id !== id))
    }
    
      // 🔥 ESC/POS LABEL BUILDER
    const buildLabel = (item: LabelItem) => {
        const ESC = '\x1B'
        const GS = '\x1D'
    
        let content = ''
    
        content += ESC + 'a' + '\x01' // center
        content += `${item.productName} (${item.uomName})\n`
    
        content += ESC + 'E' + '\x01' // bold
        content += `₵${item.price.toFixed(2)}\n`
        content += ESC + 'E' + '\x00'
    
        content += '----------------------------\n'
    
        content += ESC + 'a' + '\x00' // left
        content += `SKU: ${item.sku}\n`
    
        content += GS + 'h' + '\x50'
        content += GS + 'w' + '\x02'
        content += GS + 'k' + '\x04'
        content += `${item.sku}\x00\n`
    
        content += '\n\n'
    
        return content
    }
    
    const buildPayload = () => {
        let output = ''
        selectedItems.forEach(item => {
            for(let i=0;i<item.quantity;i++){
                output += buildLabel(item)
            }
        })
        output += '\x1D\x56\x00' // cut
        return output
    }
    
    const handlePrint = async () => {
        if(selectedItems.length === 0){
            Alert.alert("No items", "Add labels first")
            return
        }
        try {
            const payload = buildPayload()
            // await BluetoothEscposPrinter.printText(payload)
            Alert.alert("Success", "Labels printed")
        } catch (e) {
            Alert.alert("Error", "Printing failed")
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Labels</ThemedText>
                    <TouchableOpacity onPress={()=> handlePrint()} style={[styles.iconButton, { backgroundColor: themeColors.card }]}>
                        <IconSymbol name="print" size={22} color={themeColors.icon} />
                    </TouchableOpacity>
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        {previewData && (
                            <View style={{...styles.previewBox, borderColor: themeColors.border, marginBottom: 30}}>
                                <Text style={{...styles.previewName, color: themeColors.subtleText}}>
                                    {previewData?.name} ({previewData?.uom})
                                </Text>
                                <Text style={{...styles.previewPrice, color: themeColors.subtleText}}>
                                    ₵{previewData.price.toFixed(2)}
                                </Text>
                                <View style={{...styles.divider}} />
                                <Text style={{color: themeColors.subtleText, fontFamily: 'Regular', marginBottom: 5}}>SKU: {previewData.sku}</Text>
                                <Text style={{color: themeColors.subtleText, fontFamily: 'SemiBold'}}>|||||||||||||||||||</Text>
                            </View>
                        )}
                        <View style={{...styles.section}}>
                            <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Product ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=> openSheet('product', products)}>
                                <Text style={{color:form.product?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.product?.value || 'Select Product'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{...styles.section}}>
                            <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Product UOM ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=> openSheet('uom', uoms)}>
                                <Text style={{color:form.uom?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.uom?.value || 'Select UOM'}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={{...styles.button, backgroundColor: themeColors.primary}} onPress={addLabel}>
                            <Text style={styles.buttonText}>Add Label</Text>
                        </TouchableOpacity>

                        {selectedItems.map(item => (
                            <View key={item.id} style={{...styles.card, borderColor: themeColors.border}}>
                                <Text style={{color: themeColors.subtleText, fontFamily: 'SemiBold', marginBottom: 5, fontSize: 13}}>{item.productName} ({item.uomName})</Text>
                                <Text style={{color: themeColors.text, fontFamily: 'SemiBold', fontSize: 14}}>{formatCurrency(Number(item.price || 0), {symbol: businessCurrency.symbol})}</Text>

                                <View style={{ flexDirection: 'row', marginTop: 5, alignItems: 'center' }}>
                                    <TouchableOpacity onPress={()=> updateQty(item.id, -1)}>
                                        <IconSymbol name="remove.circle" size={20} color={themeColors.icon} />
                                    </TouchableOpacity>
                                    <Text style={{ marginHorizontal: 10, fontFamily: "SemiBold", fontSize: 15, color: themeColors.text }}>x{item.quantity}</Text>
                                    <TouchableOpacity onPress={()=> updateQty(item.id, 1)}>
                                        <IconSymbol name="plus.circle" size={20} color={themeColors.icon} />
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={()=> removeItem(item.id)}>
                                        <Text style={{ marginLeft: 20, color: 'red', fontFamily: 'Regular', fontSize: 13 }}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </KeyboardAvoidingView>
                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                    <BottomSheetScrollView style={{ padding: 20 }}>
                        {sheetOptions.map(opt => (
                            <TouchableOpacity key={opt.key} style={{padding:10,backgroundColor:themeColors.card,borderRadius:5,marginBottom:5, flexDirection: 'row', alignItems: 'center'}} onPress={()=>selectOption(opt)}>
                                {opt.image ? <Image source={{ uri: `${API_URL}${opt.image?.path}` }} style={{height: 40, width: 40, marginRight: 20, borderRadius: 10}} /> : <Image source={require('./../../../assets/no-image.png')} style={{height: 40, width: 40, marginRight: 20, borderRadius: 10}} />}
                                <Text style={{fontSize:Typography.body,color:themeColors.text,fontFamily:'Medium'}}>{opt.value}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={{paddingVertical: 60}} />
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
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.small },
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
    card: {
        borderWidth: 1,
        padding: 10,
        marginTop: 10
    },


    previewBox: {
        borderWidth: 1,
        padding: 20,
        marginTop: 10,
        alignItems: 'center'
      },
    
      previewName: {
        fontSize: 16,
        fontFamily: 'SemiBold'
      },
    
      previewPrice: {
        fontSize: 20,
        fontFamily: 'Bold',
        marginVertical: 5
      },
    
      previewSKU: {
        fontSize: 12,
        marginTop: 5
      },
    
      barcode: {
        marginTop: 5,
        letterSpacing: 2
      },
    
      divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 5
      },
    
})

export default LabelScreen;

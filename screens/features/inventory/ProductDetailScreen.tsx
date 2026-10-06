import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { API_URL } from '../../../configuration/credentials'
import ImageCarousel from '../../../components/ui/cards/ImageCarousel';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

type FormState = {
    uomID: BottomSheetSelectOption | null
}

type TProductDetailScreen = NativeStackScreenProps<InventoryNavigationList, "ProductDetailScreen">
const ProductDetailScreen = ({navigation, route}: TProductDetailScreen) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { data } = route.params || {};
    const { session, selectedBusiness, can, userBranch } = useAppContainer()
    let images = data ? JSON.parse(data.images || '[]') : []
    const [uomList, setUomList] = useState<any[]>([])
    const [uomL, setUomL] = useState<any[]>([])
    const [expandedRow, setExpandedRow] = useState<number | null>(null)

    const [permission, requestPermission] = useCameraPermissions()
    const [scannerVisible, setScannerVisible] = useState(false);
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission()
        }
    }, [permission])

    const fetchUOMList = async () => {
        if (!data?.id) return
        SocketIO.emit('fetch-uoms', { sessionID: session, businessID: selectedBusiness.id, productID: data.id }, (response: any) => {
            if (response.status === "success") {
                setUomList(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching product UoMs", response.message)
            }
        })
    }

    const fetchUOM = async () => {
        SocketIO.emit('fetch-uoms', { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: `${item.id}`,
                    value: `${item.name} `
                }))
                setUomL(simplified)
            } else {
                Alert.alert("Error", "Error fetching UoMs", response.message)
            }
        })
    }

    useEffect(()=> {
        fetchUOMList()
        fetchUOM()
    }, [])

    const [form, setForm] = useState<FormState>({
        uomID: null
    })

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

    const handleRemoveItem = (id:string) => {
        setUomList(prev=>prev.filter((item:any) => item.id!==id ))
    }

    const [editUOM, setEditUOM] = useState<{id: number | null, barcode: string, sellingPrice: string, conversionRate: string, isTaxInclusive: boolean}>({
        id: null,
        barcode: '',
        sellingPrice: '',
        conversionRate: '',
        isTaxInclusive: false
    })
    
    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScannerVisible(false);
        setEditUOM(prev => ({
            ...prev,
            barcode: data,
        }))
        Alert.alert('Scanned', `Barcode: ${data}`)
    }

    const handleAddUOMToProduct = (uomID:string|number|undefined) => {
        if(!uomID || !data.id){
            Alert.alert("Error", "Please select a valid UOM")
            return
        }
        const payload = {
            businessID: selectedBusiness.id,
            productID: data.id,
            hiddenID: uomID,
            isTaxInclusive: true,
            sessionID: session
        }
        SocketIO.emit('add-uom-product', payload, (response:any)=>{
            if(response.status==="success") {
                Alert.alert("Success", response.message)
                fetchUOMList()
                setForm(prev => ({
                    ...prev,
                    uomID: null
                }))
            } else {
                Alert.alert("Error", response.message || "Failed to save")
                setForm(prev => ({
                    ...prev,
                    uomID: null
                }))
            }
        })
    }

    const handleUpdateProductUOM = (id: number) => {
        if (!id || !data.id) {
            Alert.alert("Error", "Invalid UOM selected")
            return
        }
        const payload = {
            businessID: selectedBusiness.id,
            productID: data.id,
            hiddenID: id,
            barcode: editUOM.barcode,
            sellingPrice: Number(editUOM.sellingPrice),
            conversionRate: Number(editUOM.conversionRate),
            isTaxInclusive: editUOM.isTaxInclusive,
            sessionID: session
        }
        SocketIO.emit('update-uom-product', payload, (response:any)=>{
            if(response.status==="success") {
                Alert.alert("Success", response.message)
                fetchUOMList()
                setExpandedRow(null)
            } else {
                Alert.alert("Error", response.message || "Failed to update")
            }
        })
    }

    useEffect(()=> {
        if (!form?.uomID) return;
        Alert.alert(
            'Add UOM',
            `Do you want to add ${form.uomID.value} as a UOM for this product?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => {
                        setForm(prev => ({
                            ...prev,
                            uomID: null,
                        }))
                    },
                },
                { text: 'Yes', onPress: () => { handleAddUOMToProduct(form.uomID?.key) }}
            ],{ cancelable: false }
        );
    }, [form?.uomID])

    const handleExpand = (item: any | null) => {
        if (!item) {
            setExpandedRow(null)
            setEditUOM({
                id: null,
                barcode: '',
                sellingPrice: '',
                conversionRate: '',
                isTaxInclusive: false
            })
            return
        }
        setExpandedRow(item.id)
        setEditUOM({
            id: item.id,
            barcode: item.barcode || '',
            sellingPrice: item.sellingPrice?.toString() || '',
            conversionRate: item.conversionRate?.toString() || '1',
            isTaxInclusive: item.isTaxInclusive || false
        })
    }

    const productURL = `https://suito-ecommerce-shoplink.web.app/shop/${selectedBusiness.unique_code}/branch/${userBranch.id}/product/${data.id}`

    const onLinkPress = () => {
        Alert.alert(
            "Share Link",
            "What would you like to do?",
            [
                {
                    text: "Copy Link",
                    onPress: async () => {
                        await Clipboard.setStringAsync(productURL)
                        Alert.alert("Copied", "Product link copied to clipboard.")
                    },
                },
                {
                    text: "Open Link",
                    onPress: async () => {
                        try {
                            await Linking.openURL(productURL)
                        } catch (error) {
                            Alert.alert("Error", "Unable to open product link.")
                        }
                    },
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        )
    }

    return (
        <View style={[styles.container,{ backgroundColor:themeColors.background }]}>
            {Platform.OS==='android' && <View style={{ height:10, backgroundColor: themeColors.background }}/>}
            <View style={[styles.safeArea,{ paddingTop: Platform.OS==='ios'?insets.top:0, paddingBottom: Platform.OS==='ios'?85:0 }]}>
                <ThemedView style={[styles.header,{ backgroundColor:themeColors.background, borderBottomColor:themeColors.border }]}>
                    <TouchableOpacity onPress={()=>navigation.goBack()} style={[styles.backButtonMain,{ backgroundColor:themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon}/>
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Product Detail</ThemedText>
                    {can("inventory.product.create_update") && (
                        <TouchableOpacity onPress={()=> navigation.navigate("ProductFormScreen", {data: data})} style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} >
                            <IconSymbol name="pencil" size={22} color={themeColors.icon} />
                        </TouchableOpacity>
                    )}
                </ThemedView>
                <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:Spacing.small, paddingBottom: insets.bottom+100 }} showsVerticalScrollIndicator={false}>
                        {data ? (
                            <>
                                <View style={{ position: 'relative' }}>
                                    <ImageCarousel images={images} />
                                </View>
                                <View style={{paddingVertical: Spacing.screenPadding, paddingHorizontal: 10}}>
                                    <ThemedText style={{fontFamily: 'Italic', fontSize: 11, color: themeColors.warning}}>{data.manufacturerName ? `Manufactured by ${data.manufacturerName}` : ''}</ThemedText>
                                    <ThemedText style={{fontFamily: 'Bold', fontSize: 18, color: themeColors.primary}}>{data.name}</ThemedText>
                                    <ThemedText style={{fontFamily: 'Regular', fontSize: 12, textTransform: 'capitalize'}}>Category: {data.categoryName} | Type: {data.type || 'Physical'}</ThemedText>
                                    <ThemedText style={{fontFamily: 'SemiBold', fontSize: 14, marginTop: 20}}>About product</ThemedText>
                                    <ThemedText style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.subtleText}}>{data.productDescription || 'No Description' }</ThemedText>
                                </View>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'flex-end', width: 210}}>
                                    <TouchableOpacity onPress={()=>openBottomSheet('uomID', uomL, 'Select UOM')} style={{width: 150, height: 40, borderRadius: 5, marginTop: 20, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center'}} activeOpacity={0.8}>
                                        <ThemedText style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.white}}>New Product UOM</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={onLinkPress} style={{width: 50, height: 40, borderRadius: 5, marginTop: 20, backgroundColor: themeColors.warning, justifyContent: 'center', alignItems: 'center'}} activeOpacity={0.8}>
                                        <ThemedText style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.white}}><IconSymbol name='link' color={themeColors.text} /> </ThemedText>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.tableHeader, { paddingVertical: Spacing.screenPadding, paddingHorizontal: 10 }]}>
                                    <Text style={[styles.th, { flex: 2, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>UOM Name</Text>
                                    <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Category</Text>
                                    <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Con. Rate</Text>
                                    <View style={{ width: 30 }} />
                                </View>
                                <View style={{ marginTop: 0 }}>
                                    {uomList.length > 0 ? uomList.map((item: any, index: number) => {
                                        const expanded = expandedRow === item.id
                                        return (
                                            <View key={index} style={[styles.tableRowContainer, { borderBottomColor: themeColors.info, backgroundColor: themeColors.card, borderColor: themeColors.border, paddingHorizontal: 10, borderRadius: 4, marginBottom: 5 } ]}>
                                                <View style={{...styles.tableRow, borderBottomColor: themeColors.border,}}>
                                                    <Text style={[styles.td, { flex: 2, color: themeColors.text, textAlign: 'left', textTransform: 'capitalize', fontFamily: 'Regular' }]} numberOfLines={1}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={[styles.td, { flex: 1, color: themeColors.text, textAlign: 'left', textTransform: 'capitalize', fontFamily: 'Regular' }]}>{item.category}</Text>
                                                    <Text style={[styles.td, { flex: 1, color: themeColors.text, textAlign: 'left', textTransform: 'capitalize', fontFamily: 'Regular' }]}>{Number(item.conversionRate)}</Text>
                                                    <TouchableOpacity onPress={() => handleExpand(expanded ? null : item)}>
                                                        <IconSymbol name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={themeColors.icon} />
                                                    </TouchableOpacity>
                                                </View>
                                                {expanded && (
                                                    <View style={styles.hiddenRow}>
                                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                                            <View style={{ width: '83%' }}>
                                                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Scan / Type BarCode</ThemedText>
                                                                <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={editUOM.barcode} onChangeText={(v) => setEditUOM(prev => ({ ...prev, barcode: v }))} placeholder="Product Original BarCode" placeholderTextColor={themeColors.subtleText}/>
                                                            </View>
                                                            <View style={{ width: '15%', marginTop: 15, alignItems: 'flex-end' }}>
                                                                <TouchableOpacity onPress={() => setScannerVisible(true)}>
                                                                    <IconSymbol name='barcode' size={45} color={themeColors.subtleText} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                                            <View style={{ width: '49%' }}>
                                                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Selling Price</ThemedText>
                                                                <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={editUOM.sellingPrice} onChangeText={(v) => setEditUOM(prev => ({ ...prev, sellingPrice: v }))} placeholder="Selling Price" placeholderTextColor={themeColors.subtleText} keyboardType='decimal-pad' />
                                                            </View>
                                                            <View style={{ width: '49%' }}>
                                                                <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Conversion Rate</ThemedText>
                                                                <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={editUOM.conversionRate} onChangeText={(v) => setEditUOM(prev => ({ ...prev, conversionRate: v }))} placeholder="1" placeholderTextColor={themeColors.subtleText} keyboardType='decimal-pad' />
                                                            </View>
                                                        </View>
                                                        <View style={{ width: '100%', marginTop: 5 }}>
                                                            <TouchableOpacity
                                                                onPress={() => setEditUOM(prev => ({
                                                                    ...prev,
                                                                    isTaxInclusive: !prev.isTaxInclusive
                                                                }))}
                                                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}
                                                            >
                                                                <View style={{
                                                                    height: 25,
                                                                    width: 25,
                                                                    borderWidth: 1,
                                                                    justifyContent: 'center', alignItems: 'center',
                                                                    borderColor: themeColors.border,
                                                                    backgroundColor: editUOM.isTaxInclusive ? themeColors.primary : 'transparent',
                                                                    marginRight: 10
                                                                }}>{ editUOM.isTaxInclusive ? <Ionicons name='checkmark' size={14} color={themeColors.white} /> : null }</View>
                                                                <ThemedText style={{ color: themeColors.text }}>
                                                                    Price includes tax
                                                                </ThemedText>
                                                            </TouchableOpacity>
                                                        </View>
                                                        <View style={{flexDirection: 'row', marginTop: 5, justifyContent: 'space-between'}}>
                                                            <TouchableOpacity style={{...styles.btn, backgroundColor: themeColors.primary}} onPress={() => handleUpdateProductUOM(item.uomID)}>
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
                            </>
                        ) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>Product not found</ThemedText>}
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
                                enableTorch
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
    container:{ flex:1 },
    safeArea:{ flex:1 },
    header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.screenPadding, paddingVertical:Spacing.medium, borderBottomWidth:1 },
    backButtonMain:{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.small },
    headerTitle:{ fontSize:Typography.heading2, fontFamily:'SemiBold' },
    label:{ fontSize:Typography.body, fontFamily:'Medium', marginBottom:3 },
    input:{ borderWidth:1, borderRadius:Borders.radiusSmall, paddingHorizontal:Spacing.medium, paddingVertical:Spacing.large, fontSize:Typography.small, marginBottom:Spacing.small, fontFamily: 'Regular' },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
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
    sectionTitle:{fontSize:Typography.body,fontFamily:'Medium',marginBottom:3},
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
    },
});

export default ProductDetailScreen;

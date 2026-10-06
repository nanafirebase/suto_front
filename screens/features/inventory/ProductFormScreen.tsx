import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { inventoryTypeList, productTypeList } from '../../../configuration/data/System';
import { formatBytes, shortenText, SocketIO } from '../../../configuration/helpers/main.helpers';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';

type FormState = {
    type: BottomSheetSelectOption | null
    category: BottomSheetSelectOption | null
    manufacturer: BottomSheetSelectOption | null
    inventoryType: BottomSheetSelectOption | null
    taxGroup: BottomSheetSelectOption | null
}

interface SelectedImage {
    name: string;
    uri: string;
    size: number
}

type TProductFormScreen = NativeStackScreenProps<InventoryNavigationList, "ProductFormScreen">
const ProductFormScreen = ({navigation, route}: TProductFormScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { data } = route.params
    const { session, selectedBusiness } = useAppContainer()

    // const oldImages: any[] = Array.isArray(data?.images) ? data.images : (() => { try { return JSON.parse(data?.images || '[]') } catch { return [] } })()
    const [name, setName] = useState(data?.name || '')
    const [description, setDescription] = useState(data?.productDescription || '')
    const [images, setImages] = useState<SelectedImage[]>([])
    const [sku, setSKU] = useState(data?.sku || '')
    const [productCategory, setProductCategoryList] = useState<any[]>([])
    const [manufacturerList, setManufacturerList] = useState<any[]>([])
    const [taxGroupList, setTaxGroupList] = useState<any[]>([])

    const fetchProductCategory = async () => {
        SocketIO.emit('fetch-product-categories' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.categoryName || 'No Name'}`
                }))
                const selectedPC = simplified.find((item:any) => String(item.key) === String(data.productCategoryID)) || null
                const selectedPT = productTypeList.find((item:any) => String(item.key) === String(data.type)) || null
                const selectedIT = inventoryTypeList.find((item:any) => String(item.key) === String(data.inventoryType)) || null
                const selectedTax = taxGroupList.find((item:any) => String(item.key) === String(data.taxGroupID)) || null
                setForm(prev => ({
                    ...prev,
                    category: selectedPC,
                    type: selectedPT,
                    inventoryType: selectedIT,
                    taxGroup: selectedTax
                }))
                setProductCategoryList(simplified)
            } else {
                Alert.alert("Error", "Error fetching product category", response.message)
            }
        })
    }

    const fetchManufacturers = async () => {
        SocketIO.emit('fetch-manufacturers' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = [{ key: '', value: 'Select manufacturer' },...(response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name || 'No Name'}`
                }))]
                const selectedM = simplified.find((item:any) => String(item.key) === String(data.manufacturerID)) || null
                setForm(prev => ({
                    ...prev,
                    manufacturer: selectedM,
                }))
                setManufacturerList(simplified)
            } else {
                Alert.alert("Error", "Error fetching manufacturers", response.message)
            }
        })
    }

    const fetchTaxGroups = async () => {
        SocketIO.emit('fetch-tax-groups' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                const simplified = [{ key: null, value: 'No Tax' }, ...(response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.groupName || 'No Name'}`
                }))]
                const selectedT = simplified.find((item:any) => String(item.key) === String(data.taxGroupID)) || null
                setForm(prev => ({
                    ...prev,
                    taxGroup: selectedT,
                }))
                setTaxGroupList(simplified)
            } else {
                Alert.alert("Error", "Error fetching manufacturers", response.message)
            }
        })
    }

    const pickImage = async (source: 'camera' | 'gallery') => {
        let result;
        if (source === 'camera') {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission required', 'Camera permission is needed to take photos.');
                return;
            }
            result = await ImagePicker.launchCameraAsync({
                quality: 0.7,
                mediaTypes: ['images']
            })
        } else {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission required', 'Gallery permission is needed to pick photos.');
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync({
                quality: 0.7,
                mediaTypes: ['images'],
            })
        }
        if (!result.canceled) {
            const asset = result.assets[0];
            const newImage: SelectedImage = {
                uri: asset.uri,
                name: asset.fileName || `prd_${images.length + 1}`,
                size: asset.fileSize || 0
            }
            setImages(prev => [...prev, newImage])
        }
    }

    const handleChooseFile = () => {
        Alert.alert(
            'Select Image Source',
            'Choose where to get the image from',
            [
                { text: 'Camera', onPress: () => pickImage('camera') },
                { text: 'Gallery', onPress: () => pickImage('gallery') },
                { text: 'Cancel', style: 'cancel' }
            ]
        )
    }

    const removeImage = (index: number) => {
        const newImages = [...images]; // copy the array
        newImages.splice(index, 1); // remove the image at the index
        setImages(newImages);
    }

    useEffect(()=> {
        fetchProductCategory()
        fetchManufacturers()
        fetchTaxGroups()
    }, [])

    const [form, setForm] = useState<FormState>({
        type: null,
        category: null,
        manufacturer: null,
        inventoryType: null,
        taxGroup: null,
    })

    const handleSave = async () => {
        if (!name || !selectedBusiness.id || !form.type?.key) {
            Alert.alert("Note", "Some fields are required\nPlease complete form to add a product")
            return
        }
        try {
            const uploadFiles = await Promise.all(images.map(async img => {
                const base64 = await readAsStringAsync(img.uri, { encoding: 'base64' });
                return { name: img.name, data: base64 };
            }))
            const formData = {
                name: name, productDescription: description, images: JSON.stringify(uploadFiles), type: form.type?.key || 'physical',
                productCategoryID: form.category?.key, manufacturerID: form.manufacturer?.key, sessionID: session, businessID: selectedBusiness.id,
                hiddenID: data?.id, inventoryType: form.type?.key === "physical" ? form.inventoryType?.key : 'service', taxGroupID: form.taxGroup?.key
            }
            SocketIO.emit('add-update-product', formData, (response: any) => {
                if (response.status === "success") {
                    Alert.alert("Success", response.message)
                } else {
                    Alert.alert("Error", response.message || "Failed to add product", [
                        { text: "Retry", onPress: () => handleSave() },
                        { text: "Cancel", style: "cancel" },
                    ],
                    { cancelable: true })
                }
            })
        } catch (error:any) {
            Alert.alert("Error", error.message)
        }
    }

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

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Product Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Product Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Product name"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Product Type (<Text>Default: Physical</Text>)</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('type', productTypeList, 'Select Product Type')}>
                                <Text style={{ color: form.type ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.type?.value || 'Select product type'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {form.type?.key !== "digital" ? (
                            <View style={styles.section}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Product Inventory Type</ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('inventoryType', inventoryTypeList, 'Select Inventory Type')}>
                                    <Text style={{ color: form.inventoryType ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                        {form.inventoryType?.value || 'Select inventory type'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Product Category</ThemedText>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <TouchableOpacity style={[styles.input, { width: '80%', justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('category', productCategory, 'Select Product Category')}>
                                    <Text style={{ color: form.type ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                        {form.category?.value || 'Select product category'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={()=> navigation.navigate('ProductCategoryFormScreen', {data: null})} style={{width: '18%', backgroundColor: themeColors.primary, paddingVertical: Spacing.medium, marginBottom: Spacing.medium, alignItems: 'center', borderRadius: Borders.radiusSmall,}}>
                                    <ThemedText style={{color: themeColors.white, fontSize: 12}}>Add</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {form.type?.key !== "digital" ? (
                            <View style={styles.section}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Product Manufacturer</ThemedText>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <TouchableOpacity style={[styles.input, { width: '80%', justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('manufacturer', manufacturerList, 'Select Manufacturer')}>
                                        <Text style={{ color: form.type ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                            {form.manufacturer?.value || 'Select Manufacturer'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={()=> navigation.navigate('ManufacturerFormScreen', {data: null})} style={{width: '18%', backgroundColor: themeColors.primary, paddingVertical: Spacing.medium, marginBottom: Spacing.medium, alignItems: 'center', borderRadius: Borders.radiusSmall,}}>
                                        <ThemedText style={{color: themeColors.white, fontSize: 12}}>Add</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null}
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Select Tax Group</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('taxGroup', taxGroupList, 'Select tax Group')}>
                                <Text style={{ color: form.taxGroup ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.taxGroup?.value || 'Select tax group'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Description</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text,
                                    height: 120,
                                    textAlignVertical: 'top'
                                }]}
                                multiline
                                placeholder="Description"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                        {!data?.id ? (
                            <View style={styles.section}>
                                <View style={{paddingVertical: 40, alignItems: 'center'}}>
                                    <IconSymbol name='download' size={50} color={themeColors.border}  />
                                    <ThemedText style={{color: themeColors.subtleText, marginTop: 10, fontSize: 13}}>Choose files to upload</ThemedText>
                                    <TouchableOpacity onPress={handleChooseFile} style={{height: 40, backgroundColor: themeColors.primary, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 6, marginTop: 15}}>
                                        <ThemedText style={{color: themeColors.white, marginRight: 10, fontSize: 12}}>Choose File / photos</ThemedText>
                                        <IconSymbol name='arrow.right' size={20} color={themeColors.white}  />
                                    </TouchableOpacity>
                                </View>
                                {images.length ? images.map((item:any, index: number)=> {
                                    // let uri = item.path ? `${API_URL}${item.path}` : item.uri
                                    return (
                                        <View key={index} style={{padding: 10, width: '100%', borderWidth: 1, marginTop: 3, borderColor: themeColors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', width: '80%'}}>
                                                <View style={{height: 60, width: 60, borderWidth: 1, borderColor: themeColors.border}}>
                                                    <Image
                                                        source={{ uri: item.uri }}
                                                        style={{ height: '100%', width: '100%' }}
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                                <View style={{flexDirection: 'column', alignItems: 'flex-start', marginLeft: 10}}>
                                                    <ThemedText style={{fontFamily: 'SemiBold'}}>{shortenText(item.name || '', 20)}</ThemedText>
                                                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                                                        {index === 0 ? <ThemedText style={{fontFamily: 'Regular', fontSize: 13, borderWidth: 1, marginRight: 5, borderColor: themeColors.success, paddingHorizontal: 5, backgroundColor: `${themeColors.success}10`, color: themeColors.success}}>Primary</ThemedText> : null}
                                                        <ThemedText style={{fontFamily: 'Regular', fontSize: 13}}>{formatBytes(item.size || 0)}</ThemedText>
                                                    </View>
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => removeImage(index)} style={{height: 35, width: 35, backgroundColor: themeColors.error, justifyContent: 'center', alignItems: 'center', borderRadius: 10}}>
                                                <IconSymbol name='xmark' size={20} color={themeColors.white}  />
                                            </TouchableOpacity>
                                        </View>
                                    )
                                }) : null}
                            </View>
                        ) : null}
                    </ScrollView>
                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: (!name || !form.inventoryType) ? themeColors.border : themeColors.primary}]}
                            onPress={handleSave} disabled={!name || !form.inventoryType} activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                Save Record
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                    <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose enableContentPanningGesture enableHandlePanningGesture enableDynamicSizing={false} handleIndicatorStyle={{ backgroundColor: themeColors.icon, marginTop: 10 }} backgroundStyle={{backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.info}}>
                        <ThemedText style={{fontFamily: 'SemiBold', fontSize: 20, marginBottom: 20, textAlign: 'center', marginTop: 10}}>{sheetTitle || 'Select Option'}</ThemedText>
                        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                            {sheetOptions.map(option => (
                                <TouchableOpacity key={option.key} style={{ padding: 20, backgroundColor: themeColors.card, borderRadius: 5, marginBottom: 5 }} onPress={() => selectOption({key: option.key, value: option.value})}>
                                    <Text style={{ fontSize: Typography.body, color: themeColors.text, fontFamily: "Medium" }}>{option.value}</Text>
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

export default ProductFormScreen;

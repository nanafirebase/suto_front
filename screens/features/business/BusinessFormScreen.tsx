import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, BusinessNavigationList, BusinessStackList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { africaCountries, agreeOptions, bloodGroups, businessTypes, genderOptions } from '../../../configuration/data/System';
import CustomSelect from '../../../components/CustomSelect';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';

type FormState = {
    businessType: BottomSheetSelectOption | null;
    country: BottomSheetSelectOption | null;
    currency: BottomSheetSelectOption | null;
}

interface SelectedImage {
    name: string;
    uri: string;
    size: number
}

type TBusinessFormScreen = NativeStackScreenProps<BusinessStackList, "BusinessFormScreen">
const BusinessFormScreen = ({navigation}: TBusinessFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness } = useAppContainer()

    const [form, setForm] = useState<FormState>({
        businessType: null,
        country: null,
        currency: null
    })

    const [name, setName] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [taxIdentificationNumber, setTaxIdentificationNumber] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [region, setRegion] = useState('')
    const [city, setCity] = useState('')
    const [currencyList, setCurrencyList] = useState<any[]>([])

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState<string>('')
    const [activeField, setActiveField] = useState<string | null>(null)

    const [logo, setLogo] = useState<SelectedImage[]>([])

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["25%", "50%", "70%"], [])

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

    const fetchCurrencies = async () => {
        SocketIO.emit('fetch-currency' , { sessionID: session }, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name} ( ${item.code} - ${item.symbol} )`
                }))
                setCurrencyList(simplified)
            } else {
                Alert.alert("Error", "Error fetching currency list", response.message)
            }
        })
    }

    useEffect(()=> {
        fetchCurrencies()
    }, [])

    const handleSave = async () => {
        if (!name || !displayName || !phone || !email || !taxIdentificationNumber || !form.businessType || !form.country || !region || !form.currency || !session) {
            Alert.alert("Note", "All fields are required\nPlease complete form to add a business")
            return
        }

        const uploadFiles = await Promise.all(logo.map(async img => {
            const base64 = await readAsStringAsync(img.uri, { encoding: 'base64' })
            return { name: img.name, data: base64 }
        }))
        
        const formData = {
            name: name, type: form.businessType.value, displayName: displayName,
            tinNumber: taxIdentificationNumber, phone: phone, email: email,
            country: form.country.value, region: region, city: city, sessionID: session,
            logo: JSON.stringify(uploadFiles), currency: form.currency.key
        }

        SocketIO.emit('add-update-business', formData, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", "Business added successfully!", [
                    { text: "Business Plan", onPress: () => navigation.navigate('SelectPackageScreen', {formOneData: response.data || {}}) },
                    { text: "Next Time", style: "cancel", onPress: ()=> navigation.navigate('SelectBusinessScreen') },
                ], { cancelable: true })
            } else {
                Alert.alert("Error", response.message || "Failed to add business", [
                    { text: "Retry", onPress: () => handleSave() },
                    { text: "Cancel", style: "cancel" },
                ],
                { cancelable: true })
            }
        })
    }

    const pickImage = async (source: 'camera' | 'gallery') => {
        let result
        if (source === 'camera') {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission required', 'Camera permission is needed to take photos.');
                return;
            }
            result = await ImagePicker.launchCameraAsync({
                quality: 0.7,
                mediaTypes: ['images'],
                selectionLimit: 1
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
                selectionLimit: 1
            })
        }
        if (!result.canceled) {
            const asset = result.assets[0];
            const newImage: SelectedImage = {
                uri: asset.uri,
                name: asset.fileName || `business_logo`,
                size: asset.fileSize || 0
            }
            setLogo(prev => [...prev, newImage])
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

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 10, paddingBottom: Platform.OS === "ios" ? 20 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>New Business Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        {logo[0]?.uri ? (
                            <View style={{ width: 200, height: 200, borderWidth: 1.5, borderStyle: 'dashed', borderColor: themeColors.success, alignSelf: 'center', marginVertical: 20, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={{ uri: logo[0].uri, width: 190, height: 190 }} resizeMode="cover" />
                                <TouchableOpacity onPress={()=> setLogo([])} activeOpacity={0.8} style={{backgroundColor: themeColors.error, position: 'absolute', top: -10, right: -10, padding: 10, borderRadius: 8}}>
                                    <IconSymbol name='trash' color={themeColors.white} />
                                </TouchableOpacity>
                            </View>
                            ) : (
                            <TouchableOpacity onPress={handleChooseFile} activeOpacity={0.7} style={{width: 200, height: 200, borderWidth: 1, borderStyle: 'dashed', borderColor: themeColors.border, alignSelf: 'center', marginVertical: 20, justifyContent: 'center', alignItems: 'center'}}>
                                <Ionicons name='image' size={30} color={themeColors.subtleText} />
                                <ThemedText style={{ fontFamily: 'Bold', fontSize: 20, color: themeColors.subtleText}}>Business Logo</ThemedText>
                            </TouchableOpacity>
                        )}
                        <ThemedText style={{ fontSize: 14, marginBottom: 15, color: themeColors.primary, marginTop: 5, fontFamily: 'SemiBold'}}>Business Information</ThemedText>
                        <View style={{...styles.section}}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Business Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="ENCA SUITO"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Business Type ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('businessType', businessTypes, 'Select Business Type')}>
                                <Text style={{ color: form.businessType ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.businessType?.value || 'Select business type'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Business Default Currency <Text style={{color: themeColors.error}}>* ( Changes are restricted after first payment )</Text></ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('currency', currencyList, 'Select Business Currency')}>
                                <Text style={{ color: form.currency ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.currency?.value || 'Select business currency'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Display Name <Text style={{color: themeColors.error}}>* ( Same as SMS SenderID )</Text></ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="SUITO"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Tax Identification Number</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={taxIdentificationNumber}
                                onChangeText={setTaxIdentificationNumber}
                                placeholder="Business TIN"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <ThemedText style={{ fontSize: 14, marginBottom: 15, color: themeColors.primary, marginTop: 5, fontFamily: 'SemiBold'}}>Business Contact Information</ThemedText>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Phone ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="059********"
                                keyboardType="phone-pad"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Email ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="john*****@****.com"
                                keyboardType="email-address"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <ThemedText style={{ fontSize: 14, marginBottom: 15, color: themeColors.primary, marginTop: 5, fontFamily: 'SemiBold'}}>Business Location Information</ThemedText>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Country ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('country', africaCountries, 'Select Country')}>
                                <Text style={{ color: form.businessType ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.country?.value || 'Select country'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Region / State</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={region}
                                onChangeText={setRegion}
                                placeholder="Region"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>City / Town</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={city}
                                onChangeText={setCity}
                                placeholder="City"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                    </ScrollView>
                    <View style={[ styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: (!name || !form.businessType || !form.country || !phone || !email || !form.currency) ? themeColors.border : themeColors.primary}]}
                            onPress={handleSave} disabled={ !name || !form.businessType || !form.country || !phone || !email || !form.currency } activeOpacity={0.8}>
                            <ThemedText style={styles.buttonText}>
                                Submit Form
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
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
        borderTopWidth: 1
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

export default BusinessFormScreen;
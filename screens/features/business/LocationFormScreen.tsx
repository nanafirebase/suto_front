import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, BusinessNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type FormState = {
    country: BottomSheetSelectOption | null;
}

type TLocationFormScreen = NativeStackScreenProps<BusinessNavigationList, "LocationFormScreen">
const LocationFormScreen = ({navigation, route}: TLocationFormScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()
    const { data } = route.params

    const [form, setForm] = useState<FormState>({
        country: null
    })

    const [name, setName] = useState(data?.name || '')
    const [code, setCode] = useState(data?.code || '')
    const [region, setRegion] = useState(data?.region || '')
    const [city, setCity] = useState(data?.city || '')
    const [address, setAddress] = useState(data?.address || '')
    const [latitude, setLatitude] = useState(data?.geoLat || '')
    const [longitude, setLongitude] = useState(data?.geoLong || '')
    const [countryList, setCountryList] = useState<any[]>([])

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

    const fetchCountries = async () => {
        SocketIO.emit('fetch-countries' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name} (${item.code})`
                }))
                setCountryList(simplified)
                const selectedCountry = simplified.find((item:any) => String(item.key) === String(data.countryID)) || null
                setForm(prev => ({
                    ...prev,
                    country: selectedCountry
                }))
            } else {
                Alert.alert("Error", "Error fetching businesses", response.message)
            }
        })
    }

    useEffect(()=> {
        fetchCountries()
    }, [])

    const handleSave = async () => {
        if (!name || !selectedBusiness.id || !region) {
            Alert.alert("Note", "Some fields are required\nPlease complete form to add a location")
            return
        }
        const formData = {
            name: name, countryID: form.country?.key, sessionID: session, businessID: selectedBusiness.id, code: code,
            region: region, city: city, address: address, latitude: latitude, longitude: longitude, hiddenID: data?.id
        }

        SocketIO.emit('add-update-location', formData, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message)
            } else {
                Alert.alert("Error", response.message || "Failed to add location", [
                    { text: "Retry", onPress: () => handleSave() },
                    { text: "Cancel", style: "cancel" },
                ],
                { cancelable: true })
            }
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Locations Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter name"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Unique Code ( <Text style={{fontFamily: 'Regular', fontSize: 10, color: themeColors.error}}>Please leave black to auto generate.</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={code}
                                onChangeText={setCode}
                                placeholder="Enter location unique code"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Country ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('country', countryList, 'Select Country')}>
                                <Text style={{ color: form.country ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.country?.value || 'Select country'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Region</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
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
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Street Name</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Address / Street Name"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '48%'}}>
                                <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Geo. Lat</ThemedText>
                                <TextInput
                                    style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    placeholder="7.955012"
                                    placeholderTextColor={themeColors.subtleText}
                                />
                            </View>
                            <View style={{...styles.section, width: '48%'}}>
                                <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Geo. Long</ThemedText>
                                <TextInput
                                    style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    placeholder="-1.031819"
                                    placeholderTextColor={themeColors.subtleText}
                                />
                            </View>
                        </View>
                        <TouchableOpacity style={{...styles.button, backgroundColor: themeColors.success, flexDirection: 'row', justifyContent: 'center'}}>
                            <IconSymbol name='target' size={20} color={themeColors.white} />
                            <ThemedText style={{fontSize: 12, color: themeColors.white, marginLeft: 5}}>Get Current Location</ThemedText>
                        </TouchableOpacity>
                    </ScrollView>
                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: (!name || !form.country || !region) ? themeColors.border : themeColors.primary}]}
                            onPress={handleSave} disabled={!name || !form.country || !region} activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                Save Record
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

export default LocationFormScreen;

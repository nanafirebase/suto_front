import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, ProfileNavigationList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { shortenText, SocketIO } from '../../configuration/helpers/main.helpers';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

type defaultStock = {
    id: number
    value: string
}
type TBusinessSettingScreen = NativeStackScreenProps<ProfileNavigationList, "BusinessSettingScreen">
const BusinessSettingScreen = ({navigation, route}: TBusinessSettingScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, userBranch } = useAppContainer()

    const [autoExpiry, setAutoExpiry] = useState(false)
    const [allowNegativeStock, setAllowNegativeStock] = useState(false)
    const [trackBatches, setTrackBatches] = useState(false)
    const [defaultSalesStock, setDefaultSalesStock] = useState<defaultStock|null>(null)

    const [locations, setLocations] = useState<any[]>([])
    const [search, setSearch] = useState('')

    const fetchStockLocation = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-stock-locations' , { sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id }, (response: any) => {
            if (response.status === "success") {
                setLocations(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching stock locations", response.message)
            }
        })
    }

    const fetchBusinessSettings = async () => {
        if (!selectedBusiness.id || !userBranch.id) {
            Alert.alert("Error", 'Invalid Request')
            return
        }

        SocketIO.emit('fetch-business-settings' , {sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id}, (response: any) => {
            if (response.status === 'success') {
                const settings = response.data;
                setAutoExpiry(settings?.autoExpiry === 'yes')
                setAllowNegativeStock(settings?.allowNegativeStock === 'yes')
                setTrackBatches(settings?.trackBatches === 'yes')
                setDefaultSalesStock({id: settings?.defaultSalesStockID, value: settings.name})
            } else {
                Alert.alert('Error', response.message || 'Failed to fetch settings');
            }
        })
    }

    const updateSettings = (next: { autoExpiry: boolean; allowNegativeStock: boolean; trackBatches: boolean, defaultSalesStockID?: number | null }) => {
        SocketIO.emit( 'update-business-setting', { sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id,
                autoExpiry: next.autoExpiry ? 'yes' : 'no', allowNegativeStock: next.allowNegativeStock ? 'yes' : 'no',
                trackBatches: next.trackBatches ? 'yes' : 'no', defaultSalesStockID: next.defaultSalesStockID ?? defaultSalesStock?.id
            },
            (response: any) => {
                if (response.status !== 'success') {
                    Alert.alert('Error', response.message)
                }
            }
        )
    }

    useFocusEffect(
        useCallback(() => {
            fetchBusinessSettings();
            fetchStockLocation()
        }, [session, selectedBusiness.id, userBranch.id])
    )

    const pickerRegistry = {
        stockLocation: {
            title: "Select Default Stock Location",
            description: 'This is the stock location used for sales and cashier transactions by default. Sold items will be deducted from inventory in this location',
            getData: ()=> locations
        }
    }

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState<string>('')
    const [sheetDescription, setSheetDescription] = useState<string>('')
    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["50%", "75%"], [0])

    const openPicker = async (type: keyof typeof pickerRegistry) => {
        const config = pickerRegistry[type]
        const data = config.getData()
        setSheetTitle(config.title)
        setSheetDescription(config.description)
        setSheetOptions(
            data.map((item: any) => ({
                value: item.name,
                key: item.id
            }))
        )
        bottomSheetRef.current?.snapToIndex(0)
    }

    const selectOption = (option: BottomSheetSelectOption) => {

        setDefaultSalesStock({id: Number(option.key), value: String(option.value)})
        updateSettings({ autoExpiry, allowNegativeStock, trackBatches, defaultSalesStockID: Number(option.key)})

        bottomSheetRef.current?.close()
    }

    const SettingSection = ({ title, items }: { title: string; items: { label: string; screen?: string; link?: string; pickerType?: keyof typeof pickerRegistry; rightValue?: string; icon: keyof typeof Ionicons.glyphMap; arrowIcon?: keyof typeof Ionicons.glyphMap; toggle?: boolean; toggleValue?: boolean; onToggle?: (value: boolean) => void }[] }) => {
        const handlePress = (item: { screen?: string; link?: string; toggle?: boolean; pickerType?: keyof typeof pickerRegistry }) => {
            if (item.toggle) return

            if (item.pickerType) {
                openPicker(item.pickerType)
                return
            }

            if (item.screen) {
                navigation.navigate(item.screen as never)
            } else if (item.link) {
                Linking.openURL(item.link)
            }
        }
    
        return (
            <View style={{ paddingHorizontal: 2, paddingVertical: 10, marginBottom: 5 }}>
                <Text style={{ fontFamily: 'SemiBold', color: themeColors.text, fontSize: 17, marginBottom: 15 }}>
                    {title}
                </Text>
    
                <View style={{ backgroundColor: themeColors.card, paddingHorizontal: 10, borderRadius: 10 }}>
                    {items.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={item.toggle ? 1 : 0.8}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 }}
                            onPress={() => handlePress(item)}
                        >

                            <View style={{ width: item.rightValue ? '55%' : '70%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Ionicons name={item.icon} size={18} color={themeColors.subtleText} style={{ alignSelf: 'flex-start', width: '10%' }} />
                                <Text style={{ fontFamily: 'Regular', color: themeColors.text, fontSize: 12, textAlign: 'left', width: item.rightValue ? '75%' : '80%' }} >
                                    {item.label}
                                </Text>
                            </View>

                            <View style={{ width: item.rightValue ? '35%' : '20%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {item.toggle ? (
                                    <Switch
                                        value={item.toggleValue}
                                        onValueChange={(value) => {
                                            const next = {
                                                autoExpiry: item.label === 'Prioritize expiring products' ? value : autoExpiry,
                                                allowNegativeStock: item.label === 'Allow negative stock' ? value : allowNegativeStock,
                                                trackBatches: item.label === 'Track batches/lots' ? value : trackBatches
                                            }
                                            if (item.label === 'Prioritize expiring products') setAutoExpiry(value);
                                            if (item.label === 'Allow negative stock') setAllowNegativeStock(value);
                                            if (item.label === 'Track batches/lots') setTrackBatches(value);
                                        
                                            updateSettings(next);
                                        }}
                                        trackColor={{ false: themeColors.border, true: themeColors.success }}
                                        thumbColor={Platform.OS === 'ios' ? '#ffffff' : themeColors.subtleText}
                                    />
                                ) : (
                                    <>
                                        {item.rightValue ? (
                                            <Text style={{ fontFamily: 'Regular', fontSize: 12, color: themeColors.text, marginRight: 3 }} numberOfLines={1}>
                                                {shortenText(item.rightValue || 'Not Set', 15)}
                                            </Text>
                                        ) : null}
                                        <Ionicons name={item.arrowIcon ?? (item.link ? 'open-outline' : 'chevron-forward')} size={18} color={themeColors.subtleText} />
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        )
    }

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return sheetOptions;
        return sheetOptions.filter(option =>
            String(option.value).toLowerCase().includes(search.toLowerCase())
        )
    }, [search, sheetOptions])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Business Settings</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <Text style={{ color: themeColors.warning, marginBottom: 25, fontFamily: 'Regular', fontSize: 13 }}> 
                            Configure how your business operates, including inventory rules, sales settings, payments, and advanced system preferences
                        </Text>

                        <SettingSection
                            title="Inventory"
                            items={[
                                { label: 'Prioritize expiring products', icon: 'calendar-outline', toggle: true, toggleValue: autoExpiry, onToggle: setAutoExpiry },
                                { label: 'Allow negative stock', icon: 'cube-outline', toggle: true, toggleValue: allowNegativeStock, onToggle: setAllowNegativeStock },
                                { label: 'Track batches/lots', icon: 'layers-outline', toggle: true, toggleValue: trackBatches, onToggle: setTrackBatches }
                            ]}
                        />
                        <SettingSection
                            title="Sales & Payments"
                            items={[
                                { label: 'Default Stock Location', icon: 'accessibility-outline', rightValue: defaultSalesStock?.value, pickerType: 'stockLocation' },
                                // { label: 'Payout Account', screen: undefined, icon: 'cash-outline' },
                                // { label: 'Invoice numbering', screen: undefined, icon: 'lock-closed-outline' },
                                // { label: 'Quote validity', screen: undefined, icon: 'lock-closed-outline' },
                                // { label: 'Discounts', screen: undefined, icon: 'lock-closed-outline' },
                                // { label: 'Refund policy', screen: undefined, icon: 'lock-closed-outline' }
                            ]}
                        />
                        {/* <SettingSection
                            title="Advanced"
                            items={[
                                // { label: 'Data Export', screen: undefined, icon: 'person-outline' },
                                // { label: 'Integrations', screen: undefined, icon: 'person-outline' },
                                // { label: 'Backup', screen: undefined, icon: 'lock-closed-outline' },
                            ]}
                        /> */}
                    </ScrollView>
                    <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                        <ThemedText style={{fontFamily:'SemiBold',fontSize:20,marginBottom:20,textAlign:'center',marginTop:10}}>{sheetTitle || 'Select Option'}</ThemedText>
                        <ThemedText style={{fontFamily:'Regular',fontSize:12,marginBottom:20,textAlign:'center',marginTop:10, color: themeColors.subtleText, paddingHorizontal: 30}}>{sheetDescription || ''}</ThemedText>
                        <TextInput style={[styles.input,{marginHorizontal: 16, backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} value={search} onChangeText={setSearch} keyboardType='default' placeholder="Search..." placeholderTextColor={themeColors.subtleText} />
                        <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                            {filteredOptions.length > 0 ? filteredOptions.map(option=>(
                                <TouchableOpacity key={option.key} style={{padding:15,backgroundColor:themeColors.card,borderRadius:5,marginBottom:5, flexDirection: 'row', alignItems: 'center', borderWidth: option.key == defaultSalesStock?.id ? 1 : 0, borderColor: option.key == defaultSalesStock?.id ? themeColors.primary : themeColors.border}} onPress={()=> selectOption(option)}>
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
        padding: Spacing.medium,
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
    input: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.large,
        fontSize: Typography.small,
        marginBottom: Spacing.medium,
        fontFamily: 'Regular'
    },
})

export default BusinessSettingScreen;
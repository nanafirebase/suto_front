import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
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
import { useFocusEffect } from '@react-navigation/native';
import PackageCard from '../../../components/ui/cards/PackageCard';
import { formatCurrency } from '../../../utils/constants/Currency';
import PaymentModal from '../../../components/PaymentModal';
import { OTPMeta } from '../../../utils/types/store.type';

const { width } = Dimensions.get("window")

const CARD_WIDTH = width * 0.8
const CARD_SPACING = 16

type TPaymentMethod = 'mtn' | 'vod' | 'atl'

type TSelectPackageScreen = NativeStackScreenProps<BusinessStackList, "SelectPackageScreen">
const SelectPackageScreen = ({navigation, route}: TSelectPackageScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { session, userData, showPaymentModal, showOTPAlert, otpAlert } = useAppContainer()
    const { formOneData } = route.params

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [packages, setPackages] = useState([])
    const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>('mtn')
    const [paymentDuration, setPaymentDuration] = useState<1|6|12>(1)
    const [selectedPackage, setSelectedPackage] = useState({id: null, name: '', price: 0})

    const [accountNumber, setAccountNumber] = useState('')
    // const [accountNumber, setAccountNumber] = useState(userData?.phone || '')
    const [loading, setLoading] = useState<boolean>(false)

    const fetchPackages = async () => {
        SocketIO.emit('fetch-all-packages' , { sessionID: session }, (response: any) => {
            if (response.status === "success") {
                setPackages(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching packages", response.message)
            }
        })
    }

    // const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
    const flatListRef = useRef<FlatList>(null)

    useEffect(()=> {
        // console.log(userData?.email)
        fetchPackages()
    }, [])

    const bottomSheetRefPay = useRef<BottomSheet>(null)
    const snapPointsPay = useMemo(() => ["60%", "75%", "90%"], [0])

    const chosenPackage = (id:any, name:string, price: number) => {
        setSelectedPackage({id: id, name: name, price: price})
        bottomSheetRefPay.current?.snapToIndex(1)
    }

    const verifyCustomer = async (code:string, meta: OTPMeta) => {
        try {
            setLoading(true)
            if (!meta.businessID || !meta.refNumber || !meta.sessionID || !code) {
                Alert.alert("Error", "Some fields are required")
            }
            SocketIO.emit('verify-cus' , { sessionID: meta.sessionID, businessID: meta.businessID, referenceNumber: meta.refNumber, otpCode: code}, (response: any) => {
                console.log(response)
                if (response.status === "success") {
                    showPaymentModal({visibility: true, refNumber: response.data.referenceNumber, businessID: formOneData.businessID, sessionID: session})
                    setLoading(false)
                } else {
                    Alert.alert("Error", response.message || "Error verifying")
                    setLoading(false)
                }
            }) 
        } catch (error) {
            Alert.alert("Error", "Error verifying")
            setLoading(false)
        }
    }

    const makePayment = async () => {
        if (!formOneData.businessID || !selectedPackage.id || !userData?.email) {
            Alert.alert('Error', 'Missing required details')
            return
        }

        setLoading(true)

        SocketIO.emit('purchase-package' , { sessionID: session, businessID: formOneData.businessID,
            packageID: selectedPackage.id, customerEmail: userData?.email, accountNumber: accountNumber,
            paymentMethod: paymentMethod, paymentDuration: paymentDuration
        }, (response: any) => {
            if (response.status === "success") {
                if (response.data.status === "send_otp") {
                    showOTPAlert({ visibility: true, refNumber: response.data.referenceNumber, businessID: formOneData.businessID, sessionID: session, onSubmit: verifyCustomer})
                    setLoading(false)
                } else {
                    showPaymentModal({visibility: true, refNumber: response.data.referenceNumber, businessID: formOneData.businessID, sessionID: session})
                    setLoading(false)
                }
            } else {
                Alert.alert("Error", response.message || "An error occured")
                setLoading(false)
            }
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 10, paddingBottom: Platform.OS === "ios" ? 20 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    {isSearchVisible ? ( <View style={styles.searchHeaderContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => { setIsSearchVisible(false); setSearchQuery('') }}>
                            <IconSymbol name="arrow.left" size={22} color={themeColors.text} />
                        </TouchableOpacity>
                        <View style={[ styles.searchInputContainer, { backgroundColor: themeColors.inputBackground } ]} >
                            <IconSymbol name="magnifyingglass" size={18} color={themeColors.subtleText} />
                            <TextInput
                                style={[styles.searchInputField, { color: themeColors.text }]}
                                placeholder="Search for a package"
                                placeholderTextColor={themeColors.subtleText}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                    </View> ) : (
                        <>
                            <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                            </TouchableOpacity>
                            <ThemedText style={styles.headerTitle}>Choose Your Plan</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} onPress={() => setIsSearchVisible(true)} >
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{ paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: themeColors.border}}>
                            <ThemedText style={{fontFamily: 'SemiBold', fontSize: 15, color: themeColors.text}}>Choose the perfect plan for your business</ThemedText>
                            <ThemedText style={{fontFamily: 'Regular', fontSize: 13, color: themeColors.subtleText}}>Cancel anytime. No hidden fees</ThemedText>
                        </View>
                        <FlatList
                            ref={flatListRef}
                            data={packages}
                            horizontal
                            pagingEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={CARD_WIDTH + CARD_SPACING}
                            decelerationRate="fast"
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => <PackageCard item={item} onPress={(selected:any) => chosenPackage(selected.id, selected.name, Number(selected.price))} />}
                            contentContainerStyle={{ paddingHorizontal: 16, marginTop: 20 }}
                        />
                    </ScrollView>
                    <BottomSheet ref={bottomSheetRefPay} index={-1} snapPoints={snapPointsPay} enablePanDownToClose={!loading} backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                        <ThemedText style={{fontFamily:'SemiBold',fontSize:20,marginBottom:20,textAlign:'center',marginTop:10}}>{selectedPackage.name} Plan Payment</ThemedText>
                        <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                            <View style={{flex: 1}}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                    {[{key: 1,value:'Month x 1'},{key: 6,value:'Month x 6'},{key: 12,value:'Month x 12'}].map((item:any)=> (
                                        <TouchableOpacity onPress={()=> setPaymentDuration(item.key)} style={{height: 50, width: '32%', backgroundColor: paymentDuration === item.key ? themeColors.success : themeColors.border, justifyContent: 'center', alignItems: 'center'}} key={item.key}>
                                            <ThemedText style={{fontFamily: 'SemiBold', fontSize: 14,color: paymentDuration === item.key ? themeColors.white : themeColors.text }}>{item.value}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 7}}>
                                    {[{key: 'mtn',value:'MTN'},{key: 'atl',value:'AirtelTigo'},{key: 'vod',value:'Telecel'}].map((item:any)=> (
                                        <TouchableOpacity onPress={()=> setPaymentMethod(item.key)} style={{height: 50, width: '32%', backgroundColor: paymentMethod === item.key ? themeColors.success : themeColors.border, justifyContent: 'center', alignItems: 'center'}} key={item.key}>
                                            <ThemedText style={{fontFamily: 'SemiBold', fontSize: 14,color: paymentMethod === item.key ? themeColors.white : themeColors.text }}>{item.value}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={{...styles.section, marginTop: 15}}>
                                    <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Account Number ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                    <TextInput
                                        style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                        value={accountNumber}
                                        onChangeText={setAccountNumber}
                                        placeholder="Enter phone number"
                                        placeholderTextColor={themeColors.subtleText}
                                        keyboardType='number-pad'
                                    />
                                </View>
                                <TouchableOpacity style={[styles.button, { marginTop: 15, backgroundColor: (!selectedPackage.id || loading) ? themeColors.border : themeColors.success}]}
                                    onPress={makePayment} disabled={!selectedPackage.id || loading} activeOpacity={0.8}>
                                    <ThemedText style={styles.buttonText}>
                                        {loading ? 'Processing' : `Pay ( ${formatCurrency(Number(selectedPackage.price) * paymentDuration - (paymentDuration === 1 ? 0 : Number(selectedPackage.price *0.15)))} )`}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    backButtonMain: {
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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: Typography.heading1,
        fontFamily: "Bold"
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.small,
    },
    searchHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 0,
    },
    backButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.medium,
        width: 40,
        height: 40,
        flexShrink: 0,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.medium,
        borderRadius: Borders.radiusMedium,
    },
    searchInputField: {
        flex: 1,
        fontSize: Typography.body,
        marginLeft: Spacing.small,
        fontFamily: 'Regular',
        paddingVertical: 12
    },
    tabContent: {
        flex: 1,
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

export default SelectPackageScreen;

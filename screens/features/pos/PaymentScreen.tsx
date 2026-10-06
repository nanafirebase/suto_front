import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
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
import { generateId, SocketIO } from '../../../configuration/helpers/main.helpers';
import { formatCurrency } from '../../../utils/constants/Currency';
import CustomSelect from '../../../components/CustomSelect';

type TPaymentScreen = NativeStackScreenProps<POSNavigationList, "PaymentScreen">
const PaymentScreen = ({navigation, route}: TPaymentScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, businessCurrency, userData, userBranch } = useAppContainer();
    const { data } = route.params
    const [mode, setMode] = useState<'cash'|'momo'>("cash")
    const [paymentAction, setPaymentAction] = useState<'request'|'record'>("record")
    const [network, setNetwork] = useState("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [amount, setAmount] = useState<string>("")

    const clearForm = () => {
        setMode('cash')
        setPaymentAction('record')
        setNetwork('')
        setPhoneNumber('')
        setAmount('')
        Alert.alert(
            "All Done here",
            "What would you like to do?",
            [
                {
                    text:"Record New Sale",
                    onPress:() => {
                        navigation.navigate('NewSaleScreen')
                    }
                },
                {
                    text:"Cancel",
                    style:"cancel",
                    onPress:() => navigation.navigate('SaleListScreen')
                }
            ],
            { cancelable:true }
        )
    }

    const recordPaymentFunction = async () => {
        // const grandTotal = Number(data.subtotal || 0) + Number(data.totalTax || 0)
        let formData: any = {
            saleID: data.sale_id, paymentMode: mode, amount: amount, branchID: userBranch.id ?? null,
            sessionID: session, businessID: selectedBusiness.id, type: 'sales'
        }
        if (mode === "momo") {
            formData.network = network
            formData.phoneNumber = phoneNumber
        }
        SocketIO.emit('record-transaction', formData, (response: any) => {
            // console.log(response)
            if (response.status === "success") {
                Alert.alert("Success", response.message)
                clearForm()
            } else {
                Alert.alert("Error", response.message || "Failed to record transaction", [
                    { text: "Retry", onPress: () => recordPaymentFunction() },
                    { text: "Cancel", style: "cancel" },
                ],
                { cancelable: true })
            }
        })
    }

    const confirmPayment = () => {
        Alert.alert("Confirm Payment", mode === "momo"
            ? "Confirm that the customer has completed the Mobile Money payment and you have verified the amount before recording."
            : "Confirm that you have received the cash payment.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: () => recordPaymentFunction()
                }
            ]
        )
    }

    const requestPaymentFunction = async () => {
        Alert.alert("Payment", "Payment request is unavailable. Instruct the customer to pay via their mobile money menu (e.g. *170#), then record the payment after confirmation.")
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} /> )}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Record Payment</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.medium,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{paddingHorizontal: Spacing.medium, backgroundColor: themeColors.card, paddingVertical: Spacing.large, borderRadius: Borders.radiusMedium}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.small}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>Customer</Text>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>{data.customer.name}</Text>
                            </View>
                        </View>
                        <View style={{paddingHorizontal: Spacing.medium, backgroundColor: themeColors.card, paddingVertical: Spacing.large, borderRadius: Borders.radiusMedium, marginTop: 6}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.small}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.text}}>Sub Total</Text>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.text}}>{formatCurrency(data.subtotal || 0, { symbol: businessCurrency.symbol })}</Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.small, borderTopWidth: 1, borderTopColor: themeColors.border}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.text}}>
                                    Taxes
                                </Text>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.warning}}>
                                    + {formatCurrency(data.totalTax || 0, { symbol: businessCurrency.symbol })}
                                </Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.small, borderTopWidth: 1, borderTopColor: themeColors.border}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.text}}>
                                    Discount
                                </Text>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.warning}}>
                                    - {formatCurrency(data.discount || 0, { symbol: businessCurrency.symbol })}
                                </Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.small, borderTopWidth: 1, borderTopColor: themeColors.border}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.text}}>
                                    Total Paid
                                </Text>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.warning}}>
                                    - {formatCurrency(data.totalPaid || 0, { symbol: businessCurrency.symbol })}
                                </Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: themeColors.border, paddingVertical: Spacing.small}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 17, color: themeColors.text}}>Total Expected Payment</Text>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 17, color: themeColors.text}}>{formatCurrency((Number(data.subtotal || 0) + Number(data.totalTax || 0)) - Number(data.totalPaid || 0), { symbol: businessCurrency.symbol })}</Text>
                            </View>
                        </View>
                        <View style={{paddingHorizontal: Spacing.medium, backgroundColor: themeColors.card, paddingVertical: Spacing.large, borderRadius: Borders.radiusMedium, marginTop: 6}}>
                            <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>Select payment mode</Text>
                            <Text style={{fontFamily: 'Regular', fontSize: 12, color: themeColors.info, marginTop: 5, marginBottom: 7}}>Select the method the customer will use to pay (cash or mobile money)</Text>
                            <TouchableOpacity onPress={()=> setMode('cash')} style={{paddingVertical: Spacing.sectionGap, borderRadius: Borders.radiusMedium, marginVertical: 5, borderWidth: 1, paddingHorizontal: 10, borderColor: mode === "cash" ? themeColors.info : themeColors.border}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>Cash</Text>
                                <Text style={{fontFamily: 'Regular', fontSize: 12, color: themeColors.subtleText, marginTop: 4}}>Pay with physical cash. Confirm once received</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={()=> setMode('momo')} style={{paddingVertical: Spacing.sectionGap, borderRadius: Borders.radiusMedium, marginVertical: 5, borderWidth: 1, paddingHorizontal: 10, borderColor: mode === "momo" ? themeColors.info : themeColors.border}}>
                                <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>Mobile Money</Text>
                                <Text style={{fontFamily: 'Regular', fontSize: 12, color: themeColors.subtleText, marginTop: 4}}>Pay via Mobile Money (MTN, Telecel, AirtelTigo)</Text>
                            </TouchableOpacity>
                            {mode === "momo" ? (
                                <>
                                    <CustomSelect title='Network' placeholder="Select network" required={true} onSelect={(mode:any)=> setNetwork(mode)} options={['MTN', 'TELECEL', 'AIRTELTIGO']} />
                                    <View style={{ width: '100%', marginTop: 15 }}>
                                        <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Phone Number ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                        <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} placeholder="059********0" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="number-pad" placeholderTextColor={themeColors.subtleText}/>
                                    </View>
                                </>
                            ) : null}
                            {mode === "cash" ? (
                                <>
                                    <View style={{ width: '100%', marginTop: 5 }}>
                                        <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Amount Received ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                        <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} placeholder={formatCurrency((Number(data.subtotal || 0) + Number(data.totalTax || 0)) - Number(data.totalPaid || 0), { symbol: businessCurrency.symbol })} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholderTextColor={themeColors.subtleText}/>
                                    </View>
                                </>
                            ) : null}
                        </View>

                        {mode === "momo" ? (<View style={{paddingHorizontal: Spacing.medium, backgroundColor: themeColors.card, paddingVertical: Spacing.large, borderRadius: Borders.radiusMedium, marginTop: 6}}>
                            <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>Payment Action</Text>
                            <Text style={{fontFamily: 'Regular', fontSize: 12, color: themeColors.info, marginTop: 5, marginBottom: 7}}>Are you recording already made payment or requesting for payment</Text>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <TouchableOpacity onPress={()=> setPaymentAction('record')} style={{paddingVertical: Spacing.sectionGap, width: '49%', borderRadius: Borders.radiusMedium, marginVertical: 5, borderWidth: 1, paddingHorizontal: 10, borderColor: paymentAction === "record" ? themeColors.info : themeColors.border}}>
                                    <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>Record</Text>
                                    <Text style={{fontFamily: 'Regular', fontSize: 12, color: themeColors.subtleText, marginTop: 4}}>Confirm payment already received (cash or external)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={()=> setPaymentAction('request')} style={{paddingVertical: Spacing.sectionGap, width: '49%', borderRadius: Borders.radiusMedium, marginVertical: 5, borderWidth: 1, paddingHorizontal: 10, borderColor: paymentAction === "request" ? themeColors.info : themeColors.border}}>
                                    <Text style={{fontFamily: 'SemiBold', fontSize: 14, color: themeColors.text}}>Request</Text>
                                    <Text style={{fontFamily: 'Regular', fontSize: 12, color: themeColors.subtleText, marginTop: 4}}>Send Mobile Money request to customer for payment</Text>
                                </TouchableOpacity>
                            </View>
                            {paymentAction === "record" ? (
                                <>
                                    <View style={{ width: '100%', marginTop: 15 }}>
                                        <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Amount Received ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                        <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} placeholder={formatCurrency((Number(data.subtotal || 0) + Number(data.totalTax || 0)) - Number(data.totalPaid || 0), { symbol: businessCurrency.symbol })} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholderTextColor={themeColors.subtleText}/>
                                    </View>
                                </>
                            ) : null}
                            {paymentAction === "request" ? (
                                <>
                                    <View style={{ width: '100%', marginTop: 15 }}>
                                        <ThemedText style={{...styles.sectionTitle,color:themeColors.subtleText}}>Request Amount ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                        <TextInput style={[styles.input,{backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text}]} placeholder={formatCurrency((Number(data.subtotal || 0) + Number(data.totalTax || 0)) - Number(data.totalPaid || 0), { symbol: businessCurrency.symbol })} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholderTextColor={themeColors.subtleText}/>
                                    </View>
                                </>
                            ) : null}
                        </View>) : null}
                        <TouchableOpacity style={[styles.button, { marginTop: 20, backgroundColor: !(Number(data.subtotal || 0) + Number(data.totalTax || 0)) ? themeColors.border : themeColors.success}]}
                            onPress={()=> {paymentAction === "record" ? confirmPayment() : requestPaymentFunction()}} disabled={!(Number(data.subtotal || 0) + Number(data.totalTax || 0))} activeOpacity={0.8}>
                            <ThemedText style={styles.buttonText}>
                                {paymentAction === "record" ? 'Record' : "Request"} Payment
                            </ThemedText>
                        </TouchableOpacity>
                    </ScrollView>
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
        paddingBottom: 200
    },
    contentContainer: {
        padding: Spacing.screenPadding,
        paddingTop: 0,
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

export default PaymentScreen;

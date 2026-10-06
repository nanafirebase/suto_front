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
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';

type FormState = {
    country: BottomSheetSelectOption | null
}

type TManufacturerFormScreen = NativeStackScreenProps<InventoryNavigationList, "ManufacturerFormScreen">

const ManufacturerFormScreen = ({navigation, route}: TManufacturerFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { data } = route.params || {};
    const { session, selectedBusiness } = useAppContainer();

    const [name, setName] = useState(data?.name || '');
    const [code, setCode] = useState(data?.code || '');
    const [phone, setPhone] = useState(data?.phone || '');
    const [email, setEmail] = useState(data?.email || '');
    const [contactPersonName, setContactPersonName] = useState(data?.contactPersonName || '');
    const [contactPersonPhone, setContactPersonPhone] = useState(data?.contactPersonPhone || '');
    const [contactPersonEmail, setContactPersonEmail] = useState(data?.contactPersonEmail || '');
    const [contactPersonRole, setContactPersonRole] = useState(data?.contactPersonRole || '');
    const [notes, setNotes] = useState(data?.notes || '');
    const [countryList, setCountryList] = useState<any[]>([])
    
    const [form, setForm] = useState<FormState>({ country: null });
    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState<string>('');
    const [activeField, setActiveField] = useState<keyof FormState | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "50%", "75%"], []);

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

    const handleSave = () => {
        if(!name) {
            Alert.alert("Note", "Manufacturer Name is required")
            return
        }
        const formData = {
            name, code, phone, email, contactPersonName, contactPersonPhone, contactPersonEmail, contactPersonRole, notes,
            country: form.country?.key, sessionID: session, businessID:selectedBusiness.id, hiddenID:data?.id
        }
        SocketIO.emit('add-update-manufacturer', formData, (res:any) => {
            if(res.status==='success') Alert.alert('Success', res.message)
            else Alert.alert('Error', res.message || 'Failed') 
        })
    }

    return (
        <View style={[styles.container,{ backgroundColor:themeColors.background }]}>
            {Platform.OS==='android' && <View style={{ height:10, backgroundColor: themeColors.background }}/>}
            <View style={[styles.safeArea,{ paddingTop: Platform.OS==='ios'?insets.top:0, paddingBottom: Platform.OS==='ios'?85:0 }]}>
                <ThemedView style={[styles.header,{ backgroundColor:themeColors.background, borderBottomColor:themeColors.border }]}>
                    <TouchableOpacity onPress={()=>navigation.goBack()} style={[styles.backButtonMain,{ backgroundColor:themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon}/>
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Manufacturer Form</ThemedText>
                    <View style={{ width:36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'}>
                    <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:Spacing.screenPadding, paddingBottom: insets.bottom+100 }} showsVerticalScrollIndicator={false}>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Name *</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={name} onChangeText={setName} placeholder="Manufacturer Name" placeholderTextColor={themeColors.subtleText}/></View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Code ( <Text style={{fontFamily: 'Regular', fontSize: 11, color: themeColors.error}}>Please leave blank to auto generate.</Text> )</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={code} onChangeText={setCode} placeholder="Code" placeholderTextColor={themeColors.subtleText}/></View>
                        <View style={{ marginBottom:3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Country</ThemedText>
                            <TouchableOpacity style={[styles.input,{justifyContent:'center',backgroundColor:themeColors.inputBackground,borderColor:themeColors.border}]} onPress={()=>openBottomSheet('country', countryList, 'Select Country')}>
                                <Text style={{color:form.country?themeColors.text:themeColors.subtleText,fontSize:Typography.small}}>{form.country?.value||'Select Country'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Phone</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={themeColors.subtleText} keyboardType="phone-pad"/></View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Email</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={themeColors.subtleText} keyboardType="email-address"/></View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Contact Person Name</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={contactPersonName} onChangeText={setContactPersonName} placeholder="Contact Name" placeholderTextColor={themeColors.subtleText}/></View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Contact Person Phone</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={contactPersonPhone} onChangeText={setContactPersonPhone} placeholder="Contact Phone" placeholderTextColor={themeColors.subtleText} keyboardType="phone-pad"/></View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Contact Person Email</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={contactPersonEmail} onChangeText={setContactPersonEmail} placeholder="Contact Email" placeholderTextColor={themeColors.subtleText} keyboardType="email-address"/></View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Contact Person Role</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text }]} value={contactPersonRole} onChangeText={setContactPersonRole} placeholder="Role" placeholderTextColor={themeColors.subtleText}/></View>
                        <View style={{ marginBottom:3 }}><ThemedText style={{...styles.label,color:themeColors.subtleText}}>Notes</ThemedText><TextInput style={[styles.input,{ backgroundColor:themeColors.inputBackground,borderColor:themeColors.border,color:themeColors.text, height:120,textAlignVertical:'top' }]} value={notes} onChangeText={setNotes} placeholder="Notes" placeholderTextColor={themeColors.subtleText} multiline/></View>
                    </ScrollView>
                    <View style={{ padding:Spacing.screenPadding, borderTopWidth:1, borderTopColor:themeColors.border, backgroundColor:themeColors.background }}>
                        <TouchableOpacity style={{ paddingVertical:Spacing.large, borderRadius:Borders.radiusSmall, alignItems:'center', backgroundColor:name?themeColors.primary:themeColors.border }} onPress={handleSave} disabled={!name}>
                            <ThemedText style={{ color:'#fff', fontSize:Typography.body, fontFamily:'SemiBold' }}>Save Manufacturer</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                        <ThemedText style={{fontFamily:'SemiBold',fontSize:20,marginBottom:20,textAlign:'center',marginTop:10}}>{sheetTitle||'Select Option'}</ThemedText>
                        <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                            {sheetOptions.map(option=>(
                                <TouchableOpacity key={option.key} style={{padding:20,backgroundColor:themeColors.card,borderRadius:5,marginBottom:5}} onPress={()=>selectOption({key:option.key,value:option.value})}>
                                    <Text style={{fontSize:Typography.body,color:themeColors.text,fontFamily:'Medium'}}>{option.value}</Text>
                                </TouchableOpacity>
                            ))}
                        </BottomSheetScrollView>
                    </BottomSheet>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{ flex:1 },
    safeArea:{ flex:1 },
    header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.screenPadding, paddingVertical:Spacing.medium, borderBottomWidth:1 },
    backButtonMain:{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
    headerTitle:{ fontSize:Typography.heading2, fontFamily:'SemiBold' },
    label:{ fontSize:Typography.body, fontFamily:'Medium', marginBottom:3 },
    input:{ borderWidth:1, borderRadius:Borders.radiusSmall, paddingHorizontal:Spacing.medium, paddingVertical:Spacing.large, fontSize:Typography.small, marginBottom:Spacing.small, fontFamily:'Regular' },
});

export default ManufacturerFormScreen;

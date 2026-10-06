import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, HomeNavigationList, HRMNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { agreeOptions, bloodGroups, genderOptions } from '../../../configuration/data/System';
 
import CustomSelect from '../../../components/CustomSelect';

type FormState = {
    business: BottomSheetSelectOption | null;
    employee: BottomSheetSelectOption | null;
    isFit: BottomSheetSelectOption | null;
    bloodGroup: BottomSheetSelectOption | null;
}

type TMedicalFormScreen = NativeStackScreenProps<HRMNavigationList, "MedicalFormScreen">
const MedicalFormScreen = ({navigation}: TMedicalFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [form, setForm] = useState<FormState>({
        business: null,
        employee: null,
        isFit: null,
        bloodGroup: null
    })
    const [date, setDate] = useState(new Date())

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([])
    const [sheetTitle, setSheetTitle] = useState<string>('')
    const [activeField, setActiveField] = useState<string | null>(null)

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["25%", "50%"], [])

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

    const handleSave = async () => {
        console.log(form)
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Medical Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        {/* <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Business</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('business', businesses, 'Select Business')}>
                                <Text style={{ color: form.business ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.business?.value || 'Select Business'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Employee</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('employee', employees, 'Select Employee')}>
                                <Text style={{ color: form.employee ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.employee?.value || 'Select Employee'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Date of Examination</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => {}}>
                                <Text style={{ color: date ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {'Select Date'}
                                </Text>
                            </TouchableOpacity>
                        </View> */}
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Hospital Name</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text
                                }]}
                                placeholder="Enter hospital name"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Doctor's Name</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text
                                }]}
                                placeholder="Enter doctor's name"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Blood Group</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('bloodGroup', bloodGroups, 'Select blood group')}>
                                <Text style={{ color: form.bloodGroup ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.bloodGroup?.value || 'Select blood group'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Vision</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text
                                }]}
                                placeholder="Vision"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Hearing</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text
                                }]}
                                placeholder="Hearing"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Hepatitis</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text
                                }]}
                                placeholder="Hepatitis"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Fit to Work?</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('isFit', agreeOptions, 'Is Employee Fit to Work?')}>
                                <Text style={{ color: form.employee ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.isFit?.value || 'Select'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: (!form.employee) ? themeColors.border : themeColors.primary}]}
                            onPress={handleSave} disabled={!form.employee} activeOpacity={0.8}
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

export default MedicalFormScreen;

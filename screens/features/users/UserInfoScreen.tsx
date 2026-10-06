import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, UserNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

type FormState = {
    role: BottomSheetSelectOption | null
    branch: BottomSheetSelectOption | null
}

type TUserInfoScreen = NativeStackScreenProps<UserNavigationList, "UserInfoScreen">
const UserInfoScreen = ({navigation, route}: TUserInfoScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, userBranch } = useAppContainer()
    const { data } = route.params

    const [branches, setBranches] = useState<any[]>([])
    const [roles, setRoles] = useState<any[]>([])
    const [name, setName] = useState(data.full_name || '')
    const [allowEditing, setAllowEditing] = useState(false)

    const [form, setForm] = useState<FormState>({
        role: null,
        branch: null
    })

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

    const fetchRoles = async () => {
        SocketIO.emit('fetch-roles' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name}`
                }))
                setRoles(simplified)
            } else {
                Alert.alert("Error", "Error fetching roles", response.message)
            }
        })
    }

    const fetchLocations = async () => {
        SocketIO.emit('fetch-locations' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name}`
                }))
                setBranches(simplified)
            } else {
                Alert.alert("Error", "Error fetching locations", response.message)
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchRoles()
            fetchLocations()
        }, [])
    );
    

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />
            )}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>User Information</ThemedText>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground }]} onPress={() => setAllowEditing(!allowEditing)}>
                        {allowEditing ? <IconSymbol name="lock.open" size={22} color={themeColors.icon} /> : <IconSymbol name="lock" size={22} color={themeColors.icon} />}
                    </TouchableOpacity>
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.screenPadding,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{ marginBottom: 3 }}>
                            <ThemedText style={{...styles.label,color:themeColors.subtleText}}>Full Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor:themeColors.inputBackground, borderColor:themeColors.border, color:themeColors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Full Name"
                                placeholderTextColor={themeColors.subtleText}
                                editable={allowEditing}
                            />
                        </View>
                        {/* <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Branch ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('branch', branches, 'Select Branch')}>
                                <Text style={{ color: form.branch ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.branch?.value || 'Select Branch'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Role ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('role', roles, 'Select Role')}>
                                <Text style={{ color: form.role ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.role?.value || 'Select role'}
                                </Text>
                            </TouchableOpacity>
                        </View> */}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
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
    label:{ fontSize:Typography.body, fontFamily:'Medium', marginBottom:3 },
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.small },
})

export default UserInfoScreen;

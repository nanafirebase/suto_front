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
    grade: BottomSheetSelectOption | null
    branch: BottomSheetSelectOption | null
}

type TUserAccessScreen = NativeStackScreenProps<UserNavigationList, "UserAccessScreen">
const UserAccessScreen = ({navigation}: TUserAccessScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [branches, setBranches] = useState<any[]>([])
    const [roles, setRoles] = useState<any[]>([])
    const [grades, setGrades] = useState<any[]>([])
    const [username, setUsername] = useState('')

    const [form, setForm] = useState<FormState>({
        role: null,
        branch: null,
        grade: null,
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

    const fetchGrade = async () => {
        SocketIO.emit('fetch-grades' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: `${item.name}`
                }))
                setGrades(simplified)
            } else {
                Alert.alert("Error", "Error fetching grades", response.message)
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

    const handleSave = async () => {
        if (!form.branch || !form.role || !username || !selectedBusiness.id) {
            Alert.alert("Note", "Some fields are required\nPlease complete form")
            return
        }
        const formData = {
            phoneOrEmail: username, role_id: form.role.key, grade_id: form.grade?.key, branchID: form.branch.key, sessionID: session, businessID: selectedBusiness.id,
        }
        SocketIO.emit('invite-business-user', formData, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", `${response.message}`, [
                    { text: "Done", style: "cancel", onPress: ()=> navigation.goBack() },
                ],
                { cancelable: true })
            } else {
                Alert.alert("Error", response.message || "Failed to invite user", [
                    { text: "Retry", onPress: () => handleSave() },
                    { text: "Cancel", style: "cancel" },
                ],
                { cancelable: true })
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchRoles()
            fetchLocations()
            fetchGrade()
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
                    <ThemedText style={styles.headerTitle}>Add User</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{padding:Spacing.screenPadding,paddingBottom:insets.bottom+100,paddingTop:10}} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Email address or Phone number ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Email / Phone"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>
                        <View style={styles.section}>
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
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Grade</ThemedText>
                            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('grade', grades, 'Select Grade')}>
                                <Text style={{ color: form.grade ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.grade?.value || 'Select Grade'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View
                            style={[
                                styles.warningContainer,
                                {
                                    backgroundColor: isDark ? '#2A1F00' : '#FFF8E6',
                                    borderColor: '#E6B800',
                                },
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <IconSymbol
                                    name="warn"
                                    size={18}
                                    color="#E6B800"
                                />

                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <ThemedText
                                        style={[
                                            styles.warningTitle,
                                            { color: isDark ? '#FFD866' : '#8A5A00' },
                                        ]}
                                    >
                                        Important Access Notice
                                    </ThemedText>

                                    <ThemedText
                                        style={[
                                            styles.warningText,
                                            { color: themeColors.text },
                                        ]}
                                    >
                                        You are granting access to sensitive business system.
                                        Please carefully verify the email address or phone number before
                                        submitting. Granting access to the wrong person may expose
                                        confidential business information and operations.
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <View style={{ padding:Spacing.screenPadding, borderTopWidth:1, borderTopColor:themeColors.border, backgroundColor:themeColors.background }}>
                        <TouchableOpacity style={{ paddingVertical:Spacing.large, borderRadius:Borders.radiusSmall, alignItems:'center', backgroundColor:username?themeColors.primary:themeColors.border }} onPress={handleSave} disabled={!username}>
                            <ThemedText style={{ color:'#fff', fontSize:Typography.body, fontFamily:'SemiBold' }}>Send Invite</ThemedText>
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
    warningContainer: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: Spacing.medium,
        marginTop: 4,
    },
    
    warningTitle: {
        fontSize: Typography.heading3,
        fontFamily: 'SemiBold',
        marginBottom: 4,
    },
    
    warningText: {
        fontSize: 11,
        lineHeight: 20,
        fontFamily: 'Regular',
    },
})

export default UserAccessScreen
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View, Switch } from 'react-native';
import { BottomSheetSelectOption, BusinessNavigationList, UserNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { shortenText, SocketIO } from '../../../configuration/helpers/main.helpers';
import { getData } from '../../../configuration/helpers/auth.helpers';

type PermissionValue = 'yes' | 'no';

type PermissionData = {
    value: PermissionValue
    source?: 'role'
}

type PermissionMap = {
    [group: string]: {
        [permission: `${string}_meta`|string]: PermissionData
    }
}

type FormState = {
    feature: BottomSheetSelectOption | null
}


type TRolePermissionScreen = NativeStackScreenProps<UserNavigationList, "RolePermissionScreen">
const RolePermissionScreen = ({navigation, route}: TRolePermissionScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, packageName } = useAppContainer()
    const { data } = route.params

    const [featureList, setFeatureList] = useState<any[]>([])
    const [permissionList, setPermissionList] = useState<any[]>([])
    const [rolePermissionList, setRolePermissionList] = useState<PermissionMap>({})
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState<FormState>({
        feature: null
    })

    const fetchPermissions = async () => {
        if (!packageName) return
        SocketIO.emit('fetch-privileges' , {sessionID: session, businessID: selectedBusiness.id, plan: packageName}, (response: any) => {
            if (response.status === "success") {
                const simplified = (response.data || []).map((item: any) => ({
                    key: item.name.toLowerCase(),
                    value: `${item.name || 'Name'}`
                }))
                setPermissionList(response.data || [])
                setFeatureList(simplified)
            } else {
                setPermissionList([])
            }
        })
    }

    const fetchRolePermissions = async () => {
        if (!data.id) return
        SocketIO.emit('role-privileges' , { sessionID: session, businessID: selectedBusiness.id, groupID: data.id }, (response: any) => {
            if (response.status === "success") {
                const normalized:any = {}
                Object.entries(response.data || {}).forEach(([key, value]) => {
                    normalized[key.toLowerCase()] = value
                })
                setRolePermissionList(normalized)
            } else {
                setRolePermissionList({})
            }
        })
    }

    useEffect(()=> {
        if (!data.id) return
        fetchPermissions()
        fetchRolePermissions()
    }, [data.id, form.feature])

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            feature: null
        }))
    }, [])

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

    const hasPermission = (group: string, perm: string) => {
        return rolePermissionList?.[group?.toLowerCase()]?.[`${perm}_meta`]?.value === 'yes'
    }

    const togglePermission = async (group: string, perm: string, enabled: boolean) => {
        if (!selectedBusiness.id || !perm) {
            Alert.alert('Error', "Invalid permission")
            return
        }
        if (perm === 'assignAllPrivileges' && enabled) {
            const groupData = permissionList.find((p: any) => p.name === group)
            if (!groupData) return
            groupData.columns.forEach((col: any) => {
                SocketIO.emit('insert-update-Privilege' , {sessionID: session, businessID: selectedBusiness.id,
                    groupID: data.id, privilegeName: col.name, value: enabled, category: form.feature?.value,
                    type: 'role'
                }, () => {})
            })

            const all:any = {}
            groupData?.columns.forEach((c:any) => {
                all[`${c.name}_meta`] = {
                    value: 'yes',
                    source: 'user'
                }
            })
            setRolePermissionList((prev:any) => ({
                ...prev,
                [group?.toLowerCase()]: all
            }))
            return
        }

        SocketIO.emit('insert-update-Privilege' , {sessionID: session, businessID: selectedBusiness.id,
            privilegeName: perm, value: enabled, category: form.feature?.value, groupID: data.id, type: 'role'
        }, (response: any) => {
            if (response.status === "success") {
                setRolePermissionList((prev:any) => ({
                    ...prev,
                    [group?.toLowerCase()]: {
                        ...prev[group?.toLowerCase()],
                        [`${perm}_meta`]: {
                            value: enabled ? 'yes' : 'no',
                            source: 'user'
                        }
                    }
                }))
            }
        })
    }

    const selectedPermissionGroup = useMemo(() => {
        if (!form.feature) return null
        return permissionList.find((group: any) => group.name.toLowerCase() === form.feature?.key)
    }, [form.feature, permissionList])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.navigate('RoleListScreen')} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{shortenText(data.name, 10)} Permissions</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        {permissionList.length > 0 && (
                            <View style={styles.section}>
                                <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>Feature ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => openBottomSheet('feature', featureList, 'Select Feature')}>
                                    <Text style={{ color: form.feature ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                        {form.feature?.value || 'Select permission'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ marginTop: 24 }}>
                            <ThemedText style={styles.groupTitle}>{selectedPermissionGroup?.title || ''}</ThemedText>
                            {selectedPermissionGroup && selectedPermissionGroup.columns.map((perm: any) => (
                                <View key={perm.name} style={{...styles.permissionRow, borderBottomColor: themeColors.border}}>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={{fontSize: 12, fontFamily: 'SemiBold'}}>{perm.title}</ThemedText>
                                        <ThemedText style={styles.desc}>{perm.description}</ThemedText>
                                    </View>
                                    <Switch value={hasPermission(selectedPermissionGroup.name, perm.name)} onValueChange={v => togglePermission(selectedPermissionGroup.name, perm.name, v) }  />
                                </View>
                            ))}
                        </View>
                    </ScrollView>
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
    groupTitle: { fontSize: 15, fontFamily: 'SemiBold' },
    permissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    desc: { fontSize: 11, opacity: 0.6, fontFamily: 'Regular' },
})

export default RolePermissionScreen;

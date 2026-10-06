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
import { agreeOptions, bloodGroups, genderOptions } from '../../../configuration/data/System';
import { getData, saveData } from '../../../configuration/helpers/auth.helpers';

type SalesTax = {
    id: string
    name: string
    percentage: number
    calculationType: 'simple' | 'compound'
    sortOrder: number
}

type TTaxScreen = NativeStackScreenProps<BusinessNavigationList, "TaxScreen">
const TaxScreen = ({navigation, route}: TTaxScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()

    const [name, setName] = useState('')
    const [percentage, setPercentage] = useState('')
    const [calculationType, setCalculationType] = useState<'simple' | 'compound'>('simple')
    const [taxes, setTaxes] = useState<SalesTax[]>([])
    const [editingTaxId, setEditingTaxId] = useState<string | null>(null)
    const [changedMade, setChangesMade] = useState(false)


    const handleSave = async () => {
        if (!taxes.length || !selectedBusiness.id) {
            Alert.alert("Note", "Some fields are required\nPlease complete form to continue")
            return
        }
        const key = `businessID_${selectedBusiness.id}`
        const saveResp = await saveData(key, taxes)
        if (saveResp) {
            Alert.alert('Tax', 'Tax submitted successfully')
            setChangesMade(false)
        }
    }

    const handleAddItem = () => {
        if (!name.trim() || !percentage) {
            Alert.alert("Error", "Enter a valid name and percentage")
            return
        }
        const percent = Number(percentage)
        if (isNaN(percent) || percent <= 0 || percent > 100) {
            Alert.alert("Error", "Invalid percentage")
            return
        }
        if (editingTaxId) {
            setTaxes(prev =>
                prev.map(t =>
                    t.id === editingTaxId
                        ? { ...t, name, percentage: percent, calculationType }
                        : t
                )
            )
            setEditingTaxId(null)
        } else {
            setTaxes(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    name,
                    percentage: percent,
                    calculationType,
                    sortOrder: prev.length
                }
            ])
        }
        setName('')
        setPercentage('')
        setCalculationType('simple')
        setChangesMade(true)
    }

    useEffect(() => {
        const loadTaxes = async () => {
            const data = await getData(`businessID_${selectedBusiness.id}`)
            setTaxes(data ?? [])
        }
        loadTaxes()
    }, [selectedBusiness.id])

    const handleDelete = (id: string) => {
        Alert.alert("Confirm", "Delete this tax?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => {
                    setTaxes(prev => prev.filter(t => t.id !== id))
                    setChangesMade(true);
                }
            }
        ])
    }

    const handleEdit = (tax: SalesTax) => {
        setName(tax.name)
        setPercentage(tax.percentage.toString())
        setCalculationType(tax.calculationType) // ✅ IMPORTANT
        setEditingTaxId(tax.id)
    }

    const moveUp = (index: number) => {
        if (index === 0) return
        const newTaxes = [...taxes]
        ;[newTaxes[index - 1], newTaxes[index]] = [newTaxes[index], newTaxes[index - 1]]
        setTaxes(newTaxes)
    }
    
    const moveDown = (index: number) => {
        if (index === taxes.length - 1) return
        const newTaxes = [...taxes]
        ;[newTaxes[index + 1], newTaxes[index]] = [newTaxes[index], newTaxes[index + 1]]
        setTaxes(newTaxes)
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Tax Management</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Tax Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter tax name"
                                placeholderTextColor={themeColors.subtleText}
                                autoCorrect={false}
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Percentage (%) ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input,{ backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={percentage}
                                onChangeText={setPercentage}
                                placeholder="12"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Calculation Type</ThemedText>
                            <View style={{ flexDirection: 'row', marginBottom: 10, justifyContent: 'space-between' }}>
                                <TouchableOpacity
                                    onPress={() => setCalculationType('simple')}
                                    style={{
                                        width: '49%',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 35,
                                        borderRadius: 5,
                                        backgroundColor: calculationType === 'simple' ? themeColors.primary : themeColors.border
                                    }}
                                >
                                    <ThemedText style={{ color: themeColors.white }}>Simple</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setCalculationType('compound')}
                                    style={{
                                        width: '49%',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 35,
                                        borderRadius: 5,
                                        backgroundColor: calculationType === 'compound' ? themeColors.primary : themeColors.border
                                    }}
                                >
                                    <ThemedText style={{ color: themeColors.white }}>Compound</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleAddItem} style={{width: 150, height: 40, borderRadius: 5, marginTop: 5, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end'}}>
                            <ThemedText style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.white}}>{editingTaxId ? 'Update' : 'Add'}</ThemedText>
                        </TouchableOpacity>
                        <View style={[styles.tableHeader, { borderBottomColor: themeColors.border, paddingVertical: Spacing.screenPadding, paddingHorizontal: 10 }]}>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Tax Name</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Type</Text>
                            <Text style={[styles.th, { flex: 1, color: themeColors.subtleText, fontFamily: 'SemiBold' }]}>Percentage</Text>
                            <View style={{ width: 120 }} />
                        </View>
                        <View style={{ marginTop: 0 }}>
                            {taxes.length > 0 ? taxes.map((item: any, index: number) => {
                                return (
                                    <View key={index} style={[styles.tableRowContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border } ]}>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text, paddingRight: 10 }]} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>{item.calculationType === 'compound' ? 'Compound' : 'Simple'}</Text>
                                            <Text style={[styles.td, { flex: 1, color: themeColors.text }]}>{item.percentage}%</Text>
                                            <View style={{ width: 120, flexDirection: 'row', alignItems: 'flex-end' }}>
                                                <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 15 }}>
                                                    <IconSymbol name="pencil" size={18} color={themeColors.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginRight: 15 }}>
                                                    <IconSymbol name="trash" size={18} color={themeColors.error} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => moveUp(index)} style={{ marginRight: 15 }}>
                                                    <IconSymbol name="arrow.up" size={18} color={themeColors.warning} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => moveDown(index)}>
                                                    <IconSymbol name="arrow.down" size={18} color={themeColors.warning} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )
                            }) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 10, marginBottom: 20, fontSize: 13}}>No tax added</ThemedText>}
                        </View>
                    </ScrollView>
                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: (!taxes.length || !changedMade) ? themeColors.border : themeColors.primary}]}
                            onPress={handleSave} disabled={!taxes.length || !changedMade} activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                Save / Update Record
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
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
        borderBottomWidth: 0.5,
        paddingHorizontal: 10
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
})

export default TaxScreen;

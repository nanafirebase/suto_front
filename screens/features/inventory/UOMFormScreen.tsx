import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type FormState = {
    category: BottomSheetSelectOption | null
}

const uomCategories: BottomSheetSelectOption[] = [
    { key: 'unit', value: 'Unit' },
    { key: 'weight', value: 'Weight' },
    { key: 'volume', value: 'Volume' },
]

type TUOMFormScreen = NativeStackScreenProps<InventoryNavigationList, "UOMFormScreen">

const UOMFormScreen = ({ navigation, route }: TUOMFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { data } = route.params;
    const { session, selectedBusiness } = useAppContainer();

    const [name, setName] = useState(data?.name || '');
    const [shortCode, setShortCode] = useState(data?.shortCode || '');

    const [form, setForm] = useState<FormState>({
        category: data?.category
            ? uomCategories.find(item => item.key === data.category) || null
            : null
    });

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState<string>('');
    const [activeField, setActiveField] = useState<string | null>(null);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "50%"], []);

    const openBottomSheet = (field: keyof typeof form, options: BottomSheetSelectOption[], title: string) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const selectOption = (option: BottomSheetSelectOption) => {
        if (activeField) {
            setForm(prev => ({ ...prev, [activeField]: option }));
        }
        bottomSheetRef.current?.close();
    };

    const handleSave = async () => {
        if (!name || !shortCode || !form.category) {
            Alert.alert("Note", "Please complete all required fields");
            return;
        }

        const formData = {
            name,
            shortCode,
            category: form.category.key,
            sessionID: session,
            businessID: selectedBusiness.id,
            hiddenID: data?.id
        };

        SocketIO.emit('add-update-uom', formData, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message);
                navigation.goBack();
            } else {
                Alert.alert("Error", response.message || "Failed to save UOM", [
                    { text: "Retry", onPress: () => handleSave() },
                    { text: "Cancel", style: "cancel" },
                ]);
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />
            )}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>UOM Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Name <Text style={{ color: themeColors.error }}>*</Text></ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                placeholder="Unit name (e.g Piece, Kilogram)"
                                placeholderTextColor={themeColors.subtleText}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Short Code <Text style={{ color: themeColors.error }}>*</Text></ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                placeholder="e.g pcs, kg, ltr"
                                placeholderTextColor={themeColors.subtleText}
                                value={shortCode}
                                onChangeText={setShortCode}
                            />
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{ ...styles.sectionTitle, color: themeColors.subtleText }}>Category <Text style={{ color: themeColors.error }}>*</Text></ThemedText>
                            <TouchableOpacity
                                style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}
                                onPress={() => openBottomSheet('category', uomCategories, 'Select UOM Category')}
                            >
                                <Text style={{ color: form.category ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                    {form.category?.value || 'Select Category'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: (!name || !shortCode || !form.category) ? themeColors.border : themeColors.primary }]}
                            onPress={handleSave}
                            disabled={!name || !shortCode || !form.category}
                        >
                            <ThemedText style={styles.buttonText}>Save Record</ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    handleIndicatorStyle={{ backgroundColor: themeColors.icon, marginTop: 10 }}
                    backgroundStyle={{ backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.info }}
                >
                    <ThemedText style={{ fontFamily: 'SemiBold', fontSize: 20, marginBottom: 20, textAlign: 'center', marginTop: 10 }}>
                        {sheetTitle || 'Select Option'}
                    </ThemedText>
                    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {sheetOptions.map(option => (
                            <TouchableOpacity key={option.key} style={{ padding: 20, backgroundColor: themeColors.card, borderRadius: 5, marginBottom: 5 }} onPress={() => selectOption(option)}>
                                <Text style={{ fontSize: Typography.body, color: themeColors.text, fontFamily: "Medium" }}>{option.value}</Text>
                            </TouchableOpacity>
                        ))}
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </View>
    );
};

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

export default UOMFormScreen;

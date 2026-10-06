import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type TPayAllowanceFormScreen = NativeStackScreenProps<PayrollNavigationList, "AllowanceFormScreen">

type AllowanceForm = {
    type: BottomSheetSelectOption | null
    stage: BottomSheetSelectOption | null
    isAutomatic: BottomSheetSelectOption | null
}

const PayAllowanceFormScreen = ({navigation, route}: TPayAllowanceFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { data } = route.params;
    const { session, selectedBusiness, businessCurrency } = useAppContainer();

    const [name, setName] = useState(data?.name || '');
    const [description, setDescription] = useState(data?.description || '');
    const [amount, setAmount] = useState(data?.amount ? String(data.amount) : '');

    const [form, setForm] = useState<AllowanceForm>({
        type: data?.type
            ? { key: data.type, value: data.type === 'percentage' ? 'Percentage' : 'Fixed Amount' }
            : { key: 'fixed', value: 'Fixed Amount' },

        stage: data?.stage
            ? { key: data.stage, value: data.stage === 'gross' ? 'Gross Salary' : 'Net Salary' }
            : { key: 'gross', value: 'Gross Salary' },

        isAutomatic: data?.isAutomatic
            ? { key: data.isAutomatic, value: data.isAutomatic === 'yes' ? 'Yes' : 'No' }
            : { key: 'no', value: 'No' }
    });

    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState('');
    const [activeField, setActiveField] = useState<string | null>(null);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%", "55%"], []);

    const typeOptions:BottomSheetSelectOption[] = [
        { key: 'fixed', value: 'Fixed Amount' },
        { key: 'percentage', value: 'Percentage' }
    ];

    const stageOptions:BottomSheetSelectOption[] = [
        { key: 'gross', value: 'Gross Salary' },
        { key: 'net', value: 'Net Salary' }
    ];

    const automaticOptions:BottomSheetSelectOption[] = [
        { key: 'no', value: 'No' },
        { key: 'yes', value: 'Yes' }
    ];

    const openBottomSheet = (field:string, options:BottomSheetSelectOption[], title:string) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const selectOption = (option:BottomSheetSelectOption) => {
        if (activeField) {
            setForm(prev => ({ ...prev, [activeField]: option }));
        }

        bottomSheetRef.current?.close();
    };

    const handleSave = async () => {
        if (!name || !amount || !selectedBusiness.id) {
            Alert.alert("Note", "Some fields are required\nPlease complete the form to continue");
            return;
        }

        const numericAmount = Number(amount);

        if (isNaN(numericAmount) || numericAmount < 0) {
            Alert.alert("Note", "Please enter a valid amount");
            return;
        }

        if (form.type?.key === 'percentage' && numericAmount > 100) {
            Alert.alert("Note", "Percentage cannot be greater than 100");
            return;
        }

        const formData = {
            name,
            description,
            type: form.type?.key,
            stage: form.stage?.key,
            amount: numericAmount,
            isAutomatic: form.isAutomatic?.key,
            sessionID: session,
            businessID: selectedBusiness.id,
            hiddenID: data?.id
        };

        SocketIO.emit('add-update-pay-allowance', formData, (response:any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message || "Allowance saved successfully", [
                    { text: "Done", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Error", response.message || "Failed to save allowance", [
                    { text: "Retry", onPress: () => handleSave() },
                    { text: "Cancel", style: "cancel" }
                ]);
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />
            )}

            <View style={[styles.safeArea, {
                backgroundColor: themeColors.background,
                paddingTop: Platform.OS === 'ios' ? insets.top : 0,
                paddingBottom: Platform.OS === "ios" ? 85 : 0
            }]}>
                <ThemedView style={[styles.header, {
                    backgroundColor: themeColors.background,
                    borderBottomColor: themeColors.border
                }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}
                    >
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Allowance Form
                    </ThemedText>

                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={{
                            padding: Spacing.screenPadding,
                            paddingBottom: insets.bottom + 100,
                            paddingTop: 10
                        }}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <View style={styles.section}>
                            <ThemedText style={{
                                ...styles.sectionTitle,
                                color: themeColors.subtleText
                            }}>
                                Allowance Name ( <Text style={{
                                    fontFamily: 'Italic',
                                    fontSize: 12,
                                    color: themeColors.error
                                }}>Required</Text> )
                            </ThemedText>

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text
                                }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Allowance name"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ width: '49%' }}>
                                <ThemedText style={{
                                    ...styles.sectionTitle,
                                    color: themeColors.subtleText
                                }}>
                                    Type
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, {
                                        justifyContent: 'center',
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border
                                    }]}
                                    onPress={() => openBottomSheet(
                                        'type',
                                        typeOptions,
                                        'Allowance Type'
                                    )}
                                >
                                    <Text style={{
                                        color: themeColors.text,
                                        fontSize: Typography.small
                                    }}>
                                        {form.type?.value}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ width: '49%' }}>
                                <ThemedText style={{
                                    ...styles.sectionTitle,
                                    color: themeColors.subtleText
                                }}>
                                    Amount {businessCurrency.code} ( <Text style={{
                                        fontFamily: 'Italic',
                                        fontSize: 12,
                                        color: themeColors.error
                                    }}>Required</Text> )
                                </ThemedText>

                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border,
                                        color: themeColors.text
                                    }]}
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder={form.type?.key === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                                    placeholderTextColor={themeColors.subtleText}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ width: '49%' }}>
                                <ThemedText style={{
                                    ...styles.sectionTitle,
                                    color: themeColors.subtleText
                                }}>
                                    Calculation Stage
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, {
                                        justifyContent: 'center',
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border
                                    }]}
                                    onPress={() => openBottomSheet(
                                        'stage',
                                        stageOptions,
                                        'Calculation Stage'
                                    )}
                                >
                                    <Text style={{
                                        color: themeColors.text,
                                        fontSize: Typography.small
                                    }}>
                                        {form.stage?.value}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ width: '49%' }}>
                                <ThemedText style={{
                                    ...styles.sectionTitle,
                                    color: themeColors.subtleText
                                }}>
                                    Automatic
                                </ThemedText>

                                <TouchableOpacity
                                    style={[styles.input, {
                                        justifyContent: 'center',
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border
                                    }]}
                                    onPress={() => openBottomSheet(
                                        'isAutomatic',
                                        automaticOptions,
                                        'Automatic Allowance'
                                    )}
                                >
                                    <Text style={{
                                        color: themeColors.text,
                                        fontSize: Typography.small
                                    }}>
                                        {form.isAutomatic?.value}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={{
                                ...styles.sectionTitle,
                                color: themeColors.subtleText
                            }}>
                                Description
                            </ThemedText>

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: themeColors.inputBackground,
                                    borderColor: themeColors.border,
                                    color: themeColors.text,
                                    height: 120,
                                    textAlignVertical: 'top'
                                }]}
                                multiline
                                placeholder="Description"
                                placeholderTextColor={themeColors.subtleText}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, {
                        backgroundColor: themeColors.background,
                        borderTopColor: themeColors.border
                    }]}>
                        <TouchableOpacity
                            style={[styles.button, {
                                backgroundColor: (!name || !amount)
                                    ? themeColors.border
                                    : themeColors.primary
                            }]}
                            onPress={handleSave}
                            disabled={!name || !amount}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                Save Record
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    enableContentPanningGesture
                    enableHandlePanningGesture
                    enableDynamicSizing={false}
                    handleIndicatorStyle={{
                        backgroundColor: themeColors.icon,
                        marginTop: 10
                    }}
                    backgroundStyle={{
                        backgroundColor: themeColors.background,
                        borderTopWidth: 1,
                        borderTopColor: themeColors.info
                    }}
                >
                    <ThemedText style={{
                        fontFamily: 'SemiBold',
                        fontSize: 20,
                        marginBottom: 20,
                        textAlign: 'center',
                        marginTop: 10
                    }}>
                        {sheetTitle || 'Select Option'}
                    </ThemedText>

                    <BottomSheetScrollView contentContainerStyle={{
                        paddingHorizontal: 16
                    }}>
                        {sheetOptions.map(option => (
                            <TouchableOpacity
                                key={option.key}
                                style={{
                                    padding: 20,
                                    backgroundColor: themeColors.card,
                                    borderRadius: 5,
                                    marginBottom: 5
                                }}
                                onPress={() => selectOption(option)}
                            >
                                <Text style={{
                                    fontSize: Typography.body,
                                    color: themeColors.text,
                                    fontFamily: "Medium"
                                }}>
                                    {option.value}
                                </Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
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
});

export default PayAllowanceFormScreen;
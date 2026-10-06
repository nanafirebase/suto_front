import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type TPayDeductionFormScreen = NativeStackScreenProps<PayrollNavigationList, "PayDeductionFormScreen">

const PayDeductionFormScreen = ({navigation, route}:TPayDeductionFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { selectedBusiness, session } = useAppContainer();
    const insets = useSafeAreaInsets();

    const hiddenID = route.params?.hiddenID;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<BottomSheetSelectOption | null>({
        key: 'fixed',
        value: 'Fixed Amount'
    });
    const [stage, setStage] = useState<BottomSheetSelectOption | null>({
        key: 'after_tax',
        value: 'After Tax'
    });
    const [amount, setAmount] = useState('');
    const [isAutomatic, setIsAutomatic] = useState<BottomSheetSelectOption | null>({
        key: 'no',
        value: 'No'
    });

    const [loading, setLoading] = useState(false);

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
        { key: 'before_tax', value: 'Before Tax' },
        { key: 'after_tax', value: 'After Tax' }
    ];

    const automaticOptions:BottomSheetSelectOption[] = [
        { key: 'no', value: 'No' },
        { key: 'yes', value: 'Yes' }
    ];

    const openBottomSheet = (
        field:string,
        options:BottomSheetSelectOption[],
        title:string
    ) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const selectOption = (option:BottomSheetSelectOption) => {
        if (activeField === 'type') {
            setType(option);
        }

        if (activeField === 'stage') {
            setStage(option);
        }

        if (activeField === 'isAutomatic') {
            setIsAutomatic(option);
        }

        bottomSheetRef.current?.close();
    };

    useEffect(() => {
        if (!hiddenID || !selectedBusiness.id) {
            return;
        }

        setLoading(true);

        SocketIO.emit(
            'pay-deduction',
            {
                businessID: selectedBusiness.id,
                sessionID: session,
                hiddenID
            },
            (response:any) => {
                setLoading(false);

                if (response.status !== 'success') {
                    Alert.alert(
                        'Error',
                        response.message || 'Failed to load deduction'
                    );
                    return;
                }

                const data = response.data?.[0];

                if (!data) {
                    Alert.alert('Error', 'Deduction not found');
                    return;
                }

                setName(data.name || '');
                setDescription(data.description || '');

                setType({
                    key: data.type,
                    value: data.type === 'percentage'
                        ? 'Percentage'
                        : 'Fixed Amount'
                });

                setStage({
                    key: data.stage,
                    value: data.stage === 'before_tax'
                        ? 'Before Tax'
                        : 'After Tax'
                });

                setAmount(
                    data.amount !== undefined && data.amount !== null
                        ? String(data.amount)
                        : ''
                );

                setIsAutomatic({
                    key: data.isAutomatic,
                    value: data.isAutomatic === 'yes'
                        ? 'Yes'
                        : 'No'
                });
            }
        );
    }, [hiddenID, selectedBusiness.id, session]);

    const saveDeduction = () => {
        if (!selectedBusiness.id) {
            Alert.alert('Error', 'No business selected');
            return;
        }

        if (!name.trim()) {
            Alert.alert('Error', 'Deduction name is required');
            return;
        }

        if (!type?.key) {
            Alert.alert('Error', 'Please select deduction type');
            return;
        }

        if (!stage?.key) {
            Alert.alert('Error', 'Please select deduction stage');
            return;
        }

        if (!amount.trim()) {
            Alert.alert('Error', 'Amount is required');
            return;
        }

        const numericAmount = Number(amount);

        if (isNaN(numericAmount) || numericAmount < 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (type.key === 'percentage' && numericAmount > 100) {
            Alert.alert('Error', 'Percentage cannot be greater than 100');
            return;
        }

        setLoading(true);

        const formData = {
            businessID: selectedBusiness.id,
            sessionID: session,
            hiddenID,
            name: name.trim(),
            description: description.trim(),
            type: type.key,
            stage: stage.key,
            amount: numericAmount,
            isAutomatic: isAutomatic?.key || 'no'
        };

        SocketIO.emit('add-update-pay-deduction', formData, (response:any) => {
                setLoading(false);
                if (response.status === 'success') {
                    Alert.alert(
                        'Success',
                        response.message || 'Deduction saved successfully',
                        [
                            {
                                text: 'OK',
                                onPress: () => navigation.goBack()
                            }
                        ]
                    );
                } else {
                    Alert.alert(
                        'Error',
                        response.message || 'Failed to save deduction'
                    );
                }
            }
        );
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: themeColors.background
                }
            ]}
        >
            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        {
                            height: 10,
                            backgroundColor: themeColors.background
                        }
                    ]}
                />
            )}

            <View
                style={[
                    styles.safeArea,
                    {
                        backgroundColor: themeColors.background,
                        paddingTop: Platform.OS === 'ios' ? insets.top : 0
                    }
                ]}
            >
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: themeColors.background,
                            borderBottomColor: themeColors.border
                        }
                    ]}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.backButtonMain,
                            {
                                backgroundColor: themeColors.subtleBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="arrow.left"
                            size={20}
                            color={themeColors.icon}
                        />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        {hiddenID ? 'Edit Deduction' : 'Add Deduction'}
                    </ThemedText>

                    <View style={{ width: 36 }} />
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={[
                            styles.contentContainer,
                            {
                                paddingBottom: insets.bottom + 100
                            }
                        ]}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <ThemedText
                            style={[
                                styles.sectionTitle,
                                {
                                    fontSize: 15,
                                    marginBottom: 15,
                                    color: themeColors.text
                                }
                            ]}
                        >
                            Deduction Details
                        </ThemedText>

                        <View style={styles.section}>
                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color: themeColors.subtleText
                                    }
                                ]}
                            >
                                Name (
                                <Text
                                    style={{
                                        fontFamily: 'Italic',
                                        fontSize: 12,
                                        color: themeColors.error
                                    }}
                                >
                                    Required
                                </Text>
                                )
                            </ThemedText>

                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Pension, Union Dues, Staff Welfare..."
                                placeholderTextColor={themeColors.subtleText}
                                style={[
                                    styles.input,
                                    {
                                        color: themeColors.text,
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border
                                    }
                                ]}
                            />
                        </View>

                        <View style={styles.section}>
                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color: themeColors.subtleText
                                    }
                                ]}
                            >
                                Description
                            </ThemedText>

                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Optional description"
                                placeholderTextColor={themeColors.subtleText}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                style={[
                                    styles.textArea,
                                    {
                                        color: themeColors.text,
                                        backgroundColor: themeColors.inputBackground,
                                        borderColor: themeColors.border
                                    }
                                ]}
                            />
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color: themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Type (
                                    <Text
                                        style={{
                                            fontFamily: 'Italic',
                                            fontSize: 12,
                                            color: themeColors.error
                                        }}
                                    >
                                        Required
                                    </Text>
                                    )
                                </ThemedText>

                                <TouchableOpacity
                                    style={[
                                        styles.input,
                                        {
                                            justifyContent: 'center',
                                            backgroundColor: themeColors.inputBackground,
                                            borderColor: themeColors.border
                                        }
                                    ]}
                                    onPress={() =>
                                        openBottomSheet(
                                            'type',
                                            typeOptions,
                                            'Select Deduction Type'
                                        )
                                    }
                                >
                                    <Text
                                        style={{
                                            color: themeColors.text,
                                            fontSize: Typography.small
                                        }}
                                    >
                                        {type?.value}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color: themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Stage (
                                    <Text
                                        style={{
                                            fontFamily: 'Italic',
                                            fontSize: 12,
                                            color: themeColors.error
                                        }}
                                    >
                                        Required
                                    </Text>
                                    )
                                </ThemedText>

                                <TouchableOpacity
                                    style={[
                                        styles.input,
                                        {
                                            justifyContent: 'center',
                                            backgroundColor: themeColors.inputBackground,
                                            borderColor: themeColors.border
                                        }
                                    ]}
                                    onPress={() =>
                                        openBottomSheet(
                                            'stage',
                                            stageOptions,
                                            'Select Deduction Stage'
                                        )
                                    }
                                >
                                    <Text
                                        style={{
                                            color: themeColors.text,
                                            fontSize: Typography.small
                                        }}
                                    >
                                        {stage?.value}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color: themeColors.subtleText
                                        }
                                    ]}
                                >
                                    {type?.key === 'percentage'
                                        ? 'Percentage'
                                        : 'Amount'} (
                                    <Text
                                        style={{
                                            fontFamily: 'Italic',
                                            fontSize: 12,
                                            color: themeColors.error
                                        }}
                                    >
                                        Required
                                    </Text>
                                    )
                                </ThemedText>

                                <TextInput
                                    value={amount}
                                    onChangeText={text =>
                                        setAmount(
                                            text.replace(/[^0-9.]/g, '')
                                        )
                                    }
                                    placeholder={
                                        type?.key === 'percentage'
                                            ? 'e.g. 5'
                                            : 'e.g. 1000'
                                    }
                                    placeholderTextColor={themeColors.subtleText}
                                    keyboardType="decimal-pad"
                                    style={[
                                        styles.input,
                                        {
                                            color: themeColors.text,
                                            backgroundColor: themeColors.inputBackground,
                                            borderColor: themeColors.border
                                        }
                                    ]}
                                />
                            </View>

                            <View style={{...styles.section, width: '49%'}}>
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color: themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Apply Automatically
                                </ThemedText>

                                <TouchableOpacity
                                    style={[
                                        styles.input,
                                        {
                                            justifyContent: 'center',
                                            backgroundColor: themeColors.inputBackground,
                                            borderColor: themeColors.border
                                        }
                                    ]}
                                    onPress={() =>
                                        openBottomSheet(
                                            'isAutomatic',
                                            automaticOptions,
                                            'Apply Automatically'
                                        )
                                    }
                                >
                                    <Text
                                        style={{
                                            color: themeColors.text,
                                            fontSize: Typography.small
                                        }}
                                    >
                                        {isAutomatic?.value}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    <View
                        style={[
                            styles.footer,
                            {
                                backgroundColor: themeColors.background,
                                borderTopColor: themeColors.border
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor: loading
                                        ? themeColors.border
                                        : themeColors.primary
                                }
                            ]}
                            onPress={saveDeduction}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.buttonText}>
                                {loading
                                    ? 'Saving...'
                                    : hiddenID
                                        ? 'Update Deduction'
                                        : 'Save Deduction'}
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
                    <ThemedText
                        style={{
                            fontFamily: 'SemiBold',
                            fontSize: 20,
                            marginBottom: 20,
                            textAlign: 'center',
                            marginTop: 10
                        }}
                    >
                        {sheetTitle || 'Select Option'}
                    </ThemedText>

                    <BottomSheetScrollView
                        contentContainerStyle={{
                            paddingHorizontal: 16
                        }}
                    >
                        {sheetOptions.map(option => (
                            <TouchableOpacity
                                key={option.key}
                                style={{
                                    padding: 20,
                                    backgroundColor: themeColors.card,
                                    borderRadius: 5,
                                    marginBottom: 5
                                }}
                                onPress={() =>
                                    selectOption({
                                        key: option.key,
                                        value: option.value
                                    })
                                }
                            >
                                <Text
                                    style={{
                                        fontSize: Typography.body,
                                        color: themeColors.text,
                                        fontFamily: 'Medium'
                                    }}
                                >
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
    contentContainer: {
        padding: Spacing.screenPadding,
        paddingTop: 10
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
    textArea: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.medium,
        fontSize: Typography.small,
        marginBottom: Spacing.medium,
        fontFamily: 'Regular',
        minHeight: 90
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

export default PayDeductionFormScreen;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { HRMNavigationList, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type TLoanTypeFormScreen = NativeStackScreenProps<PayrollNavigationList, "LoanTypeFormScreen">

type SettingsOption = {
    key: string
    value: string
}

const interestMethodOptions: SettingsOption[] = [
    { key: 'none', value: 'No Interest' },
    { key: 'flat', value: 'Flat Interest' },
    { key: 'declining_balance', value: 'Declining Balance' }
]

const repaymentMethodOptions: SettingsOption[] = [
    { key: 'equal_installments', value: 'Equal Installments' },
    { key: 'equal_principal', value: 'Equal Principal' }
]

const LoanTypeFormScreen = ({ navigation, route }: TLoanTypeFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, businessCurrency } = useAppContainer();

    const loanType = (route.params as any)?.loanType;
    const isEditing = !!loanType?.id;

    const [name, setName] = useState('');
    const [minimumAmount, setMinimumAmount] = useState('');
    const [maximumAmount, setMaximumAmount] = useState('');
    const [defaultInterestRate, setDefaultInterestRate] = useState('');
    const [interestMethod, setInterestMethod] = useState<'none' | 'flat' | 'declining_balance'>('none');
    const [repaymentMethod, setRepaymentMethod] = useState<'equal_installments' | 'equal_principal'>('equal_installments');
    const [serviceDebtRatio, setServiceDebtRatio] = useState('');
    const [description, setDescription] = useState('');

    const [saving, setSaving] = useState(false);

    const [sheetOptions, setSheetOptions] = useState<SettingsOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState('');
    const [activeField, setActiveField] = useState<string | null>(null);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['40%', '55%'], []);

    useEffect(() => {
        if (!loanType) return;

        setName(loanType.name ? String(loanType.name) : '');
        setMinimumAmount(
            loanType.minimumAmount !== null &&
            loanType.minimumAmount !== undefined
                ? String(loanType.minimumAmount)
                : ''
        );

        setMaximumAmount(
            loanType.maximumAmount !== null &&
            loanType.maximumAmount !== undefined
                ? String(loanType.maximumAmount)
                : ''
        );

        setDefaultInterestRate(
            loanType.defaultInterestRate !== null &&
            loanType.defaultInterestRate !== undefined
                ? String(loanType.defaultInterestRate)
                : ''
        );

        setInterestMethod(
            loanType.interestMethod || 'none'
        );

        setRepaymentMethod(
            loanType.repaymentMethod || 'equal_installments'
        );

        setServiceDebtRatio(
            loanType.serviceDebtRatio !== null &&
            loanType.serviceDebtRatio !== undefined
                ? String(loanType.serviceDebtRatio)
                : ''
        );

        setDescription(
            loanType.description ? String(loanType.description) : ''
        );
    }, [loanType]);

    const openBottomSheet = (
        field: string,
        options: SettingsOption[],
        title: string
    ) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const selectOption = (option: SettingsOption) => {
        if (activeField === 'interestMethod') {
            setInterestMethod(option.key as any);
        }

        if (activeField === 'repaymentMethod') {
            setRepaymentMethod(option.key as any);
        }

        bottomSheetRef.current?.close();
    };

    const getOptionValue = (
        options: SettingsOption[],
        key: string
    ) => {
        return options.find(option => option.key === key)?.value || '';
    };

    const onSave = async () => {
        if (!selectedBusiness?.id) {
            Alert.alert('Error', 'No business selected');
            return;
        }

        const minimum = Number(minimumAmount);
        const maximum = Number(maximumAmount);
        const interestRate = Number(defaultInterestRate);
        const debtRatio = Number(serviceDebtRatio);

        if (!name.trim()) {
            Alert.alert('Error', 'Loan type name is required');
            return;
        }

        if (!minimumAmount || Number.isNaN(minimum) || minimum < 0) {
            Alert.alert('Error', 'Please enter a valid minimum loan amount');
            return;
        }

        if (!maximumAmount || Number.isNaN(maximum) || maximum <= 0) {
            Alert.alert('Error', 'Please enter a valid maximum loan amount');
            return;
        }

        if (maximum < minimum) {
            Alert.alert(
                'Error',
                'Maximum loan amount cannot be less than minimum loan amount'
            );
            return;
        }

        if (interestMethod !== 'none') {
            if (
                !defaultInterestRate ||
                Number.isNaN(interestRate) ||
                interestRate < 0
            ) {
                Alert.alert(
                    'Error',
                    'Please enter a valid default interest rate'
                );
                return;
            }
        }

        if (
            !serviceDebtRatio ||
            Number.isNaN(debtRatio) ||
            debtRatio < 0 ||
            debtRatio > 100
        ) {
            Alert.alert(
                'Error',
                'Service debt ratio must be between 0 and 100'
            );
            return;
        }

        setSaving(true);

        const formData = {
            sessionID: session,
            businessID: selectedBusiness.id,

            ...(isEditing && {
                id: loanType.id
            }),

            name: name.trim(),
            minimumAmount: minimum,
            maximumAmount: maximum,
            defaultInterestRate:
                interestMethod === 'none'
                    ? 0
                    : interestRate,

            interestMethod,
            repaymentMethod,
            serviceDebtRatio: debtRatio,
            description: description.trim(),

            status: isEditing
                ? loanType.status || 'active'
                : 'active'
        };

        SocketIO.emit(
            'add-update-loan-type',
            formData,
            (response: any) => {
                setSaving(false);

                if (response.status === 'success') {
                    Alert.alert(
                        'Success',
                        response.message ||
                        (
                            isEditing
                                ? 'Loan type updated successfully'
                                : 'Loan type created successfully'
                        ),
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
                        response.message ||
                        'Failed to save loan type'
                    );
                }
            }
        );
    };

    const ToggleInfo = ({
        title,
        value
    }: {
        title: string
        value: string
    }) => {
        return (
            <View style={styles.infoRow}>
                <ThemedText
                    style={[
                        styles.infoTitle,
                        { color: themeColors.subtleText }
                    ]}
                >
                    {title}
                </ThemedText>

                <ThemedText
                    style={[
                        styles.infoValue,
                        { color: themeColors.text }
                    ]}
                >
                    {value}
                </ThemedText>
            </View>
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
                        paddingTop:
                            Platform.OS === 'ios'
                                ? insets.top
                                : 0
                    }
                ]}
            >
                <ThemedView
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
                                backgroundColor:
                                    themeColors.subtleBackground
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
                        {isEditing
                            ? 'Edit Loan Type'
                            : 'New Loan Type'}
                    </ThemedText>

                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={
                        Platform.OS === 'ios'
                            ? 'padding'
                            : 'height'
                    }
                >
                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={[
                            styles.contentContainer,
                            {
                                paddingBottom:
                                    insets.bottom + 110
                            }
                        ]}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <ThemedText
                            style={[
                                styles.sectionHeading,
                                { color: themeColors.text }
                            ]}
                        >
                            Basic Information
                        </ThemedText>

                        <View style={styles.section}>
                            <ThemedText
                                style={[
                                    styles.label,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Loan Type Name
                            </ThemedText>

                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border,
                                        color:
                                            themeColors.text
                                    }
                                ]}
                                placeholder="e.g. Salary Advance"
                                placeholderTextColor={
                                    themeColors.subtleText
                                }
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}
                        >
                            <View
                                style={{
                                    ...styles.section,
                                    width: '49%'
                                }}
                            >
                                <ThemedText
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Minimum Amount ({businessCurrency.code})
                                </ThemedText>

                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor:
                                                themeColors.inputBackground,
                                            borderColor:
                                                themeColors.border,
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                    placeholder="0.00"
                                    placeholderTextColor={
                                        themeColors.subtleText
                                    }
                                    keyboardType="decimal-pad"
                                    value={minimumAmount}
                                    onChangeText={
                                        setMinimumAmount
                                    }
                                />
                            </View>

                            <View
                                style={{
                                    ...styles.section,
                                    width: '49%'
                                }}
                            >
                                <ThemedText
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Maximum Amount ({businessCurrency.code})
                                </ThemedText>

                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor:
                                                themeColors.inputBackground,
                                            borderColor:
                                                themeColors.border,
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                    placeholder="0.00"
                                    placeholderTextColor={
                                        themeColors.subtleText
                                    }
                                    keyboardType="decimal-pad"
                                    value={maximumAmount}
                                    onChangeText={
                                        setMaximumAmount
                                    }
                                />
                            </View>
                        </View>

                        <ThemedText
                            style={[
                                styles.sectionHeading,
                                { color: themeColors.text }
                            ]}
                        >
                            Interest
                        </ThemedText>

                        <View style={styles.section}>
                            <ThemedText
                                style={[
                                    styles.label,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Interest Method
                            </ThemedText>

                            <TouchableOpacity
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border
                                    }
                                ]}
                                onPress={() =>
                                    openBottomSheet(
                                        'interestMethod',
                                        interestMethodOptions,
                                        'Select Interest Method'
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.inputText,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {getOptionValue(
                                        interestMethodOptions,
                                        interestMethod
                                    )}
                                </Text>

                                <IconSymbol
                                    name="chevron.right"
                                    size={18}
                                    color={
                                        themeColors.subtleText
                                    }
                                />
                            </TouchableOpacity>
                        </View>

                        {interestMethod !== 'none' && (
                            <View style={styles.section}>
                                <ThemedText
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Default Interest Rate
                                </ThemedText>

                                <View
                                    style={[
                                        styles.rateInputContainer,
                                        {
                                            backgroundColor:
                                                themeColors.inputBackground,
                                            borderColor:
                                                themeColors.border
                                        }
                                    ]}
                                >
                                    <TextInput
                                        style={[
                                            styles.rateInput,
                                            {
                                                color:
                                                    themeColors.text
                                            }
                                        ]}
                                        placeholder="e.g. 10"
                                        placeholderTextColor={
                                            themeColors.subtleText
                                        }
                                        keyboardType="decimal-pad"
                                        value={
                                            defaultInterestRate
                                        }
                                        onChangeText={
                                            setDefaultInterestRate
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.rateSuffix,
                                            {
                                                color:
                                                    themeColors.subtleText
                                            }
                                        ]}
                                    >
                                        %
                                    </Text>
                                </View>
                            </View>
                        )}

                        <ThemedText
                            style={[
                                styles.sectionHeading,
                                { color: themeColors.text }
                            ]}
                        >
                            Repayment
                        </ThemedText>

                        <View style={styles.section}>
                            <ThemedText
                                style={[
                                    styles.label,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Repayment Method
                            </ThemedText>

                            <TouchableOpacity
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border
                                    }
                                ]}
                                onPress={() =>
                                    openBottomSheet(
                                        'repaymentMethod',
                                        repaymentMethodOptions,
                                        'Select Repayment Method'
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.inputText,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {getOptionValue(
                                        repaymentMethodOptions,
                                        repaymentMethod
                                    )}
                                </Text>

                                <IconSymbol
                                    name="chevron.right"
                                    size={18}
                                    color={
                                        themeColors.subtleText
                                    }
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <ThemedText
                                style={[
                                    styles.label,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Service Debt Ratio
                            </ThemedText>

                            <View
                                style={[
                                    styles.rateInputContainer,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border
                                    }
                                ]}
                            >
                                <TextInput
                                    style={[
                                        styles.rateInput,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                    placeholder="e.g. 40"
                                    placeholderTextColor={
                                        themeColors.subtleText
                                    }
                                    keyboardType="decimal-pad"
                                    value={
                                        serviceDebtRatio
                                    }
                                    onChangeText={
                                        setServiceDebtRatio
                                    }
                                />

                                <Text
                                    style={[
                                        styles.rateSuffix,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    %
                                </Text>
                            </View>
                        </View>

                        <ThemedText
                            style={[
                                styles.sectionHeading,
                                { color: themeColors.text }
                            ]}
                        >
                            Description
                        </ThemedText>

                        <TextInput
                            style={[
                                styles.descriptionInput,
                                {
                                    backgroundColor:
                                        themeColors.inputBackground,
                                    borderColor:
                                        themeColors.border,
                                    color:
                                        themeColors.text
                                }
                            ]}
                            placeholder="Enter a description for this loan type"
                            placeholderTextColor={
                                themeColors.subtleText
                            }
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                        />
                    </ScrollView>

                    <View
                        style={[
                            styles.footer,
                            {
                                backgroundColor:
                                    themeColors.background,
                                borderTopColor:
                                    themeColors.border,
                                paddingBottom:
                                    insets.bottom +
                                    Spacing.screenPadding
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor: saving
                                        ? themeColors.border
                                        : themeColors.primary
                                }
                            ]}
                            onPress={onSave}
                            disabled={saving}
                            activeOpacity={0.8}
                        >
                            <ThemedText
                                style={styles.buttonText}
                            >
                                {saving
                                    ? 'Saving...'
                                    : isEditing
                                        ? 'Update Loan Type'
                                        : 'Create Loan Type'}
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
                        backgroundColor:
                            themeColors.icon,
                        marginTop: 10
                    }}
                    backgroundStyle={{
                        backgroundColor:
                            themeColors.background,
                        borderTopWidth: 1,
                        borderTopColor:
                            themeColors.info
                    }}
                >
                    <ThemedText
                        style={[
                            styles.sheetTitle,
                            {
                                color:
                                    themeColors.text
                            }
                        ]}
                    >
                        {sheetTitle ||
                            'Select Option'}
                    </ThemedText>

                    <BottomSheetScrollView
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 30
                        }}
                    >
                        {sheetOptions.map(option => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.sheetOption,
                                    {
                                        backgroundColor:
                                            themeColors.card
                                    }
                                ]}
                                onPress={() =>
                                    selectOption(
                                        option
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.sheetOptionText,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {option.value}
                                </Text>

                                {(
                                    (
                                        activeField ===
                                        'interestMethod' &&
                                        interestMethod ===
                                        option.key
                                    ) ||
                                    (
                                        activeField ===
                                        'repaymentMethod' &&
                                        repaymentMethod ===
                                        option.key
                                    )
                                ) && (
                                    <IconSymbol
                                        name="check"
                                        size={18}
                                        color={
                                            themeColors.primary
                                        }
                                    />
                                )}
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
        flex: 1
    },
    statusBarSpacer: {
        width: '100%'
    },
    safeArea: {
        flex: 1
    },
    scrollContainer: {
        flex: 1
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
        borderBottomWidth: 1
    },
    backButtonMain: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold'
    },
    sectionHeading: {
        fontSize: 15,
        fontFamily: 'SemiBold',
        marginTop: 10,
        marginBottom: 12
    },
    section: {
        marginBottom: 5
    },
    label: {
        fontSize: Typography.body,
        fontFamily: 'Regular',
        marginBottom: 4
    },
    input: {
        minHeight: 52,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        marginBottom: Spacing.medium,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    inputText: {
        fontSize: Typography.small,
        fontFamily: 'Regular'
    },
    textInput: {
        minHeight: 52,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.medium,
        fontSize: Typography.small,
        fontFamily: 'Regular',
        marginBottom: Spacing.medium
    },
    descriptionInput: {
        minHeight: 120,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.medium,
        fontSize: Typography.small,
        fontFamily: 'Regular',
        marginBottom: Spacing.medium
    },
    rateInputContainer: {
        minHeight: 52,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.medium,
        marginBottom: Spacing.medium
    },
    rateInput: {
        flex: 1,
        fontSize: Typography.small,
        fontFamily: 'Regular',
        paddingVertical: 12
    },
    rateSuffix: {
        fontSize: Typography.small,
        fontFamily: 'Regular',
        marginLeft: 5
    },
    statusContainer: {
        minHeight: 52,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.medium
    },
    statusDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 10
    },
    statusText: {
        fontSize: Typography.small,
        fontFamily: 'Regular'
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10
    },
    infoTitle: {
        fontSize: Typography.small,
        fontFamily: 'Regular'
    },
    infoValue: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold'
    },
    footer: {
        padding: Spacing.screenPadding,
        borderTopWidth: 1
    },
    button: {
        paddingVertical: Spacing.large,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: Typography.body,
        fontFamily: 'SemiBold'
    },
    sheetTitle: {
        fontFamily: 'SemiBold',
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
        marginTop: 10
    },
    sheetOption: {
        padding: 20,
        borderRadius: 5,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    sheetOptionText: {
        fontSize: Typography.body,
        fontFamily: 'Regular'
    }
});

export default LoanTypeFormScreen;
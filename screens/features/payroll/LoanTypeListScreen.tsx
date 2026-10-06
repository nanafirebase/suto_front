import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HRMNavigationList, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { formatCurrency } from '../../../utils/constants/Currency';

type TLoanTypeListScreen = NativeStackScreenProps<PayrollNavigationList, "LoanTypeListScreen">

interface LoanType {
    id?: string | number;
    businessID?: string;
    name?: string;
    minimumAmount?: number;
    maximumAmount?: number;
    defaultInterestRate?: number;
    interestMethod?: 'none' | 'flat' | 'declining_balance';
    repaymentMethod?: 'equal_installments' | 'equal_principal';
    serviceDebtRatio?: number;
    description?: string;
    updatedAt?: string;
    createdAt?: string;
    status?: string;
}

const LoanTypeListScreen = ({ navigation }: TLoanTypeListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, businessCurrency } = useAppContainer();

    const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLoanTypes = async () => {
        if (!selectedBusiness?.id) return;

        setLoading(true);

        SocketIO.emit(
            'fetch-loan-types',
            {
                sessionID: session,
                businessID: selectedBusiness.id
            },
            (response: any) => {
                setLoading(false);
                setRefreshing(false);
                if (response.status === 'success') {
                    setLoanTypes(
                        Array.isArray(response.data)
                            ? response.data
                            : []
                    );
                } else {
                    Alert.alert(
                        'Error',
                        response.message ||
                        'Failed to fetch loan types'
                    );
                }
            }
        );
    };

    useFocusEffect(
        useCallback(() => {
            fetchLoanTypes();
        }, [selectedBusiness?.id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchLoanTypes();
    };

    const getInterestMethod = (method?: string) => {
        if (method === 'flat') return 'Flat Interest';
        if (method === 'declining_balance') {
            return 'Declining Balance';
        }

        return 'No Interest';
    };

    const getRepaymentMethod = (method?: string) => {
        if (method === 'equal_principal') {
            return 'Equal Principal';
        }

        return 'Equal Installments';
    };

    const formatAmount = (amount?: number) => {
        if (
            amount === undefined ||
            amount === null
        ) {
            return '0.00';
        }
        return formatCurrency(Number(amount) || 0, {symbol: businessCurrency.symbol})
    };

    const editLoanType = (loanType: LoanType) => {
        navigation.navigate(
            'LoanTypeFormScreen' as any,
            {
                loanType
            }
        );
    };

    const deactivateLoanType = (loanType: LoanType) => {
        if (!loanType.id) return;

        Alert.alert(
            'Delete Loan Type',
            `Are you sure you want to delete "${loanType.name}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        SocketIO.emit(
                            'delete-loan-type',
                            {
                                sessionID: session,
                                businessID:
                                    selectedBusiness?.id,
                                id: loanType.id
                            },
                            (response: any) => {
                                if (
                                    response.status ===
                                    'success'
                                ) {
                                    Alert.alert(
                                        'Success',
                                        response.message ||
                                        'Loan type deleted successfully'
                                    );

                                    fetchLoanTypes();
                                } else {
                                    Alert.alert(
                                        'Error',
                                        response.message ||
                                        'Failed to delete loan type'
                                    );
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    const activateLoanType = (loanType: LoanType) => {
        if (!loanType.id) return;

        Alert.alert(
            'Activate Loan Type',
            `Activate "${loanType.name}" again?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Activate',
                    onPress: () => {
                        SocketIO.emit(
                            'add-update-loan-type',
                            {
                                sessionID: session,
                                businessID:
                                    selectedBusiness?.id,
                                id: loanType.id,
                                name: loanType.name,
                                minimumAmount:
                                    loanType.minimumAmount,
                                maximumAmount:
                                    loanType.maximumAmount,
                                defaultInterestRate:
                                    loanType.defaultInterestRate,
                                interestMethod:
                                    loanType.interestMethod,
                                repaymentMethod:
                                    loanType.repaymentMethod,
                                serviceDebtRatio:
                                    loanType.serviceDebtRatio,
                                description:
                                    loanType.description,
                                status: 'active'
                            },
                            (response: any) => {
                                if (
                                    response.status ===
                                    'success'
                                ) {
                                    fetchLoanTypes();
                                } else {
                                    Alert.alert(
                                        'Error',
                                        response.message ||
                                        'Failed to activate loan type'
                                    );
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    const LoanTypeCard = ({
        loanType
    }: {
        loanType: LoanType
    }) => {
        const isActive =
            loanType.status !== 'inactive';

        return (
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor:
                            themeColors.card,
                        borderColor:
                            themeColors.border,
                        opacity: isActive
                            ? 1
                            : 0.65, borderLeftWidth: 2, borderLeftColor: themeColors.primary
                    }
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <ThemedText
                            style={[
                                styles.cardTitle,
                                {
                                    color:
                                        themeColors.text
                                }
                            ]}
                        >
                            {loanType.name ||
                                'Unnamed Loan Type'}
                        </ThemedText>

                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor:
                                        isActive
                                            ? '#DCFCE7'
                                            : '#F3F4F6'
                                }
                            ]}
                        >
                            <View
                                style={[
                                    styles.statusDot,
                                    {
                                        backgroundColor:
                                            isActive
                                                ? '#22C55E'
                                                : '#9CA3AF'
                                    }
                                ]}
                            />

                            <ThemedText
                                style={[
                                    styles.statusBadgeText,
                                    {
                                        color:
                                            isActive
                                                ? '#15803D'
                                                : '#6B7280'
                                    }
                                ]}
                            >
                                {isActive
                                    ? 'Active'
                                    : 'Inactive'}
                            </ThemedText>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.editButton,
                            {
                                backgroundColor:
                                    themeColors.border
                            }
                        ]}
                        onPress={() =>
                            editLoanType(loanType)
                        }
                    >
                        <IconSymbol
                            name="pencil"
                            size={18}
                            color={
                                themeColors.icon
                            }
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.editButton,
                            {
                                backgroundColor:
                                    themeColors.error, marginLeft: 5
                            }
                        ]}
                        onPress={() =>
                            deactivateLoanType(
                                loanType
                            )
                        }
                    >
                        <IconSymbol
                            name="trash"
                            size={18}
                            color={
                                themeColors.white
                            }
                        />
                    </TouchableOpacity>
                </View>

                <View
                    style={[
                        styles.amountContainer,
                        {
                            backgroundColor:
                                themeColors.inputBackground
                        }
                    ]}
                >
                    <View style={styles.amountItem}>
                        <ThemedText
                            style={[
                                styles.amountLabel,
                                {
                                    color:
                                        themeColors.subtleText
                                }
                            ]}
                        >
                            Minimum
                        </ThemedText>

                        <ThemedText
                            style={[
                                styles.amountValue,
                                {
                                    color:
                                        themeColors.text
                                }
                            ]}
                        >
                            {formatAmount(
                                loanType.minimumAmount
                            )}
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.amountDivider,
                            {
                                backgroundColor:
                                    themeColors.border
                            }
                        ]}
                    />

                    <View style={styles.amountItem}>
                        <ThemedText
                            style={[
                                styles.amountLabel,
                                {
                                    color:
                                        themeColors.subtleText
                                }
                            ]}
                        >
                            Maximum
                        </ThemedText>

                        <ThemedText
                            style={[
                                styles.amountValue,
                                {
                                    color:
                                        themeColors.text
                                }
                            ]}
                        >
                            {formatAmount(
                                loanType.maximumAmount
                            )}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <ThemedText
                            style={[
                                styles.detailLabel,
                                {
                                    color:
                                        themeColors.subtleText
                                }
                            ]}
                        >
                            Interest
                        </ThemedText>

                        <ThemedText
                            style={[
                                styles.detailValue,
                                {
                                    color:
                                        themeColors.text
                                }
                            ]}
                        >
                            {getInterestMethod(
                                loanType.interestMethod
                            )}

                            {loanType.interestMethod !==
                                'none' &&
                                loanType.defaultInterestRate !==
                                undefined
                                ? ` (${loanType.defaultInterestRate}%)`
                                : ''}
                        </ThemedText>
                    </View>

                    <View style={styles.detailRow}>
                        <ThemedText
                            style={[
                                styles.detailLabel,
                                {
                                    color:
                                        themeColors.subtleText
                                }
                            ]}
                        >
                            Repayment
                        </ThemedText>

                        <ThemedText
                            style={[
                                styles.detailValue,
                                {
                                    color:
                                        themeColors.text
                                }
                            ]}
                        >
                            {getRepaymentMethod(
                                loanType.repaymentMethod
                            )}
                        </ThemedText>
                    </View>

                    <View style={styles.detailRow}>
                        <ThemedText
                            style={[
                                styles.detailLabel,
                                {
                                    color:
                                        themeColors.subtleText
                                }
                            ]}
                        >
                            Debt Ratio
                        </ThemedText>

                        <ThemedText
                            style={[
                                styles.detailValue,
                                {
                                    color:
                                        themeColors.text
                                }
                            ]}
                        >
                            {loanType.serviceDebtRatio ??
                                0}
                            %
                        </ThemedText>
                    </View>
                </View>

                {loanType.description ? (
                    <ThemedText
                        style={[
                            styles.description,
                            {
                                color:
                                    themeColors.subtleText
                            }
                        ]}
                        numberOfLines={2}
                    >
                        {loanType.description}
                    </ThemedText>
                ) : null}

                {/* {isActive ? (
                    <TouchableOpacity
                        style={[
                            styles.deactivateButton,
                            {
                                borderColor:
                                    themeColors.border
                            }
                        ]}
                        onPress={() =>
                            
                        }
                    >
                        <ThemedText
                            style={[
                                styles.deactivateText,
                                {
                                    color:
                                        '#DC2626'
                                }
                            ]}
                        >
                            Deactivate
                        </ThemedText>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.activateButton,
                            {
                                backgroundColor:
                                    themeColors.primary
                            }
                        ]}
                        onPress={() =>
                            activateLoanType(
                                loanType
                            )
                        }
                    >
                        <ThemedText
                            style={[
                                styles.activateText
                            ]}
                        >
                            Activate
                        </ThemedText>
                    </TouchableOpacity>
                )} */}
            </View>
        );
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor:
                        themeColors.background
                }
            ]}
        >
            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        {
                            height: 10,
                            backgroundColor:
                                themeColors.background
                        }
                    ]}
                />
            )}

            <View
                style={[
                    styles.safeArea,
                    {
                        backgroundColor:
                            themeColors.background,
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
                            backgroundColor:
                                themeColors.background,
                            borderBottomColor:
                                themeColors.border
                        }
                    ]}
                >
                    <TouchableOpacity
                        onPress={() =>
                            navigation.goBack()
                        }
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
                            color={
                                themeColors.icon
                            }
                        />
                    </TouchableOpacity>

                    <ThemedText
                        style={styles.headerTitle}
                    >
                        Loan Types
                    </ThemedText>

                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate(
                                'LoanTypeFormScreen' as any
                            )
                        }
                        style={[
                            styles.addButton,
                            {
                                backgroundColor:
                                    themeColors.subtleBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="plus"
                            size={20}
                            color={themeColors.text}
                        />
                    </TouchableOpacity>
                </ThemedView>

                {loading &&
                loanTypes.length === 0 ? (
                    <View
                        style={styles.loadingContainer}
                    >
                        <ActivityIndicator
                            size="large"
                            color={
                                themeColors.primary
                            }
                        />
                    </View>
                ) : (
                    <ScrollView
                        style={
                            styles.scrollContainer
                        }
                        contentContainerStyle={[
                            styles.contentContainer,
                            {
                                paddingBottom:
                                    insets.bottom +
                                    Spacing.screenPadding
                            }
                        ]}
                        showsVerticalScrollIndicator={
                            false
                        }
                        refreshControl={
                            <RefreshControl
                                refreshing={
                                    refreshing
                                }
                                onRefresh={
                                    onRefresh
                                }
                                tintColor={
                                    themeColors.primary
                                }
                            />
                        }
                    >
                        {loanTypes.length === 0 ? (
                            <View
                                style={[
                                    styles.emptyContainer,
                                    {
                                        backgroundColor:
                                            themeColors.card,
                                        borderColor:
                                            themeColors.border
                                    }
                                ]}
                            >
                                <IconSymbol
                                    name="document-outline"
                                    size={42}
                                    color={
                                        themeColors.subtleText
                                    }
                                />

                                <ThemedText
                                    style={[
                                        styles.emptyTitle,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    No Loan Types
                                </ThemedText>

                                <ThemedText
                                    style={[
                                        styles.emptyDescription,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Create your first
                                    loan type to start
                                    configuring employee
                                    loans.
                                </ThemedText>

                                <TouchableOpacity
                                    style={[
                                        styles.emptyButton,
                                        {
                                            backgroundColor:
                                                themeColors.primary
                                        }
                                    ]}
                                    onPress={() =>
                                        navigation.navigate(
                                            'LoanTypeFormScreen' as any
                                        )
                                    }
                                >
                                    <ThemedText
                                        style={
                                            styles.emptyButtonText
                                        }
                                    >
                                        Create Loan Type
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            loanTypes.map(
                                loanType => (
                                    <LoanTypeCard
                                        key={String(
                                            loanType.id
                                        )}
                                        loanType={
                                            loanType
                                        }
                                    />
                                )
                            )
                        )}
                    </ScrollView>
                )}
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
        padding: 7,
        paddingTop: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal:
            Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1
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
        justifyContent: 'center'
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    card: {
        borderWidth: 1,
        borderRadius:
            Borders.radiusSmall,
        padding: Spacing.medium,
        marginBottom: Spacing.medium
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14
    },
    cardTitleContainer: {
        flex: 1,
        paddingRight: 10
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: 'SemiBold',
        marginBottom: 7
    },
    statusBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 5
    },
    statusBadgeText: {
        fontSize: 11,
        fontFamily: 'SemiBold'
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    amountContainer: {
        borderRadius:
            Borders.radiusSmall,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14
    },
    amountItem: {
        flex: 1
    },
    amountDivider: {
        width: 1,
        height: 35,
        marginHorizontal: 12
    },
    amountLabel: {
        fontSize: 11,
        fontFamily: 'Regular',
        marginBottom: 3
    },
    amountValue: {
        fontSize: 15,
        fontFamily: 'SemiBold'
    },
    details: {
        gap: 8,
        marginBottom: 8
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    detailLabel: {
        fontSize: Typography.small,
        fontFamily: 'Regular'
    },
    detailValue: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold',
        textAlign: 'right',
        flex: 1,
        marginLeft: 15
    },
    description: {
        fontSize: Typography.small,
        fontFamily: 'Regular',
        lineHeight: 18,
        marginTop: 5,
        marginBottom: 12
    },
    deactivateButton: {
        minHeight: 44,
        borderWidth: 1,
        borderRadius:
            Borders.radiusSmall,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8
    },
    deactivateText: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold'
    },
    activateButton: {
        minHeight: 44,
        borderRadius:
            Borders.radiusSmall,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8
    },
    activateText: {
        color: '#FFFFFF',
        fontSize: Typography.small,
        fontFamily: 'SemiBold'
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyContainer: {
        borderWidth: 1,
        borderRadius:
            Borders.radiusSmall,
        padding: 30,
        alignItems: 'center',
        marginTop: 20
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'SemiBold',
        marginTop: 15,
        marginBottom: 6
    },
    emptyDescription: {
        fontSize: Typography.small,
        fontFamily: 'Regular',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20
    },
    emptyButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius:
            Borders.radiusSmall
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.small,
        fontFamily: 'SemiBold'
    }
});

export default LoanTypeListScreen;
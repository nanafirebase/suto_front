import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type TPayDeductionListScreen = NativeStackScreenProps<PayrollNavigationList, "PayDeductionListScreen">

interface iPayDeduction {
    id:string|number;
    businessID:string|number;
    name:string;
    description?:string;
    type:string;
    stage:string;
    amount?:number;
    isAutomatic:string;
    sessionID?:string|number;
    status:string;
    createdAt:string;
}

const PayDeductionListScreen = ({navigation}:TPayDeductionListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { selectedBusiness, session } = useAppContainer();
    const insets = useSafeAreaInsets();

    const [deductions, setDeductions] = useState<iPayDeduction[]>([]);
    const [loading, setLoading] = useState(false);

    const getDeductions = useCallback(() => {
        if (!selectedBusiness.id) {
            return;
        }

        setLoading(true);

        SocketIO.emit(
            'fetch-pay-deductions',
            {
                businessID: selectedBusiness.id,
                sessionID: session
            },
            (response:any) => {
                setLoading(false);

                if (response.status === 'success') {
                    setDeductions(response.data || []);
                } else {
                    Alert.alert(
                        'Error',
                        response.message || 'Failed to load deductions'
                    );
                }
            }
        );
    }, [selectedBusiness.id, session]);

    useEffect(() => {
        getDeductions();

        const eventName = `${selectedBusiness.id}/payDeduction/insertUpdate`;

        const listener = () => {
            getDeductions();
        };

        SocketIO.on(eventName, listener);

        return () => {
            SocketIO.off(eventName, listener);
        };
    }, [getDeductions, selectedBusiness.id]);

    const formatAmount = (item:iPayDeduction) => {
        if (item.type === 'percentage') {
            return `${item.amount ?? 0}%`;
        }

        return `${item.amount ?? 0}`;
    };

    const renderItem = ({ item }: { item:iPayDeduction }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border, borderLeftColor: themeColors.primary
                    }
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("PayDeductionFormScreen", {
                        hiddenID: item.id
                    }
                )}
            >
                <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontFamily: 'SemiBold',
                                fontSize: Typography.body,
                                color: themeColors.text
                            }}
                        >
                            {item.name}
                        </Text>

                        {item.description ? (
                            <Text
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'Regular',
                                    fontSize: Typography.small,
                                    color: themeColors.subtleText,
                                    marginTop: 4
                                }}
                            >
                                {item.description}
                            </Text>
                        ) : null}
                    </View>

                    <View
                        style={[
                            styles.amountBadge,
                            {
                                backgroundColor: themeColors.subtleBackground
                            }
                        ]}
                    >
                        <Text
                            style={{
                                fontFamily: 'SemiBold',
                                fontSize: Typography.small,
                                color: themeColors.primary
                            }}
                        >
                            {formatAmount(item)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.cardBottom, { borderTopColor: themeColors.border }]}>
                    <View>
                        <Text
                            style={{
                                fontFamily: 'Regular',
                                fontSize: 10,
                                color: themeColors.subtleText
                            }}
                        >
                            Type
                        </Text>

                        <Text
                            style={{
                                fontFamily: 'Medium',
                                fontSize: Typography.small,
                                color: themeColors.text,
                                marginTop: 2
                            }}
                        >
                            {item.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </Text>
                    </View>

                    <View>
                        <Text
                            style={{
                                fontFamily: 'Regular',
                                fontSize: 10,
                                color: themeColors.subtleText
                            }}
                        >
                            Stage
                        </Text>

                        <Text
                            style={{
                                fontFamily: 'Medium',
                                fontSize: Typography.small,
                                color: themeColors.text,
                                marginTop: 2
                            }}
                        >
                            {item.stage === 'before_tax' ? 'Before Tax' : 'After Tax'}
                        </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text
                            style={{
                                fontFamily: 'Regular',
                                fontSize: 10,
                                color: themeColors.subtleText
                            }}
                        >
                            Automatic
                        </Text>

                        <Text
                            style={{
                                fontFamily: 'Medium',
                                fontSize: Typography.small,
                                color: item.isAutomatic === 'yes'
                                    ? themeColors.success
                                    : themeColors.subtleText,
                                marginTop: 2
                            }}
                        >
                            {item.isAutomatic === 'yes' ? 'Yes' : 'No'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
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
                        Deductions
                    </ThemedText>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("PayDeductionFormScreen", {})}
                        style={[
                            styles.addButton,
                            {
                                backgroundColor: themeColors.serviceIconBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="plus"
                            size={20}
                            color={themeColors.icon}
                        />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={deductions}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    refreshing={loading}
                    onRefresh={getDeductions}
                    contentContainerStyle={[
                        styles.contentContainer,
                        {
                            paddingBottom: insets.bottom + 30,
                            flexGrow: deductions.length === 0 ? 1 : undefined
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{fontFamily: 'Regular', fontSize: 11, paddingHorizontal: 40, textAlign: 'center', color: themeColors.subtleText}}>
                                Tip: Deductions reduce an employee’s gross pay to determine their net (take-home) pay. Examples include income tax, social security, pension...{'\n\n\n'}
                            </Text>
                            <Text
                                style={{
                                    color: themeColors.subtleText,
                                    fontFamily: 'Regular',
                                    fontSize: Typography.small,
                                    marginTop: 10,
                                    textAlign: 'center'
                                }}
                            >
                                {loading
                                    ? 'Loading deductions...'
                                    : 'No deductions have been created yet.'}
                            </Text>

                            {!loading && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("PayDeductionFormScreen", {})}
                                    style={[
                                        styles.emptyButton,
                                        {
                                            backgroundColor: themeColors.primary
                                        }
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color: '#FFFFFF',
                                            fontFamily: 'SemiBold',
                                            fontSize: Typography.small
                                        }}
                                    >
                                        Add Deduction
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    ListFooterComponent={
                        deductions.length > 0 ? (
                            <Text
                                style={{
                                    color: themeColors.subtleText,
                                    fontFamily: 'Italic',
                                    fontSize: Typography.small,
                                    textAlign: 'center',
                                    marginTop: 15,
                                    marginBottom: 10
                                }}
                            >
                                Tap a deduction to edit it.
                            </Text>
                        ) : null
                    }
                />
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
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        marginTop: 3,
        padding: Spacing.small,
    },
    card: {
        borderWidth: 1,
        borderRadius: 4,
        padding: Spacing.medium,
        marginBottom: 5,
        borderLeftWidth: 3
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 10
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        marginTop: 12,
        paddingTop: 10
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
    },
    emptyButton: {
        marginTop: 15,
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: Borders.radiusSmall
    }
});

export default PayDeductionListScreen;
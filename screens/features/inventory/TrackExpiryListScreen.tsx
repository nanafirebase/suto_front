import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { InventoryNavigationList, BottomSheetSelectOption } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { fullDateWord, SocketIO } from '../../../configuration/helpers/main.helpers';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

type TTrackExpiryListScreen = NativeStackScreenProps<InventoryNavigationList, "TrackExpiryListScreen">

const TrackExpiryListScreen = ({ navigation }: TTrackExpiryListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, userBranch } = useAppContainer();

    const [products, setProducts] = useState<any[]>([]);
    const [stockLocations, setStockLocations] = useState<BottomSheetSelectOption[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [destinationStock, setDestinationStock] = useState<BottomSheetSelectOption | null>(null);
    const [sheetMode, setSheetMode] = useState<'action' | 'transfer'>('action');
    const [processing, setProcessing] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['45%', '65%', '80%'], []);

    const fetchExpiringProducts = useCallback(async () => {
        if (!selectedBusiness?.id) return;

        SocketIO.emit(
            'fetch-expiring-products',
            {
                sessionID: session,
                businessID: selectedBusiness.id,
                branchID: userBranch.id
            },
            (response: any) => {
                if (response.status === 'success') {
                    setProducts(response.data || []);
                } else {
                    Alert.alert(
                        'Error',
                        response.message || 'Failed to fetch expiring products'
                    );
                }
            }
        );
    }, [selectedBusiness?.id, session, userBranch?.id]);

    const fetchStockLocations = useCallback(() => {
        if (!selectedBusiness?.id) return;

        SocketIO.emit(
            'fetch-stock-locations',
            {
                sessionID: session,
                businessID: selectedBusiness.id
            },
            (response: any) => {
                if (response.status === 'success') {
                    const locations = (response.data || []).map((item: any) => ({
                        key: item.id,
                        value: item.name || 'No Name'
                    }));

                    setStockLocations(locations);
                } else {
                    Alert.alert(
                        'Error',
                        response.message || 'Failed to fetch stock locations'
                    );
                }
            }
        );
    }, [selectedBusiness?.id, session]);

    useEffect(() => {
        fetchExpiringProducts();
        fetchStockLocations();
    }, [fetchExpiringProducts, fetchStockLocations]);

    const validProducts = useMemo(
        () => products.filter(item => item?.productName && item?.productID),
        [products]
    );

    const expiredProducts = useMemo(
        () => validProducts.filter(item => (item.daysToExpire ?? 0) <= 0),
        [validProducts]
    );

    const sevenDayProducts = useMemo(
        () => validProducts.filter(item => (item.daysToExpire ?? 0) > 0 && (item.daysToExpire ?? 0) <= 7),
        [validProducts]
    );

    const thirtyDayProducts = useMemo(
        () => validProducts.filter(item => (item.daysToExpire ?? 0) > 7 && (item.daysToExpire ?? 0) <= 30),
        [validProducts]
    );

    const ninetyDayProducts = useMemo(
        () => validProducts.filter(item => (item.daysToExpire ?? 0) > 30),
        [validProducts]
    );

    const getDaysLeft = (item: any) => {
        if (item.daysToExpire !== undefined && item.daysToExpire !== null) {
            return Number(item.daysToExpire);
        }

        if (!item.expiryDate) return null;

        return Math.ceil(
            (new Date(item.expiryDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
    };

    const getAgeInDays = (item: any) => {
        if (!item.manufactureDate) return null;

        return Math.floor(
            (Date.now() - new Date(item.manufactureDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
    };

    const openProductSheet = (item: any) => {
        setSelectedProduct(item);
        setDestinationStock(null);
        setSheetMode('action');
        bottomSheetRef.current?.snapToIndex(0);
    };

    const closeSheet = () => {
        bottomSheetRef.current?.close();
        setSelectedProduct(null);
        setDestinationStock(null);
        setSheetMode('action');
    };

    const openTransferSheet = () => {
        setDestinationStock(null);
        setSheetMode('transfer');
        bottomSheetRef.current?.snapToIndex(1);
    };

    const removeExpiredProduct = () => {
        if (!selectedProduct || !selectedBusiness?.id) return;

        Alert.alert(
            'Remove Expired Stock',
            `Remove ${selectedProduct.quantity || 0} unit(s) of ${selectedProduct.productName} from inventory?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setProcessing(true);

                        SocketIO.emit(
                            'remove-expired-stock',
                            {
                                sessionID: session,
                                businessID: selectedBusiness.id,
                                branchID: userBranch.id,
                                stockInItemID: selectedProduct.id,
                                productID: selectedProduct.productID,
                                stockID: selectedProduct.stockID
                            },
                            (response: any) => {
                                setProcessing(false);

                                if (response.status === 'success') {
                                    Alert.alert(
                                        'Success',
                                        response.message || 'Expired stock removed successfully.'
                                    );
                                    closeSheet();
                                    fetchExpiringProducts();
                                } else {
                                    Alert.alert(
                                        'Error',
                                        response.message || 'Failed to remove expired stock.'
                                    );
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    const transferProduct = () => {
        if (!selectedProduct || !destinationStock?.key || !selectedBusiness?.id) {
            Alert.alert('Error', 'Please select a destination stock location.');
            return;
        }

        if (Number(destinationStock.key) === Number(selectedProduct.stockID)) {
            Alert.alert(
                'Invalid Location',
                'The destination cannot be the same as the current stock location.'
            );
            return;
        }

        Alert.alert(
            'Confirm Transfer',
            `Transfer ${selectedProduct.quantity || 0} unit(s) of ${selectedProduct.productName} to ${destinationStock.value}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Transfer',
                    onPress: () => {
                        setProcessing(true);
                        console.log(selectedProduct)
                        SocketIO.emit(
                            'transfer-stock',
                            {
                                sessionID: session,
                                businessID: selectedBusiness.id,
                                branchID: userBranch.id,
                                items: [{
                                    productID: selectedProduct.productID,
                                    fromStockID: selectedProduct.stockLocationID,
                                    toStockID: destinationStock.key,
                                    quantity: Number(selectedProduct.quantity || 0)
                                }]
                            },
                            (response: any) => {
                                setProcessing(false);

                                if (response.status === 'success') {
                                    Alert.alert(
                                        'Success',
                                        response.message || 'Stock transferred successfully.'
                                    );
                                    closeSheet();
                                    fetchExpiringProducts();
                                } else {
                                    Alert.alert(
                                        'Error',
                                        response.message || 'Failed to transfer stock.'
                                    );
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    const renderSection = (title: string, color: string, data: any[]) => {
        if (!data.length) return null;

        return (
            <View style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { backgroundColor: color }]}>
                    <ThemedText style={styles.sectionHeaderText}>
                        {title} ({data.length})
                    </ThemedText>
                </View>

                {data.map((item, index) => renderProduct(item, index))}
            </View>
        );
    };

    const renderProduct = (item: any, index: number) => {
        const daysLeft = getDaysLeft(item);
        const ageInDays = getAgeInDays(item);
        const isExpired = daysLeft !== null && daysLeft <= 0;
        const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

        const statusColor = isExpired
            ? '#DC2626'
            : isExpiringSoon
            ? '#F59E0B'
            : '#16A34A';

        return (
            <TouchableOpacity
                key={`${item.id}-${index}`}
                activeOpacity={0.8}
                onPress={() => openProductSheet(item)}
                style={[
                    styles.productCard,
                    {
                        backgroundColor: themeColors.card,
                        borderLeftColor: statusColor
                    }
                ]}
            >
                <View style={styles.productInfo}>
                    <View style={styles.productTitleRow}>
                        <ThemedText
                            style={[
                                styles.productName,
                                { color: themeColors.text }
                            ]}
                            numberOfLines={2}
                        >
                            {item.productName}
                        </ThemedText>

                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: `${statusColor}18` }
                            ]}
                        >
                            <Text style={{ color: statusColor, fontSize: 10, fontFamily: 'SemiBold' }}>
                                {isExpired
                                    ? 'EXPIRED'
                                    : isExpiringSoon
                                    ? 'SELL FIRST'
                                    : 'EXPIRING'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: themeColors.subtleText }]}>
                                Quantity
                            </Text>
                            <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                {item.quantity ?? 0}
                            </Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: themeColors.subtleText }]}>
                                Stock
                            </Text>
                            <Text
                                style={[styles.detailValue, { color: themeColors.text }]}
                                numberOfLines={1}
                            >
                                {item.stockLocation || 'Unknown'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.metaText, { color: themeColors.subtleText }]}>
                        Manufactured: {item.manufactureDate
                            ? fullDateWord(item.manufactureDate)
                            : 'N/A'}
                        {ageInDays !== null ? ` • ${ageInDays} days old` : ''}
                    </Text>

                    <Text style={[styles.metaText, { color: themeColors.subtleText }]}>
                        Expires: {item.expiryDate
                            ? fullDateWord(item.expiryDate)
                            : 'N/A'}
                        {' • '}
                        {daysLeft === null
                            ? 'Unknown'
                            : daysLeft <= 0
                            ? 'Expired'
                            : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                    </Text>
                </View>

                <View style={styles.arrowContainer}>
                    <IconSymbol
                        name="chevron.right"
                        size={18}
                        color={themeColors.subtleText}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        { backgroundColor: themeColors.background }
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
                            { backgroundColor: themeColors.subtleBackground }
                        ]}
                    >
                        <IconSymbol
                            name="arrow.left"
                            size={20}
                            color={themeColors.icon}
                        />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Expiry Overview
                    </ThemedText>

                    <View style={{ width: 36 }} />
                </ThemedView>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[
                        styles.contentContainer,
                        { paddingBottom: insets.bottom + Spacing.screenPadding }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={[
                            styles.summaryCard,
                            {
                                backgroundColor: themeColors.card,
                                borderColor: themeColors.border
                            }
                        ]}
                    >
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                                {expiredProducts.length}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: themeColors.subtleText }]}>
                                Expired
                            </Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                                {sevenDayProducts.length}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: themeColors.subtleText }]}>
                                7 Days
                            </Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#EAB308' }]}>
                                {thirtyDayProducts.length}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: themeColors.subtleText }]}>
                                30 Days
                            </Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
                                {ninetyDayProducts.length}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: themeColors.subtleText }]}>
                                90 Days
                            </Text>
                        </View>
                    </View>

                    {renderSection('Expired', '#DC2626', expiredProducts)}
                    {renderSection('Expiring Within 7 Days', '#F59E0B', sevenDayProducts)}
                    {renderSection('Expiring Within 30 Days', '#EAB308', thirtyDayProducts)}
                    {renderSection('Expiring Within 90 Days', '#16A34A', ninetyDayProducts)}

                    {!validProducts.length && (
                        <View style={styles.emptyContainer}>
                            <IconSymbol
                                name="check"
                                size={45}
                                color={themeColors.success}
                            />
                            <ThemedText style={styles.emptyTitle}>
                                No Expiring Products
                            </ThemedText>
                            <Text style={[styles.emptyText, { color: themeColors.subtleText }]}>
                                Your inventory currently has no products requiring expiry attention.
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    backgroundStyle={{
                        backgroundColor: themeColors.background,
                        borderTopWidth: 1,
                        borderTopColor: themeColors.info
                    }}
                    handleIndicatorStyle={{
                        backgroundColor: themeColors.icon,
                        marginTop: 10
                    }}
                    onClose={() => {
                        setSelectedProduct(null);
                        setDestinationStock(null);
                        setSheetMode('action');
                    }}
                >
                    {selectedProduct && (
                        <>
                            <View style={styles.sheetHeader}>
                                <ThemedText style={styles.sheetTitle}>
                                    {sheetMode === 'transfer'
                                        ? 'Transfer Stock'
                                        : 'Product Actions'}
                                </ThemedText>

                                <Text
                                    style={[
                                        styles.sheetSubtitle,
                                        { color: themeColors.subtleText }
                                    ]}
                                    numberOfLines={2}
                                >
                                    {selectedProduct.productName}
                                </Text>
                            </View>

                            {sheetMode === 'action' ? (
                                <BottomSheetScrollView
                                    contentContainerStyle={styles.sheetContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View
                                        style={[
                                            styles.sheetInfoCard,
                                            {
                                                backgroundColor: themeColors.card,
                                                borderColor: themeColors.border
                                            }
                                        ]}
                                    >
                                        <View style={styles.sheetInfoRow}>
                                            <Text style={[styles.sheetLabel, { color: themeColors.subtleText }]}>
                                                Quantity
                                            </Text>
                                            <Text style={[styles.sheetValue, { color: themeColors.text }]}>
                                                {selectedProduct.quantity ?? 0}
                                            </Text>
                                        </View>

                                        <View style={styles.sheetInfoRow}>
                                            <Text style={[styles.sheetLabel, { color: themeColors.subtleText }]}>
                                                Current Location
                                            </Text>
                                            <Text
                                                style={[styles.sheetValue, { color: themeColors.text }]}
                                                numberOfLines={1}
                                            >
                                                {selectedProduct.stockLocation || 'Unknown'}
                                            </Text>
                                        </View>

                                        <View style={styles.sheetInfoRow}>
                                            <Text style={[styles.sheetLabel, { color: themeColors.subtleText }]}>
                                                Expiry Date
                                            </Text>
                                            <Text style={[styles.sheetValue, { color: themeColors.text }]}>
                                                {selectedProduct.expiryDate
                                                    ? fullDateWord(selectedProduct.expiryDate)
                                                    : 'N/A'}
                                            </Text>
                                        </View>
                                    </View>

                                    {getDaysLeft(selectedProduct)! <= 0 ? (
                                        <TouchableOpacity
                                            disabled={processing}
                                            activeOpacity={0.8}
                                            onPress={removeExpiredProduct}
                                            style={[
                                                styles.actionButton,
                                                { backgroundColor: themeColors.error }
                                            ]}
                                        >
                                            <IconSymbol
                                                name="trash"
                                                size={19}
                                                color="#fff"
                                            />
                                            <Text style={styles.actionButtonText}>
                                                {processing
                                                    ? 'Removing...'
                                                    : 'Remove Expired Stock'}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            disabled={processing}
                                            activeOpacity={0.8}
                                            onPress={openTransferSheet}
                                            style={[
                                                styles.actionButton,
                                                { backgroundColor: themeColors.primary }
                                            ]}
                                        >
                                            <IconSymbol
                                                name="arrow.right"
                                                size={19}
                                                color="#fff"
                                            />
                                            <Text style={styles.actionButtonText}>
                                                Transfer Stock
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </BottomSheetScrollView>
                            ) : (
                                <BottomSheetScrollView
                                    contentContainerStyle={styles.sheetContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View
                                        style={[
                                            styles.transferInfo,
                                            { backgroundColor: themeColors.subtleBackground }
                                        ]}
                                    >
                                        <Text style={[styles.transferText, { color: themeColors.text }]}>
                                            Transfer{' '}
                                            <Text style={{ fontFamily: 'SemiBold' }}>
                                                {selectedProduct.quantity ?? 0}
                                            </Text>
                                            {' '}unit(s) of{' '}
                                            <Text style={{ fontFamily: 'SemiBold' }}>
                                                {selectedProduct.productName}
                                            </Text>
                                        </Text>

                                        <Text
                                            style={[
                                                styles.transferText,
                                                {
                                                    color: themeColors.subtleText,
                                                    marginTop: 4
                                                }
                                            ]}
                                        >
                                            From: {selectedProduct.stockLocation || 'Unknown'}
                                        </Text>
                                    </View>

                                    <Text
                                        style={[
                                            styles.fieldLabel,
                                            { color: themeColors.subtleText }
                                        ]}
                                    >
                                        Destination Stock Location
                                    </Text>

                                    {stockLocations
                                        .filter(
                                            option =>
                                                Number(option.key) !==
                                                Number(selectedProduct.stockID)
                                        )
                                        .map(option => {
                                            const selected =
                                                destinationStock?.key === option.key;

                                            return (
                                                <TouchableOpacity
                                                    key={option.key}
                                                    activeOpacity={0.8}
                                                    onPress={() => setDestinationStock(option)}
                                                    style={[
                                                        styles.locationOption,
                                                        {
                                                            backgroundColor: selected
                                                                ? themeColors.primary
                                                                : themeColors.card,
                                                            borderColor: selected
                                                                ? themeColors.primary
                                                                : themeColors.border
                                                        }
                                                    ]}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={[
                                                                styles.locationName,
                                                                {
                                                                    color: selected
                                                                        ? '#fff'
                                                                        : themeColors.text
                                                                }
                                                            ]}
                                                        >
                                                            {option.value}
                                                        </Text>
                                                    </View>

                                                    {selected && (
                                                        <IconSymbol
                                                            name="check"
                                                            size={18}
                                                            color="#fff"
                                                        />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}

                                    {!stockLocations.filter(
                                        option =>
                                            Number(option.key) !==
                                            Number(selectedProduct.stockID)
                                    ).length && (
                                        <Text
                                            style={[
                                                styles.noLocationText,
                                                { color: themeColors.subtleText }
                                            ]}
                                        >
                                            No other stock locations available.
                                        </Text>
                                    )}

                                    <View style={styles.sheetButtons}>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                setSheetMode('action');
                                                bottomSheetRef.current?.snapToIndex(0);
                                            }}
                                            style={[
                                                styles.secondaryButton,
                                                {
                                                    borderColor: themeColors.border,
                                                    backgroundColor: themeColors.card
                                                }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.secondaryButtonText,
                                                    { color: themeColors.text }
                                                ]}
                                            >
                                                Back
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            disabled={!destinationStock || processing}
                                            activeOpacity={0.8}
                                            onPress={transferProduct}
                                            style={[
                                                styles.primaryButton,
                                                {
                                                    backgroundColor:
                                                        !destinationStock || processing
                                                            ? themeColors.border
                                                            : themeColors.primary
                                                }
                                            ]}
                                        >
                                            <Text style={styles.actionButtonText}>
                                                {processing ? 'Transferring...' : 'Confirm Transfer'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </BottomSheetScrollView>
                            )}
                        </>
                    )}
                </BottomSheet>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    statusBarSpacer: { width: '100%' },
    safeArea: { flex: 1 },
    content: { flex: 1 },
    contentContainer: { padding: Spacing.small },
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
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: Borders.radiusMedium,
        paddingVertical: 15,
        paddingHorizontal: 8,
        marginBottom: 15
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center'
    },
    summaryValue: {
        fontSize: 20,
        fontFamily: 'SemiBold'
    },
    summaryLabel: {
        fontSize: 10,
        fontFamily: 'Regular',
        marginTop: 2
    },
    summaryDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#ddd'
    },
    sectionContainer: {
        marginBottom: 18
    },
    sectionHeader: {
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginBottom: 8
    },
    sectionHeaderText: {
        color: '#fff',
        fontFamily: 'SemiBold',
        fontSize: 12
    },
    productCard: {
        flexDirection: 'row',
        borderLeftWidth: 4,
        borderRadius: 4,
        padding: Spacing.medium,
        marginBottom: 7
    },
    productInfo: {
        flex: 1
    },
    productTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 10
    },
    productName: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'SemiBold'
    },
    statusBadge: {
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 5
    },
    detailGrid: {
        flexDirection: 'row',
        marginBottom: 7
    },
    detailItem: {
        width: '50%'
    },
    detailLabel: {
        fontSize: 10,
        fontFamily: 'Regular',
        marginBottom: 2
    },
    detailValue: {
        fontSize: 11,
        fontFamily: 'SemiBold'
    },
    metaText: {
        fontSize: 10,
        fontFamily: 'Regular',
        marginTop: 2
    },
    arrowContainer: {
        width: 25,
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 70,
        paddingHorizontal: 30
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: 'SemiBold',
        marginTop: 12
    },
    emptyText: {
        fontSize: 12,
        fontFamily: 'Regular',
        textAlign: 'center',
        marginTop: 5,
        lineHeight: 18
    },
    sheetHeader: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 15
    },
    sheetTitle: {
        fontSize: 19,
        fontFamily: 'SemiBold',
        textAlign: 'center'
    },
    sheetSubtitle: {
        fontSize: 12,
        fontFamily: 'Regular',
        textAlign: 'center',
        marginTop: 4
    },
    sheetContent: {
        paddingHorizontal: 16,
        paddingBottom: 30
    },
    sheetInfoCard: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: 14,
        marginBottom: 15
    },
    sheetInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6
    },
    sheetLabel: {
        fontSize: 11,
        fontFamily: 'Regular'
    },
    sheetValue: {
        maxWidth: '60%',
        fontSize: 11,
        fontFamily: 'SemiBold',
        textAlign: 'right'
    },
    actionButton: {
        height: 48,
        borderRadius: Borders.radiusSmall,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'SemiBold'
    },
    transferInfo: {
        padding: 13,
        borderRadius: Borders.radiusSmall,
        marginBottom: 18
    },
    transferText: {
        fontSize: 11,
        fontFamily: 'Regular',
        lineHeight: 17
    },
    fieldLabel: {
        fontSize: 12,
        fontFamily: 'Medium',
        marginBottom: 7
    },
    locationOption: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: 14,
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center'
    },
    locationName: {
        fontSize: 12,
        fontFamily: 'Medium'
    },
    noLocationText: {
        fontSize: 12,
        fontFamily: 'Regular',
        textAlign: 'center',
        paddingVertical: 20
    },
    sheetButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15
    },
    secondaryButton: {
        width: '32%',
        height: 45,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center',
        justifyContent: 'center'
    },
    secondaryButtonText: {
        fontSize: 12,
        fontFamily: 'SemiBold'
    },
    primaryButton: {
        width: '65%',
        height: 45,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default TrackExpiryListScreen;
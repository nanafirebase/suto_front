import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View, Image } from 'react-native';
import { InventoryNavigationList, BottomSheetSelectOption } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

type Props = NativeStackScreenProps<InventoryNavigationList, 'MoveStockScreen'>;

type TransferItem = {
    productID: number;
    productName?: string;
    productImage?: string;
    productUOMID: number;
    uomName?: string;
    conversionRate: number;
    fromStockID: number;
    toStockID: number;
    quantity: number;
};

const MoveStockScreen = ({ navigation }: Props) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, userBranch } = useAppContainer();

    const [stockLocations, setStockLocations] = useState<BottomSheetSelectOption[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
    const [fromStock, setFromStock] = useState<BottomSheetSelectOption | null>(null);
    const [toStock, setToStock] = useState<BottomSheetSelectOption | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [selectedUOM, setSelectedUOM] = useState<any | null>(null);
    const [quantity, setQuantity] = useState('');
    const [sheetMode, setSheetMode] = useState<'from' | 'to' | 'products' | 'add'>('from');
    const [processing, setProcessing] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['45%', '65%', '85%'], []);

    const fetchStockLocations = useCallback(() => {
        if (!selectedBusiness?.id) return;

        SocketIO.emit('fetch-stock-locations', {
            sessionID: session,
            businessID: selectedBusiness.id
        }, (response: any) => {
            if (response.status !== 'success') {
                Alert.alert('Error', response.message || 'Failed to fetch stock locations');
                return;
            }

            setStockLocations(
                (response.data || []).map((item: any) => ({
                    key: item.id,
                    value: item.name || 'Unnamed Stock'
                }))
            );
        });
    }, [selectedBusiness?.id, session]);

    const fetchProducts = useCallback((stockID: number) => {
        if (!selectedBusiness?.id || !userBranch?.id || !stockID) return;

        SocketIO.emit('fetch-stock-products', {
            sessionID: session,
            businessID: selectedBusiness.id,
            branchID: userBranch.id,
            stockID
        }, (response: any) => {
            if (response.status !== 'success') {
                Alert.alert('Error', response.message || 'Failed to fetch stock products');
                return;
            }

            setProducts(response.data || []);
        });
    }, [selectedBusiness?.id, userBranch?.id, session]);

    useEffect(() => {
        fetchStockLocations();
    }, [fetchStockLocations]);

    const productName = (item: any) =>
        item?.productName || item?.name || `Product ${item?.productID ?? item?.id}`;

    const productImage = (item: any) =>
        item?.productImage || item?.image || item?.imageURL || item?.thumbnail;

    const getProductID = (item: any) =>
        Number(item?.productID ?? item?.id);

    const getAvailable = (item: any) =>
        Number(item?.availableQuantity ?? item?.baseQuantity ?? item?.remainingQuantity ?? item?.quantity ?? 0);

    const availableProducts = useMemo(() => {
        const grouped = new Map<number, any>();

        for (const item of products) {
            const productID = getProductID(item);
            const available = getAvailable(item);

            if (!Number.isInteger(productID) || productID <= 0 || available <= 0) continue;

            if (grouped.has(productID)) {
                grouped.get(productID).availableQuantity += available;
            } else {
                grouped.set(productID, {
                    ...item,
                    productID,
                    availableQuantity: available
                });
            }
        }

        return Array.from(grouped.values());
    }, [products]);

    const selectedProductIDs = useMemo(
        () => new Set(selectedItems.map(item => item.productID)),
        [selectedItems]
    );

    const openSheet = (mode: typeof sheetMode, index = 1) => {
        setSheetMode(mode);
        bottomSheetRef.current?.snapToIndex(index);
    };

    const selectFromStock = (stock: BottomSheetSelectOption) => {
        setFromStock(stock);
        setToStock(null);
        setSelectedItems([]);
        setProducts([]);
        setSelectedProduct(null);
        setSelectedUOM(null);
        fetchProducts(Number(stock.key));
        openSheet('to');
    };

    const selectToStock = (stock: BottomSheetSelectOption) => {
        if (Number(stock.key) === Number(fromStock?.key)) {
            Alert.alert('Invalid Location', 'Source and destination stock cannot be the same.');
            return;
        }

        setToStock(stock);
        openSheet('products', 2);
    };

    const openProduct = (product: any) => {
        const productID = getProductID(product);

        if (selectedProductIDs.has(productID)) {
            Alert.alert('Already Added', `${productName(product)} is already in the transfer.`);
            return;
        }

        setSelectedProduct(product);
        setSelectedUOM(null);
        setQuantity('');
        openSheet('add', 1);
    };

    const productUOMs = useMemo(() => {
        if (!selectedProduct) return [];

        return (
            selectedProduct?.productUOMs ||
            selectedProduct?.uoms ||
            selectedProduct?.productUOM ||
            []
        );
    }, [selectedProduct]);

    const addProduct = () => {
        if (!selectedProduct || !selectedUOM || !fromStock || !toStock) {
            Alert.alert('Incomplete', 'Select a product, UOM and quantity.');
            return;
        }

        const productID = getProductID(selectedProduct);
        const requested = Number(quantity);
        const available = getAvailable(selectedProduct);
        const conversionRate = Number(
            selectedUOM?.conversionRate ||
            selectedUOM?.conversion ||
            1
        );

        if (!Number.isFinite(requested) || requested <= 0) {
            Alert.alert('Invalid Quantity', 'Enter a valid quantity.');
            return;
        }

        if (!Number.isFinite(conversionRate) || conversionRate <= 0) {
            Alert.alert('Invalid UOM', 'The selected UOM has an invalid conversion rate.');
            return;
        }

        const baseQuantity = requested * conversionRate;

        if (baseQuantity > available) {
            Alert.alert(
                'Insufficient Stock',
                `Available stock: ${available}. Requested: ${baseQuantity}.`
            );
            return;
        }

        if (selectedProductIDs.has(productID)) {
            Alert.alert('Already Added', 'This product is already in the transfer.');
            return;
        }

        setSelectedItems(items => [
            ...items, {
                productID,
                productName: productName(selectedProduct),
                productImage: productImage(selectedProduct),
                productUOMID: Number(selectedUOM.id),
                uomName: selectedUOM.name || selectedUOM.shortCode || '',
                conversionRate,
                fromStockID: Number(fromStock.key),
                toStockID: Number(toStock.key),
                quantity: requested
            }
        ]);

        setSelectedProduct(null);
        setSelectedUOM(null);
        setQuantity('');
        openSheet('products', 2);
    };

    const removeProduct = (index: number) => {
        setSelectedItems(items => items.filter((_, i) => i !== index));
    };

    const submitTransfer = () => {
        if (!fromStock || !toStock || !selectedItems.length) {
            Alert.alert('Incomplete Transfer', 'Select stock locations and at least one product.');
            return;
        }

        Alert.alert(
            'Confirm Transfer',
            `Move ${selectedItems.length} product${selectedItems.length === 1 ? '' : 's'} from ${fromStock.value} to ${toStock.value}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Transfer',
                    onPress: () => {
                        setProcessing(true);

                        SocketIO.emit('transfer-stock', {
                            sessionID: session,
                            businessID: selectedBusiness.id,
                            branchID: userBranch.id,
                            items: selectedItems
                        }, (response: any) => {
                            setProcessing(false);

                            if (response.status !== 'success') {
                                Alert.alert('Error', response.message || 'Failed to transfer stock.');
                                return;
                            }

                            Alert.alert('Success', response.message || 'Stock transferred successfully.');

                            setSelectedItems([]);
                            setFromStock(null);
                            setToStock(null);
                            setSelectedProduct(null);
                            setSelectedUOM(null);
                            setProducts([]);
                            bottomSheetRef.current?.close();
                        });
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { backgroundColor: theme.background }]} />
            )}

            <View style={[styles.safeArea, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: theme.subtleBackground }]}
                    >
                        <IconSymbol name="arrow.left" size={20} color={theme.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>Move Stock</ThemedText>

                    <View style={{ width: 36 }} />
                </ThemedView>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: Spacing.screenPadding, paddingBottom: insets.bottom + 100 }}
                >
                    {/* STOCK LOCATIONS */}

                    <View style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.locationRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.subtleText }]}>FROM</Text>
                                <Text style={[styles.value, { color: theme.text }]}>
                                    {fromStock?.value || 'Select source stock'}
                                </Text>
                            </View>

                            <TouchableOpacity onPress={() => openSheet('from')}>
                                <Text style={[styles.changeText, { color: theme.primary }]}>Change</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.connector, { backgroundColor: theme.border }]} />

                        <View style={styles.locationRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.subtleText }]}>TO</Text>
                                <Text style={[styles.value, { color: theme.text }]}>
                                    {toStock?.value || 'Select destination stock'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                disabled={!fromStock}
                                onPress={() => openSheet('to')}
                            >
                                <Text style={[styles.changeText, { color: theme.primary }]}>Select</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* PRODUCTS */}

                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Products</ThemedText>

                        <View style={[styles.countBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.countText}>{selectedItems.length}</Text>
                        </View>
                    </View>

                    {!selectedItems.length ? (
                        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <IconSymbol name="archive" size={30} color={theme.subtleText} />

                            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                No products selected
                            </Text>

                            <Text style={[styles.emptyText, { color: theme.subtleText }]}>
                                Select a product and add its UOM and quantity.
                            </Text>
                        </View>
                    ) : (
                        selectedItems.map((item, index) => (
                            <View
                                key={`${item.productID}-${item.productUOMID}`}
                                style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            >
                                {item.productImage ? (
                                    <Image source={{ uri: item.productImage }} style={styles.productImage} />
                                ) : (
                                    <View style={[styles.productImage, { backgroundColor: theme.subtleBackground }]}>
                                        <IconSymbol name="archive" size={20} color={theme.subtleText} />
                                    </View>
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.productName, { color: theme.text }]}>
                                        {item.productName}
                                    </Text>

                                    <Text style={[styles.productQuantity, { color: theme.subtleText }]}>
                                        {item.quantity} {item.uomName}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => removeProduct(index)}
                                    style={[styles.removeButton, { backgroundColor: `${theme.error}15` }]}
                                >
                                    <IconSymbol name="trash" size={17} color={theme.error} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}

                    <TouchableOpacity
                        disabled={!fromStock || !toStock}
                        onPress={() => openSheet('products', 2)}
                        style={[
                            styles.addButton,
                            { backgroundColor: !fromStock || !toStock ? theme.border : theme.primary }
                        ]}
                    >
                        <IconSymbol name="plus" size={18} color="#fff" />
                        <Text style={styles.addButtonText}>Add Product</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* SUBMIT */}

                <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <TouchableOpacity
                        disabled={!selectedItems.length || processing}
                        onPress={submitTransfer}
                        style={[
                            styles.submitButton,
                            {
                                backgroundColor:
                                    !selectedItems.length || processing
                                        ? theme.border
                                        : theme.primary
                            }
                        ]}
                    >
                        <Text style={styles.submitText}>
                            {processing
                                ? 'Transferring...'
                                : `Transfer ${selectedItems.length} Product${selectedItems.length === 1 ? '' : 's'}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* BOTTOM SHEET */}

                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    backgroundStyle={{
                        backgroundColor: theme.background,
                        borderTopWidth: 1,
                        borderTopColor: theme.border
                    }}
                    handleIndicatorStyle={{ backgroundColor: theme.icon }}
                    onClose={() => {
                        setSelectedProduct(null);
                        setSelectedUOM(null);
                        setQuantity('');
                    }}
                >
                    <View style={styles.sheetHeader}>
                        <ThemedText style={styles.sheetTitle}>
                            {sheetMode === 'from'
                                ? 'Source Stock'
                                : sheetMode === 'to'
                                    ? 'Destination Stock'
                                    : sheetMode === 'products'
                                        ? 'Select Product'
                                        : 'Add Product'}
                        </ThemedText>
                    </View>

                    {/* FROM */}

                    {sheetMode === 'from' && (
                        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
                            {stockLocations.map((stock, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => selectFromStock(stock)}
                                    style={[
                                        styles.option,
                                        {
                                            backgroundColor:
                                                Number(fromStock?.key) === Number(stock.key)
                                                    ? theme.primary
                                                    : theme.card,
                                            borderColor: theme.border
                                        }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            {
                                                color:
                                                    Number(fromStock?.key) === Number(stock.key)
                                                        ? '#fff'
                                                        : theme.text
                                            }
                                        ]}
                                    >
                                        {stock.value}
                                    </Text>

                                    {Number(fromStock?.key) === Number(stock.key) && (
                                        <IconSymbol name="check" size={18} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </BottomSheetScrollView>
                    )}

                    {/* TO */}

                    {sheetMode === 'to' && (
                        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
                            {stockLocations
                                .filter(stock => Number(stock.key) !== Number(fromStock?.key))
                                .map((stock, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => selectToStock(stock)}
                                        style={[
                                            styles.option,
                                            {
                                                backgroundColor:
                                                    Number(toStock?.key) === Number(stock.key)
                                                        ? theme.primary
                                                        : theme.card,
                                                borderColor: theme.border
                                            }
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                {
                                                    color:
                                                        Number(toStock?.key) === Number(stock.key)
                                                            ? '#fff'
                                                            : theme.text
                                                }
                                            ]}
                                        >
                                            {stock.value}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </BottomSheetScrollView>
                    )}

                    {/* PRODUCTS */}

                    {sheetMode === 'products' && (
                        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
                            {availableProducts.map((product, index) => {
                                const productID = getProductID(product);
                                const alreadySelected = selectedProductIDs.has(productID);
                                const image = productImage(product);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        disabled={alreadySelected}
                                        onPress={() => openProduct(product)}
                                        style={[
                                            styles.productOption,
                                            {
                                                backgroundColor: alreadySelected
                                                    ? theme.subtleBackground
                                                    : theme.card,
                                                borderColor: theme.border,
                                                opacity: alreadySelected ? 0.5 : 1
                                            }
                                        ]}
                                    >
                                        {image ? (
                                            <Image source={{ uri: image }} style={styles.productImage} />
                                        ) : (
                                            <View style={[styles.productImage, { backgroundColor: theme.subtleBackground }]}>
                                                <IconSymbol name="archive" size={20} color={theme.subtleText} />
                                            </View>
                                        )}

                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.optionText, { color: theme.text }]}>
                                                {productName(product)}
                                            </Text>

                                            <Text style={[styles.stockText, { color: theme.subtleText }]}>
                                                Available: {getAvailable(product)}
                                            </Text>
                                        </View>

                                        {alreadySelected ? (
                                            <IconSymbol name="check" size={18} color={theme.success} />
                                        ) : (
                                            <IconSymbol name="chevron.right" size={18} color={theme.subtleText} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            {!availableProducts.length && (
                                <Text style={[styles.emptySheet, { color: theme.subtleText }]}>
                                    No products available in this stock.
                                </Text>
                            )}
                        </BottomSheetScrollView>
                    )}

                    {/* ADD PRODUCT */}

                    {sheetMode === 'add' && selectedProduct && (
                        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
                            {/* PRODUCT */}

                            <View style={[styles.selectedProduct, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                {productImage(selectedProduct) ? (
                                    <Image
                                        source={{ uri: productImage(selectedProduct) }}
                                        style={styles.largeProductImage}
                                    />
                                ) : (
                                    <View style={[styles.largeProductImage, { backgroundColor: theme.subtleBackground }]}>
                                        <IconSymbol name="archive" size={25} color={theme.subtleText} />
                                    </View>
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.productName, { color: theme.text }]}>
                                        {productName(selectedProduct)}
                                    </Text>

                                    <Text style={[styles.stockText, { color: theme.subtleText }]}>
                                        Available: {getAvailable(selectedProduct)}
                                    </Text>
                                </View>
                            </View>

                            {/* UOM */}

                            <Text style={[styles.fieldLabel, { color: theme.subtleText }]}>
                                Unit of Measure
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 7, paddingBottom: 15 }}
                            >
                                {productUOMs.map((uom: any, index: number) => {
                                    const selected = Number(selectedUOM?.id) === Number(uom.id);

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => setSelectedUOM(uom)}
                                            style={[
                                                styles.uomButton,
                                                {
                                                    backgroundColor: selected
                                                        ? theme.primary
                                                        : theme.card,
                                                    borderColor: selected
                                                        ? theme.primary
                                                        : theme.border
                                                }
                                            ]}
                                        >
                                            <Text
                                                style={{
                                                    color: selected ? '#fff' : theme.text,
                                                    fontSize: 11,
                                                    fontFamily: 'Medium'
                                                }}
                                            >
                                                {uom.name || uom.shortCode}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {!productUOMs.length && (
                                <Text style={[styles.emptySheet, { color: theme.error }]}>
                                    No UOM available for this product.
                                </Text>
                            )}

                            {/* QUANTITY */}

                            <Text style={[styles.fieldLabel, { color: theme.subtleText }]}>
                                Quantity
                            </Text>

                            <TextInput
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="decimal-pad"
                                placeholder="Enter quantity"
                                placeholderTextColor={theme.subtleText}
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        backgroundColor: theme.inputBackground,
                                        borderColor: theme.border
                                    }
                                ]}
                            />

                            {/* ADD */}

                            <TouchableOpacity
                                disabled={!selectedUOM || !quantity}
                                onPress={addProduct}
                                style={[
                                    styles.submitButton,
                                    {
                                        backgroundColor:
                                            !selectedUOM || !quantity
                                                ? theme.border
                                                : theme.primary
                                    }
                                ]}
                            >
                                <Text style={styles.submitText}>Add Product</Text>
                            </TouchableOpacity>
                        </BottomSheetScrollView>
                    )}
                </BottomSheet>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    statusBarSpacer: { width: '100%', height: 10 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1
    },

    backButton: {
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

    locationCard: {
        borderWidth: 1,
        borderRadius: Borders.radiusMedium,
        padding: 15,
        marginBottom: 18
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },

    connector: {
        width: 1,
        height: 15,
        marginLeft: 5,
        marginVertical: 3
    },

    label: {
        fontSize: 10,
        fontFamily: 'Regular',
        marginBottom: 3
    },

    value: {
        fontSize: 13,
        fontFamily: 'SemiBold'
    },

    changeText: {
        fontSize: 11,
        fontFamily: 'SemiBold'
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
    },

    sectionTitle: {
        fontSize: 14,
        fontFamily: 'SemiBold'
    },

    countBadge: {
        minWidth: 23,
        height: 23,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6
    },

    countText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'SemiBold'
    },

    emptyCard: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: 30,
        alignItems: 'center',
        marginBottom: 10
    },

    emptyTitle: {
        fontSize: 13,
        fontFamily: 'SemiBold',
        marginTop: 10
    },

    emptyText: {
        fontSize: 11,
        fontFamily: 'Regular',
        textAlign: 'center',
        marginTop: 5,
        lineHeight: 17
    },

    productCard: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: 11,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7
    },

    productImage: {
        width: 42,
        height: 42,
        borderRadius: 7,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },

    largeProductImage: {
        width: 55,
        height: 55,
        borderRadius: 8,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },

    productName: {
        fontSize: 12,
        fontFamily: 'SemiBold'
    },

    productQuantity: {
        fontSize: 10,
        fontFamily: 'Regular',
        marginTop: 3
    },

    removeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center'
    },

    addButton: {
        height: 46,
        borderRadius: Borders.radiusSmall,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        marginTop: 8
    },

    addButtonText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'SemiBold'
    },

    footer: {
        padding: Spacing.screenPadding,
        borderTopWidth: 1
    },

    submitButton: {
        height: 46,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center',
        justifyContent: 'center'
    },

    submitText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'SemiBold'
    },

    sheetHeader: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 7,
        paddingBottom: 13
    },

    sheetTitle: {
        fontSize: 18,
        fontFamily: 'SemiBold'
    },

    sheetContent: {
        paddingHorizontal: 16,
        paddingBottom: 30
    },

    option: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: 14,
        marginBottom: 7,
        flexDirection: 'row',
        alignItems: 'center'
    },

    optionText: {
        fontSize: 12,
        fontFamily: 'Medium'
    },

    productOption: {
        minHeight: 62,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: 12,
        marginBottom: 7,
        flexDirection: 'row',
        alignItems: 'center'
    },

    stockText: {
        fontSize: 10,
        fontFamily: 'Regular',
        marginTop: 3
    },

    emptySheet: {
        textAlign: 'center',
        paddingVertical: 30,
        fontSize: 12
    },

    selectedProduct: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18
    },

    fieldLabel: {
        fontSize: 11,
        fontFamily: 'Medium',
        marginBottom: 6
    },

    uomButton: {
        minWidth: 70,
        height: 40,
        paddingHorizontal: 13,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center',
        justifyContent: 'center'
    },

    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: 14,
        fontSize: 13,
        fontFamily: 'Regular',
        marginBottom: 15
    }
});

export default MoveStockScreen;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Typography, Borders } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { fullDateTime, SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '../../../utils/constants/Currency';

type TStockInListScreen = NativeStackScreenProps<InventoryNavigationList, "StockInListScreen">
const StockInListScreen = ({navigation}: TStockInListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, can, userBranch } = useAppContainer();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [stockInList, setStockInList] = useState<any[]>([]);

    const fetchStockIn = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-stock-ins', { sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id }, (response: any) => {
            if (response.status === "success") {
                setStockInList(response.data);
            } else {
                Alert.alert("Error", response.message || "Failed to fetch stock-in records");
            }
        });
    };

    useFocusEffect(
        useCallback(() => {
            fetchStockIn();
        }, [])
    )

    const confirmStockIn = async (id:number) => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('confirm-stock-in', { sessionID: session, businessID: selectedBusiness.id, hiddenID: id, branchID: userBranch.id }, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message)
                fetchStockIn()
            } else {
                Alert.alert("Error", response.message || "Failed to add confirm stock in", [
                    { text: "Retry", onPress: () => confirmStockIn(id) },
                    { text: "Cancel", style: "cancel" },
                ],
                { cancelable: true })
            }
        })
    }

    const ask = (id:number, lineAmount:number, totalAmount:number) => {
        if (lineAmount !== totalAmount) {
            Alert.alert("Confirmation", "There seem to be some inconsistency in the amount difference. Are you sure you want to confirm this stock in invoice?", [
                { text: "Yes, Confirm", onPress: () => confirmStockIn(id) },
                { text: "Cancel", style: "cancel" },
            ],
            { cancelable: true })
            return
        }
        Alert.alert("Confirmation", "Are you sure you want to confirm this stock in invoice?", [
            { text: "Yes, Confirm", onPress: () => confirmStockIn(id) },
            { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true })
    }

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return stockInList;
        return stockInList.filter(option =>
            String(option.referenceNumber).toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery, stockInList])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={[ styles.statusBarSpacer, { height: 10, backgroundColor: themeColors.background} ]} />}
            <View style={[ styles.safeArea, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    {isSearchVisible ? (
                        <View style={styles.searchHeaderContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={() => { setIsSearchVisible(false); setSearchQuery(''); }}>
                                <IconSymbol name="arrow.left" size={22} color={themeColors.text} />
                            </TouchableOpacity>
                            <View style={[styles.searchInputContainer, { backgroundColor: themeColors.inputBackground }]}>
                                <IconSymbol name="magnifyingglass" size={18} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.searchInputField, { color: themeColors.text }]}
                                    placeholder="Search stock in"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                            </TouchableOpacity>
                            <ThemedText style={styles.headerTitle}>Stock Ins</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[styles.iconButton, { backgroundColor: themeColors.card }]} onPress={() => setIsSearchVisible(true)}>
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                                {can("inventory.stock.create_update") && (
                                    <TouchableOpacity onPress={()=> navigation.navigate("StockInFormScreen", {data: {}})} style={[styles.iconButton, { backgroundColor: themeColors.card }]}>
                                        <IconSymbol name="plus" size={22} color={themeColors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </ThemedView>
                <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + Spacing.screenPadding }]} showsVerticalScrollIndicator={false}>
                    <View style={styles.tabContent}>
                        {filteredOptions.length > 0 ? filteredOptions.map((item, index) => (
                            <TouchableOpacity key={index} style={[styles.accountCard, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} onPress={()=> navigation.navigate('StockInItemDetailScreen', {data: item})} activeOpacity={0.8}>
                                <View style={styles.accountCardContent}>
                                    <View style={styles.accountTitleRow}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', width: '70%'}}>
                                            <View style={{flexDirection: 'column'}}>
                                                <Text style={{...styles.accountName, color: themeColors.text, textTransform: 'uppercase'}} numberOfLines={1}>{item.referenceNumber || "No Ref"} ( {item.status} )</Text>
                                                <Text style={[styles.accountType, { color: themeColors.subtleText }]}>Supplier: {item.supplier_name || 'Unknown Supplier'}</Text>
                                                <Text style={[styles.accountType, { color: themeColors.subtleText }]}>Invoice Date: {fullDateTime(item.invoiceDate) || 'N/A'}</Text>
                                                <Text style={[styles.accountType, { color: themeColors.subtleText }]}>Invoice Total: <Text style={{color: themeColors.warning}}>{formatCurrency(Number(item.totalAmountBase) || 0, {symbol: item.business_currency_symbol})} ( Invoice Currency {formatCurrency(Number(item.totalAmount) || 0, {symbol: item.invoice_currency_symbol})} )</Text></Text>
                                                <Text style={[styles.accountType, { color: themeColors.subtleText }]}>Line Items Total: <Text style={{color: themeColors.info}}>{formatCurrency(Number(item.lineTotal) || 0, {symbol: item.invoice_currency_symbol})}</Text></Text>
                                            </View>
                                        </View>
                                        {item.status !== "confirmed" ? (
                                            <View style={{flexDirection: 'row', width: '25%', justifyContent: 'flex-end'}}>
                                                <TouchableOpacity activeOpacity={0.8} onPress={()=> navigation.navigate("StockInItemsFormScreen", {data: item})} style={[ styles.iconButton, { backgroundColor: themeColors.tabIconDefault } ]} >
                                                    <IconSymbol name="document-outline" size={18} color={themeColors.white} />
                                                </TouchableOpacity>
                                                {can("inventory.stock_in.confirm") && (
                                                    <TouchableOpacity activeOpacity={0.8} onPress={()=> ask(Number(item.id), Number(item.lineTotal) || 0, Number(item.totalAmountBase) || 0)} style={[ styles.iconButton, { backgroundColor: themeColors.tabIconDefault } ]} >
                                                        <IconSymbol name="check" size={18} color={themeColors.white} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No records found</ThemedText>}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    statusBarSpacer: { width: '100%' },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.medium, borderBottomWidth: 1 },
    backButtonMain: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.small },
    searchHeaderContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 0 },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.medium },
    searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.medium, borderRadius: Borders.radiusMedium },
    searchInputField: { flex: 1, fontSize: Typography.body, marginLeft: Spacing.small, fontFamily: 'Regular', paddingVertical: 12 },
    content: { flex: 1 },
    contentContainer: { padding: Spacing.small },
    tabContent: { flex: 1 },
    accountCard: {
        borderRadius: 2,
        overflow: 'hidden',
        borderBottomWidth: 0.09,
        borderLeftWidth: 3,
        marginBottom: 3
    },
    accountCardContent: {
        padding: Spacing.large,
        position: 'relative',
    },
    accountTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    accountName: {
        fontSize: 11,
        fontFamily: 'SemiBold',
        marginBottom: 5
    },
    mainBadge: {
        paddingHorizontal: Spacing.small,
        paddingVertical: 2,
        borderRadius: Borders.radiusSmall,
    },
    mainBadgeText: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold',
    },
    accountType: {
        fontFamily: 'Regular',
        fontSize: Typography.small,
    },
});

export default StockInListScreen;

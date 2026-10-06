import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BusinessNavigationList, HomeNavigationList, InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type TStockListScreen = NativeStackScreenProps<InventoryNavigationList, "StockListScreen">
const StockListScreen = ({navigation}: TStockListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, can } = useAppContainer()

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [dataList, setDataList] = useState<any[]>([])

    const fetchStockLocation = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-stock-locations' , { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") {
                setDataList(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching stock locations", response.message)
            }
        })
    }

    useEffect(()=> {
        fetchStockLocation()
    }, [])

    useFocusEffect(
        useCallback(() => {
            fetchStockLocation()
        }, [])
    )

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return dataList;
        return dataList.filter(option =>
            String(option.name).toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery, dataList])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    {isSearchVisible ? ( <View style={styles.searchHeaderContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => { setIsSearchVisible(false); setSearchQuery('') }}>
                            <IconSymbol name="arrow.left" size={22} color={themeColors.text} />
                        </TouchableOpacity>
                        <View style={[ styles.searchInputContainer, { backgroundColor: themeColors.inputBackground } ]} >
                            <IconSymbol name="magnifyingglass" size={18} color={themeColors.subtleText} />
                            <TextInput
                                style={[styles.searchInputField, { color: themeColors.text }]}
                                placeholder="Search product category"
                                placeholderTextColor={themeColors.subtleText}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                    </View> ) : (
                        <>
                            <TouchableOpacity onPress={()=> navigation.popToTop()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                            </TouchableOpacity>
                            <ThemedText style={styles.headerTitle}>Stock Location</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} onPress={() => setIsSearchVisible(true)} >
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                                {can("inventory.stock_location.create_update") && (
                                    <TouchableOpacity onPress={()=> navigation.navigate("StockFormScreen", {data: {}})} style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} >
                                        <IconSymbol name="plus" size={22} color={themeColors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </ThemedView>
                <ScrollView style={styles.content} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + Spacing.screenPadding }]} showsVerticalScrollIndicator={false}>
                    <View style={styles.tabContent}>
                        <View style={styles.accountsList}>
                            {filteredOptions.length > 0 ? filteredOptions.map((item, index) => (
                                <TouchableOpacity key={index} style={[styles.accountCard, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} onPress={()=> {}} activeOpacity={0.8}>
                                    <View style={styles.accountCardContent}>
                                        <View style={styles.accountTitleRow}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', width: '65%'}}>
                                                <View style={{flexDirection: 'column'}}>
                                                    <Text style={{...styles.accountName, color: themeColors.text}} numberOfLines={1}>{item.name || ''} ({item.code || ''})</Text>
                                                    <Text style={[styles.accountType, { color: themeColors.subtleText }]}>
                                                        {item.description || 'Not Set'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={{flexDirection: 'row', width: '30%', justifyContent: 'flex-end'}}>
                                                <TouchableOpacity onPress={()=> navigation.navigate("StockFormScreen", {data: item})} style={[ styles.iconButton, { backgroundColor: themeColors.tabIconDefault } ]} >
                                                    <IconSymbol name="pencil" size={18} color={themeColors.white} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No records found</ThemedText>}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    backButtonMain: {
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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: Typography.heading1,
        fontFamily: "Bold"
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.small,
    },
    searchHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 0,
    },
    backButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.medium,
        width: 40,
        height: 40,
        flexShrink: 0,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.medium,
        borderRadius: Borders.radiusMedium,
    },
    searchInputField: {
        flex: 1,
        fontSize: Typography.body,
        marginLeft: Spacing.small,
        fontFamily: 'Regular',
        paddingVertical: 12
    },
    tabContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: Typography.heading3,
        fontFamily: 'Bold',
        marginBottom: Spacing.large,
    },
    accountsList: {
        gap: 3,
    },
    accountCard: {
        borderRadius: 2,
        overflow: 'hidden',
        borderBottomWidth: 0.09,
        borderLeftWidth: 3
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
})

export default StockListScreen;

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BusinessNavigationList, HomeNavigationList, InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { shortenText, SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../../configuration/credentials';
import { Image } from 'expo-image';

type TProductListScreen = NativeStackScreenProps<InventoryNavigationList, "ProductListScreen">
const ProductListScreen = ({navigation}: TProductListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, can, userBranch } = useAppContainer()

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [productCategory, setProductCategoryList] = useState<any[]>([])
    const [isLoading, setLoading] = useState(false)
    const [allProducts, setAllProducts] = useState<any[]>([])
    const [productList, setProductList] = useState<any[]>([])
    const [selectedCategoryID, setSelectedCategoryID] = useState<number | null>(null);

    const fetchProducts = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-products' , {sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id }, (response: any) => {
            if (response.status === "success") {
                setAllProducts(response.data || [])
                setProductList(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching product", response.message)
            }
        })
    }

    const fetchProductCategory = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-product-categories' , { sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id }, (response: any) => {
            if (response.status === "success") {
                setProductCategoryList(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching product category", response.message)
            }
        })
    }

    const handleCategoryFilter = (categoryID: number | null) => {
        setSelectedCategoryID(categoryID)
        if (categoryID === null) {
            setProductList(allProducts)
            return
        }
        const filtered = allProducts.filter(product => product.productCategoryID === categoryID)
        setProductList(filtered)
        if (filtered.length === 0) {
            if (!selectedBusiness?.id) return
            SocketIO.emit("fetch-products", { sessionID: session, businessID: selectedBusiness.id, productCategoryID: categoryID, branchID: userBranch.id }, (response:any) => {
                if (response.status === "success") {
                    setProductList(response.data || [])
                } else {
                    setProductList([])
                }
            })
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchProductCategory()
            fetchProducts()
        }, [])
    )

    const categoriesWithAll = [{ id: null, categoryName: "All Categories" }, ...productCategory]

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return productList
        return productList.filter(option =>
            String(option.name).toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery, productList])

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
                                placeholder="Search products"
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
                            <ThemedText style={styles.headerTitle}>Products</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} onPress={() => setIsSearchVisible(true)} >
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                                {can("inventory.product.create_update") && (
                                    <TouchableOpacity onPress={()=> navigation.navigate("ProductFormScreen", {data: {}})} style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} >
                                        <IconSymbol name="plus" size={22} color={themeColors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </ThemedView>
                <View style={styles.tabContent}>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 3}}>
                        <View style={{width: '40%', flex: 1}}>
                            <ScrollView style={styles.content} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + Spacing.screenPadding }]} showsVerticalScrollIndicator={false}>
                                <View style={styles.accountsList}>
                                    {categoriesWithAll.length > 0 ? categoriesWithAll.map((item, index) => (
                                        <TouchableOpacity key={index} style={[styles.pCAccountCard, { backgroundColor: themeColors.card, borderBottomWidth: selectedCategoryID === item.id ? 3 : 0, borderBottomColor: selectedCategoryID === item.id ? themeColors.primary : themeColors.card }]} onPress={() => handleCategoryFilter(item.id)} activeOpacity={0.8}>
                                            <View style={styles.accountCardContent}>
                                                <View style={styles.accountTitleRow}>
                                                    <View style={{flexDirection: 'row', alignItems: 'center', width: '65%'}}>
                                                        <Text style={{...styles.pCAccountName, color: themeColors.text}}>{item?.categoryName || ''}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    )) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>0 categories found</ThemedText>}
                                </View>
                            </ScrollView>
                        </View>
                        <View style={{width: '60%'}}>
                            <ScrollView contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + Spacing.screenPadding }]} showsVerticalScrollIndicator={false}>
                                <View style={styles.accountsList}>
                                    {filteredOptions.length > 0 ? filteredOptions.map((item, index) => {
                                        let image = JSON.parse(item.images || '[]')
                                        let stockIndicator = item.stock?.trim() ? item.stock?.trim() : null
                                        return (
                                            <TouchableOpacity key={index} style={[styles.accountCard, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} onPress={()=> navigation.navigate('ProductDetailScreen', {data: item})} activeOpacity={0.8}>
                                                <View style={styles.accountCardContent}>
                                                    <View style={styles.accountTitleRow}>
                                                        <View style={{flexDirection: 'row', alignItems: 'center', width: '65%'}}>
                                                            {image.length > 0 ? <Image cachePolicy="memory-disk" source={{ uri:  `${API_URL}${image[0]?.path}` }}
                                                            style={{height: 50, width: 50, marginRight: 10, borderRadius: 10, marginTop: 5}} /> : <Image source={require('./../../../assets/no-image.png')}
                                                            style={{height: 50, width: 50, marginRight: 10, borderRadius: 10, marginTop: 5}} /> }
                                                            <View style={{flexDirection: 'column'}}>
                                                                <Text style={{...styles.accountName, color: themeColors.text}} numberOfLines={1}>{item.name || ''}</Text>
                                                                <Text style={[styles.accountType, { color: themeColors.subtleText, textTransform: 'capitalize' }]}>{stockIndicator || ''}{stockIndicator && " \n"}Default Reorder Level: {Number(item.reorderLevel || 0)}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    }) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>0 products found</ThemedText>}
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </View>
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
        padding: 3,
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
    pCAccountCard: {
        borderRadius: 2,
        overflow: 'hidden'
    },
    accountCardContent: {
        padding: Spacing.large,
        position: 'relative',
    },
    accountTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountName: {
        fontSize: 11,
        fontFamily: 'SemiBold',
        marginBottom: 2
    },
    pCAccountName: {
        fontSize: 10,
        fontFamily: 'SemiBold'
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

export default ProductListScreen;

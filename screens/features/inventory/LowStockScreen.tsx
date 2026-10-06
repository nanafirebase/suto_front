import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol, IconSymbolName } from '../../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { API_URL } from '../../../configuration/credentials';
import { useFocusEffect } from '@react-navigation/native';
import { MainStatCard } from '../../../components/ui/cards/MainStatCard';
import * as Linking from 'expo-linking'

type Supplier = {
    supplierID: number
    supplierName: string
    phone?: string
    email?: string
}

type LowStockItem = {
    productID: number
    stockID: number
    baseQuantity: number
    reorderLevel: number
    productName: string

    totalSoldLast7Days: number
    avgDailySales: number
    estimatedDaysRemaining: number | null
    suggestedReorderQuantity: number

    urgency: 'critical' | 'warning' | 'low' | 'healthy'

    insightMessage: string
    suppliers?: Supplier[]
}

type LowStockResponse = {
    totalProducts: number
    total: number
    criticalCount: number
    warningCount: number
    items: LowStockItem[]
}

const buildWhatsAppMessage = (productName: string, qty: number) => {
	return `
Hello, I want to reorder:

Product: ${productName}
Quantity: ${qty}

Please confirm availability and price.`
}


type TLowStockScreen = NativeStackScreenProps<InventoryNavigationList, "LowStockScreen">
const LowStockScreen = ({navigation}: TLowStockScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()
    const [data, setData] = useState<LowStockResponse>({
        totalProducts: 0,
        total: 0,
        criticalCount: 0,
        warningCount: 0,
        items: []
    })

    const sheetRef = useRef<BottomSheet>(null)
    const bulkSheetRef = useRef<BottomSheet>(null)

    const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null)
    const [qty, setQty] = useState<number>(0)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [bulkMap, setBulkMap] = useState<Record<number, { supplier: Supplier, items: LowStockItem[]}>>({})
    const [bulkQtyMap, setBulkQtyMap] = useState<Record<number, number>>({})

    const openReorderSheet = (item: LowStockItem, supplier?: Supplier) => {
        setSelectedItem(item)
        setQty(item.suggestedReorderQuantity)
        setSelectedSupplier(supplier || item.suppliers?.[0] || null)
        sheetRef.current?.snapToIndex(0)
    }

    const formatWhatsAppPhone = (phone: string) => {
        if (!phone) return ''
    
        // remove everything except digits
        let cleaned = phone.replace(/\D/g, '')
    
        // Ghana format handling
        // 0241234567 -> 233241234567
        if (cleaned.startsWith('0')) {
            cleaned = `233${cleaned.substring(1)}`
        }
    
        // already starts with 233
        if (cleaned.startsWith('233')) {
            return cleaned
        }
    
        // fallback for numbers without country code
        if (cleaned.length === 9) {
            cleaned = `233${cleaned}`
        }
    
        return cleaned
    }

    const openWhatsApp = () => {
        if (!selectedSupplier?.phone || !selectedItem) return
        const msg = buildWhatsAppMessage(selectedItem.productName, qty)
        const cleanPhone = formatWhatsAppPhone(selectedSupplier.phone)
        Linking.openURL(
            `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
        )
    }

    const call = () => {
        if (!selectedSupplier?.phone) return
        Linking.openURL(`tel:${selectedSupplier.phone}`)
    }

	const sms = () => {
        if (!selectedSupplier?.phone || !selectedItem) return
        const msg = `Hi ${selectedSupplier.supplierName}, need stock for ${selectedItem.productName} (${qty} units).`
        Linking.openURL(
            `sms:${selectedSupplier.phone}?body=${encodeURIComponent(msg)}`
        )
    }

    const buildBulkWhatsAppMessage = (supplierName: string, items: LowStockItem[], qtyMap: Record<number, number>) => {
        let msg = `Hello ${supplierName},\n\nI want to reorder the following items:\n\n`
        items.forEach(i => {
            msg += `• ${i.productName} - Qty: ${qtyMap[i.productID] ?? i.suggestedReorderQuantity}\n`
        })
        msg += `\nPlease confirm availability and pricing.`
        return msg
    }

    const openBulkWhatsApp = (group: { supplier: Supplier, items: LowStockItem[] }) => {
        try {
            const phone = group.supplier.phone
            if (!phone) return
            const qtyMap: Record<number, number> = {}
            group.items.forEach(i => {
                qtyMap[i.productID] = i.suggestedReorderQuantity
            })
            const msg = buildBulkWhatsAppMessage(
                group.supplier.supplierName,
                group.items,
                qtyMap
            )
            const cleanPhone = formatWhatsAppPhone(phone)
            Linking.openURL(
                `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
            )
        } catch (error:any) {
            Alert.alert("error", error.message)
        }
    }

    const openBulkSMS = (group: { supplier: Supplier, items: LowStockItem[] }) => {
        const phone = group.supplier.phone
        if (!phone) return
        const text =
            `Bulk reorder:\n` +
            group.items.map(i =>
                `- ${i.productName} (${i.suggestedReorderQuantity})`
            ).join('\n')
        Linking.openURL(
            `sms:${phone}?body=${encodeURIComponent(text)}`
        )
    }

    const fetchLowStockProducts = () => {
        SocketIO.emit(
            'fetch-low-stock-products', { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
                if (response.status === 'success') {
                    setData(response.data);
                    // console.log({data})
                } else {
                    Alert.alert('Error', response.message || 'Failed to fetch product running out');
                }
            }
        );
    };

    useFocusEffect(
        useCallback(() => {
            fetchLowStockProducts();
        }, [])
    );

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return '#D32F2F'
            case 'warning': return '#F57C00'
            case 'low': return '#FBC02D'
            default: return '#388E3C'
        }
    }

    const getUrgencyIcon = (urgency: string): IconSymbolName => {
        switch (urgency) {
            case 'critical': return 'close'
            case 'warning': return 'warn'
            case 'low': return 'alert'
            default: return 'checkmark.circle.fill'
        }
    }

    const initBulkSupplierOrder = (supplier: Supplier, items: LowStockItem[]) => {
        setBulkMap(prev => {
            const exists = prev[supplier.supplierID]
            if (exists) return prev
            return {
                ...prev,
                [supplier.supplierID]: {
                    supplier,
                    items
                }
            }
        })
        setBulkQtyMap(prev => {
            const copy = { ...prev }
            items.forEach(i => {
                copy[i.productID] = i.suggestedReorderQuantity
            })
            return copy
        })
        bulkSheetRef.current?.snapToIndex(0)
    }

    const supplierGroups = useMemo(() => {
        const map: Record<number, { supplier: Supplier; items: LowStockItem[] }> = {}
        data.items.forEach(item => {
            item.suppliers?.forEach(s => {
                if (!map[s.supplierID]) {
                    map[s.supplierID] = {
                        supplier: s,
                        items: []
                    }
                }
                map[s.supplierID].items.push(item)
            })
        })
        return Object.values(map)
    }, [data.items])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Low Stock Products</ThemedText>
                    <View style={{ width: 32 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <MainStatCard id='products' value={data.totalProducts.toString() || '0'} themeColors={themeColors} width={'32%'} />
                            <MainStatCard id='low-stocks' value={data.total.toString() || '0'} themeColors={themeColors} width={'32%'} />
                            <MainStatCard id='expiring-soon' value={data.criticalCount.toString() || '0'} themeColors={themeColors} width={'32%'} title={'Critical'} />
                        </View>
                        <View style={{ gap: 3 }}>
                            {data.items.length > 0 ? data.items.map((item, index) => {
                                const urgencyColor = getUrgencyColor(item.urgency)
                                const urgencyIcon = getUrgencyIcon(item.urgency)
                                return (
                                    <TouchableOpacity key={index} style={[styles.card, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]}>
                                        <View style={{ paddingHorizontal: Spacing.medium, paddingVertical: Spacing.small, flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontFamily: 'SemiBold', color: themeColors.text, fontSize: 15 }}>
                                                    {item.productName}
                                                </Text>
                                                <Text style={{ fontFamily: 'Regular', color: themeColors.subtleText, fontSize: 11, marginTop: 4 }}>
                                                    {item.insightMessage}
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: urgencyColor, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                <IconSymbol name={urgencyIcon} size={13} color='#fff' />
                                                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'SemiBold', textTransform: 'uppercase' }}>
                                                    {item.urgency}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 }}>
                                            <View style={[styles.metricBox, { backgroundColor: themeColors.subtleBackground }]}>
                                                <Text style={{...styles.metricLabel, color: themeColors.subtleText}}>Stock Left</Text>
                                                <Text style={{...styles.metricValue, color: themeColors.text}}>{Number(item.baseQuantity || 0)}</Text>
                                            </View>
                                            <View style={[styles.metricBox, { backgroundColor: themeColors.subtleBackground }]}>
                                                <Text style={{...styles.metricLabel, color: themeColors.subtleText}}>Daily Sales</Text>
                                                <Text style={{...styles.metricValue, color: themeColors.text}}>{Number(item.avgDailySales || 0)}</Text>
                                            </View>
                                            <View style={[styles.metricBox, { backgroundColor: themeColors.subtleBackground }]}>
                                                <Text style={{...styles.metricLabel, color: themeColors.subtleText}}>Reorder</Text>
                                                <Text style={{...styles.metricValue, color: themeColors.text}}>{Number(item.suggestedReorderQuantity || 0)}</Text>
                                            </View>
                                        </View>
                                        {item.suppliers?.length ? (
                                            <View style={{ marginTop: 12 }}>
                                                <Text style={{ fontFamily: 'SemiBold', fontSize: 12, color: themeColors.text }}>
                                                    Reorder Suppliers
                                                </Text>

                                                {item.suppliers.map((s, i) => (
                                                    <View key={i} style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 10, borderLeftWidth: 2, borderRadius: 3, borderLeftColor: themeColors.warning }}>
                                                        <Text style={{ fontFamily: 'Regular', fontSize: 13, color: themeColors.text }}>
                                                            Place reorder with {s.supplierName}
                                                        </Text>

                                                        {s.phone ? (
                                                            <Text style={{ fontSize: 11, color: themeColors.subtleText, marginTop: 2 }}>
                                                                {s.phone}
                                                            </Text>
                                                        ) : null}
                                                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                                            <TouchableOpacity style={{...styles.reorderBtn, width:'49%'}} onPress={() => openReorderSheet(item)}>
                                                                <Text style={{ color: '#fff' }}>Reorder Single</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity style={{...styles.reorderBtn, width:'49%', backgroundColor: themeColors.tomato}} onPress={() => {
                                                                    const group = supplierGroups.find(g => g.supplier.supplierID === s.supplierID)
                                                                    if (!group) return
                                                                    initBulkSupplierOrder(group.supplier, group.items)
                                                                }}>
                                                                <Text style={{ color: '#fff' }}>Bulk Reorder</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : null}
                                    </TouchableOpacity>
                                )
                            }) : null}
                        </View>
                    </ScrollView>
                    <BottomSheet ref={sheetRef} index={-1} snapPoints={['45%']} enablePanDownToClose backgroundStyle={{ backgroundColor: themeColors.card, borderTopWidth: 1, borderTopColor: themeColors.info }} handleIndicatorStyle={{ backgroundColor: themeColors.subtleText }}>
                        <BottomSheetScrollView contentContainerStyle={{ padding: 16 }}>

                            <Text style={{ fontFamily: 'SemiBold', fontSize: 16, color: themeColors.text }}>
                                Reorder {selectedItem?.productName}
                            </Text>

                            <Text style={{ marginTop: 6, color: themeColors.subtleText }}>
                                Select quantity and supplier
                            </Text>

                            {/* Quantity controls */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 }}>
                                <TouchableOpacity onPress={() => setQty(q => Math.max(0, q - 1))}>
                                    <IconSymbol name="remove.circle" size={22} color={themeColors.text} />
                                </TouchableOpacity>

                                <Text style={{ fontSize: 18, fontFamily: 'SemiBold', color: themeColors.text }}>
                                    {qty}
                                </Text>

                                <TouchableOpacity onPress={() => setQty(q => q + 1)}>
                                    <IconSymbol name="plus.circle" size={22} color={themeColors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Supplier list */}
                            <View style={{ marginTop: 20 }}>
                                {selectedItem?.suppliers?.map((s, i) => {
                                    const active = selectedSupplier?.supplierID === s.supplierID

                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => setSelectedSupplier(s)}
                                            style={{
                                                borderWidth: 1,
                                                borderRadius: Borders.radiusSmall,
                                                paddingHorizontal: Spacing.medium,
                                                paddingVertical: Spacing.large,
                                                borderColor: active ? themeColors.primary : themeColors.border,
                                                marginBottom: 10
                                            }}
                                        >
                                            <Text style={{ fontFamily: 'SemiBold', color: themeColors.text, fontSize: Typography.small, }}>
                                                {s.supplierName}
                                            </Text>

                                            {s.phone ? (
                                                <Text style={{ fontSize: 11, color: themeColors.subtleText }}>
                                                    {s.phone}
                                                </Text>
                                            ) : null}
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>

                            {/* Actions */}
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'space-between' }}>
                                <TouchableOpacity
                                    onPress={openWhatsApp}
                                    style={{ flex: 1, padding: 12, backgroundColor: '#25D366', borderRadius: 10, flexDirection: 'row', alignItems: 'center', width: '75%', justifyContent: 'center' }}
                                >
                                    <IconSymbol name='whatsapp' size={25} color={'#fff'} />
                                    <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'SemiBold' }}> WhatsApp Order</Text>
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '25%', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={call} style={[ styles.iconButton, { backgroundColor: '#1976D2' } ]} >
                                        <IconSymbol name='phone' size={26} color='#fff' />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={sms} style={[ styles.iconButton, { backgroundColor: '#F57C00' } ]} >
                                        <IconSymbol name='sms' size={26} color='#fff' />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </BottomSheetScrollView>
                    </BottomSheet>
                    <BottomSheet ref={bulkSheetRef} index={-1} snapPoints={['70%']} enablePanDownToClose backgroundStyle={{ backgroundColor: themeColors.card, borderTopWidth: 1, borderTopColor: themeColors.info }} handleIndicatorStyle={{ backgroundColor: themeColors.subtleText }}>
                        <BottomSheetScrollView style={{ padding: 16 }}>
                            {Object.values(bulkMap).length === 0 ? (
                                <Text style={{ marginTop: 20, color: themeColors.subtleText }}>
                                    No items selected
                                </Text>
                            ) : (
                                Object.values(bulkMap).map((group, i) => (
                                    <View key={i} style={{ marginTop: 0 }}>
                                        <Text style={{ fontFamily: 'SemiBold', color: themeColors.text, fontSize: 16, marginBottom: 15 }}>
                                            Placing Bulk Orders with {group.supplier.supplierName}
                                        </Text>
                                        {group.items.map((item, index) => (
                                            <View key={index} style={{ marginBottom: 12, backgroundColor: themeColors.primary, width: '100%', height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.medium}}>
                                                <Text style={{ fontFamily: 'Regular', fontSize: 14, color: themeColors.text }}>{item.productName}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setBulkQtyMap(prev => ({
                                                                ...prev,
                                                                [item.productID]: Math.max(0, (prev[item.productID] || 0) - 1)
                                                            }))
                                                        }}
                                                    >
                                                        <IconSymbol name="remove.circle" size={20} color={themeColors.text} />
                                                    </TouchableOpacity>
                                                    <Text style={{ fontSize: 16, fontFamily: 'SemiBold', color: themeColors.text }}>
                                                        {bulkQtyMap[item.productID] ?? item.suggestedReorderQuantity}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setBulkQtyMap(prev => ({
                                                                ...prev,
                                                                [item.productID]: (prev[item.productID] || item.suggestedReorderQuantity) + 1
                                                            }))
                                                        }}
                                                    >
                                                        <IconSymbol name="plus.circle" size={20} color={themeColors.text} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                        
                                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'space-between' }}>
                                            <TouchableOpacity
                                                onPress={()=> openBulkWhatsApp(group)}
                                                style={{ flex: 1, padding: 12, backgroundColor: '#25D366', borderRadius: 10, flexDirection: 'row', alignItems: 'center', width: '75%', justifyContent: 'center' }}
                                            >
                                                <IconSymbol name='whatsapp' size={25} color={'#fff'} />
                                                <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'SemiBold' }}> WhatsApp Order</Text>
                                            </TouchableOpacity>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '25%', alignItems: 'center' }}>
                                                <TouchableOpacity onPress={call} style={[ styles.iconButton, { backgroundColor: '#1976D2' } ]} >
                                                    <IconSymbol name='phone' size={26} color='#fff' />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={()=>{openBulkSMS(group)}} style={[ styles.iconButton, { backgroundColor: '#F57C00' } ]} >
                                                    <IconSymbol name='sms' size={26} color='#fff' />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}

                        </BottomSheetScrollView>
                    </BottomSheet>
                </KeyboardAvoidingView>
            </View>
        </View>
    )
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
    contentContainer: {
        padding: Spacing.medium,
        paddingTop: 0
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    backButton: {
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
    card: {
        borderLeftWidth: 3,
        padding: 10,
        marginTop: 5
    },
    previewBox: {
        borderWidth: 1,
        padding: 20,
        marginTop: 10,
        alignItems: 'center'
    },
    previewName: {
        fontSize: 16,
        fontFamily: 'SemiBold'
    },
    previewPrice: {
        fontSize: 20,
        fontFamily: 'SemiBold',
        marginVertical: 5
    },
    previewSKU: {
        fontSize: 12,
        marginTop: 5
    },
    barcode: {
        marginTop: 5,
        letterSpacing: 2
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 5
    },
    metricBox: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 90
    },
    metricLabel: {
        fontSize: 10,
        fontFamily: 'Medium',
        color: '#888'
    },

    metricValue: {
        fontSize: 15,
        fontFamily: 'SemiBold',
        marginTop: 4,
        color: '#111'
    },
    reorderBtn: {
		marginTop: 10,
		backgroundColor: '#1976D2',
		padding: 8,
		borderRadius: 6,
		alignItems: 'center'
	},
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
    },
})

export default LowStockScreen;


// I’ve been thinking a lot about us and about the pressure you’ve been carrying. 
// I know lately you’ve had to handle a lot financially and around the house, and I don’t want you to feel unseen or alone in that.
// I appreciate everything you’ve done for me and for us. I really do. I just want us to talk honestly. 
// I don’t expect you to carry everything forever. 
// I’m working toward stability again, and I want you to feel supported too, even while I’m rebuilding
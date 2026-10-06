import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { BusinessNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ScrollView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { formatCurrency } from '../../../utils/constants/Currency';

type Props = NativeStackScreenProps<BusinessNavigationList, "TaxGroupItemsScreen">

const TaxGroupItemsScreen = ({ navigation, route }: Props) => {
    const { data } = route.params

    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, businessCurrency } = useAppContainer()

    const [items, setItems] = useState<any[]>([])
    const [allTaxes, setAllTaxes] = useState<any[]>([])

    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ["50%", "75%"], []);

    // 🔄 Fetch group items
    const fetchItems = () => {
        SocketIO.emit('fetch-tax-group-items', {sessionID: session, businessID: selectedBusiness.id, taxGroupID: data.id }, (res: any) => {
            if (res.status === 'success') {
                setItems(res.data || [])
            }
        })
    }

    // 🔄 Fetch all taxes
    const fetchTaxes = () => {
        SocketIO.emit('fetch-taxes' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === 'success') {
                setAllTaxes(response.data || [])
            }
        })
    }

    useFocusEffect(useCallback(() => {
        fetchItems()
        fetchTaxes()
    }, []))

    // ➕ Add tax
    const addTax = (tax: any) => {
        if (items.find(i => i.taxID === tax.id)) {
            Alert.alert("Warning", "Already added")
            return
        }
        SocketIO.emit('add-tax-group-item', { sessionID: session, businessID: selectedBusiness.id, taxGroupID: data.id, taxID: tax.id, sortOrder: items.length + 1 }, (response:any) => {
            if (response.status === 'success') {
                fetchItems()
                bottomSheetRef.current?.close()
            } else {
                Alert.alert("Warning", response.message || "Already added")
            }
        })
    }

    // ❌ Remove
    const removeItem = (item: any) => {
        SocketIO.emit('remove-tax-from-group', { id: item.id }, fetchItems)
    }

    // 🔁 Update order after drag
    const updateOrder = (newItems: any[]) => {
        const payload = newItems.map((item, index) => ({
            id: item.id,
            sortOrder: index + 1
        }))

        setItems(newItems)
        SocketIO.emit('reorder-tax-group-items', payload, fetchItems)
    }

    // 🔥 Preview logic
    const previewData = useMemo(() => {
        let base = 100
        let taxTotal = 0

        const result = items.map(tax => {
            const calcBase = tax.calculationType === 'compound' ? base + taxTotal : base
            const amount = calcBase * (tax.percentage / 100)
            taxTotal += amount
            
            return {
                name: tax.taxName,
                amount
            }
        })

        return {
            rows: result,
            total: result.reduce((sum, r) => sum + r.amount, 0)
        }
    }, [items])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{data.groupName}</ThemedText>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={() => bottomSheetRef.current?.snapToIndex(0)} style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} >
                            <IconSymbol name="plus" size={22} color={themeColors.icon} />
                        </TouchableOpacity>
                    </View>
                </ThemedView>

                {/* BODY */}
                <DraggableFlatList
                    data={items}
                    keyExtractor={(item) => String(item.id)}
                    onDragEnd={({ data }) => updateOrder(data)}
                    contentContainerStyle={{
                        padding: Spacing.small,
                        paddingBottom: 120
                    }}
                    ListHeaderComponent={
                        <View style={{paddingHorizontal: 15}}>
                            <ThemedText style={{ color: themeColors.text, marginBottom: 0, fontSize: 14, fontFamily: 'SemiBold' }}>
                                {items.length} taxes applied
                            </ThemedText>
                            <ThemedText style={{ fontSize: 11, color: themeColors.subtleText, marginBottom: 10, fontFamily: 'Regular' }}>
                                Hold and drag to reorder taxes
                            </ThemedText>
                        </View>
                    }
                    renderItem={({ item, drag, isActive, getIndex }) => (
                        <TouchableOpacity
                            onLongPress={drag}
                            disabled={isActive}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: isActive ? themeColors.primary + '20' : themeColors.card
                                }
                            ]}
                        >
                            <View style={styles.row}>
                                <View>
                                    <Text style={{ color: themeColors.text, fontFamily: 'SemiBold' }}>
                                        {getIndex()! + 1}. {item.taxName} ({item.percentage}%)
                                    </Text>
                                    <Text style={{ fontSize: 11, color: themeColors.subtleText, marginLeft: 13, marginTop: 5, textTransform: 'capitalize', fontFamily: 'Regular' }}>
                                        {item.calculationType}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => removeItem(item)}>
                                        <IconSymbol name="trash" size={18} color={themeColors.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListFooterComponent={
                        <View style={styles.previewBox}>
                            <Text style={{ fontFamily: 'SemiBold', marginBottom: 10, color: themeColors.text, fontSize: 16 }}>
                                Preview ( <Text style={{color: themeColors.warning, fontSize: 14.5}}>Amount: {formatCurrency(Number(100), {symbol: businessCurrency?.symbol || 'GHC'})}</Text> )
                            </Text>

                            {previewData.rows.map((row, i) => (
                                <Text key={i} style={{fontFamily: 'Regular', color: themeColors.text, fontSize: 14, marginBottom: 5}}>
                                    {row.name} ~ <Text style={{color: themeColors.info, fontSize: 14.5}}>{formatCurrency(Number(row.amount.toFixed(2) || 0), {symbol: businessCurrency.symbol})}</Text>
                                </Text>
                            ))}

                            <Text style={{ marginTop: 10, fontFamily: 'SemiBold', color: themeColors.text, fontSize: 18 }}>
                                Total Tax: {formatCurrency(Number(previewData.total.toFixed(2) || 0), {symbol: businessCurrency.symbol})}
                            </Text>
                        </View>
                    }
                />

                {/* BOTTOM SHEET */}
                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}}>
                    <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                        {allTaxes.map(tax => {
                            const isAdded = items.some(i => i.taxID === tax.id)
                            return (
                                <TouchableOpacity key={tax.id} disabled={isAdded} style={{padding:20,backgroundColor:themeColors.card,borderRadius:5,marginBottom:5, opacity: isAdded ? 0.4 : 1}}
                                    onPress={() => addTax(tax)}
                                >
                                    <Text style={{fontFamily: 'Medium', color: themeColors.text, fontSize: Typography.body}}>
                                        {tax.taxName} ({tax.percentage}%)
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </BottomSheetScrollView>
                </BottomSheet>

            </View>
        </View>
    )
}

export default TaxGroupItemsScreen

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
    backButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.medium,
        width: 40,
        height: 40,
        flexShrink: 0,
    },

    title: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold'
    },

    card: {
        padding: 20,
        borderRadius: 6,
        marginBottom: 6
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    previewBox: {
        marginTop: 30,
        padding: 15,
        borderRadius: 6
    }
})
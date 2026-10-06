import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { InventoryNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { ThemedView } from '../../../components/ui/ThemedView'
import { ThemedText } from '../../../components/ui/ThemedText'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { formatCurrency } from '../../../utils/constants/Currency'
import { fullDateTime, fullDateWord } from '../../../configuration/helpers/main.helpers'

type TStockInItemDetailScreen = NativeStackScreenProps<InventoryNavigationList, "StockInItemDetailScreen">

const StockInItemDetailScreen = ({navigation, route}:TStockInItemDetailScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const data:any = route.params?.data || {}
    const items:any[] = data.items || data.stockInItems || data.lineItems || []

    const getStatusColor = () => {
        if (data.status === 'confirmed') return '#198754'
        if (data.status === 'cancelled') return '#D32F2F'
        return '#B77900'
    }

    return (
        <View style={[styles.container, {backgroundColor:themeColors.background}]}>
            {Platform.OS === 'android' && <View style={[styles.statusBarSpacer, {backgroundColor:themeColors.background}]} />}

            <View style={[styles.safeArea, {paddingTop:Platform.OS === 'ios' ? insets.top : 0}]}>
                <ThemedView style={[styles.header, {backgroundColor:themeColors.background, borderBottomColor:themeColors.border}]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, {backgroundColor:themeColors.subtleBackground}]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Stock In Details
                    </ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{padding:8, paddingBottom:insets.bottom + 30}}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.headerCard, {backgroundColor:themeColors.card}]}>
                        <View style={styles.titleRow}>
                            <View style={{flex:1}}>
                                <Text style={[styles.referenceNumber, {color:themeColors.text}]}>
                                    {data.referenceNumber || 'No Reference'}
                                </Text>

                                {data.supplier_name ?<Text style={[styles.supplier, {color:themeColors.subtleText}]}>
                                    Supplier: {data.supplier_name}
                                </Text> : null}
                            </View>

                            <View style={[styles.statusBadge, {backgroundColor:`${getStatusColor()}18`}]}>
                                <Text style={[styles.statusText, {color:getStatusColor()}]}>
                                    {String(data.status || 'draft').toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoColumn}>
                                <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                    Invoice Date
                                </Text>
                                <Text style={[styles.value, {color:themeColors.text}]}>
                                    {data.invoiceDate ? fullDateTime(data.invoiceDate) : 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.infoColumn}>
                                <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                    Currency
                                </Text>
                                <Text style={[styles.value, {color:themeColors.text}]}>
                                    {data.invoice_currency_symbol || data.currencyCode || '-'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.infoColumn}>
                                <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                    Invoice Total
                                </Text>
                                <Text style={[styles.amount, {color:themeColors.warning}]}>
                                    {formatCurrency(Number(data.totalAmount) || 0, {symbol:data.invoice_currency_symbol})}
                                </Text>
                            </View>

                            <View style={styles.infoColumn}>
                                <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                    Base Total
                                </Text>
                                <Text style={[styles.amount, {color:themeColors.text}]}>
                                    {formatCurrency(Number(data.totalAmountBase) || 0, {symbol:data.business_currency_symbol})}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.infoColumn}>
                                <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                    Line Items
                                </Text>
                                <Text style={[styles.value, {color:themeColors.text}]}>
                                    {items.length}
                                </Text>
                            </View>

                            <View style={styles.infoColumn}>
                                <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                    Date Added
                                </Text>
                                <Text style={[styles.value, {color:themeColors.text}]}>
                                    {data.createdAt ? fullDateTime(data.createdAt) : '-'}
                                </Text>
                            </View>
                        </View>

                        {!!data.remarks && (
                            <>
                                <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                                <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                    Remarks
                                </Text>

                                <Text style={[styles.remarks, {color:themeColors.text}]}>
                                    {data.remarks}
                                </Text>
                            </>
                        )}
                    </View>

                    <View style={styles.itemsHeader}>
                        <ThemedText style={styles.itemsTitle}>
                            Stock Items
                        </ThemedText>

                        <Text style={[styles.itemsCount, {color:themeColors.subtleText}]}>
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                        </Text>
                    </View>

                    {items.length > 0 ? items.map((item:any, index:number) => {
                        const quantity = Number(item.quantity || 0)
                        const costPrice = Number(item.costPrice || 0)
                        const lineTotal = quantity * costPrice

                        return (
                            <View key={item.id || index} style={[styles.itemCard, {backgroundColor:themeColors.card, borderColor:themeColors.border}]}>
                                <View style={styles.itemTop}>
                                    <View style={{flex:1}}>
                                        <Text style={[styles.productName, {color:themeColors.text}]}>
                                            {item.productName || item.product_name || `Product ${item.productID || ''}`}
                                        </Text>

                                        {!!(item.productUOMName || item.uomName || item.productUOM) && (
                                            <Text style={[styles.itemMeta, {color:themeColors.subtleText}]}>
                                                UOM: {item.productUOMName || item.uomName || item.productUOM}
                                            </Text>
                                        )}
                                    </View>

                                    <Text style={[styles.lineTotal, {color:themeColors.primary}]}>
                                        {formatCurrency(lineTotal, {symbol:data.invoice_currency_symbol})}
                                    </Text>
                                </View>

                                <View style={[styles.divider, {backgroundColor:themeColors.border}]} />

                                <View style={styles.itemInfoRow}>
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                            Quantity
                                        </Text>
                                        <Text style={[styles.value, {color:themeColors.text}]}>
                                            {quantity}
                                        </Text>
                                    </View>

                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                            Cost Price
                                        </Text>
                                        <Text style={[styles.value, {color:themeColors.text}]}>
                                            {formatCurrency(costPrice, {symbol:data.invoice_currency_symbol})}
                                        </Text>
                                    </View>

                                    <View style={[styles.itemInfo, {alignItems:'flex-end'}]}>
                                        <Text style={[styles.label, {color:themeColors.subtleText}]}>
                                            Remaining
                                        </Text>
                                        <Text style={[styles.value, {color:themeColors.text}]}>
                                            {Number(item.remainingQuantity ?? quantity)}
                                        </Text>
                                    </View>
                                </View>

                                {(item.batchNumber || item.expiryDate || item.manufactureDate) && (
                                    <View style={[styles.extraDetails, {backgroundColor:themeColors.subtleBackground, borderWidth: 0.3, borderColor: themeColors.border}]}>
                                        {!!item.batchNumber && (
                                            <Text style={[styles.itemMeta, {color:themeColors.subtleText}]}>
                                                Batch: <Text style={{color:themeColors.text}}>{item.batchNumber}</Text>
                                            </Text>
                                        )}

                                        {!!item.manufactureDate && (
                                            <Text style={[styles.itemMeta, {color:themeColors.subtleText}]}>
                                                Manufactured Date: <Text style={{color:themeColors.text}}>{item.manufactureDate ? fullDateWord(item.manufactureDate) : ''}</Text>
                                            </Text>
                                        )}

                                        {!!item.expiryDate && (
                                            <Text style={[styles.itemMeta, {color:themeColors.subtleText}]}>
                                                Expiry Date: <Text style={{color:themeColors.text}}>{item.expiryDate ? fullDateWord(item.expiryDate) : ''}</Text>
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        )
                    }) : (
                        <View style={styles.empty}>
                            <IconSymbol name="document-outline" size={32} color={themeColors.subtleText} />

                            <Text style={[styles.emptyTitle, {color:themeColors.text}]}>
                                No Items
                            </Text>

                            <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                No stock items were found for this stock-in.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{flex:1},
    safeArea:{flex:1},
    statusBarSpacer:{height:10},
    header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.screenPadding,paddingVertical:Spacing.medium,borderBottomWidth:1},
    backButton:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
    headerTitle:{fontSize:Typography.heading2,fontFamily:'SemiBold'},
    content:{flex:1},
    headerCard:{borderRadius:Borders.radiusMedium,padding:Spacing.medium},
    titleRow:{flexDirection:'row',alignItems:'center'},
    referenceNumber:{fontSize:14,fontFamily:'SemiBold',textTransform:'uppercase'},
    supplier:{fontSize:12,marginTop:5},
    statusBadge:{paddingHorizontal:10,paddingVertical:5,borderRadius:Borders.radiusSmall},
    statusText:{fontSize:10,fontFamily:'SemiBold'},
    divider:{height:1,marginVertical:Spacing.medium},
    infoRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:Spacing.medium},
    infoColumn:{width:'48%'},
    label:{fontSize:10,marginBottom:4},
    value:{fontSize:12,fontFamily:'Medium'},
    amount:{fontSize:14,fontFamily:'SemiBold'},
    remarks:{fontSize:13,lineHeight:19},
    itemsHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:Spacing.large,marginBottom:Spacing.medium},
    itemsTitle:{fontSize:15,fontFamily:'SemiBold'},
    itemsCount:{fontSize:12},
    itemCard:{borderWidth:1,borderRadius:Borders.radiusMedium,padding:Spacing.medium,marginBottom:10},
    itemTop:{flexDirection:'row',alignItems:'center'},
    productName:{fontSize:14,fontFamily:'SemiBold'},
    itemMeta:{fontSize:11,marginTop:3},
    lineTotal:{fontSize:13,fontFamily:'SemiBold'},
    itemInfoRow:{flexDirection:'row',justifyContent:'space-between'},
    itemInfo:{width:'31%'},
    extraDetails:{marginTop:Spacing.medium,padding:Spacing.small,borderRadius:Borders.radiusSmall},
    empty:{alignItems:'center',paddingVertical:60},
    emptyTitle:{fontSize:14,fontFamily:'SemiBold',marginTop:10},
    emptyText:{fontSize:11,textAlign:'center',marginTop:5}
})

export default StockInItemDetailScreen
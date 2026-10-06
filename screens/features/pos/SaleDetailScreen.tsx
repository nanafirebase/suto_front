import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { POSNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedView } from '../../../components/ui/ThemedView'
import { ThemedText } from '../../../components/ui/ThemedText'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { formatCurrency } from '../../../utils/constants/Currency'

type TSaleDetailScreen = NativeStackScreenProps<POSNavigationList, "SaleDetailScreen">

const SaleDetailScreen = ({navigation, route}:TSaleDetailScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {businessCurrency} = useAppContainer()

    const sale:any = route.params?.data || {}
    const items:any[] = sale.items || []
    const transactions:any[] = sale.transactions || []
    const summary = sale.summary || {}

    const total = Number(summary.total ?? (Number(sale.totalAmount || 0) + Number(sale.taxAmount || 0)))
    const paid = Number(summary.paid || 0)
    const due = Math.max(0, Number(summary.due ?? total - paid))
    const isCompleted = summary.isFullyPaid === true || due <= 0

    const formatDate = (value:any) => {
        if (!value) return "-"

        const date = new Date(value)

        if (isNaN(date.getTime())) return String(value)

        return date.toLocaleString('en-GB', {
            day:'2-digit',
            month:'short',
            year:'numeric',
            hour:'2-digit',
            minute:'2-digit'
        })
    }

    const getCustomerName = () => {
        return sale.customerName ||
            sale.customer_name ||
            [sale.customerFirstName, sale.customerLastName].filter(Boolean).join(' ') ||
            sale.customer ||
            'Walk-in Customer'
    }

    const getItemName = (item:any) => {
        return item.productName ||
            item.product_name ||
            item.name ||
            `Product #${item.productID || '-'}`
    }

    const getItemQuantity = (item:any) => {
        return Number(item.quantity || 0)
    }

    const getItemPrice = (item:any) => {
        return Number(item.unitPrice ?? item.price ?? item.sellingPrice ?? 0)
    }

    const getItemTotal = (item:any) => {
        return Number(
            item.totalAmount ??
            item.total ??
            (getItemQuantity(item) * getItemPrice(item))
        )
    }

    const statusColor = (status:any) => {
        if (status === 'success' || status === 'completed' || status === 'paid') return themeColors.success
        if (status === 'failed' || status === 'cancelled') return themeColors.error
        return themeColors.warning
    }

    const DetailRow = ({label, value}: {label:string, value:any}) => {
        if (value === undefined || value === null || value === '') return null

        return (
            <View style={[styles.detailRow, {borderBottomColor:themeColors.border}]}>
                <Text style={[styles.detailLabel, {color:themeColors.subtleText}]}>
                    {label}
                </Text>

                <Text style={[styles.detailValue, {color:themeColors.text}]}>
                    {String(value)}
                </Text>
            </View>
        )
    }

    return (
        <View style={[styles.container, {backgroundColor:themeColors.background}]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, {backgroundColor:themeColors.background}]} />
            )}

            <View style={[styles.safeArea, {paddingTop:Platform.OS === 'ios' ? insets.top : 0}]}>
                <ThemedView style={[
                    styles.header,
                    {
                        backgroundColor:themeColors.background,
                        borderBottomColor:themeColors.border
                    }
                ]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.backButton,
                            {backgroundColor:themeColors.subtleBackground}
                        ]}
                    >
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        Sale Details
                    </ThemedText>

                    <View style={{width:36}} />
                </ThemedView>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding:8,
                        paddingBottom:insets.bottom + 40
                    }}
                >
                    <View style={[
                        styles.statusCard,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        <View style={{flex:1}}>
                            <Text style={[
                                styles.reference,
                                {color:themeColors.text}
                            ]}>
                                {sale.reference || `Sale #${sale.id || '-'}`}
                            </Text>

                            <Text style={[
                                styles.date,
                                {color:themeColors.subtleText}
                            ]}>
                                {formatDate(sale.createdAt)}
                            </Text>
                        </View>

                        <View style={[
                            styles.statusBadge,
                            {backgroundColor:`${isCompleted ? themeColors.success : themeColors.warning}18`}
                        ]}>
                            <View style={[
                                styles.statusDot,
                                {backgroundColor:isCompleted ? themeColors.success : themeColors.warning}
                            ]} />

                            <Text style={[
                                styles.statusText,
                                {
                                    color:isCompleted
                                        ? themeColors.success
                                        : themeColors.warning
                                }
                            ]}>
                                {isCompleted ? 'COMPLETED' : 'PENDING'}
                            </Text>
                        </View>
                    </View>

                    <View style={[
                        styles.summaryCard,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                Total
                            </Text>

                            <Text style={[styles.summaryValue, {color:themeColors.text}]}>
                                {formatCurrency(total, {symbol:businessCurrency.symbol})}
                            </Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                Paid
                            </Text>

                            <Text style={[styles.summaryValue, {color:themeColors.success}]}>
                                {formatCurrency(paid, {symbol:businessCurrency.symbol})}
                            </Text>
                        </View>

                        <View style={[styles.summaryItem, {alignItems:'flex-end'}]}>
                            <Text style={[styles.summaryLabel, {color:themeColors.subtleText}]}>
                                Due
                            </Text>

                            <Text style={[
                                styles.summaryValue,
                                {color:due > 0 ? themeColors.error : themeColors.success}
                            ]}>
                                {formatCurrency(due, {symbol:businessCurrency.symbol})}
                            </Text>
                        </View>
                    </View>

                    <View style={[
                        styles.section,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                            Customer
                        </Text>

                        <DetailRow label="Customer" value={getCustomerName()} />
                        <DetailRow label="Customer ID" value={sale.customerID} />
                        <DetailRow label="Phone" value={sale.customerPhone || sale.customer_phone} />
                    </View>

                    <View style={[
                        styles.section,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                            Sale Information
                        </Text>

                        <DetailRow label="Reference" value={sale.reference} />
                        <DetailRow label="Sale ID" value={sale.id} />
                        <DetailRow label="Branch" value={sale.branchName || sale.branch_name} />
                        <DetailRow label="Cashier" value={sale.staffName || sale.cashierName} />
                        <DetailRow label="Sale Status" value={sale.status} />
                        <DetailRow label="Date" value={formatDate(sale.createdAt)} />
                    </View>

                    <View style={[
                        styles.section,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                                Sale Items
                            </Text>

                            <Text style={[styles.sectionCount, {color:themeColors.subtleText}]}>
                                {items.length} item{items.length === 1 ? '' : 's'}
                            </Text>
                        </View>

                        {items.length === 0 ? (
                            <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                No sale items found.
                            </Text>
                        ) : (
                            items.map((item:any, index:number) => (
                                <View
                                    key={item.id || index}
                                    style={[
                                        styles.itemRow,
                                        {borderBottomColor:themeColors.border}
                                    ]}
                                >
                                    <View style={{flex:1}}>
                                        <Text style={[styles.itemName, {color:themeColors.text}]}>
                                            {getItemName(item)}
                                        </Text>

                                        <Text style={[
                                            styles.itemMeta,
                                            {color:themeColors.subtleText}
                                        ]}>
                                            {getItemQuantity(item)} × {formatCurrency(
                                                getItemPrice(item),
                                                {symbol:businessCurrency.symbol}
                                            )}
                                        </Text>
                                    </View>

                                    <Text style={[
                                        styles.itemTotal,
                                        {color:themeColors.text}
                                    ]}>
                                        {formatCurrency(
                                            getItemTotal(item),
                                            {symbol:businessCurrency.symbol}
                                        )}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={[
                        styles.section,
                        {
                            backgroundColor:themeColors.card,
                            borderColor:themeColors.border
                        }
                    ]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, {color:themeColors.text}]}>
                                Transactions
                            </Text>

                            <Text style={[styles.sectionCount, {color:themeColors.subtleText}]}>
                                {transactions.length} payment{transactions.length === 1 ? '' : 's'}
                            </Text>
                        </View>

                        {transactions.length === 0 ? (
                            <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                No payment transactions found.
                            </Text>
                        ) : (
                            transactions.map((transaction:any, index:number) => (
                                <View
                                    key={transaction.id || index}
                                    style={[
                                        styles.transactionRow,
                                        {borderBottomColor:themeColors.border}
                                    ]}
                                >
                                    <View style={{flex:1}}>
                                        <Text style={[
                                            styles.transactionReference,
                                            {color:themeColors.text}
                                        ]}>
                                            {transaction.reference || `Transaction #${transaction.id || '-'}`}
                                        </Text>

                                        <Text style={[
                                            styles.transactionMeta,
                                            {color:themeColors.subtleText}
                                        ]}>
                                            {transaction.type
                                                ? transaction.type.toUpperCase()
                                                : 'PAYMENT'}
                                            {transaction.network
                                                ? ` • ${transaction.network}`
                                                : ''}
                                        </Text>

                                        <Text style={[
                                            styles.transactionDate,
                                            {color:themeColors.subtleText}
                                        ]}>
                                            {formatDate(transaction.createdAt)}
                                        </Text>
                                    </View>

                                    <View style={{alignItems:'flex-end'}}>
                                        <Text style={[
                                            styles.transactionAmount,
                                            {color:themeColors.text}
                                        ]}>
                                            {formatCurrency(
                                                Number(transaction.amount || 0),
                                                {symbol:businessCurrency.symbol}
                                            )}
                                        </Text>

                                        <View style={[
                                            styles.transactionStatus,
                                            {
                                                backgroundColor:`${statusColor(transaction.status)}18`
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.transactionStatusText,
                                                {color:statusColor(transaction.status)}
                                            ]}>
                                                {String(transaction.status || 'pending').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={[
                        styles.completionCard,
                        {
                            backgroundColor:isCompleted
                                ? `${themeColors.success}12`
                                : `${themeColors.warning}12`,
                            borderColor:isCompleted
                                ? themeColors.success
                                : themeColors.warning
                        }
                    ]}>
                        <View style={[
                            styles.completionIcon,
                            {
                                backgroundColor:isCompleted
                                    ? themeColors.success
                                    : themeColors.warning
                            }
                        ]}>
                            <IconSymbol
                                name={isCompleted ? "check" : "clock"}
                                size={18}
                                color="#FFFFFF"
                            />
                        </View>

                        <View style={{flex:1}}>
                            <Text style={[
                                styles.completionTitle,
                                {
                                    color:isCompleted
                                        ? themeColors.success
                                        : themeColors.warning
                                }
                            ]}>
                                {isCompleted
                                    ? 'Sale Completed'
                                    : 'Sale Not Completed'}
                            </Text>

                            <Text style={[
                                styles.completionText,
                                {color:themeColors.subtleText}
                            ]}>
                                {isCompleted
                                    ? 'This sale has been fully paid.'
                                    : `${formatCurrency(due, {symbol:businessCurrency.symbol})} is still outstanding.`}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex:1
    },
    safeArea:{
        flex:1
    },
    statusBarSpacer:{
        height:10
    },
    header:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingHorizontal:Spacing.screenPadding,
        paddingVertical:Spacing.medium,
        borderBottomWidth:1
    },
    backButton:{
        width:36,
        height:36,
        borderRadius:18,
        alignItems:'center',
        justifyContent:'center'
    },
    headerTitle:{
        fontSize:Typography.heading2,
        fontFamily:'SemiBold'
    },
    statusCard:{
        flexDirection:'row',
        alignItems:'center',
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        padding:Spacing.medium,
        marginBottom:Spacing.medium
    },
    reference:{
        fontSize:16,
        fontFamily:'SemiBold'
    },
    date:{
        fontSize:11,
        marginTop:5
    },
    statusBadge:{
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal:9,
        paddingVertical:5,
        borderRadius:20
    },
    statusDot:{
        width:7,
        height:7,
        borderRadius:4,
        marginRight:5
    },
    statusText:{
        fontSize:9,
        fontFamily:'SemiBold'
    },
    summaryCard:{
        flexDirection:'row',
        justifyContent:'space-between',
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        padding:Spacing.medium,
        marginBottom:Spacing.medium
    },
    summaryItem:{
        flex:1
    },
    summaryLabel:{
        fontSize:11
    },
    summaryValue:{
        fontSize:14,
        fontFamily:'SemiBold',
        marginTop:5
    },
    section:{
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        paddingHorizontal:Spacing.medium,
        marginBottom:Spacing.medium
    },
    sectionHeader:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between'
    },
    sectionTitle:{
        fontSize:15,
        fontFamily:'SemiBold',
        paddingVertical:Spacing.medium
    },
    sectionCount:{
        fontSize:11
    },
    detailRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        paddingVertical:11,
        borderBottomWidth:0.5
    },
    detailLabel:{
        fontSize:12,
        flex:1
    },
    detailValue:{
        fontSize:12,
        fontFamily:'Medium',
        flex:1,
        textAlign:'right'
    },
    itemRow:{
        flexDirection:'row',
        alignItems:'center',
        paddingVertical:12,
        borderBottomWidth:0.5
    },
    itemName:{
        fontSize:13,
        fontFamily:'Medium'
    },
    itemMeta:{
        fontSize:11,
        marginTop:4
    },
    itemTotal:{
        fontSize:13,
        fontFamily:'SemiBold',
        marginLeft:10
    },
    transactionRow:{
        flexDirection:'row',
        alignItems:'center',
        paddingVertical:12,
        borderBottomWidth:0.5
    },
    transactionReference:{
        fontSize:13,
        fontFamily:'Medium'
    },
    transactionMeta:{
        fontSize:10,
        marginTop:4
    },
    transactionDate:{
        fontSize:10,
        marginTop:3
    },
    transactionAmount:{
        fontSize:13,
        fontFamily:'SemiBold'
    },
    transactionStatus:{
        paddingHorizontal:7,
        paddingVertical:3,
        borderRadius:10,
        marginTop:5
    },
    transactionStatusText:{
        fontSize:8,
        fontFamily:'SemiBold'
    },
    emptyText:{
        fontSize:12,
        paddingBottom:Spacing.medium
    },
    completionCard:{
        flexDirection:'row',
        alignItems:'center',
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        padding:Spacing.medium
    },
    completionIcon:{
        width:34,
        height:34,
        borderRadius:17,
        alignItems:'center',
        justifyContent:'center',
        marginRight:Spacing.medium
    },
    completionTitle:{
        fontSize:13,
        fontFamily:'SemiBold'
    },
    completionText:{
        fontSize:11,
        marginTop:3
    }
})

export default SaleDetailScreen
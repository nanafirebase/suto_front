import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { PayrollNavigationList } from '../../../utils/types/index.type'
import { Colors } from '../../../utils/constants/Colors'
import { Spacing, Typography, Borders } from '../../../utils/constants/Design'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppContainer } from '../../../configuration/navigation/AppContainer'
import { SocketIO } from '../../../configuration/helpers/main.helpers'
import { ThemedText } from '../../../components/ui/ThemedText'
import { ThemedView } from '../../../components/ui/ThemedView'
import { IconSymbol } from '../../../components/ui/icon-symbol'

type TMyPayDetailsScreen = NativeStackScreenProps<PayrollNavigationList, "MyPayDetailsScreen">

type PayDetails = {
    compensationID?: string | number
    compensationSource?: string
    compensationSourceID?: string | number
    compensationType?: string
    salary?: number | string
    wageRate?: number | string
    wageRateType?: string
    wagePeriod?: string
    currencyID?: string | number
    currencyName?: string
    currencyCode?: string
    effectiveFrom?: string | Date
    effectiveTo?: string | Date
    roleName?: string
    gradeName?: string
    employeeFirstName?: string
    employeeLastName?: string
}

const MyPayDetailsScreen = ({navigation}:TMyPayDetailsScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const {selectedBusiness, session} = useAppContainer()

    const [payDetails, setPayDetails] = useState<PayDetails|null>(null)
    const [loading, setLoading] = useState(false)

    const fetchPayDetails = async () => {
        if (!selectedBusiness.id) return

        setLoading(true)

        SocketIO.emit(
            'fetch-my-pay-details',
            {
                sessionID:session,
                businessID:selectedBusiness.id
            },
            (response:any) => {
                setLoading(false)

                if (response.status !== "success") {
                    Alert.alert(
                        "Error",
                        response.message || "Failed to load pay details"
                    )
                    return
                }

                setPayDetails(response.data || null)
            }
        )
    }

    useFocusEffect(
        useCallback(() => {
            if (!selectedBusiness.id) return

            fetchPayDetails()
        }, [selectedBusiness.id])
    )

    const formatAmount = (value:any, currencyCode?:string) => {
        const amount = Number(value || 0)

        return `${currencyCode || 'GHS'} ${amount.toLocaleString(undefined, {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        })}`
    }

    const formatDate = (value:any) => {
        if (!value) return "-"

        const date = new Date(value)

        if (isNaN(date.getTime())) return String(value)

        return date.toLocaleDateString('en-GB', {
            day:'2-digit',
            month:'short',
            year:'numeric'
        })
    }

    const getPayType = () => {
        if (payDetails?.compensationType === "wage") {
            return "Wage"
        }

        return "Salary"
    }

    const getPayAmount = () => {
        if (payDetails?.compensationType === "wage") {
            return formatAmount(
                payDetails.wageRate,
                payDetails.currencyCode
            )
        }

        return formatAmount(
            payDetails?.salary,
            payDetails?.currencyCode
        )
    }

    const getPayPeriod = () => {
        if (payDetails?.compensationType !== "wage") {
            return "Monthly"
        }

        return payDetails?.wagePeriod || "-"
    }

    const getSourceLabel = () => {
        if (payDetails?.compensationSource === "individual") {
            return "Individual"
        }

        if (payDetails?.compensationSource === "role") {
            return "Role"
        }

        if (payDetails?.compensationSource === "grade") {
            return "Grade"
        }

        return "-"
    }

    const DetailRow = ({
        label,
        value,
        last = false
    }: {
        label:string
        value:any
        last?:boolean
    }) => (
        <View style={[
            styles.detailRow,
            !last && {
                borderBottomWidth:1,
                borderBottomColor:themeColors.border
            }
        ]}>
            <Text style={[
                styles.detailLabel,
                {color:themeColors.subtleText}
            ]}>
                {label}
            </Text>

            <Text style={[
                styles.detailValue,
                {color:themeColors.text}
            ]}>
                {value || "-"}
            </Text>
        </View>
    )

    return (
        <View style={[
            styles.container,
            {backgroundColor:themeColors.background}
        ]}>
            {Platform.OS === 'android' && (
                <View style={[
                    styles.statusBarSpacer,
                    {backgroundColor:themeColors.background}
                ]} />
            )}

            <View style={[
                styles.safeArea,
                {
                    paddingTop:
                        Platform.OS === 'ios'
                            ? insets.top
                            : 0
                }
            ]}>
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
                            {
                                backgroundColor:
                                    themeColors.subtleBackground
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
                        My Pay Details
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
                    {loading ? (
                        <View style={styles.loading}>
                            <Text style={[
                                styles.loadingText,
                                {color:themeColors.subtleText}
                            ]}>
                                Loading pay details...
                            </Text>
                        </View>
                    ) : !payDetails ? (
                        <View style={styles.empty}>
                            <View style={[
                                styles.emptyIcon,
                                {
                                    backgroundColor:
                                        themeColors.subtleBackground
                                }
                            ]}>
                                <IconSymbol
                                    name="wallet"
                                    size={28}
                                    color={themeColors.subtleText}
                                />
                            </View>

                            <Text style={[
                                styles.emptyTitle,
                                {color:themeColors.text}
                            ]}>
                                No Pay Details
                            </Text>

                            <Text style={[
                                styles.emptyText,
                                {color:themeColors.subtleText}
                            ]}>
                                Your current compensation details are not available.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={[
                                styles.heroCard,
                                {
                                    backgroundColor:themeColors.primary
                                }
                            ]}>
                                <View style={styles.heroTop}>
                                    <View style={[
                                        styles.walletIcon,
                                        {
                                            backgroundColor:
                                                'rgba(255,255,255,0.15)'
                                        }
                                    ]}>
                                        <IconSymbol
                                            name="wallet"
                                            size={24}
                                            color="#FFFFFF"
                                        />
                                    </View>

                                    <View style={styles.sourceBadge}>
                                        <Text style={styles.sourceText}>
                                            {getSourceLabel()}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.heroLabel}>
                                    Current Pay
                                </Text>

                                <Text style={styles.heroAmount}>
                                    {getPayAmount()} <Text style={styles.heroPeriod}>/ {getPayPeriod()}</Text>
                                </Text>
                            </View>

                            <Text style={[
                                styles.sectionTitle,
                                {color:themeColors.text}
                            ]}>
                                Compensation
                            </Text>

                            <View style={[
                                styles.card,
                                {
                                    backgroundColor:themeColors.card,
                                    borderColor:themeColors.border
                                }
                            ]}>
                                <DetailRow
                                    label="Pay Type"
                                    value={getPayType()}
                                />

                                {payDetails.compensationType === "salary" ? (
                                    <DetailRow
                                        label="Basic Salary"
                                        value={formatAmount(
                                            payDetails.salary,
                                            payDetails.currencyCode
                                        )}
                                    />
                                ) : (
                                    <>
                                        <DetailRow
                                            label="Wage Rate"
                                            value={formatAmount(
                                                payDetails.wageRate,
                                                payDetails.currencyCode
                                            )}
                                        />

                                        <DetailRow
                                            label="Wage Rate Type"
                                            value={
                                                payDetails.wageRateType || "-"
                                            }
                                        />
                                    </>
                                )}

                                <DetailRow
                                    label="Pay Period"
                                    value={getPayPeriod()}
                                />

                                <DetailRow
                                    label="Currency"
                                    value={
                                        payDetails.currencyName
                                            ? `${payDetails.currencyName} (${payDetails.currencyCode || ""})`
                                            : payDetails.currencyCode
                                    }
                                    last
                                />
                            </View>

                            <Text style={[
                                styles.sectionTitle,
                                {color:themeColors.text}
                            ]}>
                                Position
                            </Text>

                            <View style={[
                                styles.card,
                                {
                                    backgroundColor:themeColors.card,
                                    borderColor:themeColors.border
                                }
                            ]}>
                                <DetailRow
                                    label="Role"
                                    value={payDetails.roleName}
                                />

                                <DetailRow
                                    label="Grade"
                                    value={payDetails.gradeName}
                                    last
                                />
                            </View>

                            <Text style={[
                                styles.sectionTitle,
                                {color:themeColors.text}
                            ]}>
                                Effective Date
                            </Text>

                            <View style={[
                                styles.card,
                                {
                                    backgroundColor:themeColors.card,
                                    borderColor:themeColors.border
                                }
                            ]}>
                                <DetailRow
                                    label="Effective From"
                                    value={formatDate(
                                        payDetails.effectiveFrom
                                    )}
                                />

                                <DetailRow
                                    label="Effective To"
                                    value={
                                        payDetails.effectiveTo
                                            ? formatDate(
                                                payDetails.effectiveTo
                                            )
                                            : "Current"
                                    }
                                    last
                                />
                            </View>

                            <View style={[
                                styles.infoBox,
                                {
                                    backgroundColor:
                                        themeColors.subtleBackground
                                }
                            ]}>
                                <IconSymbol
                                    name="alert"
                                    size={18}
                                    color={themeColors.subtleText}
                                />

                                <Text style={[
                                    styles.infoText,
                                    {color:themeColors.subtleText}
                                ]}>
                                    Your pay details are based on your current
                                    applicable compensation. Changes to your
                                    salary or wage may take effect from a
                                    future effective date.
                                </Text>
                            </View>
                        </>
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
    header:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingHorizontal:Spacing.screenPadding,
        paddingVertical:Spacing.medium,
        borderBottomWidth:1
    },
    headerTitle:{
        fontSize:Typography.heading2,
        fontFamily:'SemiBold'
    },
    backButton:{
        width:36,
        height:36,
        borderRadius:18,
        alignItems:'center',
        justifyContent:'center'
    },
    heroCard:{
        borderRadius:Borders.radiusMedium,
        padding:20,
        marginBottom:25
    },
    heroTop:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center'
    },
    walletIcon:{
        width:44,
        height:44,
        borderRadius:22,
        alignItems:'center',
        justifyContent:'center'
    },
    sourceBadge:{
        paddingHorizontal:10,
        paddingVertical:5,
        borderRadius:20,
        backgroundColor:'rgba(255,255,255,0.15)'
    },
    sourceText:{
        color:'#FFFFFF',
        fontSize:11,
        fontFamily:'Medium',
        textTransform:'capitalize'
    },
    heroLabel:{
        color:'rgba(255,255,255,0.75)',
        fontSize:12,
        marginTop:10,
        marginBottom:5
    },
    heroAmount:{
        color:'#FFFFFF',
        fontSize:28,
        fontFamily:'SemiBold'
    },
    heroPeriod:{
        color:'rgba(255,255,255,0.75)',
        fontSize:12,
        marginTop:4,
        textTransform:'capitalize'
    },
    sectionTitle:{
        fontSize:15,
        fontFamily:'SemiBold',
        marginBottom:10,
        marginTop:5
    },
    card:{
        borderWidth:1,
        borderRadius:Borders.radiusMedium,
        paddingHorizontal:Spacing.medium,
        marginBottom:15
    },
    detailRow:{
        paddingVertical: 13,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        gap:5
    },
    detailLabel:{
        fontSize:11,
        flex:1
    },
    detailValue:{
        fontSize:12,
        fontFamily:'Medium',
        textAlign:'right',
        flex:1
    },
    infoBox:{
        flexDirection:'row',
        alignItems:'flex-start',
        gap:10,
        padding:15,
        borderRadius:Borders.radiusSmall,
        marginTop:2
    },
    infoText:{
        flex:1,
        fontSize:12,
        lineHeight:18
    },
    loading:{
        alignItems:'center',
        paddingTop:80
    },
    loadingText:{
        fontSize:14
    },
    empty:{
        alignItems:'center',
        paddingTop:80,
        paddingHorizontal:30
    },
    emptyIcon:{
        width:60,
        height:60,
        borderRadius:30,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:15
    },
    emptyTitle:{
        fontSize:17,
        fontFamily:'SemiBold',
        marginBottom:7
    },
    emptyText:{
        fontSize:13,
        textAlign:'center',
        lineHeight:20
    }
})

export default MyPayDetailsScreen
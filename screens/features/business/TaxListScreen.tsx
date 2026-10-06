import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BusinessNavigationList } from '../../../utils/types/index.type';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '../../../components/ui/ThemedView';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { ThemedText } from '../../../components/ui/ThemedText';

type TTaxListScreen = NativeStackScreenProps<BusinessNavigationList, "TaxListScreen">
const TaxListScreen = ({navigation, route}: TTaxListScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, can } = useAppContainer()

    const [data, setData] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false)

    const fetchTaxes = async () => {
        SocketIO.emit('fetch-taxes' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                setData(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching taxes", response.message)
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchTaxes()
        }, [])
    )

    const filteredData = useMemo(() => {
        if (!searchQuery) return data
        return data.filter((item) =>
            item.taxName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [data, searchQuery])

    const getTypeLabel = (type: string) => {
        if (type === 'compound') return "Compound"
        return "Simple"
    }

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return data;
        return data.filter(option =>
            String(option.taxName).toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery, data])

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
                                placeholder="Search tax"
                                placeholderTextColor={themeColors.subtleText}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                    </View> ) : (
                        <>
                            <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                            </TouchableOpacity>
                            <ThemedText style={styles.headerTitle}>Taxes</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} onPress={() => setIsSearchVisible(true)} >
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                                {can("pos.sale.new") && (
                                    <TouchableOpacity onPress={()=> navigation.navigate("TaxFormScreen", {data: {}})} style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} >
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
                                                    <Text style={{...styles.accountName, color: themeColors.text}} numberOfLines={1}>{item.taxName}</Text>
                                                    <Text style={[styles.accountType, { color: themeColors.subtleText }]}>
                                                        {item.percentage}% • {getTypeLabel(item.calculationType)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={{flexDirection: 'row', width: '30%', justifyContent: 'flex-end'}}>
                                                <TouchableOpacity onPress={()=> navigation.navigate("TaxFormScreen", {data: item})} style={[ styles.iconButton, { backgroundColor: themeColors.tabIconDefault } ]} >
                                                    <IconSymbol name="pencil" size={18} color={themeColors.white} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={styles.badgeRow}>
                                            <View style={[
                                                styles.badge,
                                                {
                                                    backgroundColor: item.calculationType === 'compound'
                                                        ? themeColors.warning
                                                        : themeColors.success
                                                }
                                            ]}>
                                                <Text style={styles.badgeText}>
                                                    {getTypeLabel(item.calculationType)}
                                                </Text>
                                            </View>

                                            <View style={[
                                                styles.badge,
                                                {
                                                    backgroundColor: item.status === 'active'
                                                        ? themeColors.success
                                                        : themeColors.error
                                                }
                                            ]}>
                                                <Text style={styles.badgeText}>
                                                    {item.status === 'active' ? 'Active' : 'Inactive'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No record(s) found</ThemedText>}
                        </View>
                    </View>
                </ScrollView>
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
    badgeRow: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'SemiBold'
    }
})

export default TaxListScreen;

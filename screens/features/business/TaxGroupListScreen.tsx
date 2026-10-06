import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
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

type Props = NativeStackScreenProps<BusinessNavigationList, "TaxGroupListScreen">

const TaxGroupListScreen = ({ navigation }: Props) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, can } = useAppContainer()

    const [data, setData] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchVisible, setIsSearchVisible] = useState(false)

    const fetchGroups = () => {
        SocketIO.emit('fetch-tax-groups',
            { sessionID: session, businessID: selectedBusiness.id },
            (res: any) => {
                if (res.status === 'success') {
                    setData(res.data || [])
                } else {
                    Alert.alert("Error", res.message)
                }
            })
    }

    useFocusEffect(useCallback(() => {
        fetchGroups()
    }, []))

    const filtered = useMemo(() => {
        if (!searchQuery) return data
        return data.filter(item =>
            item.groupName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [data, searchQuery])

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
                                placeholder="Search bundle"
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
                            <ThemedText style={styles.headerTitle}>Tax Bundles</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} onPress={() => setIsSearchVisible(true)} >
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                                {can("inventory.product.view") && (
                                    <TouchableOpacity onPress={()=> navigation.navigate("TaxGroupFormScreen", {data: {}})} style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} >
                                        <IconSymbol name="plus" size={22} color={themeColors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </ThemedView>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.small, paddingBottom: insets.bottom + Spacing.screenPadding }} showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 3 }}>
                        {filtered.length > 0 ? filtered.map((item, index) => {
                            return (
                                <View key={index} style={[styles.card, { backgroundColor: themeColors.card, borderLeftWidth: 2, borderLeftColor: themeColors.primary }]}>
                                    <View style={{ padding: Spacing.large }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ width: '65%' }}>
                                                <Text style={{ fontSize: 11, fontFamily: 'SemiBold', color: themeColors.text }} numberOfLines={1}>
                                                    {item?.groupName}
                                                </Text>
                                            </View>
                                            <View style={{flexDirection: 'row', width: '25%', justifyContent: 'flex-end'}}>
                                                <TouchableOpacity activeOpacity={0.8} onPress={()=> navigation.navigate("TaxGroupItemsScreen", {data: item})} style={[ styles.iconButton, { backgroundColor: themeColors.tabIconDefault } ]} >
                                                    <IconSymbol name="document-outline" size={18} color={themeColors.white} />
                                                </TouchableOpacity>
                                                <TouchableOpacity activeOpacity={0.8} onPress={()=> navigation.navigate("TaxGroupFormScreen", {data: item})} style={[ styles.iconButton, { backgroundColor: themeColors.tabIconDefault } ]} >
                                                    <IconSymbol name="pencil" size={18} color={themeColors.white} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )
                        }) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No record(s) found</ThemedText>}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

export default TaxGroupListScreen

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
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.medium,
        borderRadius: Borders.radiusMedium,
    },
    title: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold'
    },
    card: {
        padding: 5,
        borderRadius: Borders.radiusSmall,
        marginBottom: 6
    },
    searchHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%'
    },
    searchInputField: {
        flex: 1,
        fontSize: Typography.body,
        marginLeft: Spacing.small,
        fontFamily: 'Regular',
        paddingVertical: 12
    },
})
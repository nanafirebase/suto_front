import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { InventoryNavigationList, POSNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { useFocusEffect } from '@react-navigation/native';

type TCustomerListScreen = NativeStackScreenProps<POSNavigationList, "CustomerListScreen">

const CustomerListScreen = ({ navigation }: TCustomerListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, can } = useAppContainer();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [customersList, setCustomersList] = useState<any[]>([])

    const fetchCustomers = async () => {
        if (!selectedBusiness?.id) return
        SocketIO.emit('fetch-customers' , {sessionID: session, businessID: selectedBusiness.id}, (response: any) => {
            if (response.status === "success") {
                const data = response.data
                setCustomersList(data || [])
            } else {
                Alert.alert("Error", "Error fetching customers", response.message)
            }
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchCustomers()
        }, [])
    )

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return customersList;
        return customersList.filter(option =>
            String(option.customerName).toLowerCase().includes(searchQuery.toLowerCase()) || String(option.customerCode).toLowerCase().includes(searchQuery.toLowerCase()) 
        )
    }, [searchQuery, customersList])

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={{ height: 10, backgroundColor: themeColors.background }} />}
            <View style={[styles.safeArea, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
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
                                    placeholder="Search customer"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                            </TouchableOpacity>
                            <ThemedText style={styles.headerTitle}>Customer</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground }]} onPress={() => setIsSearchVisible(true)}>
                                    <IconSymbol name="magnifyingglass" size={22} color={themeColors.icon} />
                                </TouchableOpacity>
                                {can("pos.customer.create_update") && (
                                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground }]} onPress={() => navigation.navigate('CustomerFormScreen', { data: {} })}>
                                        <IconSymbol name="plus" size={22} color={themeColors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </ThemedView>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.small, paddingBottom: insets.bottom + Spacing.screenPadding }} showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 3 }}>
                        {filteredOptions.length > 0 ? filteredOptions.map((item, index) => {
                            return (
                                <TouchableOpacity key={index} style={[styles.card, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} activeOpacity={0.8}>
                                    <View style={{ padding: Spacing.large }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ width: '65%' }}>
                                                <Text style={{ fontSize: 11, fontFamily: 'SemiBold', color: themeColors.text }} numberOfLines={1}>
                                                    {item?.customerName} ({item.customerCode || ''})
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.iconButton, { backgroundColor: themeColors.tabIconDefault }]}
                                                onPress={() => navigation.navigate('CustomerFormScreen', { data: item })}
                                            >
                                                <IconSymbol name="pencil" size={18} color={themeColors.white} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        }) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No record(s) found</ThemedText>}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.medium, borderBottomWidth: 1 },
    backButtonMain: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.small },
    searchHeaderContainer: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.medium },
    searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.medium, borderRadius: 6 },
    searchInputField: { flex: 1, marginLeft: Spacing.small, fontSize: Typography.body, paddingVertical: 12, fontFamily: 'Regular' },
    card: { borderBottomWidth: 0.09, borderLeftWidth: 3 },
});

export default CustomerListScreen;

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import { supplierTypes } from '../../../configuration/data/System';

type TSupplierListScreen = NativeStackScreenProps<InventoryNavigationList, "SupplierListScreen">

const SupplierListScreen = ({navigation}: TSupplierListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, can } = useAppContainer();
    const [supplierList, setSupplierList] = useState<any[]>([]);

    const fetchSuppliers = async () => {
        SocketIO.emit('fetch-suppliers', { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            if (response.status === "success") setSupplierList(response.data);
            else Alert.alert("Error", response.message || "Failed to fetch suppliers");
        });
    }

    useEffect(() => { fetchSuppliers() }, []);
    useFocusEffect(useCallback(() => { fetchSuppliers() }, []));

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={{ height: 10, backgroundColor: themeColors.background }}/>}
            <View style={[styles.safeArea, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <ThemedView style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.background }]}>
                    <TouchableOpacity onPress={()=> navigation.popToTop()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Supplier</ThemedText>
                    {can("inventory.supplier.create_update") && (
                        <TouchableOpacity onPress={()=> navigation.navigate("SupplierFormScreen", { data: {} })} style={[styles.iconButton, { backgroundColor: themeColors.subtleBackground }]}>
                            <IconSymbol name="plus" size={22} color={themeColors.icon} />
                        </TouchableOpacity>
                    )}
                </ThemedView>
                {/* <ScrollView style={styles.content} contentContainerStyle={{ padding: Spacing.small, paddingBottom: insets.bottom + 20 }}>
                    {supplierList.map((item, index) => (
                        <TouchableOpacity key={index} style={[styles.card, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} onPress={()=> navigation.navigate("SupplierFormScreen", { data: item })}>
                            <ThemedText style={[styles.cardTitle, { color: themeColors.text, fontSize: 13 }]}>{item.supplier_name || 'No Name'}</ThemedText>
                            <ThemedText style={{ color: themeColors.subtleText, fontSize: 12 }}>{item.supplier_type || 'Not set'}</ThemedText>
                            <ThemedText style={{ color: themeColors.subtleText, fontSize: 12 }}>{item.phone || ''} {item.email || ''}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView> */}
                <ScrollView style={styles.content} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + Spacing.screenPadding }]} showsVerticalScrollIndicator={false}>
                    <View style={styles.tabContent}>
                        <View style={styles.accountsList}>
                            {supplierList.length > 0 ? supplierList.map((item, index) => {
                                const selectedType = supplierTypes.find((listItem:any) => listItem.key === item.supplier_type) || null
                                return (
                                    <TouchableOpacity key={index} style={[styles.accountCard, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} onPress={()=> {}} activeOpacity={0.8}>
                                        <View style={styles.accountCardContent}>
                                            <View style={styles.accountTitleRow}>
                                                <View style={{flexDirection: 'row', alignItems: 'center', width: '65%'}}>
                                                    <View style={{flexDirection: 'column'}}>
                                                        <Text style={{...styles.accountName, color: themeColors.text, fontFamily: 'SemiBold'}} numberOfLines={1}>{item.supplier_name || ''}</Text>
                                                        <Text style={{ color: themeColors.subtleText, fontSize: 11, fontFamily: 'Regular' }}>{selectedType?.value || 'Not set'}</Text>
                                                        <Text style={{ color: themeColors.subtleText, fontSize: 11, fontFamily: 'Regular' }}>{item.phone || ''}, {item.email || ''}</Text>
                                                    </View>
                                                </View>
                                                <View style={{flexDirection: 'row', width: '30%', justifyContent: 'flex-end'}}>
                                                    <TouchableOpacity onPress={()=> navigation.navigate("SupplierFormScreen", {data: item})} style={[ styles.iconButton, { backgroundColor: themeColors.tabIconDefault } ]} >
                                                        <IconSymbol name="pencil" size={18} color={themeColors.white} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )
                            }) : <ThemedText style={{textAlign: 'center', color: themeColors.subtleText, marginTop: 50}}>No records found</ThemedText>}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{ flex:1 },
    safeArea:{ flex:1 },
    header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.screenPadding, paddingVertical:Spacing.medium, borderBottomWidth:1 },
    backButtonMain:{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
    headerTitle:{ fontSize:Typography.heading2, fontFamily:'SemiBold' },
    iconButton:{ width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center' },
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
        fontSize: 12,
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
});

export default SupplierListScreen;

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { HomeNavigationList, UserNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SAMPLE_ALERTS } from '../../../configuration/data/FetchData';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type TAllAlertScreen = NativeStackScreenProps<HomeNavigationList, "AllAlertScreen">
const AllAlertScreen = ({navigation}: TAllAlertScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [data, setData] = useState<any[]>([])
    
    
    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={{ height: 10, backgroundColor: themeColors.background }} />}
            <View style={[styles.safeArea, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Activity Center</ThemedText>
                    <View style={{width: 32}} />
                </ThemedView>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.small, paddingBottom: insets.bottom + Spacing.screenPadding }} showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 3 }}>
                        {data.length > 0 ? data.map((item, index) => {
                            const color = item.type === "info" ? themeColors.info : item.type === 'approval_request' ? themeColors.error : item.type === 'warning' ? themeColors.warning : 'info'
                            const icon = item.type === "info" ? <IconSymbol name='alert-circle' size={25} color={color} /> : item.type === 'approval_request' ? <IconSymbol name='check' size={25} color={color} /> : item.type === 'warning' ? <IconSymbol name='alert-circle' size={25} color={color} /> : <IconSymbol name='key' size={25} color={color} />
                            return (
                                <TouchableOpacity key={index} style={[styles.card, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} activeOpacity={0.8}>
                                    <View style={{ paddingHorizontal: Spacing.large, paddingVertical: Spacing.small, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{...styles.alertType}}>
                                            <ThemedView style={[ styles.alertIconWrapper, { backgroundColor: `${color}15` }]}>
                                                {icon}
                                            </ThemedView>
                                        </View>
                                        <View style={{flexDirection: 'column'}}>
                                            <Text style={{fontFamily: 'SemiBold', color: themeColors.text, fontSize: 14}}>{item.title}</Text>
                                            <Text style={{fontFamily: 'Regular', color: themeColors.subtleText, fontSize: 11, marginTop: 5}}>{item.message}</Text>
                                        </View>
                                        <Text></Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        }) : <View style={{justifyContent: 'center', alignItems: 'center', marginTop: 50}}>
                                <Text style={{color: themeColors.text, fontFamily: 'SemiBold'}}>Empty</Text>
                                <Text style={{color: themeColors.subtleText, fontFamily: 'Regular', marginTop: 10 }}>No alert / notification found</Text>
                            </View>
                        }
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.medium, borderBottomWidth: 1 },
    backButtonMain: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.small },
    card: { borderBottomWidth: 0.09, borderLeftWidth: 3 },
    alertType: {
        width: '17%',
        alignItems: 'center',
        marginRight: '4%'
    },
    alertIconWrapper: {
        width: '100%',
        height: 50,
        borderRadius: Borders.radiusMedium,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.small
    },
})

export default AllAlertScreen
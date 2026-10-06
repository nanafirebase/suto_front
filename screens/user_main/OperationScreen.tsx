import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { abbFull, features } from '../../configuration/data/FetchData';
import CloudStorageOverview from '../../components/ui/charts/CloudStorageOverview';
import { OperationNavigationList } from '../../utils/types/index.type';
import { SocketIO } from '../../configuration/helpers/main.helpers';
import { saveData } from '../../configuration/helpers/auth.helpers';
import { useFocusEffect } from '@react-navigation/native';

function navigateSafe<ParamList extends Record<string, any>,RouteName extends keyof ParamList>(
    navigation: NativeStackNavigationProp<ParamList, RouteName>,
    screen: keyof ParamList
) {
    navigation.navigate(screen as never);
}

type TOperationMenuScreen = NativeStackScreenProps<OperationNavigationList, "OperationMenuScreen">
const OperationMenuScreen = ({navigation}: TOperationMenuScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'
    const insets = useSafeAreaInsets()

    const { can, selectedBusiness, session, setSelectedBusiness, setUserBranch, setUserGrade } = useAppContainer()

    const hasVisibleServices = Object.values(features).some(items =>
        items.some(item =>
            item.requires &&
            item.requires.length > 0 &&
            item.requires.some(p => can(p))
        )
    )

    const fetchFeatures = () => {
        SocketIO.emit('re-verify-package', {businessID: selectedBusiness.id, sessionID: session }, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", `${response.message}`, [
                    { text: "Done", style: "cancel" },
                ],
                { cancelable: true })
                setSelectedBusiness(null)
                setUserBranch(null)
                setUserGrade(null)
            } else {
                Alert.alert("Error", response.message || "Failed to get package data", [
                    { text: "Retry", onPress: () => fetchFeatures() },
                    { text: "Cancel", style: "cancel" },
                ],
                { cancelable: true })
            }
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Operations Menu</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false} bounces={false}>
                    {Object.entries(features).map(([category, items]) => {
                        const visibleItems = items.filter(item => {
                            return item.requires && item.requires.length > 0 && item.requires.some(p => can(p))
                        })
                        if (visibleItems.length === 0) return null
                        return (
                            <ThemedView key={category} style={styles.servicesContainer}>
                                <ThemedText style={styles.sectionTitle}>
                                    {abbFull[category]}
                                </ThemedText>
                                <ThemedView style={styles.servicesGrid}>
                                    {visibleItems.map((service, index) => (
                                        <TouchableOpacity key={`${category}-${index}`} style={styles.serviceItem} activeOpacity={0.7} onPress={() => service.screen ? navigateSafe(navigation, service.screen) : {}}>
                                            <ThemedView style={[ styles.serviceIconWrapper, { backgroundColor: `${service.color}15` }]}>
                                                <IconSymbol name={service.icon} size={30} color={service.color} />
                                            </ThemedView>
                                            <ThemedText style={[styles.serviceLabel, { color: themeColors.subtleText }]}>
                                                {service.name}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </ThemedView>
                            </ThemedView>
                        )
                    })}
                    {!hasVisibleServices && (
                        <ThemedView
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 40,
                            }}
                        >
                            <ThemedText
                                style={{
                                    color: themeColors.subtleText,
                                    marginBottom: 15,
                                }}
                            >
                                No services available.
                            </ThemedText>

                            <TouchableOpacity
                                onPress={fetchFeatures}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: themeColors.primary,
                                    paddingHorizontal: 20,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                }}
                            >
                                <IconSymbol
                                    name="clock"
                                    size={18}
                                    color="#FFFFFF"
                                />
                                <ThemedText
                                    style={{
                                        color: '#FFFFFF',
                                        marginLeft: 8,
                                        fontFamily: 'SemiBold',
                                    }}
                                >
                                    Refresh
                                </ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    )}
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
    contentContainer: {
        padding: Spacing.screenPadding,
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
    servicesContainer: {
        marginTop: 10,
        marginBottom: Spacing.sectionGap,
    },
    sectionTitle: {
        fontSize: Typography.heading3,
        fontFamily: "SemiBold",
    },

    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginTop: 10,
        alignItems: 'center',
    },
    serviceItem: {
        width: '21%',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        marginRight: '4%'
    },
    serviceIconWrapper: {
        width: '100%',
        height: 70,
        borderRadius: Borders.radiusMedium,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.small
    },
    serviceLabel: {
        fontSize: Typography.small,
        textAlign: 'center',
        fontFamily: 'SemiBold'
    }
})


export default OperationMenuScreen;
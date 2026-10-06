import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, ProfileNavigationList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { SocketIO } from '../../configuration/helpers/main.helpers';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { Ionicons } from '@expo/vector-icons';

type TSupportScreen = NativeStackScreenProps<ProfileNavigationList, "SupportScreen">
const SupportScreen = ({navigation, route}: TSupportScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()

    const contactOptions = [
        {
            label: 'Email Support',
            value: 'enca.dev@gmail.com',
            icon: 'mail-outline',
            action: () => Linking.openURL('mailto:enca.dev@gmail.com'),
        },
        {
            label: 'Call Support',
            value: '+233(59)195-2088',
            icon: 'call-outline',
            action: () => Linking.openURL('tel:+233591952088'),
        },
        {
            label: 'WhatsApp Support',
            value: '+233(59)195-2088',
            icon: 'logo-whatsapp',
            action: () => Linking.openURL('https://wa.me/233256121730'),
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Contact Support</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <Text style={{ color: themeColors.info, marginBottom: 25, fontFamily: 'Regular', fontSize: 13 }}> 
                            Need help? Reach our support team directly using any of the options below
                        </Text>

                        {contactOptions.map(option => (
                            <TouchableOpacity
                                key={option.label}
                                style={[styles.contactCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                                onPress={option.action}
                                activeOpacity={0.8}
                            >
                                <View style={{...styles.contactIconWrapper, backgroundColor: themeColors.primary}}>
                                    <Ionicons name={option.icon as any} size={22} color={themeColors.white} />
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactLabel, { color: themeColors.text }]}>{option.label}</Text>
                                    <Text style={[styles.contactValue, { color: themeColors.subtleText }]}>{option.value}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </KeyboardAvoidingView>
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
        padding: Spacing.medium,
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
    backButtonMain: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    contactIconWrapper: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        fontFamily: 'SemiBold',
        marginBottom: 4,
    },
    contactValue: {
        fontSize: 12,
        fontFamily: 'Regular',
    },
})

export default SupportScreen;
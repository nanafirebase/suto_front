import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Spacing, Typography } from '../../utils/constants/Design';


type TTermsScreen = NativeStackScreenProps<RootStackParamList, "TermsScreen">
const TermsScreen = ({navigation}: TTermsScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const isDark = colorScheme === 'dark'

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack()
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView style={styles.scrollView} contentContainerStyle={[ styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={{...styles.backButton, backgroundColor: themeColors.card}} onPress={handleBack} activeOpacity={0.7}>
                        <IconSymbol name="chevron.left" size={18} color={themeColors.text} />
                    </TouchableOpacity>
                    <View style={styles.header}>
                        <ThemedText style={[styles.title, { color: themeColors.text }]}>Suto ~ Term and Conditions</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themeColors.subtleText }]}>
                            Effective Date: {new Date().toDateString()}
                        </ThemedText>
                    </View>
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Account Registration & Responsibility
                        </ThemedText>
                    </View>
                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        To use Suto, you must create an account by providing accurate and complete information. You are
                        responsible for maintaining the confidentiality of your account credentials and for all activities
                        that occur under your account. You agree to notify Suto immediately of any unauthorized use or
                        security breach.
                    </ThemedText>
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Acceptable Use
                        </ThemedText>
                    </View>
                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        You agree not to misuse the Suto platform. Prohibited activities include engaging in illegal actions,
                        attempting unauthorized access, introducing malicious software, disrupting system performance, or
                        using the Service in a way that harms other users or the platform.
                    </ThemedText>
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Data Collection & Usage
                        </ThemedText>
                    </View>
                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto collects personal and business-related information such as names, contact details, business
                        data, and system activity to operate and improve the Service. We do not sell your data to third
                        parties. Limited information may be shared only when necessary to provide core services or comply
                        with legal requirements.
                    </ThemedText>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, marginTop: 20, color: themeColors.subtleText }}>
                        Your information may be used for account authentication, system customization, billing purposes, feature access management, and customer support. Suto does not sell or rent your personal data to third parties. Limited data may be shared only when required to operate core services or comply with legal obligations.
                    </ThemedText>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, marginTop: 20, color: themeColors.subtleText }}>
                        We apply reasonable administrative and technical measures to protect your data against unauthorized access, loss, or misuse. You can view, update, or request deletion of your personal information through your account settings. By using Suto, you agree to these Terms & Conditions and any future updates.
                    </ThemedText>
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Data Ownership & Responsibility
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        You retain ownership of all data you upload or generate while using Suto. By using the Service, you
                        grant Suto permission to store and process your data solely to provide platform functionality. You
                        are responsible for the accuracy and legality of your data.
                    </ThemedText>


                    {/* 5. Subscriptions & Billing */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Subscriptions, Packages & Billing
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto may offer free or paid subscription plans with different features and limitations. By
                        subscribing, you agree to pay applicable fees and comply with plan restrictions. Pricing and
                        features may change with notice. Failure to complete payment may result in service suspension.
                    </ThemedText>


                    {/* 6. Service Availability */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Service Availability & Maintenance
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto is provided on an “as is” and “as available” basis. We do not guarantee uninterrupted access
                        and may perform maintenance or updates that temporarily affect availability.
                    </ThemedText>


                    {/* 7. Termination */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Termination & Suspension
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto reserves the right to suspend or terminate accounts that violate these Terms, fail to meet
                        payment obligations, or pose security risks. Upon termination, access to the Service may be limited
                        or removed.
                    </ThemedText>


                    {/* 8. Limitation of Liability */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Limitation of Liability
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        To the fullest extent permitted by law, Suto shall not be liable for indirect, incidental, or
                        consequential damages, including loss of data or business interruption arising from use of the
                        Service.
                    </ThemedText>

                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Changes to These Terms
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto may update these Terms from time to time. Continued use of the Service after changes are made
                        constitutes acceptance of the updated Terms.
                    </ThemedText>


                    {/* 10. Acceptance */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Acceptance
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        By using Suto, you acknowledge that you have read, understood, and agree to these Terms & Conditions.
                    </ThemedText>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    gradient: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.screenPadding,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        marginTop: 20
    },
    title: {
        fontSize: Typography.heading1,
        fontFamily: 'Bold',
        marginBottom: Spacing.small,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.body,
        textAlign: 'center'
    },
})

export default TermsScreen;

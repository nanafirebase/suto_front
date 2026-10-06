import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Spacing, Typography } from '../../utils/constants/Design';


type TPolicyScreen = NativeStackScreenProps<RootStackParamList, "PolicyScreen">
const PolicyScreen = ({navigation}: TPolicyScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const isDark = colorScheme === 'dark'

    const handleBack = () => {
        if(navigation.canGoBack()){
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
                        <ThemedText style={[styles.title, { color: themeColors.text }]}>Suto ~ Privacy Policy</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themeColors.subtleText }]}>
                            Effective Date: {new Date().toDateString()}
                        </ThemedText>
                    </View>

                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Information We Collect
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto collects personal and business-related information that you provide when creating an account,
                        such as your name, email address, phone number, country, and business details. We also collect system
                        usage data to help operate and improve the platform.
                    </ThemedText>


                    {/* 2. How We Use Your Information */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            How We Use Your Information
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Your information is used to create and manage accounts, provide access to features, process
                        subscriptions, improve system performance, provide customer support, and communicate important
                        updates related to your account or the Service.
                    </ThemedText>


                    {/* 3. Data Sharing */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Data Sharing & Disclosure
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto does not sell or rent your personal data. Information may be shared with trusted service
                        providers only when necessary to operate the Service, or when required by law or legal process.
                    </ThemedText>


                    {/* 4. Data Security */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Data Security
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        We apply reasonable administrative and technical safeguards to protect your information from
                        unauthorized access, loss, or misuse. However, no system is completely secure, and we cannot
                        guarantee absolute data security.
                    </ThemedText>


                    {/* 5. Data Retention */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Data Retention
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        We retain your data for as long as your account remains active or as necessary to provide the
                        Service. Data may be deleted or anonymized upon account termination, subject to legal and operational
                        requirements.
                    </ThemedText>


                    {/* 6. Your Rights */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Your Rights
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        You have the right to access, update, or request deletion of your personal information through your
                        account settings. You may also contact us for privacy-related requests or questions.
                    </ThemedText>


                    {/* 7. Cookies & Tracking */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Cookies & Tracking
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        Suto may use cookies or similar technologies to maintain sessions, enhance performance, and improve
                        user experience. These technologies do not collect unnecessary personal information.
                    </ThemedText>


                    {/* 8. Changes to This Policy */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Changes to This Privacy Policy
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        This Privacy Policy may be updated from time to time. Continued use of Suto after changes take effect
                        indicates acceptance of the updated policy.
                    </ThemedText>


                    {/* 9. Contact Us */}
                    <View style={{ marginTop: 25, marginBottom: 10 }}>
                        <ThemedText style={{ fontFamily: 'Bold', color: themeColors.text, fontSize: 15 }}>
                            Contact Us
                        </ThemedText>
                    </View>

                    <ThemedText style={{ fontFamily: "Regular", fontSize: 15, color: themeColors.subtleText }}>
                        If you have questions or concerns about this Privacy Policy or your data, please contact us through
                        the Suto support channels.
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

export default PolicyScreen;

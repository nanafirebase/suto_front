import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { ThemedText } from '../../components/ui/ThemedText';


type TResetPasswordScreen = NativeStackScreenProps<RootStackParamList, "ResetPasswordScreen">
const ResetPasswordScreen = ({navigation}: TResetPasswordScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const isDark = colorScheme === 'dark'

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setIsLoading(true)

        // const { error } = await signIn(email, password)

        setIsLoading(false)
    }

    const handleForgotPassword = () => {
        Alert.alert('Forgot Password', 'Password reset link sent to your email');
    }
    
    const handleSignIn = () => {
        navigation.navigate('LoginScreen');
    }
    
    const handleBack = () => {
        navigation.goBack()
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView style={styles.scrollView} contentContainerStyle={[ styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={{...styles.backButton, backgroundColor: themeColors.card}} onPress={handleBack} activeOpacity={0.7}>
                        <IconSymbol name="chevron.left" size={18} color={themeColors.text} />
                    </TouchableOpacity>
                    <View style={styles.header}>
                        <ThemedText style={[styles.title, { color: themeColors.text }]}>Reset Your Password</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themeColors.subtleText }]}>
                            Enter your email / phone and we will send you a reset link
                        </ThemedText>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: email ? themeColors.primary : themeColors.border }]}>
                                <IconSymbol name="person" size={20} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.textInput, { color: themeColors.text }]}
                                    placeholder="Email or Phone"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.loginButton, { 
                                backgroundColor: themeColors.primary,
                                opacity: isLoading ? 0.7 : 1
                            }]} onPress={handleReset} disabled={isLoading} activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    {/* <IconSymbol name="arrow.clockwise" size={20} color="#FFFFFF" /> */}
                                    <ThemedText style={{...styles.loginButtonText, fontFamily: 'Bold', color: '#fff'}}>Checking...</ThemedText>
                                </View>
                            ) : (
                                <ThemedText style={{...styles.loginButtonText, color: '#fff', fontFamily: 'Bold'}}>Send Reset Link</ThemedText>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.loginButton, {
                                backgroundColor: themeColors.background,
                                opacity: isLoading ? 0.7 : 1, borderWidth: 1, borderColor: themeColors.buttonBorder
                            }]} onPress={handleSignIn} disabled={isLoading} activeOpacity={0.8}
                        >
                            <ThemedText style={{...styles.loginButtonText, color: themeColors.text, fontFamily: 'Bold'}}>Back to Login</ThemedText>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
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
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.large,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
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
    formContainer: {
        flex: 1,
        marginBottom: Spacing.xl,
        marginTop: 30,
        marginHorizontal: 15
    },
    inputContainer: {
        marginBottom: Spacing.large,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Platform.OS === 'ios' ? Spacing.large : Spacing.medium,
        borderWidth: 1,
    },
    textInput: {
        flex: 1,
        fontSize: Typography.body,
        marginLeft: Spacing.medium,
        paddingVertical: 5,
        fontFamily: 'Regular'
    },
    eyeButton: {
        padding: Spacing.small,
        position: 'absolute',
        right: 10
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xl,
    },
    forgotPasswordText: {
        fontSize: Typography.body,
        fontFamily: 'Regular'
    },
    loginButton: {
        borderRadius: Borders.radiusSmall,
        paddingVertical: Spacing.large,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.small,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.body,
        marginLeft: Spacing.small
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        paddingHorizontal: Spacing.large,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.medium,
        marginBottom: Spacing.xl,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.large,
        borderRadius: Borders.radiusMedium,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    socialButtonText: {
        marginLeft: Spacing.small,
        fontSize: Typography.body
    },
    footer: {
        alignItems: 'center',
        paddingVertical: Spacing.large,
    },
    footerText: {
        fontSize: Typography.body,
        textAlign: 'center',
    },
    signUpLink: {
        fontFamily: 'Bold'
    },
})

export default ResetPasswordScreen;

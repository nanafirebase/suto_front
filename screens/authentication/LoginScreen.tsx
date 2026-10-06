import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { ThemedText } from '../../components/ui/ThemedText';
import { useAppContainer } from '../../configuration/navigation/AppContainer'
import { ApiClient, saveData } from '../../configuration/helpers/auth.helpers';


type TLoginScreen = NativeStackScreenProps<RootStackParamList, "LoginScreen">
const LoginScreen = ({navigation}: TLoginScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const isDark = colorScheme === 'dark'
    const { showAlert, setSession, setUserData, setIsLoggedIn } = useAppContainer()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async () => {
        if (!username || !password) {
            showAlert({visibility: true, messageType: 'text', message: 'Please complete form to continue', type: 'error', title: 'Account Login'})
            return
        }
        setIsLoading(true)
        
        try {
            const response = await ApiClient.post('/login-account', {
                username: username, password: password
            })
            if (response.data.status === "success") {
                try {
                    setIsLoading(false)
                    setSession(response.data.data.session_id)
                    saveData("session", response.data.data.session_id)
                    saveData("user_data", {
                        id: response.data.data.user_id, full_name: response.data.data.user_data.full_name,
                        email: response.data.data.user_data.email, phone: response.data.data.user_data.phone
                    })
                    setUserData({
                        id: response.data.data.user_id, full_name: response.data.data.user_data.full_name,
                        email: response.data.data.user_data.email, phone: response.data.data.user_data.phone
                    })
                    setIsLoggedIn(true)
                } catch (error:any) {
                    setIsLoading(false)
                }
            } else {
                setIsLoading(false)
                showAlert({visibility: true, messageType: 'text', message: response.data.message || "Login failed", type: 'error', title: 'Account Login'})
            }
        } catch (error:any) {
            setIsLoading(false)
            // console.log(error?.response?.data?.message)
            const errorMessage = error?.response?.data?.message || error?.message || "Something went wrong"
            showAlert({visibility: true, messageType: 'text', message: errorMessage, type: 'error', title: 'Account Login'})
        } finally {
            setIsLoading(false)
        }
    }

    const handleForgotPassword = () => {
        navigation.navigate('ResetPasswordScreen')
    }
    
    const handleSignUp = () => {
        navigation.navigate('RegisterScreen');
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
                        <View style={[styles.logoContainer, { backgroundColor: themeColors.primary }]}>
                            <IconSymbol name="lock.fill" size={32} color="#FFFFFF" />
                        </View>
                        <ThemedText style={[styles.title, { color: themeColors.text }]}>Welcome Back</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themeColors.subtleText }]}>
                            Sign in to your account to continue
                        </ThemedText>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: username ? themeColors.primary : themeColors.border }]}>
                                <IconSymbol name="person" size={20} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.textInput, { color: themeColors.text }]}
                                    placeholder="Email or Phone"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={username}
                                    onChangeText={(text)=> setUsername(text)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: password ? themeColors.primary : themeColors.border }]}>
                                <IconSymbol name="lock" size={20} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.textInput, { color: themeColors.text }]}
                                    placeholder="Enter your password"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={password}
                                    onChangeText={(text)=> setPassword(text)}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} >
                                    <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={20} color={themeColors.subtleText} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword} >
                            <Text style={[styles.forgotPasswordText, { color: themeColors.primary }]}>
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.loginButton, { 
                                backgroundColor: themeColors.primary,
                                opacity: isLoading ? 0.7 : 1
                            }]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    {/* <IconSymbol name="arrow.clockwise" size={20} color="#FFFFFF" /> */}
                                    <Text style={styles.loginButtonText}>Signing In...</Text>
                                </View>
                            ) : (
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        {/* <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                            <Text style={[styles.dividerText, { color: themeColors.subtleText }]}>or</Text>
                            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                        </View> */}

                        {/* <View style={styles.socialButtons}>
                            <TouchableOpacity style={[styles.socialButton, { backgroundColor: themeColors.card }]}>
                                <IconSymbol name="apple.logo" size={20} color={themeColors.text} />
                                <Text style={[styles.socialButtonText, { color: themeColors.text }]}>Sprintelex</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={[styles.socialButton, { backgroundColor: themeColors.card }]}>
                                <IconSymbol name="globe" size={20} color={themeColors.text} />
                                <Text style={[styles.socialButtonText, { color: themeColors.text }]}>Google</Text>
                            </TouchableOpacity>
                        </View> */}

                        <View style={styles.footer}>
                            <ThemedText style={[styles.footerText, { color: themeColors.subtleText }]}>
                                Don't have an account?{' '}
                                <ThemedText style={[styles.signUpLink, { color: themeColors.primary }]} onPress={handleSignUp}>
                                    Sign Up
                                </ThemedText>
                            </ThemedText>
                        </View>
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
        marginBottom: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
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
        fontFamily: 'Bold',
        fontSize: Typography.body
    },
})

export default LoginScreen;

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { ThemedText } from '../../components/ui/ThemedText';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { ApiClient, saveData, validatePassword } from '../../configuration/helpers/auth.helpers';

type TRegisterScreen = NativeStackScreenProps<RootStackParamList, "RegisterScreen">
const RegisterScreen = ({navigation}: TRegisterScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';
    const { showAlert, setSession, setUserData, setIsLoggedIn } = useAppContainer()

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async () => {
        setIsLoading(true)

        if (!fullName || !phone || !email || !password) {
            showAlert({visibility: true, messageType: 'text', message: 'Please complete form to continue', type: 'error', title: 'Account Registration'})
            setIsLoading(false)
            return
        }
        
        const validate = validatePassword(password)
        if (!validate.hasNumbers && !validate.aboveLen && !validate.hasSpecial) {
            showAlert({visibility: true, messageType: 'text', message: 'Password validation failed', type: 'error', title: 'Account Registration'})
            setIsLoading(false)
            return
        }
    
        try {
            const response = await ApiClient.post('/register-account', { 
                full_name: fullName, email: email, phone: phone, password: password
            })
            if (response.data.status === "success") {
                try {
                    saveData("session", response.data.data.session_id)
                    saveData("user_data", {
                        id: response.data.data.user_id, full_name: response.data.data.user_data.full_name,
                        email: response.data.data.user_data.email, phone: response.data.data.user_data.phone
                    })
                    setUserData({
                        id: response.data.data.user_id, full_name: response.data.data.user_data.full_name,
                        email: response.data.data.user_data.email, phone: response.data.data.user_data.phone
                    })
                    showAlert({visibility: true, messageType: 'text', message: response.data.message || "Your account was successfully created", type: 'success', title: 'Account Registration'})
                    setIsLoading(false)
                    navigation.navigate('LoginScreen')
                } catch (error:any) {
                    showAlert({visibility: true, messageType: 'text', message: response.data.message || "An error occurred, please try again", type: 'error', title: 'Account Registration'})
                    setIsLoading(false)
                }
            } else {
                showAlert({visibility: true, messageType: 'text', message: response.data.message || "Registration failed", type: 'error', title: 'Account Registration'})
                setIsLoading(false)
            }
        } catch (error:any) {
            setIsLoading(false)
            // console.log(error?.response?.data?.message)
            const errorMessage = error?.response?.data?.message || error?.message || "Something went wrong"
            showAlert({visibility: true, messageType: 'text', message: errorMessage, type: 'error', title: 'Account Registration'})
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignIn = () => {
        navigation.navigate('LoginScreen');
    }

    const handleBack = () => {
        navigation.goBack();
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
                        <ThemedText style={[styles.title, { color: themeColors.text }]}>Create New Account</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themeColors.subtleText }]}>
                            Please complete form to register a new account
                        </ThemedText>
                    </View><View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: email ? themeColors.primary : themeColors.border }]}>
                                <IconSymbol name="person" size={20} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.textInput, { color: themeColors.text }]}
                                    placeholder="John Blunt"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    keyboardType="default"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: email ? themeColors.primary : themeColors.border }]}>
                                <IconSymbol name="mail" size={20} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.textInput, { color: themeColors.text }]}
                                    placeholder="blunt***@*****.com"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                        </View>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: email ? themeColors.primary : themeColors.border }]}>
                                <IconSymbol name="phone" size={20} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.textInput, { color: themeColors.text }]}
                                    placeholder="059******"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="numeric"
                                    autoCapitalize="none"
                                    autoComplete="tel"
                                />
                            </View>
                        </View>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: email ? themeColors.primary : themeColors.border }]}>
                                <IconSymbol name="lock" size={20} color={themeColors.subtleText} />
                                <TextInput
                                    style={[styles.textInput, { color: themeColors.text }]}
                                    placeholder="Enter your password"
                                    placeholderTextColor={themeColors.subtleText}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} >
                                    <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={20} color={themeColors.subtleText} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ marginBottom: 15, paddingHorizontal: 6, flexDirection: "row", flexWrap: "wrap" }}>
                            <Text style={{ fontSize: 12, fontFamily: 'Regular', color: themeColors.text }}>
                                By signing up, you accept our
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TermsScreen')}>
                                <Text style={{ fontSize: 12, color: "#007bff" }}> Terms & Conditions </Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, color: themeColors.text }}>
                                and
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('PolicyScreen')}>
                                <Text style={{ fontSize: 12, color: "#007bff" }}> Privacy Policy</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.loginButton, { 
                                backgroundColor: themeColors.primary,
                                opacity: isLoading ? 0.7 : 1
                            }]} onPress={handleSignup} disabled={isLoading} activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    {/* <IconSymbol name="arrow.clockwise" size={20} color="#FFFFFF" /> */}
                                    <Text style={styles.loginButtonText}>Signing In...</Text>
                                </View>
                            ) : (
                                <Text style={styles.loginButtonText}>Sign Up</Text>
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
                            <Text style={[styles.footerText, { color: themeColors.subtleText }]}>
                                Already have an account?{' '}
                                <Text style={[styles.signUpLink, { color: themeColors.primary }]} onPress={handleSignIn}>
                                    Sign In
                                </Text>
                            </Text>
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
    section: {
        marginBottom: 0
    },
    sectionTitle: {
        fontSize: Typography.body,
        fontFamily: 'Medium',
        marginBottom: 3,
    },
    input: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.large,
        fontSize: Typography.small,
        marginBottom: Spacing.large,
        fontFamily: 'Regular'
    },
})

export default RegisterScreen;

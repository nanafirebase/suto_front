import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BusinessStackList, RootStackParamList } from '../../utils/types/index.type';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { ThemedText } from '../../components/ui/ThemedText';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { fullDate, SocketIO } from '../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../configuration/credentials';
import { deleteData, saveData } from '../../configuration/helpers/auth.helpers';
import { PermissionEngine } from '../../configuration/data/PermissionEngine';

type TSelectBusinessScreen = NativeStackScreenProps<BusinessStackList, "SelectBusinessScreen">
const SelectBusinessScreen = ({navigation}: TSelectBusinessScreen) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const isDark = colorScheme === 'dark'
    const { setSelectedBusiness, setUserData, setSession, setIsLoggedIn, setIsLoading, session, setUserBranch, setUserGrade } = useAppContainer()
    const [businessList, setBusinessList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const signOut = async () => {
        if (!session) {
            setUserData(null)
            setSession(null)
            setIsLoading(false)
            setIsLoggedIn(false)
            setSelectedBusiness(null)
            deleteData('myPrivileges')
            deleteData('packageName')
            return
        }
        SocketIO.emit('logout-account', { sessionID: session, logoutType: 'user' }, (res: any) => {
            if (res.status === 'success') {
                setUserData(null)
                setSession(null)
                setIsLoading(false)
                setIsLoggedIn(false)
                setSelectedBusiness(null)
                deleteData('myPrivileges')
                deleteData('packageName')
            } else {
                setUserData(null)
                setSession(null)
                setIsLoading(false)
                setIsLoggedIn(false)
                setSelectedBusiness(null)
                deleteData('myPrivileges')
                deleteData('packageName')
            }
        })
    }
    
    const handleLogout = () => {
        Alert.alert( 'Sign Out', 'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut()
                    }
                }
            ]
        )
    }

    const handleSelectBusiness = (business: any) => {
        if (!business.id) {
            Alert.alert("Error", "Missing business data")
            return
        }
        try {
            setLoading(true)
            SocketIO.emit('validate-business' , {sessionID: session, businessID: business.id}, (response: any) => {
                if (response.status === "success") {
                    if (!response.subscriptionName) {
                        setLoading(false)
                        return
                    }
                    setSelectedBusiness(business)
                    setUserBranch(business.branch)
                    setUserGrade(business.grade)
                    saveData('myPrivileges', response.privileges || {})
                    saveData('packageName', response.subscriptionName || undefined)
                    setLoading(false)
                } else {
                    setLoading(false)
                    navigation.navigate("SelectPackageScreen", {formOneData: {businessID: business.id}})
                }
            })
        } catch (error:any) {
            console.log(error.message)
            setLoading(false)
        }
    }
    
    const fetchBusinesses = async () => {
        setLoading(true)
        setRefreshing(true)
        SocketIO.emit('fetch-user-businesses' , {sessionID: session}, (response: any) => {
            if (response.status === "success") {
                setBusinessList(response.data || [])
            } else {
                Alert.alert("Error", "Error fetching businesses", response.message)
            }
            setLoading(false)
            setRefreshing(false)
        })
    }

    useFocusEffect(
        useCallback(() => {
            fetchBusinesses()
        }, [])
    )

    const onRefresh = () => {
        fetchBusinesses()
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView style={styles.scrollView} contentContainerStyle={[ styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <ThemedText style={[styles.title, { color: themeColors.text }]}>Business Selection</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themeColors.subtleText }]}>
                            Access and manage your registered businesses
                        </ThemedText>
                    </View>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.contentContainer]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={themeColors.primary}
                            />
                        }
                    >
                        <View style={{paddingTop: 20}}>
                            {businessList && businessList.length > 0 ? businessList.map((business:any, index:number) => {
                                let image:any[] = JSON.parse(business.logo || '[]')
                                return (
                                    <TouchableOpacity key={index} disabled={loading} style={[styles.accountCard, { backgroundColor: themeColors.card, marginBottom: 5, borderLeftColor: themeColors.primary }]} onPress={()=> handleSelectBusiness(business)} activeOpacity={0.8}>
                                        <View style={styles.accountCardContent}>
                                            <View style={styles.accountTitleRow}>
                                                <View style={{flexDirection: 'row', alignItems: 'center', width: '65%'}}>
                                                    {image.length > 0 ? (
                                                        <Image source={{ uri: `${API_URL}${image[0]?.path}` }} style={{height: 50, width: 50, marginRight: 20, borderRadius: 10, marginTop: 5}} />
                                                    ) : (
                                                        <Image source={require('./../../assets/no-image.png')} style={{height: 50, width: 50, marginRight: 20, borderRadius: 10, marginTop: 5}} />
                                                    )}
                                                    <View style={{flexDirection: 'column'}}>
                                                        <Text style={{...styles.accountName, color: themeColors.text}} numberOfLines={1}>{business.name || ''}</Text>
                                                        <Text style={[styles.accountType, { color: themeColors.subtleText }]}>
                                                            Role: {business.role || 'No Role'}{' | '}Branch: {business.branch.name || 'No Branch'}
                                                        </Text>
                                                        {business.joinedAt ? (
                                                            <Text style={[styles.accountType, { color: themeColors.subtleText }]}>
                                                                Joined Since: {fullDate(business.joinedAt || '')}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                            )}) : (<View style={{alignItems: 'center', paddingVertical: 50}}>
                                <Text style={{color: themeColors.text}}>No business found</Text>
                            </View>)}
                            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: themeColors.primary, marginTop: 50 }]} onPress={()=> navigation.navigate('BusinessFormScreen')} activeOpacity={0.7}>
                                <Text style={[styles.logoutText, { color: themeColors.white, fontFamily: 'Medium' }]}>
                                    New Business
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.logoutSection}>
                            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: `${themeColors.error}30` }]} onPress={handleLogout} activeOpacity={0.7}>
                                <IconSymbol name="power" size={20} color={themeColors.error} />
                                <Text style={[styles.logoutText, { color: themeColors.error, fontFamily: 'Medium' }]}>
                                    Sign Out
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
    logoutSection: {
        marginTop: Spacing.small,
        marginBottom: Spacing.large,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.large,
        borderRadius: Borders.radiusMedium,
    },
    logoutText: {
        fontSize: Typography.caption,
        fontFamily: "Montserrat-SemiBold",
        marginLeft: Spacing.small,
    },
    accountCard: {
        borderRadius: 3,
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
        fontSize: 11,
        fontFamily: 'SemiBold',
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
        textTransform: 'capitalize'
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.small,
    },
})

export default SelectBusinessScreen;

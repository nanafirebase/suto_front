import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { ProfileNavigationList } from '../../utils/types/index.type';
import { ApiClient, deleteData } from '../../configuration/helpers/auth.helpers';
import { getNameAbbr, shortenText, SocketIO } from '../../configuration/helpers/main.helpers';
import { Ionicons } from '@expo/vector-icons';

type TProfileScreen = NativeStackScreenProps<ProfileNavigationList, "ProfileScreen">
const ProfileScreen = ({navigation}: TProfileScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const { userData, setUserData, setSession, session, setIsLoading, setIsLoggedIn, setSelectedBusiness, selectedBusiness, userBranch } = useAppContainer()

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
        SocketIO.emit('logout-account', { sessionID: session, businessID: selectedBusiness.id, branchID: userBranch.id, logoutType: 'user' }, (res: any) => {
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

    const handleSwitch = () => {
        Alert.alert( 'Switch Businesses', 'Are you sure you want to switch business?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Switch',
                    style: 'destructive',
                    onPress: async () => {
                        deleteData('myPrivileges')
                        deleteData('packageName')
                        setSelectedBusiness(null)
                    }
                }
            ]
        )
    }

    const SettingSection = ({ title, items }: { title: string; items: { label: string; screen?: string; link?: string, rightValue?: string, icon: keyof typeof Ionicons.glyphMap, arrowIcon?: keyof typeof Ionicons.glyphMap }[] }) => {
        const handlePress = (item: { screen?: string; link?: string }) => {
            if (item.screen) {
                navigation.navigate(item.screen as never);
            } else if (item.link) {
                Linking.openURL(item.link);
            }
        }
        return (
            <View style={{paddingHorizontal: 2, paddingVertical: 10, marginBottom: 5}}>
                <Text style={{ fontFamily: 'SemiBold', color: themeColors.text, fontSize: 17, marginBottom: 15 }}>{title}</Text>
                <View style={{backgroundColor: themeColors.card, paddingHorizontal: 10, borderRadius: 10}}>
                    {items.map((item, index) => (
                        <TouchableOpacity key={index} activeOpacity={0.8} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15}} onPress={() => handlePress(item)}>
                            <Ionicons name={item.icon} size={18} color={themeColors.subtleText} style={{alignSelf: 'flex-start', width: '10%'}} />
                            <Text style={{ fontFamily: 'Regular', color: themeColors.text, fontSize: 12, textAlign: 'left', width: item.rightValue ? '55%' : '70%' }}> {item.label} </Text>
                            <View style={{ width: item.rightValue ? '25%' : '10%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
                                {item.rightValue ? <Text style={{fontFamily: 'SemiBold', fontSize: 12, color: themeColors.primary, marginRight: 3}} numberOfLines={1}>{shortenText(item.rightValue || 'None', 15)}</Text> : null}
                                <Ionicons name={item.arrowIcon ?? "chevron-forward"} size={18} color={themeColors.subtleText} style={{}} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        )
    }

    const shopURL = `https://enca-gh.web.app/shop/${selectedBusiness.unique_code}/branch/${userBranch.id}`
        // console.log(`https://enca-gh.web.app/shop/${selectedBusiness.unique_code}/branch/${userBranch.id}`)
    // https://enca-gh.web.app/shop/Awo's%20PubtpGEO2026/branch/5318975277187
    // https://enca-gh.web.app/shop/Body%20Worship%20Spa%20&%20Cliniceh6Bp2026/branch/8947561774978

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background }]}>
                    <ThemedText style={styles.headerTitle}>Profile</ThemedText>
                </ThemedView>
                <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + 100, marginTop: 10, }]} showsVerticalScrollIndicator={false} bounces={false}>
                    <View style={[styles.profileHeader, { backgroundColor: themeColors.card }]}>
                        <View style={[styles.avatarContainer, { backgroundColor: themeColors.primary }]}>
                            <Text style={styles.avatarText}>{getNameAbbr(userData?.full_name || 'Guest')}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <ThemedText style={styles.profileName}>{userData?.full_name || ''}</ThemedText>
                            <Text style={[styles.profileEmail, { fontFamily: 'Regular', color: themeColors.subtleText }]}>
                                {userData?.email || 'Email not set'}
                            </Text>
                            <Text style={[styles.profilePhone, { fontFamily: 'Regular', color: themeColors.subtleText }]}>
                                {userData?.phone || 'Phone not set'}
                            </Text>
                            <Text style={[styles.profilePhone, { fontFamily: 'Regular', color: themeColors.primary }]} onPress={() => Linking.openURL(shopURL)}>
                                Shareable Store Link 🔗
                            </Text>
                        </View>
                
                        <View style={styles.verificationBadge}>
                            
                        </View>
                    </View>

                    <SettingSection
                        title="Account"
                        items={[
                            // { label: 'Edit Account', screen: undefined, icon: 'person-outline' },
                            { label: 'Change Password', screen: 'ChangePasswordScreen', icon: 'lock-closed-outline' },
                        ]}
                    />

                    <SettingSection
                        title="Business"
                        items={[
                            { label: 'Branch / Location', screen: undefined, icon: 'location-outline', rightValue: userBranch.name },
                            { label: 'Business Settings', screen: 'BusinessSettingScreen', icon: 'business-outline' },
                        ]}
                    />

                    <SettingSection
                        title="Support"
                        items={[
                            { label: 'Contact Support', screen: 'SupportScreen', icon: 'headset-outline' },
                            // { label: 'Need help?', link: 'https://enca-group.web.app/help/community', icon: 'help-outline', arrowIcon: 'open-outline' },
                            { label: 'Terms of Service', link: 'https://enca-gh.web.app/terms', icon: 'list', arrowIcon: 'open-outline' },
                            { label: 'Privacy Policy', link: 'https://enca-gh.web.app/privacy', icon: 'shield-checkmark-outline', arrowIcon: 'open-outline' }
                        ]}
                    />

                    <TouchableOpacity style={[styles.logoutButton, { backgroundColor: themeColors.card, marginBottom: 14, justifyContent: 'space-between' }]} onPress={handleSwitch} activeOpacity={0.7}>
                        <IconSymbol name="business-outline" size={18} color={themeColors.subtleText} style={{textAlign: 'left', width: '8%'}} />
                        <Text style={[styles.logoutText, { color: themeColors.text, width: '75%', fontFamily: 'Regular', fontSize: 12 }]}>
                            Switch Businesses
                        </Text>
                        <IconSymbol name="shuffle" size={18} color={themeColors.subtleText} style={{textAlign: 'right', width: '10%'}} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.logoutButton, { backgroundColor: `${themeColors.error}15`, marginBottom: 14, justifyContent: 'space-between' }]} onPress={handleLogout} activeOpacity={0.7}>
                        <IconSymbol name="power" size={18} color={themeColors.error} style={{textAlign: 'left', width: '8%'}}  />
                        <Text style={[styles.logoutText, { color: themeColors.error, width: '75%', fontFamily: 'Regular', fontSize: 12 }]}>
                            Log Out
                        </Text>
                        <View style={{ width: '10%'}} />
                    </TouchableOpacity>

                    <ThemedText style={{color: themeColors.text, fontFamily: 'Title', fontSize: 14, textAlign: 'center', marginTop: 50}}>V.1.0.0</ThemedText>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: Typography.heading1,
        fontFamily: "Bold",
    },
    editButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.large,
        borderRadius: Borders.radiusMedium,
        marginBottom: Spacing.large,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.medium,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: Typography.heading2,
        fontFamily: "Bold",
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: Typography.heading3,
        fontFamily: "Bold",
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: Typography.body,
        marginBottom: 2,
    },
    profilePhone: {
        fontSize: Typography.body,
    },
    verificationBadge: {
        marginLeft: Spacing.small,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.large,
        borderRadius: Borders.radiusMedium,
        marginBottom: Spacing.large,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: Typography.heading3,
        fontFamily: "Montserrat-Bold",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: Typography.small,
    },
    statDivider: {
        width: 1,
        height: 32,
        marginHorizontal: Spacing.medium,
    },
    menuSection: {
        marginBottom: Spacing.large,
    },
    sectionTitle: {
        fontSize: Typography.small,
        fontFamily: "Montserrat-SemiBold",
        marginBottom: Spacing.medium,
        textTransform: 'uppercase',
    },
    menuContainer: {
        borderRadius: Borders.radiusMedium,
        overflow: 'hidden',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 17,
        paddingVertical: Spacing.large,
        borderRadius: Borders.radiusMedium,
    },
    logoutText: {
        fontSize: Typography.caption,
        fontFamily: "Montserrat-SemiBold",
        marginLeft: Spacing.small + 17,
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.large,
    },
    versionText: {
        fontSize: Typography.small,
    }
})


export default ProfileScreen;

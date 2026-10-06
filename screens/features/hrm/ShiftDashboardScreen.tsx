import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { HomeNavigationList, BusinessNavigationList, HRMNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { fullDateTimeWord, fullDateWord, SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type TShiftDashboardScreen = NativeStackScreenProps<HRMNavigationList, "ShiftDashboardScreen">
const ShiftDashboardScreen = ({navigation}: TShiftDashboardScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness, can } = useAppContainer()
    const constColors = ["#822ce1"]

    type CardData = {
        title: string;
        value: string | number;
        icon: string;
        color: string;
        topValue?: string;
        screen?: string
    };

    const TouchableCards = ({ cardData }: { cardData: CardData }) => {
        return (
            <TouchableOpacity activeOpacity={cardData.screen ? 0.8 : 1} style={{width: '48%', backgroundColor: themeColors.card, borderWidth: 0.5, borderColor: themeColors.border, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 7, borderLeftWidth: 1.5, borderLeftColor: cardData.color}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <View style={[styles.backButtonMain, { backgroundColor: cardData.color, width: 30, height: 30 }]}>
                        <IconSymbol name={cardData.icon as any} color={themeColors.white} size={15} />
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <View style={{height: 8, width: 8, backgroundColor: cardData.color, borderRadius: 10}} />
                        <Text style={{fontFamily: 'Regular', fontSize: 11, marginLeft: 5, color: themeColors.subtleText}}>{cardData.topValue}</Text>
                    </View>
                </View>
                <View style={{flexDirection: 'column', marginTop: 10}}>
                    <Text style={{fontFamily: 'SemiBold', fontSize: 13, color: themeColors.text}}>{cardData.title}</Text>
                    <Text style={{fontFamily: 'Regular', fontSize: 11, color: themeColors.subtleText}}>{cardData.value}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>TimeSheet Board</ThemedText>
                    <TouchableOpacity onPress={()=> navigation.navigate('ShiftListScreen')} style={{alignItems:'flex-end'}}>
                        <Text style={{fontSize:12,color:themeColors.primary,fontFamily:'SemiBold'}}>
                            Manage Shift
                        </Text>
                    </TouchableOpacity>
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer,{ paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <ThemedText style={{marginBottom: 10, fontSize: 13}}>Today's work overview - {fullDateWord()}</ThemedText>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 10 }}>
                            <TouchableCards cardData={{title: 'Clocked In', icon: 'person', value: '9:05 AM', color: themeColors.success, topValue: 'on time'}} />
                            <TouchableCards cardData={{title: 'Shift Schedule', icon: 'calendar', value: '10:00 AM - 5:00 PM', color: themeColors.primary, topValue: 'morning shift'}} />
                            <TouchableCards cardData={{title: 'Hours Worked', icon: 'check.box', value: '2h / 5h Completed', color: themeColors.info, topValue: '30%'}} />
                            <TouchableCards cardData={{title: 'OverTime', icon: 'hour.glass', value: 'No Overtime', color: themeColors.warning, topValue: 'all clear'}} />
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
                            <TouchableOpacity activeOpacity={0.8} style={{ width: '48%', backgroundColor: themeColors.primary, borderRadius: 10, padding: 10 }}>
                                <View style={{flexDirection: 'row'}}>
                                    <IconSymbol name="calendar" size={20} color={themeColors.white} />
                                    <Text style={{fontFamily: 'SemiBold', fontSize: 15, color: themeColors.white, marginLeft: 10}}>Timesheet</Text>
                                </View>
                                <Text style={{fontFamily: 'Regular', fontSize: 11, marginTop: 5, color: themeColors.white}}>Check your work sessions this week</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.8} style={{ width: '48%', backgroundColor: themeColors.primary, borderRadius: 10, padding: 10 }}>
                                <View style={{flexDirection: 'row', justifyContent: 'flex-start' }}>
                                    <IconSymbol name="credit-card" size={20} color={themeColors.white} />
                                    <Text style={{fontFamily: 'SemiBold', fontSize: 15, color: themeColors.white, marginLeft: 10}}>My Payroll</Text>
                                </View>
                                <Text style={{fontFamily: 'Regular', fontSize: 11, marginTop: 5, color: themeColors.white}}>View your salary breakdown for this month</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 20, backgroundColor: themeColors.card, padding: 3, borderRadius: 10}}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                                <View style={{ width: '49.5%', backgroundColor: themeColors.background, padding: 10, borderRadius: 8 }}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <IconSymbol name="play" size={20} color={themeColors.subtleText}/>
                                        <Text style={{fontFamily: 'Regular', marginLeft: 5, color: themeColors.subtleText, fontSize: 12}}>Shift Start Time</Text>
                                    </View>
                                    <Text style={{paddingHorizontal: 25, fontFamily: 'SemiBold', fontSize: 12}}>9:00 AM</Text>
                                </View>
                                <View style={{ width: '49.5%', backgroundColor: themeColors.background, padding: 10, borderRadius: 8}}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <IconSymbol name="flag" size={20} color={themeColors.subtleText}/>
                                        <Text style={{fontFamily: 'Regular', marginLeft: 5, color: themeColors.subtleText, fontSize: 12}}>Shift End Time</Text>
                                    </View>
                                    <Text style={{paddingHorizontal: 25, fontFamily: 'SemiBold', fontSize: 12}}>5:00 PM</Text>
                                </View>
                            </View>
                            <Text style={{fontFamily: 'Regular', fontSize: 12, paddingVertical: 5, marginTop: 5, paddingHorizontal: 10}}>Remaining time of recent shift <Text style={{fontFamily: 'SemiBold'}}>4 hours 43 minutes</Text></Text>
                        </View>
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
    }
})

export default ShiftDashboardScreen;

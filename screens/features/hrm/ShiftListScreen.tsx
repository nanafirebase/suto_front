import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { HRMNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type TShiftListScreen = NativeStackScreenProps<HRMNavigationList, "ShiftListScreen">

const ShiftListScreen = ({navigation}: TShiftListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { selectedBusiness, session } = useAppContainer()
    const insets = useSafeAreaInsets();

    const [shifts, setShifts] = useState<any[]>([])
    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchShifts = useCallback(() => {
        if (!selectedBusiness.id) return

        setLoading(true)

        SocketIO.emit('fetch-shifts', {
            sessionID: session,
            businessID: selectedBusiness.id
        }, (response: any) => {
            setLoading(false)

            if (response.status === "success") {
                setShifts(response.data || [])
            } else {
                Alert.alert("Error", response.message || "Error fetching shifts")
            }
        })
    }, [selectedBusiness.id, session])

    useFocusEffect(
        useCallback(() => {
            fetchShifts()
        }, [fetchShifts])
    )

    useEffect(() => {
        const event = `${selectedBusiness.id}/shift/insertUpdate`

        const onShiftUpdate = () => {
            fetchShifts()
        }

        SocketIO.on(event, onShiftUpdate)

        return () => {
            SocketIO.off(event, onShiftUpdate)
        }
    }, [selectedBusiness.id, fetchShifts])

    const onRefresh = () => {
        setRefreshing(true)
        SocketIO.emit('fetch-shifts', { sessionID: session, businessID: selectedBusiness.id }, (response: any) => {
            setRefreshing(false)
            if (response.status === "success") {
                setShifts(response.data || [])
            } else {
                Alert.alert("Error", response.message || "Error fetching shifts")
            }
        })
    }

    const formatTimeRaw = (time: string) => {
        if (!time) return ''
        return time.substring(0, 5)
    }

    const formatTime = (time: string) => {
        if (!time) return ''
    
        const [hours, minutes] = time.split(':').map(Number)
    
        const date = new Date()
        date.setHours(hours, minutes, 0, 0)
    
        return date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const getSchedule = (shift: any) => {
        const schedule = [
            { day: 'Mon', from: shift.mondayFrom, to: shift.mondayTo },
            { day: 'Tue', from: shift.tuesdayFrom, to: shift.tuesdayTo },
            { day: 'Wed', from: shift.wednesdayFrom, to: shift.wednesdayTo },
            { day: 'Thu', from: shift.thursdayFrom, to: shift.thursdayTo },
            { day: 'Fri', from: shift.fridayFrom, to: shift.fridayTo },
            { day: 'Sat', from: shift.saturdayFrom, to: shift.saturdayTo },
            { day: 'Sun', from: shift.sundayFrom, to: shift.sundayTo },
        ]

        return schedule
    }

    const getWorkingDays = (shift: any) => {
        return getSchedule(shift).filter(day => day.from && day.to).length
    }

    const renderShift = (shift: any) => {
        const schedule = getSchedule(shift)

        return (
            <View key={shift.id} style={[styles.shiftCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.shiftName}>{shift.name}</ThemedText>
                        <Text style={{ color: themeColors.subtleText, fontSize: 12, marginTop: 3, fontFamily: 'Regular' }}>
                            {getWorkingDays(shift)} working {getWorkingDays(shift) === 1 ? 'day' : 'days'} per week
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: themeColors.border }]}
                        onPress={() => navigation.navigate('ShiftFormScreen', {
                            hiddenID: shift.id,
                            shiftData: shift
                        })}
                    >
                        <IconSymbol name="pencil" size={17} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} horizontal>
                    {schedule.map(day => {
                        const active = day.from && day.to
                        return (
                            <View
                                key={day.day}
                                style={[
                                    styles.dayItem,
                                    {
                                        backgroundColor: active ? themeColors.primary : themeColors.inputBackground,
                                        borderColor: active ? themeColors.primary : themeColors.border
                                    }
                                ]}
                            >
                                <Text style={{ fontSize: 11, fontFamily: 'Regular', color: active ? themeColors.white : themeColors.subtleText }}>
                                    {day.day}
                                </Text>

                                <Text style={{ fontSize: 11, marginTop: 4, fontFamily: 'SemiBold', color: active ? themeColors.white : themeColors.subtleText, textAlign: 'center' }}>
                                    {active ? `${formatTime(day.from)}\n------\n${formatTime(day.to)}` : 'Off'}
                                </Text>
                            </View>
                        )
                    })}
                </ScrollView>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />}

            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}
                    >
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <ThemedText style={styles.headerTitle}>Shifts</ThemedText>
                        <View style={[styles.countBadge, { backgroundColor: themeColors.subtleBackground, marginLeft: 5 }]}>
                            <Text style={{ color: themeColors.primary, fontFamily: 'SemiBold', fontSize: 12 }}>
                                {shifts.length}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ShiftFormScreen', {shiftData: null, hiddenID: undefined})}
                        style={[styles.addButton, { backgroundColor: themeColors.card }]}
                    >
                        <IconSymbol name="plus" size={20} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={themeColors.primary}
                        />
                    }
                >
                    {/* <View style={styles.titleRow}>
                        <View>
                            <ThemedText style={{ fontSize: 15, fontFamily: 'SemiBold' }}>
                                Shift Templates
                            </ThemedText>
                            <Text style={{ color: themeColors.subtleText, fontSize: 11, marginTop: 1, fontFamily: 'Regular' }}>
                                Manage your business working schedules
                            </Text>
                        </View>

                        
                    </View> */}

                    {loading ? (
                        <View style={{...styles.emptyContainer, borderColor: themeColors.border}}>
                            <Text style={{ color: themeColors.subtleText, fontSize: Typography.body, borderColor: themeColors.border, fontFamily: 'SemiBold' }}>
                                Loading shifts...
                            </Text>
                        </View>
                    ) : shifts.length === 0 ? (
                        <View style={[styles.emptyContainer, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
                            <View style={[styles.emptyIcon, { backgroundColor: themeColors.subtleBackground }]}>
                                <IconSymbol name="clock" size={25} color={themeColors.primary} />
                            </View>

                            <ThemedText style={{ fontFamily: 'SemiBold', fontSize: 16, marginTop: 12 }}>
                                No shifts yet
                            </ThemedText>

                            <Text style={{ color: themeColors.subtleText, fontSize: 12, textAlign: 'center', marginTop: 5, fontFamily: 'Regular' }}>
                                Create your first shift to start managing employee schedules.
                            </Text>

                            <TouchableOpacity
                                style={[styles.createButton, { backgroundColor: themeColors.primary }]}
                                onPress={() => navigation.navigate('ShiftFormScreen', {hiddenID: undefined, shiftData: null})}
                            >

                                <Text style={{ color: themeColors.white, fontFamily: 'SemiBold', marginLeft: 7 }}>
                                    Create Shift
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        shifts.map(shift => renderShift(shift))
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
        height: 10,
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.screenPadding,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
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
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    countBadge: {
        minWidth: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    shiftCard: {
        borderWidth: 0.5,
        borderRadius: Borders.radiusSmall,
        padding: Spacing.medium,
        marginBottom: Spacing.medium
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    shiftName: {
        fontSize: 16,
        fontFamily: 'SemiBold',
    },
    editButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    scheduleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    dayItem: {
        width: 70,
        minHeight: 55,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5
    },
    timeRow: {
        borderTopWidth: 1,
        marginTop: 15,
        paddingTop: 10,
    },
    emptyContainer: {
        borderRadius: Borders.radiusSmall,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 25,
    },
    emptyIcon: {
        width: 55,
        height: 55,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: Borders.radiusSmall,
        marginTop: 15,
    },
})

export default ShiftListScreen;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HRMNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

type ShiftForm = {
    [key in DayKey]: {
        from: string;
        to: string;
    }
}

type TShiftFormScreen = NativeStackScreenProps<HRMNavigationList, "ShiftFormScreen">

const days: { key: DayKey; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
]

const emptyForm: ShiftForm = {
    monday: { from: '', to: '' },
    tuesday: { from: '', to: '' },
    wednesday: { from: '', to: '' },
    thursday: { from: '', to: '' },
    friday: { from: '', to: '' },
    saturday: { from: '', to: '' },
    sunday: { from: '', to: '' },
}

const ShiftFormScreen = ({navigation, route}: TShiftFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { selectedBusiness, session } = useAppContainer()
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("")
    const [form, setForm] = useState<ShiftForm>(emptyForm)
    const [timePicker, setTimePicker] = useState<{day: DayKey; type: 'from' | 'to'} | null>(null)
    const [saving, setSaving] = useState(false)

    const hiddenID = (route.params as any)?.hiddenID
    const shiftData = (route.params as any)?.shiftData

    useFocusEffect(
        useCallback(() => {
            if (hiddenID && shiftData) {
                setName(shiftData.name || '')
                setForm({
                    monday: { from: shiftData.mondayFrom || '', to: shiftData.mondayTo || '' },
                    tuesday: { from: shiftData.tuesdayFrom || '', to: shiftData.tuesdayTo || '' },
                    wednesday: { from: shiftData.wednesdayFrom || '', to: shiftData.wednesdayTo || '' },
                    thursday: { from: shiftData.thursdayFrom || '', to: shiftData.thursdayTo || '' },
                    friday: { from: shiftData.fridayFrom || '', to: shiftData.fridayTo || '' },
                    saturday: { from: shiftData.saturdayFrom || '', to: shiftData.saturdayTo || '' },
                    sunday: { from: shiftData.sundayFrom || '', to: shiftData.sundayTo || '' },
                })
            }
        }, [hiddenID, shiftData])
    )

    const timeToDate = (time: string) => {
        const date = new Date()
        if (time) {
            const [hours, minutes] = time.split(':').map(Number)
            date.setHours(hours || 0, minutes || 0, 0, 0)
        } else {
            date.setHours(8, 0, 0, 0)
        }
        return date
    }

    const formatTime = (date: Date) => {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`
    }

    const selectTime = (day: DayKey, type: 'from' | 'to') => {
        setTimePicker({ day, type })
    }

    const onTimeChange = (_event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setTimePicker(null)
        if (!selectedDate || !timePicker) return

        const time = formatTime(selectedDate)

        setForm(prev => ({
            ...prev,
            [timePicker.day]: {
                ...prev[timePicker.day],
                [timePicker.type]: time
            }
        }))

        if (Platform.OS === 'ios') setTimePicker(null)
    }

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert("Error", "Shift name is required")
            return false
        }

        for (const day of days) {
            const value = form[day.key]
            if ((value.from && !value.to) || (!value.from && value.to)) {
                Alert.alert("Error", `Please provide both start and end time for ${day.label}`)
                return false
            }
        }

        const hasSchedule = days.some(day => form[day.key].from && form[day.key].to)

        if (!hasSchedule) {
            Alert.alert("Error", "Please add at least one working day")
            return false
        }

        return true
    }

    const onSaveShift = async () => {
        if (!selectedBusiness.id) {
            Alert.alert("Error", "No business selected")
            return
        }

        if (!validateForm()) return

        setSaving(true)

        const formData = {
            sessionID: session,
            businessID: selectedBusiness.id,
            name: name.trim(),
            mondayFrom: form.monday.from || undefined,
            mondayTo: form.monday.to || undefined,
            tuesdayFrom: form.tuesday.from || undefined,
            tuesdayTo: form.tuesday.to || undefined,
            wednesdayFrom: form.wednesday.from || undefined,
            wednesdayTo: form.wednesday.to || undefined,
            thursdayFrom: form.thursday.from || undefined,
            thursdayTo: form.thursday.to || undefined,
            fridayFrom: form.friday.from || undefined,
            fridayTo: form.friday.to || undefined,
            saturdayFrom: form.saturday.from || undefined,
            saturdayTo: form.saturday.to || undefined,
            sundayFrom: form.sunday.from || undefined,
            sundayTo: form.sunday.to || undefined,
            ...(hiddenID ? { hiddenID } : {})
        }

        SocketIO.emit('add-update-shift', formData, (response: any) => {
            setSaving(false)

            if (response.status === "success") {
                Alert.alert("Success", response.message, [
                    { text: "OK", onPress: () => navigation.goBack() }
                ])
            } else {
                Alert.alert("Error", response.message || "Failed to save shift", [
                    { text: "Retry", onPress: () => onSaveShift() },
                    { text: "Cancel", style: "cancel" },
                ])
            }
        })
    }

    const clearForm = () => {
        setName('')
        setForm(emptyForm)
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
                <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{hiddenID ? 'Edit Shift' : 'Create Shift'}</ThemedText>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <ThemedText style={{...styles.sectionTitle, fontSize: 15, marginBottom: 15, color: themeColors.text, marginTop: 10}}>
                        Shift Information
                    </ThemedText>

                    <View style={styles.section}>
                        <ThemedText style={{...styles.sectionTitle, color: themeColors.subtleText}}>
                            Shift Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                            placeholder="Morning Shift"
                            placeholderTextColor={themeColors.subtleText}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <ThemedText style={{...styles.sectionTitle, fontSize: 15, marginBottom: 15, marginTop: 15, color: themeColors.text}}>
                        Weekly Schedule
                    </ThemedText>

                    {days.map(day => (
                        <View key={day.key} style={[styles.dayCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <ThemedText style={{ fontFamily: 'SemiBold', fontSize: Typography.body }}>
                                    {day.label}
                                </ThemedText>

                                {!form[day.key].from && !form[day.key].to && (
                                    <Text style={{ fontSize: 12, color: themeColors.subtleText }}>Off</Text>
                                )}
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ width: '49%' }}>
                                    <Text style={{...styles.sectionTitle, color: themeColors.subtleText}}>Start Time</Text>
                                    <TouchableOpacity
                                        style={[styles.timeInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}
                                        onPress={() => selectTime(day.key, 'from')}
                                    >
                                        <Text style={{ color: form[day.key].from ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                            {form[day.key].from ? form[day.key].from.substring(0, 5) : 'Start time'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ width: '49%' }}>
                                    <Text style={{...styles.sectionTitle, color: themeColors.subtleText}}>End Time</Text>
                                    <TouchableOpacity
                                        style={[styles.timeInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}
                                        onPress={() => selectTime(day.key, 'to')}
                                    >
                                        <Text style={{ color: form[day.key].to ? themeColors.text : themeColors.subtleText, fontSize: Typography.small }}>
                                            {form[day.key].to ? form[day.key].to.substring(0, 5) : 'End time'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {(form[day.key].from || form[day.key].to) && (
                                <TouchableOpacity
                                    onPress={() => setForm(prev => ({ ...prev, [day.key]: { from: '', to: '' } }))}
                                    style={{ alignSelf: 'flex-end', marginTop: 2 }}
                                >
                                    <Text style={{ color: themeColors.error, fontSize: 12 }}>Clear day</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </ScrollView>

                <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: !name.trim() || saving ? themeColors.border : themeColors.primary }]}
                        onPress={onSaveShift}
                        disabled={!name.trim() || saving}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={styles.buttonText}>
                            {saving ? 'Saving...' : hiddenID ? 'Update Shift' : 'Save Shift'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {timePicker && (
                    <DateTimePicker
                        value={timeToDate(form[timePicker.day][timePicker.type])}
                        mode="time"
                        is24Hour={false}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onTimeChange}
                    />
                )}
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
        marginBottom: Spacing.medium,
        fontFamily: 'Regular'
    },
    dayCard: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: Spacing.medium,
        marginBottom: Spacing.medium,
    },
    timeInput: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.large,
        marginBottom: 3,
    },
    footer: {
        padding: Spacing.screenPadding,
        borderTopWidth: 1,
    },
    button: {
        paddingVertical: Spacing.large,
        borderRadius: Borders.radiusSmall,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: Typography.body,
        fontFamily: 'SemiBold'
    },
})

export default ShiftFormScreen;
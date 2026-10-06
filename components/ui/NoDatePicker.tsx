import React, { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fullDate } from '../../configuration/helpers/main.helpers';

type Props = {
    value?: Date | null;
    onChange: (date: Date) => void;
    placeholder?: string;
    themeColors: any;
    style?: any;
    minimumDate?: Date;
    maximumDate?: Date;
    defaultToToday?: boolean;
};

const NoDatePicker = ({ value, onChange, placeholder = 'Select date', themeColors, style, minimumDate, maximumDate, defaultToToday = false }: Props) => {

    const [show, setShow] = useState(false);

    useEffect(() => {
        if (defaultToToday && !value) {
            onChange(new Date());
        }
    }, [defaultToToday])

    const handleChange = (_: any, selectedDate?: Date) => {
        if (Platform.OS !== 'ios') {
            setShow(false);
        }

        if (selectedDate) {
            onChange(selectedDate);
        }
    }

    return (
        <View>
            <TouchableOpacity
                style={[
                    { justifyContent: 'center', borderColor: themeColors.border, marginBottom: 10 },
                    style
                ]}
                onPress={() => setShow(true)}
            >
                <Text style={{ color: value ? themeColors.warning : themeColors.subtleText, fontSize: 11, fontFamily: 'SemiBold', marginTop: 5 }}>
                    {value ? fullDate(value.toISOString()) : placeholder}
                </Text>
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}
        </View>
    );
};

export default NoDatePicker;
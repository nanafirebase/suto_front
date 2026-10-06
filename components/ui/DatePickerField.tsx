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

const DatePickerField = ({ value, onChange, placeholder = 'Select date', themeColors, style, minimumDate, maximumDate, defaultToToday = false }: Props) => {

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
                    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12,
                        paddingVertical: 14, justifyContent: 'center', backgroundColor: themeColors.inputBackground,
                        borderColor: themeColors.border, marginBottom: 10
                    },
                    style
                ]}
                onPress={() => setShow(true)}
            >
                <Text style={{ color: value ? themeColors.text : themeColors.subtleText, fontSize: 11, fontFamily: 'Regular' }}>
                    {value ? `${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}-${value.getFullYear()}` : placeholder}
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

export default DatePickerField;
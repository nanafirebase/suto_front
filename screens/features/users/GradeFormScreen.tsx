import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { UserNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type TGradeFormScreen = NativeStackScreenProps<UserNavigationList, "GradeFormScreen">
const GradeFormScreen = ({ navigation, route }: TGradeFormScreen) => {

    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const { data } = route.params;
    const { session, selectedBusiness } = useAppContainer();

    const [name, setName] = useState(data?.name || '');
    const [description, setDescription] = useState(
        data?.description || ''
    );

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {

        if (!selectedBusiness.id) {
            Alert.alert(
                'Error',
                'Business could not be determined'
            );
            return;
        }

        if (!name.trim()) {
            Alert.alert(
                'Note',
                'Grade name is required'
            );
            return;
        }

        setSaving(true);

        const formData = {
            name: name.trim(),
            description: description.trim(),
            sessionID: session,
            businessID: selectedBusiness.id,
            hiddenID: data?.id
        };

        SocketIO.emit(
            'add-update-grade',
            formData,
            (response: any) => {

                setSaving(false)

                if (response.status === 'success') {

                    Alert.alert(
                        'Success',
                        response.message ||
                            'Grade saved successfully',
                        [
                            {
                                text: 'Done',
                                onPress: () => navigation.goBack()
                            }
                        ]
                    );

                } else {
                    Alert.alert('Error', response.message || 'Failed to save grade');
                }
            }
        );
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor:
                        themeColors.background
                }
            ]}
        >

            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        {
                            backgroundColor:
                                themeColors.background
                        }
                    ]}
                />
            )}

            <View
                style={[
                    styles.safeArea,
                    {
                        backgroundColor:
                            themeColors.background,
                        paddingTop:
                            Platform.OS === 'ios'
                                ? insets.top
                                : 0,
                        paddingBottom:
                            Platform.OS === 'ios'
                                ? 85
                                : 0
                    }
                ]}
            >

                <ThemedView
                    style={[
                        styles.header,
                        {
                            backgroundColor:
                                themeColors.background,
                            borderBottomColor:
                                themeColors.border
                        }
                    ]}
                >

                    <TouchableOpacity
                        onPress={() =>
                            navigation.goBack()
                        }
                        style={[
                            styles.backButtonMain,
                            {
                                backgroundColor:
                                    themeColors.subtleBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="arrow.left"
                            size={20}
                            color={themeColors.icon}
                        />
                    </TouchableOpacity>

                    <ThemedText
                        style={styles.headerTitle}
                    >
                        {data?.id
                            ? 'Edit Grade'
                            : 'Grade Form'}
                    </ThemedText>

                    <View style={{ width: 36 }} />

                </ThemedView>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={
                        Platform.OS === 'ios'
                            ? 'padding'
                            : 'height'
                    }
                >

                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={{
                            padding:
                                Spacing.screenPadding,
                            paddingBottom:
                                insets.bottom + 100,
                            paddingTop: 10
                        }}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >

                        <View style={styles.section}>

                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Grade (
                                <Text
                                    style={{
                                        fontFamily:
                                            'Italic',
                                        fontSize: 12,
                                        color:
                                            themeColors.error
                                    }}
                                >
                                    Required
                                </Text>
                                )
                            </ThemedText>

                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border,
                                        color:
                                            themeColors.text
                                    }
                                ]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Grade name"
                                placeholderTextColor={
                                    themeColors.subtleText
                                }
                                autoCapitalize="words"
                            />

                        </View>

                        <View style={styles.section}>

                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Description
                            </ThemedText>

                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border,
                                        color:
                                            themeColors.text,
                                        height: 120,
                                        textAlignVertical:
                                            'top'
                                    }
                                ]}
                                multiline
                                placeholder="Description"
                                placeholderTextColor={
                                    themeColors.subtleText
                                }
                                value={description}
                                onChangeText={
                                    setDescription
                                }
                            />

                        </View>

                    </ScrollView>

                    <View
                        style={[
                            styles.footer,
                            {
                                backgroundColor:
                                    themeColors.background,
                                borderTopColor:
                                    themeColors.border
                            }
                        ]}
                    >

                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor:
                                        !name.trim() ||
                                        saving
                                            ? themeColors.border
                                            : themeColors.primary
                                }
                            ]}
                            onPress={handleSave}
                            disabled={
                                !name.trim() ||
                                saving
                            }
                            activeOpacity={0.8}
                        >
                            <ThemedText
                                style={
                                    styles.buttonText
                                }
                            >
                                {saving
                                    ? 'Saving...'
                                    : 'Save Record'}
                            </ThemedText>
                        </TouchableOpacity>

                    </View>

                </KeyboardAvoidingView>

            </View>

        </View>
    );
};

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
        fontFamily: 'SemiBold',
    },

    backButtonMain: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    section: {
        marginBottom: 0,
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
        fontFamily: 'Regular',
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
        fontFamily: 'SemiBold',
    },

});

export default GradeFormScreen;
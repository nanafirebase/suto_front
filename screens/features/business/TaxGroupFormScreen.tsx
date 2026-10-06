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
import { BusinessNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type Props = NativeStackScreenProps<BusinessNavigationList, "TaxGroupFormScreen">

const TaxGroupFormScreen = ({ navigation, route }: Props) => {
    const { data } = route.params || {}

    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()

    const [groupName, setGroupName] = useState(data?.groupName || '')

    const isEdit = !!data?.id

    const handleSave = () => {
        if (!groupName) {
            Alert.alert("Required", "Group name is required")
            return
        }

        SocketIO.emit('add-update-tax-group', { sessionID: session, businessID: selectedBusiness.id, groupName, hiddenID: data?.id }, (res: any) => {
            if (res.status === 'success') {
                Alert.alert("Success", res.message, [
                    { text: "OK", onPress: () => navigation.goBack() }
                ])
            } else {
                Alert.alert("Error", res.message)
            }
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && (
                <View style={[styles.statusBarSpacer, { backgroundColor: themeColors.background }]} />
            )}
            <View style={[styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 }]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{isEdit ? "Edit Tax Bundle" : "Create Tax Bundle"}</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                    <ScrollView contentContainerStyle={{ padding: Spacing.screenPadding }}>

                        {/* NAME */}
                        <View style={styles.section}>
                            <ThemedText>Bundle Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                value={groupName}
                                onChangeText={setGroupName}
                                placeholder="e.g. VAT Bundle"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                    </ScrollView>

                    {/* FOOTER */}
                    <View style={{ padding: Spacing.screenPadding }}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: themeColors.primary }]}
                            onPress={handleSave}
                        >
                            <ThemedText style={{ color: '#fff' }}>Save Record</ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

            </View>
        </View>
    )
}

export default TaxGroupFormScreen

const styles = StyleSheet.create({
    container: { flex: 1 },
    statusBarSpacer: {
        width: '100%',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.medium,
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

    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    section: {
        marginBottom: Spacing.medium
    },

    title: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold'
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
    toggle: {
        padding: 10,
        borderRadius: 6,
        marginRight: 10
    },
    button: {
        padding: 15,
        borderRadius: 6,
        alignItems: 'center'
    }
})
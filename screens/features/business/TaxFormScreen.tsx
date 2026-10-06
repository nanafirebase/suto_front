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

type TTaxFormScreen = NativeStackScreenProps<BusinessNavigationList, "TaxFormScreen">

const TaxFormScreen = ({ navigation, route }: TTaxFormScreen) => {
    const { data } = route.params || {}

    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const insets = useSafeAreaInsets()
    const { session, selectedBusiness } = useAppContainer()

    const [taxName, setTaxName] = useState(data?.taxName || '')
    const [percentage, setPercentage] = useState(String(data?.percentage || ''))
    const [calculationType, setCalculationType] = useState<'simple' | 'compound'>(data?.calculationType || 'simple')
    const [order, setOrder] = useState(String(data?.order || '1'))
    const [status, setStatus] = useState<'active' | 'inactive'>(data?.status || 'active')

    const isEdit = !!data?.id

    const handleSave = () => {
        if (!taxName || !percentage) {
            Alert.alert("Required", "Tax name and percentage are required")
            return
        }

        const payload = { sessionID: session, businessID: selectedBusiness.id, taxName, percentage: Number(percentage),
            calculationType, order: calculationType === 'compound' ? Number(order) : 1, hiddenID: data?.id
        }

        SocketIO.emit('add-update-tax', payload, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message, [
                    { text: "OK", onPress: () => navigation.goBack() }
                ])
            } else {
                Alert.alert("Error", response.message || "Failed to save tax")
            }
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 0 } ]}>
                {/* HEADER */}
                <ThemedView style={[styles.header, { borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        {isEdit ? "Edit Tax" : "Create Tax"}
                    </ThemedText>

                    <View style={{ width: 36 }} />
                </ThemedView>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={{
                            padding: Spacing.screenPadding,
                            paddingBottom: insets.bottom + 100
                        }}
                        showsVerticalScrollIndicator={false}
                    >

                        {/* TAX NAME */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>Tax Name ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
                                value={taxName}
                                onChangeText={setTaxName}
                                placeholder="e.g. VAT"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                        {/* PERCENTAGE */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>Percentage (%) ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> )</ThemedText>
                            <TextInput
                                keyboardType="numeric"
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
                                value={percentage}
                                onChangeText={setPercentage}
                                placeholder="15"
                                placeholderTextColor={themeColors.subtleText}
                            />
                        </View>

                        {/* TYPE */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>Calculation Type</ThemedText>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {['simple', 'compound'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setCalculationType(type as any)}
                                        style={[
                                            styles.toggleBtn, {
                                                backgroundColor: calculationType === type ? themeColors.primary : themeColors.inputBackground
                                            }
                                        ]}
                                    >
                                        <Text style={{
                                            color: calculationType === type ? '#fff' : themeColors.text,
                                            fontSize: 12
                                        }}>
                                            {type === 'simple' ? 'Simple' : 'Compound'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <ThemedText style={styles.helper}>
                                {calculationType === 'compound' ? 'Applied after other taxes' : 'Applied directly on amount'}
                            </ThemedText>
                        </View>

                        {/* ORDER (ONLY IF COMPOUND) */}
                        {calculationType === 'compound' && (
                            <View style={styles.section}>
                                <ThemedText style={styles.label}>Execution Order</ThemedText>
                                <TextInput
                                    keyboardType="numeric"
                                    style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
                                    value={order}
                                    onChangeText={setOrder}
                                    placeholder="1"
                                    placeholderTextColor={themeColors.subtleText}
                                />
                                <ThemedText style={styles.helper}>
                                    1 = applied first, 2 = next...
                                </ThemedText>
                            </View>
                        )}

                        {/* PREVIEW (🔥 BIG UX WIN) */}
                        <View style={styles.previewBox}>
                            <ThemedText style={{ fontFamily: 'SemiBold', marginBottom: 5 }}>
                                Preview ( Amount: 100 )
                            </ThemedText>
                            <Text style={{ color: themeColors.text }}>
                                {taxName || 'Tax'}: {(Number(percentage) || 0)}%
                            </Text>
                            <Text style={{ color: themeColors.subtleText, fontSize: 11 }}>
                                = {(100 * (Number(percentage) || 0) / 100).toFixed(2)}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* FOOTER */}
                    <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.primary }]} onPress={handleSave}>
                            <ThemedText style={styles.buttonText}>
                                Save Record
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </View>
    )
}

export default TaxFormScreen

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

    label: {
        fontSize: Typography.body,
        marginBottom: 4
    },

    input: {
        borderWidth: 1,
        borderRadius: Borders.radiusSmall,
        padding: Spacing.medium,
        fontSize: Typography.small,
    },

    toggleBtn: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
    },

    helper: {
        fontSize: 11,
        marginTop: 5,
        opacity: 0.7
    },

    previewBox: {
        marginTop: 20,
        borderRadius: 6
    },

    footer: {
        padding: Spacing.screenPadding,
        borderTopWidth: 1,
    },

    button: {
        padding: Spacing.large,
        borderRadius: 6,
        alignItems: 'center',
    },

    buttonText: {
        color: '#fff',
        fontFamily: 'SemiBold'
    }
})
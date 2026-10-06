import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { InventoryNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { SocketIO } from '../../../configuration/helpers/main.helpers';

type TStockFormScreen = NativeStackScreenProps<InventoryNavigationList, "StockFormScreen">
const StockFormScreen = ({navigation, route}: TStockFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { session, selectedBusiness, userBranch } = useAppContainer();
    const { data } = route.params;

    const [name, setName] = useState(data?.name || '');
    const [code, setCode] = useState(data?.code || '');
    const [description, setDescription] = useState(data?.description || '');
    const [isDefault, setIsDefault] = useState(data?.isDefaultSalesStock || 'no');

    const handleSave = () => {
        if (!name || !selectedBusiness.id || !userBranch.id) {
            Alert.alert("Note", "Some fields are required\nPlease complete form to add a stock location")
            return
        }
        const formData = {
            name,
            code,
            description,
            sessionID: session,
            businessID: selectedBusiness.id,
            branchID: userBranch.id,
            hiddenID: data?.id
        }
        SocketIO.emit('add-update-stock-location', formData, (response: any) => {
            if (response.status === "success") {
                Alert.alert("Success", response.message)
            } else {
                Alert.alert("Error", response.message || "Failed to add stock location")
            }
        })
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && <View style={[ styles.statusBarSpacer, { height: 10, backgroundColor: themeColors.background} ]} />}
            <View style={[ styles.safeArea, { paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === 'ios' ? 85 : 0 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={()=> navigation.goBack()} style={[styles.backButtonMain, { backgroundColor: themeColors.subtleBackground }]}>
                        <IconSymbol name="arrow.left" size={20} color={themeColors.icon} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Stock Location Form</ThemedText>
                    <View style={{ width: 36 }} />
                </ThemedView>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={[ styles.contentContainer, { paddingBottom: insets.bottom + 100, paddingTop: 10 }]} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Name <Text style={{ color: themeColors.error }}>*</Text></ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                placeholder="Enter location name"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Unique Code ( <Text style={{fontFamily: 'Regular', fontSize: 10, color: themeColors.error}}>Please leave black to auto generate.</Text> )</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
                                placeholder="Enter location code"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                                value={code}
                                onChangeText={setCode}
                            />
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>Description</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text, height: 120, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="Enter description"
                                placeholderTextColor={themeColors.subtleText}
                                keyboardType="default"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                        <View style={styles.section}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <ThemedText style={[styles.sectionTitle, { color: themeColors.subtleText }]}>
                                    Set as default stock location
                                </ThemedText>
                                <Switch
                                    value={isDefault}
                                    onValueChange={setIsDefault}
                                    trackColor={{ false: themeColors.border, true: themeColors.success }}
                                    thumbColor={Platform.OS === 'ios' ? '#ffffff' : themeColors.subtleText}
                                />
                            </View>
                            <ThemedText style={{ color: themeColors.subtleText, marginTop: 6, fontSize: 12 }}>
                                This stock location will be used automatically for sales unless changed.
                            </ThemedText>
                        </View>
                    </ScrollView>
                    <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: !name ? themeColors.border : themeColors.primary }]} onPress={handleSave} disabled={!name}>
                            <ThemedText style={styles.buttonText}>Save Record</ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    statusBarSpacer: { width: '100%' },
    safeArea: { flex: 1 },
    scrollContainer: { flex: 1 },
    contentContainer: { padding: Spacing.screenPadding, paddingTop: 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.medium, borderBottomWidth: 1 },
    backButtonMain: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: Typography.heading2, fontFamily: 'SemiBold' },
    section: { marginBottom: 0 },
    sectionTitle: { fontSize: Typography.body, fontFamily: 'Medium', marginBottom: 3 },
    input: { borderWidth: 1, borderRadius: Borders.radiusSmall, paddingHorizontal: Spacing.medium, paddingVertical: Spacing.large, fontSize: Typography.small, marginBottom: Spacing.medium, fontFamily: 'Regular' },
    footer: { padding: Spacing.screenPadding, borderTopWidth: 1 },
    button: { paddingVertical: Spacing.large, borderRadius: Borders.radiusSmall, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: Typography.body, fontFamily: 'SemiBold' },
});

export default StockFormScreen;

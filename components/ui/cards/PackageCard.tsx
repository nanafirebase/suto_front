import React from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Colors } from '../../../utils/constants/Colors';
import { IconSymbol } from '../icon-symbol';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { formatCurrency } from '../../../utils/constants/Currency';
import { abbFull } from '../../../configuration/data/FetchData';

const { width } = Dimensions.get("window")

const CARD_WIDTH = width * 0.8
const CARD_SPACING = 16

const PackageCard = ({item, onPress}:any) => {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']
    const isDark = colorScheme === 'dark'

    const features:any[] = Array.isArray(item.feature_array) ? item.feature_array : JSON.parse(item.feature_array || '[]')
    const modules:any[] = Array.isArray(item.feature_tables) ? item.feature_tables : JSON.parse(item.feature_tables || '[]')

    return (
        <View style={{width: CARD_WIDTH, marginRight: CARD_SPACING, borderRadius: 10, overflow: 'hidden'}}>
            {!item ? (
                <ActivityIndicator size={25} color={themeColors.success} style={{alignSelf: 'center', marginTop: 20}} />
            ) : (
                <>
                    <View style={{backgroundColor: themeColors.primary, padding: 10, paddingVertical: 20, alignItems: 'center' }}>
                        <View style={{height: 50, width: 50, borderRadius: 150, backgroundColor: themeColors.background, marginBottom: 10, alignItems: 'center', justifyContent: 'center'}}>
                            <IconSymbol name={item.name === "Medium" ? "star" : 'layers'} color={item.name === "Medium" ? themeColors.warning : themeColors.primary} size={25} />
                        </View>
                        <ThemedText style={{color: themeColors.white, fontFamily: 'SemiBold', fontSize: 15}}>{item.name} Plan</ThemedText>
                        <ThemedText style={{color: themeColors.white, fontFamily: 'SemiBold', fontSize: 18, marginTop: 5}}>{formatCurrency(item.price || 0)}/month</ThemedText>
                    </View>
                    <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} bounces={false}>
                        <View style={{padding: 10}}>
                            <ThemedText style={{fontSize: 13}}>{item.description}</ThemedText>
                        </View>
                        <View style={{ width: '100%', borderWidth: 0.8, borderColor: themeColors.border, padding: 20}}>
                            {features.length > 0 && (
                                <>
                                    <View style={{flexDirection: 'row', padding: 5, alignItems: 'center', paddingVertical: 8}}>
                                        <IconSymbol name='check' size={15} color={themeColors.primary} style={{marginRight: 5}} />
                                        <ThemedText style={{fontFamily: 'Italic', fontSize: 13, textTransform: 'capitalize', color: themeColors.text}}>{features[0].user_access} User Access</ThemedText>
                                    </View>
                                    <View style={{flexDirection: 'row', padding: 5, alignItems: 'center', paddingVertical: 8}}>
                                        <IconSymbol name='check' size={15} color={themeColors.primary} style={{marginRight: 5}} />
                                        <ThemedText style={{fontFamily: 'Italic', fontSize: 13, textTransform: 'capitalize', color: themeColors.text}}>{features[0].storage}GB Storage</ThemedText>
                                    </View>
                                    <View style={{flexDirection: 'row', padding: 5, alignItems: 'center', paddingVertical: 8}}>
                                        <IconSymbol name='check' size={15} color={themeColors.primary} style={{marginRight: 5}} />
                                        <ThemedText style={{fontFamily: 'Italic', fontSize: 13, textTransform: 'capitalize', color: themeColors.text}}>{features[0].support} support</ThemedText>
                                    </View>
                                    {features[0].projects && (
                                        <View style={{flexDirection: 'row', padding: 5, alignItems: 'center', paddingVertical: 8}}>
                                            <IconSymbol name='check' size={15} color={themeColors.primary} style={{marginRight: 5}} />
                                            <ThemedText style={{fontFamily: 'Italic', fontSize: 13, textTransform: 'capitalize', color: themeColors.text}}>{features[0].projects} Projects</ThemedText>
                                        </View>
                                    )}
                                    {features[0].receipt_printer && (
                                        <View style={{flexDirection: 'row', padding: 5, alignItems: 'center', paddingVertical: 8}}>
                                            <IconSymbol name='check' size={15} color={themeColors.primary} style={{marginRight: 5}} />
                                            <ThemedText style={{fontFamily: 'Italic', fontSize: 13, textTransform: 'capitalize', color: themeColors.text}}>{`Free ${features[0].receipt_printer} Receipt Printer`}</ThemedText>
                                        </View>
                                    )}
                                    {features[0].ai_assist && (
                                        <View style={{flexDirection: 'row', padding: 5, alignItems: 'center', paddingVertical: 8}}>
                                            <IconSymbol name='check' size={15} color={themeColors.primary} style={{marginRight: 5}} />
                                            <ThemedText style={{fontFamily: 'Italic', fontSize: 13, textTransform: 'capitalize'}}>AI Assist</ThemedText>
                                        </View>
                                    )}
                                </>
                            )}
                            <View style={{flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: 5 }}>
                                <IconSymbol name='check' size={15} color={themeColors.primary} style={{marginRight: 5}} />
                                {modules.length > 0 && modules.map((module:any, index: number) => (
                                    <View key={index} style={{flexDirection: 'row', alignItems: 'center', marginRight: 5}}>
                                        <ThemedText style={{fontFamily: 'Italic', fontSize: 13}}>{abbFull[module]}{index + 1 !== modules.length ? ',' : null}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    <TouchableOpacity disabled={item.status !== "active" ? true : false} style={[styles.button, { backgroundColor: themeColors.primary, opacity: item.status !== "active" ? 0.5 : 1}]} onPress={() => onPress(item)} activeOpacity={0.8}>
                        <ThemedText style={styles.buttonText}>
                            Get Started
                        </ThemedText>
                    </TouchableOpacity>
                </>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
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

export default PackageCard;

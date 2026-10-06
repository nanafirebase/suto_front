import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { IconSymbol } from '../icon-symbol';
import * as Linking from 'expo-linking'

const EmployeeCard = ({ employee, onPress, themeColors }:any) => {

    const callNumber = async (phone:string) => {
        await Linking.openURL(`tel:${phone}`)
    }

    return (
        <TouchableOpacity key={employee.id} style={[styles.accountCard, { backgroundColor: themeColors.card, borderLeftColor: themeColors.primary }]} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.accountCardContent}>
                <View style={styles.accountTitleRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center', width: '55%'}}>
                        <Image source={require('./../../../assets/no-image.png')} style={{height: 50, width: 50, marginRight: 20, borderRadius: 10, marginTop: 5}} />
                        <View style={{flexDirection: 'column',width: '100%'}}>
                            <Text style={{...styles.accountName, color: themeColors.text}} numberOfLines={1}>{`${employee?.firstName || ''} ${employee?.otherNames || ''} ${employee?.lastName || ''}`.replace(/\s+/g, ' ').trim()}</Text>
                            <Text style={[styles.accountType, { color: themeColors.subtleText, textTransform: 'capitalize' }]}>
                                {employee.department_name || 'No department set'}
                            </Text>
                            <Text style={[styles.accountType, { color: themeColors.subtleText, textTransform: 'capitalize'}]}>
                                {employee.designation_name || 'No designation set'} ( {employee.location_name || 'No branch set'} )
                            </Text>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row', width: '30%', justifyContent: 'flex-end'}}>
                        <TouchableOpacity onPress={()=> {}} style={[ styles.iconButton, { backgroundColor: themeColors.warning } ]} >
                            <IconSymbol name="sms" size={18} color={themeColors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=> callNumber(employee.phone)} style={[ styles.iconButton, { backgroundColor: themeColors.primary } ]} >
                            <IconSymbol name="phone" size={18} color={themeColors.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    accountCard: {
        borderRadius: 2,
        overflow: 'hidden',
        borderBottomWidth: 0.09,
        borderLeftWidth: 3
    },
    accountCardContent: {
        padding: 5,
        position: 'relative',
    },
    accountTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    accountName: {
        fontSize: 11,
        fontFamily: 'SemiBold',
        marginBottom: 5
    },
    mainBadge: {
        paddingHorizontal: Spacing.small,
        paddingVertical: 2,
        borderRadius: Borders.radiusSmall,
    },
    mainBadgeText: {
        fontSize: Typography.small,
        fontFamily: 'SemiBold',
    },
    accountType: {
        fontFamily: 'Regular',
        fontSize: Typography.small,
    },
    accountDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountBalance: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold',
    },
    accountNumber: {
        fontSize: Typography.body,
    },
    accountIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    iconButton: {
        width: 35,
        height: 35,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
    },
})

export default EmployeeCard;
